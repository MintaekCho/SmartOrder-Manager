'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 카테고리 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.shopCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('카테고리 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 카테고리 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      slug,
      code,
      description,
      imageUrl,
      parentId,
      displayOrder,
      isActive,
      isVisible,
      icon,
    } = body;

    // 카테고리 존재 확인
    const existing = await prisma.shopCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 슬러그 중복 확인 (다른 카테고리)
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.shopCategory.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 슬러그입니다.' },
          { status: 400 }
        );
      }
    }

    // 코드 중복 확인 (다른 카테고리)
    if (code && code !== existing.code) {
      // 코드 형식 검증
      if (!/^[A-Z0-9]+$/.test(code)) {
        return NextResponse.json(
          { success: false, error: '코드는 영문 대문자와 숫자만 가능합니다.' },
          { status: 400 }
        );
      }

      const codeExists = await prisma.shopCategory.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 카테고리 코드입니다.' },
          { status: 400 }
        );
      }
    }

    // 자기 자신을 부모로 설정하는 것 방지
    if (parentId === id) {
      return NextResponse.json(
        { success: false, error: '자기 자신을 상위 카테고리로 설정할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 카테고리 수정
    const category = await prisma.shopCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(parentId !== undefined && { parentId }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(isVisible !== undefined && { isVisible }),
        ...(icon !== undefined && { icon }),
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('카테고리 수정 에러:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 카테고리 존재 확인
    const existing = await prisma.shopCategory.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 하위 카테고리 있으면 삭제 불가
    if (existing.children.length > 0) {
      return NextResponse.json(
        { success: false, error: '하위 카테고리가 있어 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제해주세요.' },
        { status: 400 }
      );
    }

    // 삭제
    await prisma.shopCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '카테고리가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('카테고리 삭제 에러:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
