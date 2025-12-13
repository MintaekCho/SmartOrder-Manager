import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 쿠팡 기본 설정 (메모리 캐시 - 실제로는 DB에 저장해야 함)
let coupangSettings: CoupangSettings | null = null;

interface CoupangSettings {
  // 배송 설정
  deliveryMethod: string;
  deliveryCompanyCode: string;
  deliveryChargeType: string;
  deliveryCharge: number;
  freeShipOverAmount: number;
  deliveryChargeOnReturn: number;
  remoteAreaDeliverable: string;
  unionDeliveryType: string;

  // 출고지/반품지
  outboundShippingPlaceCode: string;
  outboundShippingPlaceName?: string;
  returnCenterCode: string;
  returnCenterName?: string;

  // 반품 설정
  returnCharge: number;
  returnChargeVendor: string;

  // A/S 정보
  afterServiceInformation: string;
  afterServiceContactNumber: string;

  // 기본값
  defaultBrand?: string;
  vendorUserId?: string;

  // 메타 정보
  updatedAt?: string;
}

/**
 * 쿠팡 기본 설정 조회
 * GET /api/coupang/settings
 */
export async function GET() {
  try {
    // 저장된 설정이 없으면 기본값 반환
    if (!coupangSettings) {
      // 출고지/반품지 목록도 함께 조회
      const vendorId = process.env.COUPANG_VENDOR_ID;
      let outboundPlaces: Array<{ code: number | string; name: string }> = [];
      let returnCenters: Array<{ code: string; name: string }> = [];

      if (vendorId) {
        try {
          const client = getCoupangClient();
          const [outboundRes, returnRes] = await Promise.all([
            client.getOutboundShippingPlaces(vendorId),
            client.getReturnShippingCenters(vendorId),
          ]);

          // 디버그 로그 - 실제 응답 구조 확인
          console.log('[Coupang Settings] Outbound Response:', JSON.stringify(outboundRes, null, 2));
          console.log('[Coupang Settings] Return Response:', JSON.stringify(returnRes, null, 2));

          // 쿠팡 API 응답 구조 확인: data.content 또는 직접 배열
          const outboundContent = outboundRes.data?.content || outboundRes.content || [];
          const returnContent = returnRes.data?.content || returnRes.content || [];

          if (outboundContent.length > 0) {
            outboundPlaces = outboundContent.map((p: { outboundShippingPlaceCode: number | string; shippingPlaceName: string }) => ({
              code: p.outboundShippingPlaceCode,
              name: p.shippingPlaceName,
            }));
          }

          if (returnContent.length > 0) {
            returnCenters = returnContent.map((c: { returnCenterCode: string; shippingPlaceName: string }) => ({
              code: c.returnCenterCode,
              name: c.shippingPlaceName,
            }));
          }

          console.log('[Coupang Settings] Parsed outbound places:', outboundPlaces);
          console.log('[Coupang Settings] Parsed return centers:', returnCenters);
        } catch (error) {
          console.error('출고지/반품지 로드 실패:', error);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          // 기본값
          deliveryMethod: 'SEQUENCIAL',
          deliveryCompanyCode: 'CJGLS',
          deliveryChargeType: 'NOT_FREE',
          deliveryCharge: 3000,
          freeShipOverAmount: 50000,
          deliveryChargeOnReturn: 6000,
          remoteAreaDeliverable: 'Y',
          unionDeliveryType: 'UNION_DELIVERY',
          outboundShippingPlaceCode: outboundPlaces[0]?.code?.toString() || '',
          outboundShippingPlaceName: outboundPlaces[0]?.name || '',
          returnCenterCode: returnCenters[0]?.code || '',
          returnCenterName: returnCenters[0]?.name || '',
          returnCharge: 6000,
          returnChargeVendor: 'VENDOR',
          afterServiceInformation: '고객센터로 문의해주세요.',
          afterServiceContactNumber: '',
          defaultBrand: '',
          vendorUserId: '',
        },
        outboundPlaces,
        returnCenters,
        isConfigured: false,
      });
    }

    return NextResponse.json({
      success: true,
      data: coupangSettings,
      isConfigured: true,
    });
  } catch (error) {
    console.error('[API] Coupang settings GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    );
  }
}

/**
 * 쿠팡 기본 설정 저장
 * POST /api/coupang/settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 설정 저장
    coupangSettings = {
      deliveryMethod: body.deliveryMethod || 'SEQUENCIAL',
      deliveryCompanyCode: body.deliveryCompanyCode || 'CJGLS',
      deliveryChargeType: body.deliveryChargeType || 'NOT_FREE',
      deliveryCharge: body.deliveryCharge ?? 3000,
      freeShipOverAmount: body.freeShipOverAmount ?? 50000,
      deliveryChargeOnReturn: body.deliveryChargeOnReturn ?? 6000,
      remoteAreaDeliverable: body.remoteAreaDeliverable || 'Y',
      unionDeliveryType: body.unionDeliveryType || 'UNION_DELIVERY',
      outboundShippingPlaceCode: body.outboundShippingPlaceCode || '',
      outboundShippingPlaceName: body.outboundShippingPlaceName || '',
      returnCenterCode: body.returnCenterCode || '',
      returnCenterName: body.returnCenterName || '',
      returnCharge: body.returnCharge ?? 6000,
      returnChargeVendor: body.returnChargeVendor || 'VENDOR',
      afterServiceInformation: body.afterServiceInformation || '고객센터로 문의해주세요.',
      afterServiceContactNumber: body.afterServiceContactNumber || '',
      defaultBrand: body.defaultBrand || '',
      vendorUserId: body.vendorUserId || '',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: coupangSettings,
      message: '쿠팡 기본 설정이 저장되었습니다.',
    });
  } catch (error) {
    console.error('[API] Coupang settings POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
