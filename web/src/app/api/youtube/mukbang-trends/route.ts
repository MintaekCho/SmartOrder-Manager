import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

interface FoodKeyword {
  keyword: string;
  count: number;
  videos: YouTubeVideo[];
}

// 음식 키워드 추출을 위한 패턴
const FOOD_KEYWORDS = [
  // 한식
  '김치', '불고기', '삼겹살', '떡볶이', '비빔밥', '냉면', '갈비', '찌개', '국밥', '순대',
  '치킨', '족발', '보쌈', '삼계탕', '김밥', '라면', '짜장면', '짬뽕', '탕수육', '만두',
  '제육볶음', '된장찌개', '김치찌개', '부대찌개', '순두부', '해장국', '설렁탕', '갈비탕',
  '칼국수', '수제비', '전', '부침개', '닭발', '곱창', '막창', '대창', '회', '초밥',
  // 분식/간식
  '떡', '호떡', '붕어빵', '타코야끼', '핫도그', '감자튀김', '치즈볼', '닭강정',
  // 디저트
  '케이크', '마카롱', '쿠키', '아이스크림', '와플', '빵', '도넛', '크로와상', '타르트',
  // 음료
  '커피', '버블티', '스무디', '주스', '밀크티',
  // 외식/프랜차이즈
  '피자', '햄버거', '파스타', '스테이크', '샐러드', '샌드위치', '타코', '부리또',
  // 일식
  '라멘', '우동', '돈카츠', '오코노미야끼', '야키토리', '덮밥', '카레',
  // 중식
  '마라탕', '훠궈', '양꼬치', '마라샹궈', '꿔바로우',
  // 동남아
  '쌀국수', '팟타이', '똠양꿍', '분짜', '반미',
  // 기타
  '스시', '사시미', '오마카세', '코스요리', '뷔페', '배달음식', 'ASM', '편의점',
];

// 제외할 단어 (음식과 관련 없는 일반적인 먹방 키워드)
const EXCLUDE_WORDS = ['먹방', 'ASMR', 'mukbang', 'eating', 'sound', '리얼사운드', '이팅사운드'];

/**
 * 영상 제목에서 음식 키워드 추출
 */
function extractFoodKeywords(title: string): string[] {
  const keywords: string[] = [];
  const lowerTitle = title.toLowerCase();

  for (const food of FOOD_KEYWORDS) {
    if (lowerTitle.includes(food.toLowerCase())) {
      keywords.push(food);
    }
  }

  return keywords;
}

/**
 * YouTube Data API v3를 사용하여 먹방 영상 검색
 */
