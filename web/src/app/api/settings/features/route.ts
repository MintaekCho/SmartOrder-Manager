import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId } from '@/lib/auth';
import { defaultFeatureSettings, FeatureSettings } from '@/contexts/FeatureSettingsContext';

// GET: 기능 설정 조회
export async function GET() {
  try {
    const userId = await getOrCreateDefaultUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // settings JSON에서 features 추출
    const settings = user.settings as Record<string, unknown> | null;
    const features = settings?.features as FeatureSettings | undefined;

    return NextResponse.json({
      success: true,
      data: features || defaultFeatureSettings,
    });
  } catch (error) {
    console.error('기능 설정 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '기능 설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 기능 설정 저장
export async function PUT(request: NextRequest) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const body = await request.json();
    const { features } = body as { features: Partial<FeatureSettings> };

    if (!features || typeof features !== 'object') {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 설정입니다.' },
        { status: 400 }
      );
    }

    // 기존 설정 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    const existingSettings = (user?.settings as Record<string, unknown>) || {};

    // 설정 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...existingSettings,
          features: {
            ...defaultFeatureSettings,
            ...(existingSettings.features as Record<string, unknown> || {}),
            ...features,
          },
        },
      },
      select: { settings: true },
    });

    const updatedSettings = updatedUser.settings as Record<string, unknown>;
    const updatedFeatures = updatedSettings?.features as FeatureSettings;

    return NextResponse.json({
      success: true,
      data: updatedFeatures,
    });
  } catch (error) {
    console.error('기능 설정 저장 에러:', error);
    return NextResponse.json(
      { success: false, error: '기능 설정을 저장하는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
