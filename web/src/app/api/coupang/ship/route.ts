import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClientWithVendorId, DELIVERY_COMPANY_CODES } from '@/lib/coupang/client';

// 송장 등록 (발송 처리)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentBoxId, deliveryCompanyCode, invoiceNumber, vendorItemIds } = body;

    if (!shipmentBoxId) {
      return NextResponse.json({ error: 'shipmentBoxId is required' }, { status: 400 });
    }

    if (!deliveryCompanyCode) {
      return NextResponse.json({ error: 'deliveryCompanyCode is required' }, { status: 400 });
    }

    if (!invoiceNumber) {
      return NextResponse.json({ error: 'invoiceNumber is required' }, { status: 400 });
    }

    const { client, vendorId } = await getCoupangClientWithVendorId();
    const response = await client.shipOrder(vendorId, {
      shipmentBoxId: Number(shipmentBoxId),
      deliveryCompanyCode,
      invoiceNumber,
      vendorItemIds,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang ship error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ship order' },
      { status: 500 }
    );
  }
}

// 택배사 목록 조회
export async function GET() {
  return NextResponse.json({
    data: Object.entries(DELIVERY_COMPANY_CODES).map(([code, name]) => ({
      code,
      name,
    })),
  });
}
