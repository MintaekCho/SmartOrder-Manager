import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId } from '@/lib/auth';
import { createCoupangClient } from '@/lib/coupang/client';

// 플랫폼 API 연결 테스트
export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const body = await request.json();
    const { platform } = body;

    if (!platform || !['COUPANG', 'NAVER'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 플랫폼입니다.' },
        { status: 400 }
      );
    }

    // DB에서 설정 조회
    const config = await prisma.platformConfig.findUnique({
      where: {
        userId_platform: { userId, platform },
      },
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: '플랫폼 설정이 없습니다. 먼저 설정을 저장해주세요.' },
        { status: 400 }
      );
    }

    const credentials = config.credentials as Record<string, string>;

    let verifyResult = { success: false, message: '', sellerInfo: null as Record<string, string> | null };

    if (platform === 'COUPANG') {
      verifyResult = await verifyCoupang(credentials);
    } else if (platform === 'NAVER') {
      verifyResult = await verifyNaver(credentials);
    }

    if (verifyResult.success) {
      // 검증 성공 시 DB 업데이트
      await prisma.platformConfig.update({
        where: { id: config.id },
        data: {
          isActive: true,
          lastVerifiedAt: new Date(),
          sellerId: verifyResult.sellerInfo?.sellerId || config.sellerId,
          sellerName: verifyResult.sellerInfo?.sellerName || config.sellerName,
        },
      });

      return NextResponse.json({
        success: true,
        message: verifyResult.message,
        data: verifyResult.sellerInfo,
      });
    } else {
      // 검증 실패 시 비활성화
      await prisma.platformConfig.update({
        where: { id: config.id },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json(
        { success: false, error: verifyResult.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('플랫폼 연결 테스트 오류:', error);
    return NextResponse.json(
      { success: false, error: 'API 연결 테스트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 쿠팡 API 검증
async function verifyCoupang(credentials: Record<string, string>): Promise<{
  success: boolean;
  message: string;
  sellerInfo: Record<string, string> | null;
}> {
  const { vendorId, accessKey, secretKey } = credentials;

  if (!vendorId || !accessKey || !secretKey) {
    return {
      success: false,
      message: 'Vendor ID, Access Key, Secret Key가 모두 필요합니다.',
      sellerInfo: null,
    };
  }

  try {
    // 쿠팡 API 클라이언트로 출고지 목록 조회 (가벼운 API로 연결 확인)
    const client = createCoupangClient({ accessKey, secretKey });

    // 출고지 조회로 연결 확인 (간단한 API)
    const result = await client.getOutboundShippingPlaces(vendorId, 1, 10);

    console.log('[Coupang Verify] API Response:', JSON.stringify(result, null, 2));

    // 쿠팡 API 에러 응답 확인 (HTTP 200이지만 에러인 경우)
    // 에러 응답 예시: { code: "ERROR", message: "Invalid signature" }
    // 성공 응답: { code: 200, message: "SUCCESS" } 또는 content 배열만 있는 경우
    const responseCode = (result as { code?: string | number }).code;
    const responseCodeStr = String(responseCode).toUpperCase();

    // 성공 코드 목록: "OK", "SUCCESS", "200", 숫자 200
    const successCodes = ['OK', 'SUCCESS', '200'];
    const isSuccessCode = !responseCode || successCodes.includes(responseCodeStr);

    if (!isSuccessCode) {
      const errorMessage = (result as { message?: string }).message || '알 수 없는 에러';
      console.error('[Coupang Verify] API Error Response:', responseCode, errorMessage);
      return {
        success: false,
        message: `쿠팡 API 오류: ${errorMessage} (${responseCode})`,
        sellerInfo: null,
      };
    }

    // 응답에 content가 배열로 있어야 성공
    const content = result.content || result.data?.content;
    if (Array.isArray(content)) {
      return {
        success: true,
        message: `쿠팡 API 연결이 확인되었습니다. (출고지 ${content.length}개)`,
        sellerInfo: {
          sellerId: vendorId,
          sellerName: `쿠팡 판매자 (${vendorId})`,
        },
      };
    }

    // content가 없으면 실패로 간주
    console.error('[Coupang Verify] No content in response:', result);
    return {
      success: false,
      message: 'API 응답에 출고지 정보가 없습니다. 자격 증명을 확인해주세요.',
      sellerInfo: null,
    };
  } catch (error) {
    console.error('쿠팡 API 검증 오류:', error);
    // 에러 메시지에서 상태 코드 추출
    const errorMessage = error instanceof Error ? error.message : 'API 연결에 실패했습니다.';

    // 401 Unauthorized 등 인증 오류 명확히 표시
    if (errorMessage.includes('401')) {
      return {
        success: false,
        message: 'API 인증 실패: Access Key 또는 Secret Key가 올바르지 않습니다.',
        sellerInfo: null,
      };
    }
    if (errorMessage.includes('403')) {
      return {
        success: false,
        message: 'API 권한 오류: 해당 Vendor ID에 대한 접근 권한이 없습니다.',
        sellerInfo: null,
      };
    }

    return {
      success: false,
      message: errorMessage,
      sellerInfo: null,
    };
  }
}

// 네이버 API 검증
async function verifyNaver(credentials: Record<string, string>): Promise<{
  success: boolean;
  message: string;
  sellerInfo: Record<string, string> | null;
}> {
  const { clientId, clientSecret } = credentials;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      message: 'Client ID와 Client Secret이 모두 필요합니다.',
      sellerInfo: null,
    };
  }

  try {
    // 네이버 Commerce API 토큰 발급 시도
    const tokenUrl = 'https://api.commerce.naver.com/external/v1/oauth2/token';

    // 타임스탬프 기반 서명 생성
    const timestamp = Date.now();
    const crypto = await import('crypto');
    const message = `${clientId}_${timestamp}`;
    const signature = crypto
      .createHmac('sha256', clientSecret)
      .update(message)
      .digest('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      timestamp: timestamp.toString(),
      client_secret_sign: signature,
      grant_type: 'client_credentials',
      type: 'SELF',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      return {
        success: true,
        message: '네이버 Commerce API 연결이 확인되었습니다.',
        sellerInfo: {
          sellerId: clientId,
          sellerName: '네이버 스마트스토어',
        },
      };
    }

    return {
      success: false,
      message: data.message || data.error_description || 'API 인증에 실패했습니다.',
      sellerInfo: null,
    };
  } catch (error) {
    console.error('네이버 API 검증 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API 연결에 실패했습니다.',
      sellerInfo: null,
    };
  }
}
