import { NextRequest, NextResponse } from 'next/server';
import { getCoupangCrawler } from '@/lib/crawler/coupang-crawler';
import { getDomeggookCrawler } from '@/lib/crawler/domeggook-crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface MarginResult {
  coupangProduct: {
    id: string;
    name: string;
    price: number;
    url: string;
    reviewCount: number;
    rating: number;
    isRocketDelivery: boolean;
  };
  wholesaleProduct: {
    id: string;
    name: string;
    price: number;
    url: string;
    source: string;
  };
  margin: {
    priceDifference: number;
    marginRate: number;
    estimatedProfit: number; // 수수료 제외 후
    coupangFee: number; // 쿠팡 수수료 (약 10.8%)
    shippingCost: number; // 예상 배송비
  };
  similarityScore: number; // 상품명 유사도 (0-1)
}

interface AnalysisResult {
  keyword: string;
  analyzedAt: string;
  totalCoupangProducts: number;
  totalWholesaleProducts: number;
  matchedProducts: number;
  avgMarginRate: number;
  results: MarginResult[];
  topOpportunities: MarginResult[];
}

const COUPANG_FEE_RATE = 0.108; // 쿠팡 수수료 약 10.8%
const ESTIMATED_SHIPPING = 3000; // 예상 배송비

