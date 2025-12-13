import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';
import { getNaverCommerceClient } from '@/lib/naver-api/client';

// 쿠팡 카테고리 캐시 (메모리 캐시)
let coupangCategoryCache: {
  data: Array<{
    code: number;
    name: string;
    fullPath: string;
    isLeaf: boolean;
    parentCode?: number;
  }>;
  timestamp: number;
} | null = null;

const CACHE_TTL = 1000 * 60 * 60; // 1시간

/**
 * 쿠팡 카테고리 전체 목록 재귀 조회 (캐싱)
 */
async function getAllCoupangCategories(client: ReturnType<typeof getCoupangClient>) {
  // 캐시 확인
  if (coupangCategoryCache && Date.now() - coupangCategoryCache.timestamp < CACHE_TTL) {
    return coupangCategoryCache.data;
  }

  const allCategories: Array<{
    code: number;
    name: string;
    fullPath: string;
    isLeaf: boolean;
    parentCode?: number;
  }> = [];

  // 쿠팡 API 응답 구조:
  // { code: "SUCCESS", data: { displayItemCategoryCode: 0, name: "ROOT", child: [...] } }
  // child 배열 내부: { displayItemCategoryCode, name, status, child: [] }

  // 재귀적으로 카테고리 파싱
  function parseCategories(categoryData: {
    displayItemCategoryCode?: number;
    name?: string;
    status?: string;
    child?: unknown[];
  }, path: string[] = []) {
    if (!categoryData || !categoryData.child) return;

    const children = categoryData.child as Array<{
      displayItemCategoryCode: number;
      name: string;
      status: string;
      child: unknown[];
    }>;

    for (const cat of children) {
      const currentPath = cat.name ? [...path, cat.name] : path;
      const hasChildren = cat.child && Array.isArray(cat.child) && cat.child.length > 0;

      if (cat.displayItemCategoryCode) {
        allCategories.push({
          code: cat.displayItemCategoryCode,
          name: cat.name,
          fullPath: currentPath.join(' > '),
          isLeaf: !hasChildren,
          parentCode: categoryData.displayItemCategoryCode,
        });
      }

      // 하위 카테고리가 있고 depth 4까지만
      if (hasChildren && currentPath.length < 4) {
        parseCategories(cat as typeof categoryData, currentPath);
      }
    }
  }

  try {
    // 전체 카테고리 목록 조회 (트리 구조)
    const response = await client.getAllDisplayCategories();
    console.log('[Coupang] 카테고리 응답:', JSON.stringify(response).slice(0, 500));
    console.log('[Coupang] response.data 타입:', typeof response.data);
    console.log('[Coupang] response.data 키:', response.data ? Object.keys(response.data) : 'null');

    if (response.data) {
      parseCategories(response.data);
      console.log('[Coupang] 파싱된 카테고리 수:', allCategories.length);
    }
  } catch (error) {
    console.error('[Coupang] 전체 카테고리 조회 실패:', error);
  }

  // 캐시 저장
  coupangCategoryCache = {
    data: allCategories,
    timestamp: Date.now(),
  };

  return allCategories;
}

