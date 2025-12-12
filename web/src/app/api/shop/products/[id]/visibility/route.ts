'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 자사몰 상품 노출 토글
export async function POST(
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

    const product = await prisma.inventoryItem.update({
      where: { id },
      data: {
        isShopVisible: !existing.isShopVisible,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: product.isShopVisible ? '상품이 자사몰에 노출됩니다.' : '상품이 자사몰에서 숨겨집니다.',
    });
  } catch (error) {
    console.error('자사몰 상품 노출 토글 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 노출 설정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
