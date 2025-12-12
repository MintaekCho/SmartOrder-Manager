'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 카테고리 이미지는 2MB로 제한

// 이미지 업로드 헬퍼 함수
async function uploadCategoryImage(file: File): Promise<string | null> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return null;
  if (file.size > MAX_FILE_SIZE) return null;

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `category-${uuidv4()}.${ext}`;
  const filePath = `categories/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.PRODUCTS)
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Category image upload error:', error);
    return null;
  }

  return getPublicUrl(STORAGE_BUCKETS.PRODUCTS, filePath);
}

// 카테고리 생성 (이미지 업로드 포함)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const code = formData.get('code') as string;
    const description = formData.get('description') as string | null;
    const parentId = formData.get('parentId') as string | null;
    const displayOrder = formData.get('displayOrder');
    const isActive = formData.get('isActive');
    const isVisible = formData.get('isVisible');
    const icon = formData.get('icon') as string | null;
    const imageFile = formData.get('image') as File | null;

    // 필수 필드 검증
    if (!name || !slug || !code) {
      return NextResponse.json(
        { success: false, error: '카테고리명, 슬러그, 코드는 필수입니다.' },
        { status: 400 }
      );
    }

    // 코드 형식 검증
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

    // 이미지 업로드
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadCategoryImage(imageFile);
    }

    // 카테고리 생성
    const category = await prisma.shopCategory.create({
      data: {
        name,
        slug,
        code,
        description: description || null,
        imageUrl,
        parentId: parentId || null,
        displayOrder: displayOrder ? parseInt(displayOrder as string) : 0,
        isActive: isActive !== 'false',
        isVisible: isVisible !== 'false',
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
