import { NextRequest, NextResponse } from 'next/server';
import { getCoupangCrawler } from '@/lib/crawler/coupang-crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ProductAnalysis {
  keyword: string;
  totalProducts: number;
  priceAnalysis: {
    min: number;
    max: number;
    avg: number;
    median: number;
    priceRanges: { range: string; count: number; percentage: number }[];
  };
  reviewAnalysis: {
    avgReviewCount: number;
    avgRating: number;
    topReviewedProducts: { name: string; reviewCount: number; rating: number }[];
  };
  sellerAnalysis: {
    rocketDeliveryRate: number;
    rocketFreshRate: number;
    topSellers: { name: string; count: number }[];
  };
  competitionScore: number; // 0-100 경쟁 강도
  opportunityScore: number; // 0-100 기회 점수
  products: any[];
}

/**
 * 쿠팡 상위 상품 분석 API
 * GET /api/research/coupang-analysis?keyword=사과&limit=20
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const limit = parseInt(searchParams.get('limit') || '20');
  const useMock = searchParams.get('useMock') === 'true';

  if (!keyword) {
    return NextResponse.json(
      { success: false, error: '키워드가 필요합니다.' },
      { status: 400 }
    );
  }

  // Mock 데이터 (테스트용)
  if (useMock) {
    return NextResponse.json({
      success: true,
      source: 'mock',
      data: generateMockAnalysis(keyword),
    });
  }

  try {
    const crawler = getCoupangCrawler();
    const result = await crawler.searchProducts(keyword, { maxItems: limit });

    if (!result.success || result.items.length === 0) {
      // 크롤링 실패 시 Mock 데이터로 폴백
      console.log('[API] 쿠팡 크롤링 실패, Mock 데이터 사용');
      return NextResponse.json({
        success: true,
        source: 'mock-fallback',
        data: generateMockAnalysis(keyword),
        warning: '쿠팡 크롤링이 차단되어 샘플 데이터를 표시합니다.',
      });
    }

    const analysis = analyzeProducts(keyword, result.items);

    return NextResponse.json({
      success: true,
      source: 'crawl',
      data: analysis,
    });
  } catch (error) {
    console.error('[API] 쿠팡 분석 오류:', error);
    // 오류 발생 시에도 Mock 데이터로 폴백
    return NextResponse.json({
      success: true,
      source: 'mock-fallback',
      data: generateMockAnalysis(keyword),
      warning: '크롤링 중 오류가 발생하여 샘플 데이터를 표시합니다.',
    });
  }
}

function analyzeProducts(keyword: string, products: any[]): ProductAnalysis {
  const prices = products.map(p => p.price).filter(p => p > 0);
  const reviews = products.map(p => p.reviewCount);
  const ratings = products.map(p => p.rating).filter(r => r > 0);

  // 가격 분석
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

  // 가격대 분류
  const priceRanges = calculatePriceRanges(prices);

  // 리뷰 분석
  const avgReviewCount = reviews.reduce((a, b) => a + b, 0) / reviews.length;
  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  const topReviewedProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      reviewCount: p.reviewCount,
      rating: p.rating,
    }));

  // 판매자 분석
  const rocketDeliveryCount = products.filter(p => p.isRocketDelivery).length;
  const rocketFreshCount = products.filter(p => p.isRocketFresh).length;

  const sellerCounts: Record<string, number> = {};
  products.forEach(p => {
    const seller = p.seller || '일반판매자';
    sellerCounts[seller] = (sellerCounts[seller] || 0) + 1;
  });

  const topSellers = Object.entries(sellerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 경쟁 강도 점수 계산 (0-100)
  // - 리뷰 수가 많을수록 경쟁 치열
  // - 로켓배송 비율이 높을수록 경쟁 치열
  // - 상품 수가 많을수록 경쟁 치열
  const competitionScore = calculateCompetitionScore({
    avgReviewCount,
    rocketDeliveryRate: rocketDeliveryCount / products.length,
    productCount: products.length,
  });

  // 기회 점수 계산 (0-100)
  // - 가격 마진 여유가 클수록 기회
  // - 평균 리뷰 수가 적을수록 진입 기회
  // - 상품 수가 적당할수록 기회
  const opportunityScore = calculateOpportunityScore({
    avgPrice,
    priceRange: sortedPrices[sortedPrices.length - 1] - sortedPrices[0],
    avgReviewCount,
    competitionScore,
  });

  return {
    keyword,
    totalProducts: products.length,
    priceAnalysis: {
      min: sortedPrices[0] || 0,
      max: sortedPrices[sortedPrices.length - 1] || 0,
      avg: Math.round(avgPrice),
      median: medianPrice || 0,
      priceRanges,
    },
    reviewAnalysis: {
      avgReviewCount: Math.round(avgReviewCount),
      avgRating: Math.round(avgRating * 10) / 10,
      topReviewedProducts,
    },
    sellerAnalysis: {
      rocketDeliveryRate: Math.round((rocketDeliveryCount / products.length) * 100),
      rocketFreshRate: Math.round((rocketFreshCount / products.length) * 100),
      topSellers,
    },
    competitionScore,
    opportunityScore,
    products,
  };
}

function calculatePriceRanges(prices: number[]): { range: string; count: number; percentage: number }[] {
  if (prices.length === 0) return [];

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;

  // 5개 구간으로 나누기
  const step = Math.ceil(range / 5);
  const ranges: { range: string; count: number; percentage: number }[] = [];

  for (let i = 0; i < 5; i++) {
    const start = min + (step * i);
    const end = i === 4 ? max : min + (step * (i + 1)) - 1;
    const count = prices.filter(p => p >= start && p <= end).length;

    ranges.push({
      range: `${formatPrice(start)}~${formatPrice(end)}`,
      count,
      percentage: Math.round((count / prices.length) * 100),
    });
  }

  return ranges.filter(r => r.count > 0);
}

function formatPrice(price: number): string {
  if (price >= 10000) {
    return `${Math.round(price / 10000)}만`;
  }
  return `${price.toLocaleString()}`;
}

function calculateCompetitionScore(data: {
  avgReviewCount: number;
  rocketDeliveryRate: number;
  productCount: number;
}): number {
  // 각 요소별 점수 (0-100)
  const reviewScore = Math.min(data.avgReviewCount / 100, 1) * 40; // 최대 40점
  const rocketScore = data.rocketDeliveryRate * 30; // 최대 30점
  const countScore = Math.min(data.productCount / 50, 1) * 30; // 최대 30점

  return Math.round(reviewScore + rocketScore + countScore);
}

function calculateOpportunityScore(data: {
  avgPrice: number;
  priceRange: number;
  avgReviewCount: number;
  competitionScore: number;
}): number {
  // 경쟁이 낮을수록 기회 (역산)
  const competitionFactor = (100 - data.competitionScore) * 0.4;

  // 가격 마진 여유 (가격대가 넓을수록 마진 기회)
  const marginFactor = Math.min(data.priceRange / data.avgPrice, 1) * 30;

  // 리뷰 진입 장벽 (평균 리뷰가 낮을수록 진입 용이)
  const entryFactor = Math.max(0, 30 - (data.avgReviewCount / 10));

  return Math.round(Math.min(100, competitionFactor + marginFactor + entryFactor));
}

function generateMockAnalysis(keyword: string): ProductAnalysis {
  return {
    keyword,
    totalProducts: 20,
    priceAnalysis: {
      min: 15000,
      max: 89000,
      avg: 42500,
      median: 38000,
      priceRanges: [
        { range: '1만~2만', count: 3, percentage: 15 },
        { range: '2만~4만', count: 8, percentage: 40 },
        { range: '4만~6만', count: 5, percentage: 25 },
        { range: '6만~9만', count: 4, percentage: 20 },
      ],
    },
    reviewAnalysis: {
      avgReviewCount: 1250,
      avgRating: 4.6,
      topReviewedProducts: [
        { name: `${keyword} 프리미엄 선물세트 3kg`, reviewCount: 5420, rating: 4.8 },
        { name: `${keyword} 산지직송 5kg`, reviewCount: 3210, rating: 4.7 },
        { name: `${keyword} 가정용 특가 2kg`, reviewCount: 2150, rating: 4.5 },
      ],
    },
    sellerAnalysis: {
      rocketDeliveryRate: 65,
      rocketFreshRate: 40,
      topSellers: [
        { name: '로켓배송', count: 13 },
        { name: '산지직송팜', count: 3 },
        { name: '신선마켓', count: 2 },
      ],
    },
    competitionScore: 72,
    opportunityScore: 58,
    products: [],
  };
}
