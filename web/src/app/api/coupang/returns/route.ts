import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClientWithVendorId } from '@/lib/coupang/client';

// 반품/취소 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const createdAtFrom = searchParams.get('createdAtFrom') || undefined;
    const createdAtTo = searchParams.get('createdAtTo') || undefined;
    const cancelType = searchParams.get('cancelType') || undefined;
    const nextToken = searchParams.get('nextToken') || undefined;

    const { client, vendorId } = await getCoupangClientWithVendorId();

    // 여러 상태의 데이터를 조회하여 합침
    const statuses = ['UC', 'CC', 'RC']; // 승인대기, 승인완료, 수거완료
    const allResults: any[] = [];

    for (const s of statuses) {
      try {
        const result = await client.getCancelRequests({
          vendorId,
          createdAtFrom,
          createdAtTo,
          cancelType,
          status: s,
          nextToken,
        });
        if (result.data && Array.isArray(result.data)) {
          allResults.push(...result.data.map((item: any) => ({
            ...item,
            status: s === 'UC' ? 'REQUEST' : s === 'CC' ? 'APPROVED' : 'COLLECT_DONE',
          })));
        }
      } catch (e) {
        console.log(`[API] No data for status ${s}`);
      }
    }

    return NextResponse.json({
      code: 'SUCCESS',
      message: 'Success',
      data: allResults,
    });
  } catch (error) {
    console.error('[API] Returns fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

// 반품/취소 승인 처리
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptId, action } = body;

    const { client, vendorId } = await getCoupangClientWithVendorId();

    if (action === 'approve') {
      const result = await client.approveCancel(vendorId, receiptId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] Return action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process return' },
      { status: 500 }
    );
  }
}
