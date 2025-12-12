'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // 기본값 true
    const flat = searchParams.get('flat') === 'true'; // 플랫 리스트로 반환

    const where: any = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (flat) {
      // 플랫 리스트 (드롭다운용)
      const categories = await prisma.shopCategory.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    // 계층 구조로 반환 (최상위 카테고리만)
    where.parentId = null;

    const categories = await prisma.shopCategory.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      include: includeChildren ? {
        children: {
          where: activeOnly ? { isActive: true } : {},
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
          include: {
            children: {
              where: activeOnly ? { isActive: true } : {},
              orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
              ],
            },
          },
        },
      } : undefined,
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('카테고리 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 카테고리 생성
export async function POST(request: NextRequest) {
  try {
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

    // 필수 필드 검증
    if (!name || !slug || !code) {
      return NextResponse.json(
        { success: false, error: '카테고리명, 슬러그, 코드는 필수입니다.' },
        { status: 400 }
      );
    }

    // 코드 형식 검증 (영문 대문자 + 숫자만)
    if (!/^[A-Z0-9]+$/.test(code)) {
      return NextResponse.json(
        { success: false, error: '코드는 영문 대문자와 숫자만 가능합니다.' },
        { status: 400 }
      );
    }

    // 슬러그 중복 확인
    const existingSlug = await prisma.shopCategory.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 슬러그입니다.' },
        { status: 400 }
      );
    }

    // 코드 중복 확인
    const existingCode = await prisma.shopCategory.findUnique({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 카테고리 코드입니다.' },
        { status: 400 }
      );
    }

    // 카테고리 생성
    const category = await prisma.shopCategory.create({
      data: {
        name,
        slug,
        code,
        description: description || null,
        imageUrl: imageUrl || null,
        parentId: parentId || null,
        displayOrder: displayOrder ?? 0,
        isActive: isActive !== false,
        isVisible: isVisible !== false,
        icon: icon || null,
        productSeq: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('카테고리 생성 에러:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