/**
 * 마진 분석 API
 * GET /api/research/margin-analysis?keyword=사과&limit=10
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const limit = parseInt(searchParams.get('limit') || '10');
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
      data: generateMockMarginAnalysis(keyword),
    });
  }

  try {
    // 1. 쿠팡 상품 크롤링
    const coupangCrawler = getCoupangCrawler();
    const coupangResult = await coupangCrawler.searchProducts(keyword, { maxItems: limit });

    if (!coupangResult.success || coupangResult.items.length === 0) {
      // 크롤링 실패 시 Mock 데이터로 폴백
      console.log('[API] 쿠팡 크롤링 실패, Mock 데이터 사용');
      return NextResponse.json({
        success: true,
        source: 'mock-fallback',
        data: generateMockMarginAnalysis(keyword),
        warning: '쿠팡 크롤링이 차단되어 샘플 데이터를 표시합니다.',
      });
    }

    // 2. 도매꾹 상품 크롤링
    const domeggookCrawler = getDomeggookCrawler();
    const wholesaleResult = await domeggookCrawler.search(keyword, { maxItems: limit });

    if (!wholesaleResult.success || wholesaleResult.items.length === 0) {
      // 도매꾹 크롤링 실패 시 Mock 데이터로 폴백
      console.log('[API] 도매꾹 크롤링 실패, Mock 데이터 사용');
      return NextResponse.json({
        success: true,
        source: 'mock-fallback',
        data: generateMockMarginAnalysis(keyword),
        warning: '도매꾹 크롤링이 차단되어 샘플 데이터를 표시합니다.',
      });
    }

    // 3. 상품 매칭 및 마진 분석
    const matchedResults = matchAndAnalyze(
      coupangResult.items,
      wholesaleResult.items
    );

    // 4. 결과 정리
    const avgMarginRate = matchedResults.length > 0
      ? matchedResults.reduce((sum, r) => sum + r.margin.marginRate, 0) / matchedResults.length
      : 0;

    const topOpportunities = [...matchedResults]
      .sort((a, b) => b.margin.estimatedProfit - a.margin.estimatedProfit)
      .slice(0, 5);

    const analysis: AnalysisResult = {
      keyword,
      analyzedAt: new Date().toISOString(),
      totalCoupangProducts: coupangResult.items.length,
      totalWholesaleProducts: wholesaleResult.items.length,
      matchedProducts: matchedResults.length,
      avgMarginRate: Math.round(avgMarginRate * 10) / 10,
      results: matchedResults,
      topOpportunities,
    };

    return NextResponse.json({
      success: true,
      source: 'crawl',
      data: analysis,
    });
  } catch (error) {
    console.error('[API] 마진 분석 오류:', error);
    // 오류 발생 시 Mock 데이터로 폴백
    return NextResponse.json({
      success: true,
      source: 'mock-fallback',
      data: generateMockMarginAnalysis(keyword),
      warning: '분석 중 오류가 발생하여 샘플 데이터를 표시합니다.',
    });
  }
}

function matchAndAnalyze(coupangProducts: any[], wholesaleProducts: any[]): MarginResult[] {
  const results: MarginResult[] = [];

  for (const coupangProduct of coupangProducts) {
    // 가장 유사한 도매 상품 찾기
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const wholesaleProduct of wholesaleProducts) {
      const similarity = calculateSimilarity(
        coupangProduct.name,
        wholesaleProduct.name
      );

      if (similarity > bestSimilarity && similarity > 0.3) {
        bestSimilarity = similarity;
        bestMatch = wholesaleProduct;
      }
    }

    if (bestMatch && bestMatch.price < coupangProduct.price) {
      const priceDifference = coupangProduct.price - bestMatch.price;
      const coupangFee = Math.round(coupangProduct.price * COUPANG_FEE_RATE);
      const estimatedProfit = priceDifference - coupangFee - ESTIMATED_SHIPPING;
      const marginRate = (priceDifference / coupangProduct.price) * 100;

      results.push({
        coupangProduct: {
          id: coupangProduct.id,
          name: coupangProduct.name,
          price: coupangProduct.price,
          url: coupangProduct.url,
          reviewCount: coupangProduct.reviewCount,
          rating: coupangProduct.rating,
          isRocketDelivery: coupangProduct.isRocketDelivery,
        },
        wholesaleProduct: {
          id: bestMatch.id || bestMatch.name,
          name: bestMatch.name,
          price: bestMatch.price,
          url: bestMatch.url || '',
          source: 'domeggook',
        },
        margin: {
          priceDifference,
          marginRate: Math.round(marginRate * 10) / 10,
          estimatedProfit,
          coupangFee,
          shippingCost: ESTIMATED_SHIPPING,
        },
        similarityScore: Math.round(bestSimilarity * 100) / 100,
      });
    }
  }

  return results.sort((a, b) => b.margin.marginRate - a.margin.marginRate);
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1;

  // 토큰 기반 유사도
  const tokens1 = new Set(s1.split(/\s+/));
  const tokens2 = new Set(s2.split(/\s+/));

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  const jaccardSimilarity = intersection.size / union.size;

  // 핵심 키워드 매칭 보너스
  const keywordBonus = calculateKeywordBonus(s1, s2);

  return Math.min(1, jaccardSimilarity + keywordBonus);
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateKeywordBonus(s1: string, s2: string): number {
  // 용량/수량 패턴 매칭
  const quantityPattern = /(\d+)\s*(kg|g|개|입|박스|팩)/gi;

  const quantities1 = s1.match(quantityPattern) || [];
  const quantities2 = s2.match(quantityPattern) || [];

  if (quantities1 && quantities1.length > 0 && quantities2 && quantities2.length > 0) {
    const q1 = quantities1[0]?.toLowerCase() ?? '';
    const q2 = quantities2[0]?.toLowerCase() ?? '';

    if (q1 && q2 && q1 === q2) return 0.2;
  }

  return 0;
}

function generateMockMarginAnalysis(keyword: string): AnalysisResult {
  const mockResults: MarginResult[] = [
    {
      coupangProduct: {
        id: '1',
        name: `${keyword} 프리미엄 3kg 선물세트`,
        price: 45000,
        url: 'https://www.coupang.com/vp/products/1',
        reviewCount: 1250,
        rating: 4.7,
        isRocketDelivery: true,
      },
      wholesaleProduct: {
        id: 'w1',
        name: `${keyword} 상품 3kg`,
        price: 28000,
        url: 'https://domeggook.com/product/1',
        source: 'domeggook',
      },
      margin: {
        priceDifference: 17000,
        marginRate: 37.8,
        estimatedProfit: 9140,
        coupangFee: 4860,
        shippingCost: 3000,
      },
      similarityScore: 0.72,
    },
    {
      coupangProduct: {
        id: '2',
        name: `${keyword} 가정용 5kg`,
        price: 35000,
        url: 'https://www.coupang.com/vp/products/2',
        reviewCount: 890,
        rating: 4.5,
        isRocketDelivery: false,
      },
      wholesaleProduct: {
        id: 'w2',
        name: `${keyword} 가정용 5kg`,
        price: 22000,
        url: 'https://domeggook.com/product/2',
        source: 'domeggook',
      },
      margin: {
        priceDifference: 13000,
        marginRate: 37.1,
        estimatedProfit: 6220,
        coupangFee: 3780,
        shippingCost: 3000,
      },
      similarityScore: 0.85,
    },
    {
      coupangProduct: {
        id: '3',
        name: `${keyword} 산지직송 2kg`,
        price: 28000,
        url: 'https://www.coupang.com/vp/products/3',
        reviewCount: 2100,
        rating: 4.8,
        isRocketDelivery: true,
      },
      wholesaleProduct: {
        id: 'w3',
        name: `산지 ${keyword} 2kg`,
        price: 18000,
        url: 'https://domeggook.com/product/3',
        source: 'domeggook',
      },
      margin: {
        priceDifference: 10000,
        marginRate: 35.7,
        estimatedProfit: 3976,
        coupangFee: 3024,
        shippingCost: 3000,
      },
      similarityScore: 0.68,
    },
  ];

  return {
    keyword,
    analyzedAt: new Date().toISOString(),
    totalCoupangProducts: 20,
    totalWholesaleProducts: 15,
    matchedProducts: mockResults.length,
    avgMarginRate: 36.9,
    results: mockResults,
    topOpportunities: mockResults.slice(0, 2),
  };
}
