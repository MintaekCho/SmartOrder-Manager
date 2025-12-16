import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClientWithVendorId } from '@/lib/coupang/client';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId } from '@/lib/auth';

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
    const userId = await getOrCreateDefaultUserId();

    // DB에서 쿠팡 설정 조회
    const platformConfig = await prisma.platformConfig.findFirst({
      where: {
        userId,
        platform: 'COUPANG',
      },
    });

    // 출고지/반품지 목록 조회
    let outboundPlaces: Array<{ code: number | string; name: string }> = [];
    let returnCenters: Array<{ code: string; name: string }> = [];

    try {
      const { client, vendorId } = await getCoupangClientWithVendorId();

      // 출고지 조회
      try {
        const outboundRes = await client.getOutboundShippingPlaces(vendorId);
        console.log('[Coupang Settings] Outbound Response:', JSON.stringify(outboundRes, null, 2));

        const outboundContent = outboundRes.data?.content || outboundRes.content || [];
        if (outboundContent.length > 0) {
          outboundPlaces = outboundContent.map((p: { outboundShippingPlaceCode: number | string; shippingPlaceName: string }) => ({
            code: p.outboundShippingPlaceCode,
            name: p.shippingPlaceName,
          }));
        }
        console.log('[Coupang Settings] Parsed outbound places:', outboundPlaces);
      } catch (error) {
        console.error('출고지 로드 실패:', error);
      }

      // 반품지 조회
      try {
        const returnRes = await client.getReturnShippingCenters(vendorId);
        console.log('[Coupang Settings] Return Response:', JSON.stringify(returnRes, null, 2));

        const returnContent = returnRes.data?.content || returnRes.content || [];
        if (returnContent.length > 0) {
          returnCenters = returnContent.map((c: { returnCenterCode: string; shippingPlaceName: string }) => ({
            code: c.returnCenterCode,
            name: c.shippingPlaceName,
          }));
        }
        console.log('[Coupang Settings] Parsed return centers:', returnCenters);
      } catch (error) {
        console.error('반품지 로드 실패:', error);
      }
    } catch (error) {
      console.log('[Coupang Settings] No API config yet:', error);
    }

    // DB에 저장된 설정이 있으면 반환
    if (platformConfig) {
      const credentials = platformConfig.credentials as Record<string, unknown> || {};
      const settings = (credentials.settings as CoupangSettings) || {};

      return NextResponse.json({
        success: true,
        data: {
          deliveryMethod: settings.deliveryMethod || 'SEQUENCIAL',
          deliveryCompanyCode: settings.deliveryCompanyCode || 'CJGLS',
          deliveryChargeType: settings.deliveryChargeType || 'NOT_FREE',
          deliveryCharge: settings.deliveryCharge ?? 3000,
          freeShipOverAmount: settings.freeShipOverAmount ?? 50000,
          deliveryChargeOnReturn: settings.deliveryChargeOnReturn ?? 6000,
          remoteAreaDeliverable: settings.remoteAreaDeliverable || 'Y',
          unionDeliveryType: settings.unionDeliveryType || 'UNION_DELIVERY',
          outboundShippingPlaceCode: platformConfig.outboundCode || settings.outboundShippingPlaceCode || '',
          outboundShippingPlaceName: settings.outboundShippingPlaceName || '',
          returnCenterCode: platformConfig.returnCode || settings.returnCenterCode || '',
          returnCenterName: settings.returnCenterName || '',
          returnCharge: settings.returnCharge ?? 6000,
          returnChargeVendor: settings.returnChargeVendor || 'VENDOR',
          afterServiceInformation: settings.afterServiceInformation || '고객센터로 문의해주세요.',
          afterServiceContactNumber: settings.afterServiceContactNumber || '',
          defaultBrand: settings.defaultBrand || '',
          vendorUserId: settings.vendorUserId || '',
          updatedAt: settings.updatedAt,
        },
        outboundPlaces,
        returnCenters,
        isConfigured: true,
      });
    }

    // 저장된 설정이 없으면 기본값 반환
    return NextResponse.json({
      success: true,
      data: {
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
    const userId = await getOrCreateDefaultUserId();
    const body = await request.json();

    // 설정 데이터 구성
    const settings: CoupangSettings = {
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

    // 기존 설정 조회
    const existingConfig = await prisma.platformConfig.findFirst({
      where: {
        userId,
        platform: 'COUPANG',
      },
    });

    if (existingConfig) {
      // 기존 credentials에 settings 병합
      const existingCredentials = existingConfig.credentials as Record<string, unknown> || {};

      await prisma.platformConfig.update({
        where: { id: existingConfig.id },
        data: {
          outboundCode: settings.outboundShippingPlaceCode,
          returnCode: settings.returnCenterCode,
          credentials: {
            ...existingCredentials,
            settings: JSON.parse(JSON.stringify(settings)),
          },
        },
      });
    } else {
      // 새로 생성
      await prisma.platformConfig.create({
        data: {
          userId,
          platform: 'COUPANG',
          outboundCode: settings.outboundShippingPlaceCode,
          returnCode: settings.returnCenterCode,
          credentials: {
            settings: JSON.parse(JSON.stringify(settings)),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
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
