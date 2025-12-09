import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 일별 매출 데이터 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;
    const days = parseInt(searchParams.get('days') || '7');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    const client = getCoupangClient();
    const today = new Date();
    const revenueData: { date: string; revenue: number; profit: number }[] = [];

    // 각 날짜별 주문 데이터 조회
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

      try {
        const orders = await client.getOrders({
          vendorId,
          createdAtFrom: dateStr,
          createdAtTo: dateStr,
          status: 'ACCEPT',
          maxPerPage: 50,
        });

        // 매출 계산
        const revenue = (orders.data || []).reduce((sum, order) => {
          const orderTotal = (order.orderItems || []).reduce((itemSum, item) => {
            return itemSum + (item.orderPrice || 0) * (item.shippingCount || 1);
          }, 0);
          return sum + orderTotal;
        }, 0);

        // 순이익 추정 (마진율 15% 가정)
        const profit = Math.round(revenue * 0.15);

        revenueData.push({
          date: displayDate,
          revenue,
          profit,
        });
      } catch {
        // 개별 날짜 조회 실패 시 0으로 설정
        revenueData.push({
          date: displayDate,
          revenue: 0,
          profit: 0,
        });
      }
    }

    return NextResponse.json({ revenueData });
  } catch (error) {
    console.error('[API] Revenue data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
