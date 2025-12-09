import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 주문 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;
    const status = searchParams.get('status') || 'ACCEPT';
    const createdAtFrom = searchParams.get('createdAtFrom');
    const createdAtTo = searchParams.get('createdAtTo');
    const nextToken = searchParams.get('nextToken');
    const maxPerPage = searchParams.get('maxPerPage');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    const client = getCoupangClient();
    const response = await client.getOrders({
      vendorId,
      status,
      createdAtFrom: createdAtFrom || undefined,
      createdAtTo: createdAtTo || undefined,
      nextToken: nextToken || undefined,
      maxPerPage: maxPerPage ? parseInt(maxPerPage) : 50,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang orders error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
