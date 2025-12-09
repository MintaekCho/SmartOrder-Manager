import { NextRequest, NextResponse } from 'next/server';
import { getCoupangCrawler } from '@/lib/crawler/coupang-crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ReviewTrend {
  productId: string;
  productName: string;
  productUrl: string;
  currentReviewCount: number;
  currentRating: number;
  // 변화량 (DB에 이전 데이터가 있을 때)
  reviewGrowth?: {
    daily: number;
    weekly: number;
    growthRate: number; // % 증가율
  };
  // 추정 판매량 (리뷰 수 기반)
  estimatedSales: {
    daily: number;
    monthly: number;
  };
  demandSignal: 'hot' | 'rising' | 'stable' | 'declining';
  isRocketDelivery: boolean;
  price: number;
}

interface ReviewTrackerResult {
  keyword: string;
  analyzedAt: string;
  totalProducts: number;
  hotProducts: ReviewTrend[]; // 급상승 상품
  risingProducts: ReviewTrend[]; // 상승 중 상품
  allProducts: ReviewTrend[];
}

// 리뷰 → 판매 전환율 추정 (일반적으로 1~5%)
const REVIEW_TO_SALES_RATIO = 0.02; // 2%

/**
 * 리뷰 트래커 API
 * GET /api/research/review-tracker?keyword=사과&limit=20
 *
 * 리뷰 수 변화를 통해 수요 상승 중인 상품을 감지합니다.
 * DB 연동 시 이전 데이터와 비교하여 증가율을 계산합니다.
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
      data: generateMockReviewTracker(keyword),
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
        data: generateMockReviewTracker(keyword),
        warning: '쿠팡 크롤링이 차단되어 샘플 데이터를 표시합니다.',
      });
    }

    // 리뷰 트렌드 분석
    const reviewTrends = analyzeReviewTrends(result.items);

    // 수요 신호별 분류
    const hotProducts = reviewTrends.filter(p => p.demandSignal === 'hot');
    const risingProducts = reviewTrends.filter(p => p.demandSignal === 'rising');

    const analysisResult: ReviewTrackerResult = {
      keyword,
      analyzedAt: new Date().toISOString(),
      totalProducts: reviewTrends.length,
      hotProducts,
      risingProducts,
      allProducts: reviewTrends,
    };

    return NextResponse.json({
      success: true,
      source: 'crawl',
      data: analysisResult,
    });
  } catch (error) {
    console.error('[API] 리뷰 트래커 오류:', error);
    // 오류 발생 시 Mock 데이터로 폴백
    return NextResponse.json({
      success: true,
      source: 'mock-fallback',
      data: generateMockReviewTracker(keyword),
      warning: '분석 중 오류가 발생하여 샘플 데이터를 표시합니다.',
    });
  }
}

function analyzeReviewTrends(products: any[]): ReviewTrend[] {
  return products.map(product => {
    const reviewCount = product.reviewCount || 0;
    const rating = product.rating || 0;

    // 리뷰 수 기반 판매량 추정
    const estimatedMonthlySales = Math.round(reviewCount / REVIEW_TO_SALES_RATIO / 12);
    const estimatedDailySales = Math.round(estimatedMonthlySales / 30);

    // 수요 신호 판단 (현재는 리뷰 수 기반, DB 연동 시 변화율 기반으로 전환)
    let demandSignal: 'hot' | 'rising' | 'stable' | 'declining';

    if (reviewCount > 5000 && rating >= 4.5) {
      demandSignal = 'hot';
    } else if (reviewCount > 1000 && rating >= 4.0) {
      demandSignal = 'rising';
    } else if (reviewCount > 100) {
      demandSignal = 'stable';
    } else {
      demandSignal = 'declining';
    }

    return {
      productId: product.id,
      productName: product.name,
      productUrl: product.url,
      currentReviewCount: reviewCount,
      currentRating: rating,
      estimatedSales: {
        daily: estimatedDailySales,
        monthly: estimatedMonthlySales,
      },
      demandSignal,
      isRocketDelivery: product.isRocketDelivery || false,
      price: product.price,
    };
  }).sort((a, b) => b.currentReviewCount - a.currentReviewCount);
}

function generateMockReviewTracker(keyword: string): ReviewTrackerResult {
  const mockProducts: ReviewTrend[] = [
    {
      productId: '1',
      productName: `${keyword} 프리미엄 선물세트 3kg`,
      productUrl: 'https://www.coupang.com/vp/products/1',
      currentReviewCount: 8520,
      currentRating: 4.8,
      reviewGrowth: {
        daily: 45,
        weekly: 280,
        growthRate: 15.2,
      },
      estimatedSales: {
        daily: 142,
        monthly: 4260,
      },
      demandSignal: 'hot',
      isRocketDelivery: true,
      price: 45000,
    },
    {
      productId: '2',
      productName: `${keyword} 산지직송 5kg`,
      productUrl: 'https://www.coupang.com/vp/products/2',
      currentReviewCount: 3210,
      currentRating: 4.6,
      reviewGrowth: {
        daily: 28,
        weekly: 168,
        growthRate: 8.5,
      },
      estimatedSales: {
        daily: 53,
        monthly: 1605,
      },
      demandSignal: 'rising',
      isRocketDelivery: true,
      price: 35000,
    },
    {
      productId: '3',
      productName: `${keyword} 가정용 2kg`,
      productUrl: 'https://www.coupang.com/vp/products/3',
      currentReviewCount: 1890,
      currentRating: 4.5,
      reviewGrowth: {
        daily: 12,
        weekly: 72,
        growthRate: 3.2,
      },
      estimatedSales: {
        daily: 31,
        monthly: 945,
      },
      demandSignal: 'rising',
      isRocketDelivery: false,
      price: 28000,
    },
    {
      productId: '4',
      productName: `${keyword} 특가 1kg`,
      productUrl: 'https://www.coupang.com/vp/products/4',
      currentReviewCount: 450,
      currentRating: 4.2,
      reviewGrowth: {
        daily: 3,
        weekly: 18,
        growthRate: 1.1,
      },
      estimatedSales: {
        daily: 7,
        monthly: 225,
      },
      demandSignal: 'stable',
      isRocketDelivery: false,
      price: 15000,
    },
  ];

  return {
    keyword,
    analyzedAt: new Date().toISOString(),
    totalProducts: mockProducts.length,
    hotProducts: mockProducts.filter(p => p.demandSignal === 'hot'),
    risingProducts: mockProducts.filter(p => p.demandSignal === 'rising'),
    allProducts: mockProducts,
  };
}
