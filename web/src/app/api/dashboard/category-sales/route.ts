import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 카테고리 색상 매핑
const CATEGORY_COLORS = [
  '#4AC1E0', // Primary
  '#4CAF50', // Success
  '#F5A623', // Warning
  '#E74C3C', // Error
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FF9800', // Orange
  '#607D8B', // Gray
];

// 카테고리별 판매 데이터 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    const client = getCoupangClient();

    // 최근 30일간 주문 조회
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const response = await client.getOrders({
      vendorId,
      createdAtFrom: thirtyDaysAgo,
      createdAtTo: today,
      status: 'ACCEPT',
      maxPerPage: 50,
    });

    // 카테고리별 매출 집계
    const categoryMap = new Map<string, number>();

    (response.data || []).forEach((order) => {
      (order.orderItems || []).forEach((item) => {
        // 상품명에서 카테고리 추론 (실제로는 상품 정보에서 카테고리를 가져와야 함)
        const productName = item.sellerProductName || item.vendorItemName || '';
        const category = inferCategory(productName);
        const amount = (item.orderPrice || 0) * (item.shippingCount || 1);

        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });
    });

    // 배열로 변환하고 정렬
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // 상위 6개만

    return NextResponse.json({ categoryData });
  } catch (error) {
    console.error('[API] Category sales error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch category sales' },
      { status: 500 }
    );
  }
}

// 상품명에서 카테고리 추론 (간단한 키워드 매칭)
function inferCategory(productName: string): string {
  const keywords: Record<string, string[]> = {
    '전자기기': ['이어폰', '충전기', '케이블', '마우스', '키보드', '스피커', '배터리', '어댑터', 'USB', '블루투스'],
    '생활용품': ['수건', '세제', '청소', '주방', '욕실', '정리', '수납', '매트'],
    '패션잡화': ['가방', '지갑', '벨트', '모자', '시계', '악세서리', '선글라스', '스카프'],
    '뷰티': ['화장품', '스킨', '로션', '크림', '마스크팩', '샴푸', '바디'],
    '식품': ['과일', '야채', '고기', '해산물', '과자', '음료', '건강식품'],
    '스포츠': ['운동', '헬스', '요가', '골프', '테니스', '축구', '농구'],
  };

  const lowerName = productName.toLowerCase();

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => lowerName.includes(word.toLowerCase()))) {
      return category;
    }
  }

  return '기타';
}
