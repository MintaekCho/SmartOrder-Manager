import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

/**
 * 쿠팡 출고지/반품지 조회 API
 *
 * GET /api/coupang/shipping
 * - ?type=outbound : 출고지 목록 조회
 * - ?type=return : 반품지 목록 조회
 * - ?vendorId=xxx : 업체 ID (선택, 기본값: 환경변수)
 * - ?pageNum=1 : 페이지 번호 (선택, 기본값: 1)
 * - ?pageSize=50 : 페이지 크기 (선택, 기본값: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'outbound';
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;
    const pageNum = parseInt(searchParams.get('pageNum') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    const client = getCoupangClient();

    if (type === 'outbound') {
      // 출고지 목록 조회
      const response = await client.getOutboundShippingPlaces(vendorId, pageNum, pageSize);

      return NextResponse.json({
        success: true,
        type: 'outbound',
        data: response.data?.content?.map(place => ({
          code: place.outboundShippingPlaceCode,
          name: place.shippingPlaceName,
          address: place.placeAddresses?.[0]?.returnAddress,
          addressDetail: place.placeAddresses?.[0]?.returnAddressDetail,
          zipCode: place.placeAddresses?.[0]?.returnZipCode,
          contactNumber: place.placeAddresses?.[0]?.companyContactNumber,
          remoteAreaDeliverable: place.remoteAreaDeliverable,
          usable: place.usable,
        })) || [],
        pagination: response.data?.pagination,
      });
    } else if (type === 'return') {
      // 반품지 목록 조회
      const response = await client.getReturnShippingCenters(vendorId, pageNum, pageSize);

      return NextResponse.json({
        success: true,
        type: 'return',
        data: response.data?.content?.map(center => ({
          code: center.returnCenterCode,
          name: center.shippingPlaceName,
          deliveryCompanyCode: center.deliverCode,
          deliveryCompanyName: center.deliverName,
          address: center.placeAddresses?.[0]?.returnAddress,
          addressDetail: center.placeAddresses?.[0]?.returnAddressDetail,
          zipCode: center.placeAddresses?.[0]?.returnZipCode,
          contactNumber: center.placeAddresses?.[0]?.companyContactNumber,
          usable: center.usable,
        })) || [],
        pagination: response.data?.pagination,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Use "outbound" or "return".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API] Coupang shipping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shipping places'
      },
      { status: 500 }
    );
  }
}
