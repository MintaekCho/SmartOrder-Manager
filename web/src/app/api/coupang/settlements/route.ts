import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 정산 내역 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;
    const settleDateFrom = searchParams.get('settleDateFrom');
    const settleDateTo = searchParams.get('settleDateTo');
    const nextToken = searchParams.get('nextToken');
    const maxPerPage = searchParams.get('maxPerPage');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    if (!settleDateFrom || !settleDateTo) {
      return NextResponse.json(
        { error: 'settleDateFrom and settleDateTo are required' },
        { status: 400 }
      );
    }

    const client = getCoupangClient();
    const response = await client.getSettlements({
      vendorId,
      settleDateFrom,
      settleDateTo,
      nextToken: nextToken || undefined,
      maxPerPage: maxPerPage ? parseInt(maxPerPage) : 50,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang settlements error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}
