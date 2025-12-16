import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClientWithVendorId } from '@/lib/coupang/client';

/**
 * 쿠팡 출고지/반품지 조회 API
 *
 * GET /api/coupang/shipping
 * - ?type=outbound : 출고지 목록 조회
 * - ?type=return : 반품지 목록 조회
 * - ?pageNum=1 : 페이지 번호 (선택, 기본값: 1)
 * - ?pageSize=50 : 페이지 크기 (선택, 기본값: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'outbound';
    const pageNum = parseInt(searchParams.get('pageNum') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const { client, vendorId } = await getCoupangClientWithVendorId();

    if (type === 'outbound') {
      // 출고지 목록 조회
      const response = await client.getOutboundShippingPlaces(vendorId, pageNum, pageSize);

      // 새 API는 content를 직접 반환, 이전 API는 data.content로 반환
      const outboundContent = response.data?.content || response.content || [];
      const pagination = response.data?.pagination || response.pagination;

      return NextResponse.json({
        success: true,
        type: 'outbound',
        data: outboundContent.map(place => ({
          code: place.outboundShippingPlaceCode,
          name: place.shippingPlaceName,
          address: place.placeAddresses?.[0]?.returnAddress,
          addressDetail: place.placeAddresses?.[0]?.returnAddressDetail,
          zipCode: place.placeAddresses?.[0]?.returnZipCode,
          contactNumber: place.placeAddresses?.[0]?.companyContactNumber,
          remoteAreaDeliverable: place.remoteAreaDeliverable,
          usable: place.usable,
        })),
        pagination,
      });
    } else if (type === 'return') {
      // 반품지 목록 조회
      const response = await client.getReturnShippingCenters(vendorId, pageNum, pageSize);

      // 새 API는 content를 직접 반환, 이전 API는 data.content로 반환
      const returnContent = response.data?.content || response.content || [];
      const pagination = response.data?.pagination || response.pagination;

      return NextResponse.json({
        success: true,
        type: 'return',
        data: returnContent.map(center => ({
          code: center.returnCenterCode,
          name: center.shippingPlaceName,
          deliveryCompanyCode: center.deliverCode,
          deliveryCompanyName: center.deliverName,
          address: center.placeAddresses?.[0]?.returnAddress,
          addressDetail: center.placeAddresses?.[0]?.returnAddressDetail,
          zipCode: center.placeAddresses?.[0]?.returnZipCode,
          contactNumber: center.placeAddresses?.[0]?.companyContactNumber,
          usable: center.usable,
        })),
        pagination,
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
