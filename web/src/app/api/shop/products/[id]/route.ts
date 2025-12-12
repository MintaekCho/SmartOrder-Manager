'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 자사몰 상품 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        warehouse: {
          select: { name: true },
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
    console.error('자사몰 상품 상세 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 자사몰 상품 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      category,
      costPrice,
      sellingPrice,
      quantity,
      minQuantity,
      unit,
      warehouseId,
      description,
      imageUrl,
      isShopVisible,
      shopDescription,
      shopImages,
    } = body;

    // 기존 상품 확인
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const product = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(costPrice !== undefined && { costPrice }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(quantity !== undefined && { quantity }),
        ...(minQuantity !== undefined && { minQuantity }),
        ...(unit && { unit }),
        ...(warehouseId && { warehouseId }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isShopVisible !== undefined && { isShopVisible }),
        ...(shopDescription !== undefined && { shopDescription }),
        ...(shopImages !== undefined && { shopImages }),
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('자사몰 상품 수정 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 자사몰 상품 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 기존 상품 확인
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '상품이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('자사몰 상품 삭제 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