/**
 * 통합 플랫폼 카테고리 API
 *
 * GET /api/platform/categories
 * - ?platform=COUPANG : 쿠팡 카테고리 조회
 * - ?platform=NAVER : 네이버 카테고리 조회
 * - ?parentCode=0 : 상위 카테고리 코드 (쿠팡)
 * - ?parentId=50000000 : 상위 카테고리 ID (네이버)
 * - ?keyword=검색어 : 카테고리 검색
 * - ?predict=상품명 : 상품명 기반 카테고리 추천 (키워드 검색으로 대체)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform')?.toUpperCase();
    const parentCode = searchParams.get('parentCode');
    const parentId = searchParams.get('parentId');
    const keyword = searchParams.get('keyword');
    const predict = searchParams.get('predict');

    if (!platform || !['COUPANG', 'NAVER'].includes(platform)) {
      return NextResponse.json({
        success: false,
        error: 'platform 파라미터가 필요합니다. (COUPANG 또는 NAVER)',
      }, { status: 400 });
    }

    // 쿠팡 카테고리
    if (platform === 'COUPANG') {
      const client = getCoupangClient();

      // 키워드 검색 또는 상품명 추천 (둘 다 로컬 검색으로 처리)
      const searchTerm = keyword || predict;
      if (searchTerm) {
        // 전체 카테고리 가져오기
        const allCategories = await getAllCoupangCategories(client);

        // 검색어를 여러 토큰으로 분리 (예: "제주 감귤" -> ["제주", "감귤"])
        let searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        // 유사 키워드 확장 (상품명 → 카테고리명 매핑)
        const synonyms: Record<string, string[]> = {
          '감귤': ['귤', '오렌지', '과일'],
          '오렌지': ['귤', '감귤', '과일'],
          '사과': ['과일', '사과'],
          '배': ['과일', '배'],
          '포도': ['과일', '포도'],
          '딸기': ['과일', '딸기'],
          '수박': ['과일', '수박', '멜론'],
          '참외': ['과일', '참외', '멜론'],
          '티셔츠': ['상의', '티셔츠', '반팔'],
          '바지': ['하의', '바지', '팬츠'],
          '원피스': ['원피스', '드레스'],
          '신발': ['신발', '운동화', '구두'],
        };

        // 확장된 검색어 추가
        const expandedTerms = new Set(searchTerms);
        for (const term of searchTerms) {
          if (synonyms[term]) {
            synonyms[term].forEach(syn => expandedTerms.add(syn));
          }
        }
        searchTerms = Array.from(expandedTerms);
        console.log('[Coupang] 확장된 검색어:', searchTerms);

        // 키워드로 필터링 (이름 또는 전체 경로에서 검색)
        // 모든 검색어가 이름이나 경로에 포함되어야 함 (AND 조건)
        const filtered = allCategories.filter(cat => {
          const nameLower = cat.name.toLowerCase();
          const pathLower = cat.fullPath.toLowerCase();
          // 모든 검색어 중 하나라도 매칭되면 포함 (OR 조건으로 변경)
          return searchTerms.some(term =>
            nameLower.includes(term) || pathLower.includes(term)
          );
        });

        console.log('[Coupang] 검색어:', searchTerm, '필터링 결과:', filtered.length);

        // 디버깅: 검색 결과가 0개면 샘플 카테고리 출력
        if (filtered.length === 0) {
          const sampleCategories = allCategories.slice(0, 20).map(c => c.name);
          console.log('[Coupang] 검색 결과 0개. 샘플 카테고리:', sampleCategories);

          // 과일 관련 카테고리 찾기
          const fruitRelated = allCategories.filter(c =>
            c.name.includes('과일') ||
            c.name.includes('귤') ||
            c.fullPath.includes('과일')
          ).slice(0, 10);
          console.log('[Coupang] 과일 관련 카테고리:', fruitRelated.map(c => `${c.name} (${c.fullPath})`));
        }

        // 최하위 카테고리 우선, 최대 20개
        const sorted = filtered
          .sort((a, b) => {
            // isLeaf가 true인 것 먼저
            if (a.isLeaf && !b.isLeaf) return -1;
            if (!a.isLeaf && b.isLeaf) return 1;
            // 이름에 검색어가 포함된 것 우선 (any term matches)
            const aNameMatch = searchTerms.some(term => a.name.toLowerCase().includes(term));
            const bNameMatch = searchTerms.some(term => b.name.toLowerCase().includes(term));
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            return 0;
          })
          .slice(0, 20);

        return NextResponse.json({
          success: true,
          platform: 'COUPANG',
          data: sorted.map(cat => ({
            code: String(cat.code),
            name: cat.name,
            fullPath: cat.fullPath,
            isLeaf: cat.isLeaf,
          })),
        });
      }

      // 카테고리 목록 조회 (특정 부모 아래)
      const displayCategoryCode = parentCode ? parseInt(parentCode) : 0;
      const response = await client.getDisplayCategories(displayCategoryCode);

      return NextResponse.json({
        success: true,
        platform: 'COUPANG',
        data: response.data?.map(cat => ({
          code: String(cat.displayCategoryCode),
          name: cat.displayCategoryName,
          isLeaf: cat.isLeaf,
          parentCode: cat.parentDisplayCategoryCode,
        })) || [],
      });
    }

    // 네이버 카테고리
    if (platform === 'NAVER') {
      const client = getNaverCommerceClient();

      if (!client.isConfigured()) {
        return NextResponse.json({
          success: false,
          error: '네이버 커머스 API 인증 정보가 설정되지 않았습니다.',
        }, { status: 400 });
      }

      // 키워드 검색
      if (keyword) {
        const categories = await client.searchCategories(keyword);
        return NextResponse.json({
          success: true,
          platform: 'NAVER',
          data: categories.map(cat => ({
            code: cat.id,
            name: cat.name,
            fullPath: cat.wholeCategoryName,
            isLeaf: cat.isLeaf,
            parentId: cat.parentId,
          })),
        });
      }

      // 카테고리 목록 조회
      const categories = await client.getCategories(parentId || undefined);

      return NextResponse.json({
        success: true,
        platform: 'NAVER',
        data: categories.map(cat => ({
          code: cat.id,
          name: cat.name,
          fullPath: cat.wholeCategoryName,
          isLeaf: cat.isLeaf,
          parentId: cat.parentId,
        })),
      });
    }

    return NextResponse.json({
      success: false,
      error: '지원하지 않는 플랫폼입니다.',
    }, { status: 400 });
  } catch (error) {
    console.error('[API] Platform categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}
