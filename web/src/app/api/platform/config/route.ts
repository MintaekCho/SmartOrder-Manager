import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId } from '@/lib/auth';
import { Platform } from '@prisma/client';

// 플랫폼 설정 조회
export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform | null;

    const where = platform
      ? { userId, platform }
      : { userId };

    const configs = await prisma.platformConfig.findMany({
      where,
      select: {
        id: true,
        platform: true,
        sellerId: true,
        sellerName: true,
        outboundCode: true,
        returnCode: true,
        isActive: true,
        lastVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        // credentials는 민감정보이므로 마스킹 처리
        credentials: true,
      },
    });

    // credentials 마스킹 처리
    const maskedConfigs = configs.map(config => {
      const creds = config.credentials as Record<string, string>;
      const maskedCreds: Record<string, string> = {};

      for (const [key, value] of Object.entries(creds)) {
        if (typeof value === 'string' && value.length > 0) {
          // 마지막 4자리만 표시
          maskedCreds[key] = value.length > 4
            ? '*'.repeat(value.length - 4) + value.slice(-4)
            : '****';
        } else {
          maskedCreds[key] = '';
        }
      }

      return {
        ...config,
        credentials: maskedCreds,
        isConfigured: Object.values(creds).some(v => v && v.length > 0),
      };
    });

    return NextResponse.json({
      success: true,
      data: maskedConfigs,
    });
  } catch (error) {
    console.error('플랫폼 설정 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 플랫폼 설정 저장/수정
export async function PUT(request: NextRequest) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const body = await request.json();

    const { platform, credentials, outboundCode, returnCode } = body;

    if (!platform || !['COUPANG', 'NAVER', 'SHOP'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 플랫폼입니다.' },
        { status: 400 }
      );
    }

    // 기존 설정이 있으면 업데이트, 없으면 생성
    const existingConfig = await prisma.platformConfig.findUnique({
      where: {
        userId_platform: { userId, platform },
      },
    });

    let config;

    if (existingConfig) {
      // 기존 credentials와 병합 (빈 값이 아닌 것만 업데이트)
      const existingCreds = existingConfig.credentials as Record<string, string>;
      const mergedCreds = { ...existingCreds };

      for (const [key, value] of Object.entries(credentials || {})) {
        if (typeof value === 'string' && value.length > 0 && !value.startsWith('*')) {
          mergedCreds[key] = value;
        }
      }

      config = await prisma.platformConfig.update({
        where: { id: existingConfig.id },
        data: {
          credentials: mergedCreds,
          outboundCode: outboundCode || existingConfig.outboundCode,
          returnCode: returnCode || existingConfig.returnCode,
          updatedAt: new Date(),
        },
      });
    } else {
      config = await prisma.platformConfig.create({
        data: {
          userId,
          platform,
          credentials: credentials || {},
          outboundCode,
          returnCode,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        platform: config.platform,
        isConfigured: true,
      },
    });
  } catch (error) {
    console.error('플랫폼 설정 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: '설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
