import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId } from '@/lib/auth';

// 마스터 상품 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const { id } = await params;

    const product = await prisma.masterProduct.findFirst({
      where: { id, userId },
      include: {
        platformProducts: {
          include: {
            uploadLogs: {
              orderBy: { startedAt: 'desc' },
              take: 5,
            },
          },
        },
        category: true,
        uploadLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('마스터 상품 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '상품 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 마스터 상품 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const { id } = await params;
    const body = await request.json();

    // 기존 상품 확인
    const existingProduct = await prisma.masterProduct.findFirst({
      where: { id, userId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const {
      name,
      description,
      brand,
      categoryId,
      thumbnailUrl,
      images,
      costPrice,
      basePrice,
      options,
      detailHtml,
      notices,
      shippingFee,
      status,
    } = body;

    const product = await prisma.masterProduct.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(brand !== undefined && { brand }),
        ...(categoryId !== undefined && { categoryId }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(images !== undefined && { images }),
        ...(costPrice !== undefined && { costPrice: parseInt(costPrice) || 0 }),
        ...(basePrice !== undefined && { basePrice: parseInt(basePrice) }),
        ...(options !== undefined && { options }),
        ...(detailHtml !== undefined && { detailHtml }),
        ...(notices !== undefined && { notices }),
        ...(shippingFee !== undefined && { shippingFee: parseInt(shippingFee) || 0 }),
        ...(status !== undefined && { status }),
      },
      include: {
        platformProducts: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('마스터 상품 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '상품 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 마스터 상품 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const { id } = await params;

    // 기존 상품 확인
    const existingProduct = await prisma.masterProduct.findFirst({
      where: { id, userId },
      include: { platformProducts: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 플랫폼에 등록된 상품이 있으면 경고
    const activePlatforms = existingProduct.platformProducts.filter(
      pp => pp.status === 'ACTIVE' || pp.status === 'REGISTERED'
    );

    if (activePlatforms.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '플랫폼에 등록된 상품이 있습니다. 먼저 플랫폼에서 삭제해주세요.',
          activePlatforms: activePlatforms.map(pp => pp.platform),
        },
        { status: 400 }
      );
    }

    // 소프트 삭제 (상태만 변경)
    await prisma.masterProduct.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return NextResponse.json({
      success: true,
      message: '상품이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('마스터 상품 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '상품 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