async function searchMukbangVideos(apiKey: string, query: string, maxResults: number = 50, publishedAfter?: string) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: 'viewCount',
    maxResults: maxResults.toString(),
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    key: apiKey,
  });

  if (publishedAfter) {
    params.append('publishedAfter', publishedAfter);
  }

  const searchResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
  );

  if (!searchResponse.ok) {
    const error = await searchResponse.json();
    throw new Error(error.error?.message || 'YouTube API 검색 실패');
  }

  const searchData = await searchResponse.json();
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

  if (!videoIds) {
    return [];
  }

  // 영상 통계 정보 조회
  const statsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?` +
    `part=statistics,snippet&id=${videoIds}&key=${apiKey}`
  );

  if (!statsResponse.ok) {
    const error = await statsResponse.json();
    throw new Error(error.error?.message || 'YouTube API 통계 조회 실패');
  }

  const statsData = await statsResponse.json();

  return statsData.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    viewCount: parseInt(item.statistics.viewCount || '0'),
    likeCount: parseInt(item.statistics.likeCount || '0'),
    commentCount: parseInt(item.statistics.commentCount || '0'),
  }));
}

/**
 * GET /api/youtube/mukbang-trends
 * 먹방 트렌드 분석
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '7'; // 기본 7일
  const query = searchParams.get('query') || '먹방';

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      // API 키가 없으면 더미 데이터 반환
      return NextResponse.json({
        success: true,
        data: {
          videos: getDummyVideos(),
          foodTrends: getDummyFoodTrends(),
          totalVideos: 50,
          period: parseInt(period),
          message: 'YouTube API 키가 설정되지 않아 샘플 데이터를 표시합니다.',
        },
      });
    }

    // 기간 계산
    const daysAgo = parseInt(period);
    const publishedAfter = new Date();
    publishedAfter.setDate(publishedAfter.getDate() - daysAgo);

    // 먹방 영상 검색
    const videos = await searchMukbangVideos(
      apiKey,
      query,
      50,
      publishedAfter.toISOString()
    );

    // 음식 키워드 분석
    const foodCounts: Map<string, { count: number; videos: YouTubeVideo[] }> = new Map();

    for (const video of videos) {
      const keywords = extractFoodKeywords(video.title);
      for (const keyword of keywords) {
        const existing = foodCounts.get(keyword) || { count: 0, videos: [] };
        existing.count++;
        if (existing.videos.length < 5) {
          existing.videos.push(video);
        }
        foodCounts.set(keyword, existing);
      }
    }

    // 인기 음식 순위 정렬
    const foodTrends: FoodKeyword[] = Array.from(foodCounts.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        videos: data.videos,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        videos: videos.slice(0, 20),
        foodTrends,
        totalVideos: videos.length,
        period: daysAgo,
      },
    });
  } catch (error) {
    console.error('[YouTube API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'YouTube 데이터 조회 실패',
    }, { status: 500 });
  }
}

// 더미 데이터 (API 키 없을 때 사용)
function getDummyVideos(): YouTubeVideo[] {
  return [
    {
      id: 'dummy1',
      title: '역대급 삼겹살 먹방! 고기 10인분 도전',
      channelTitle: '먹방 크리에이터',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=삼겹살+먹방',
      viewCount: 2500000,
      likeCount: 85000,
      commentCount: 4200,
    },
    {
      id: 'dummy2',
      title: '마라탕 ASMR 먹방 리얼사운드',
      channelTitle: 'ASMR 먹방',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=마라탕+먹방',
      viewCount: 1800000,
      likeCount: 62000,
      commentCount: 3100,
    },
    {
      id: 'dummy3',
      title: '편의점 신상 털기! 떡볶이 라면 조합',
      channelTitle: '편의점 리뷰어',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=편의점+먹방',
      viewCount: 1500000,
      likeCount: 51000,
      commentCount: 2800,
    },
    {
      id: 'dummy4',
      title: '치킨 5마리 혼자 다 먹기 도전',
      channelTitle: '대식가TV',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=치킨+먹방',
      viewCount: 1200000,
      likeCount: 42000,
      commentCount: 2100,
    },
    {
      id: 'dummy5',
      title: '곱창 막창 대창 풀코스 먹방',
      channelTitle: '야식먹방',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://via.placeholder.com/320x180?text=곱창+먹방',
      viewCount: 980000,
      likeCount: 35000,
      commentCount: 1800,
    },
  ];
}

function getDummyFoodTrends(): FoodKeyword[] {
  const dummyVideos = getDummyVideos();
  return [
    { keyword: '삼겹살', count: 15, videos: [dummyVideos[0]] },
    { keyword: '마라탕', count: 12, videos: [dummyVideos[1]] },
    { keyword: '치킨', count: 11, videos: [dummyVideos[3]] },
    { keyword: '떡볶이', count: 10, videos: [dummyVideos[2]] },
    { keyword: '곱창', count: 9, videos: [dummyVideos[4]] },
    { keyword: '라면', count: 8, videos: dummyVideos.slice(0, 1) },
    { keyword: '족발', count: 7, videos: dummyVideos.slice(0, 1) },
    { keyword: '피자', count: 6, videos: dummyVideos.slice(0, 1) },
    { keyword: '햄버거', count: 5, videos: dummyVideos.slice(0, 1) },
    { keyword: '초밥', count: 4, videos: dummyVideos.slice(0, 1) },
  ];
}
