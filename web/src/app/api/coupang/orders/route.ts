import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClientWithVendorId } from '@/lib/coupang/client';

// 주문 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACCEPT';
    const createdAtFrom = searchParams.get('createdAtFrom');
    const createdAtTo = searchParams.get('createdAtTo');
    const nextToken = searchParams.get('nextToken');
    const maxPerPage = searchParams.get('maxPerPage');

    const { client, vendorId } = await getCoupangClientWithVendorId();
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
