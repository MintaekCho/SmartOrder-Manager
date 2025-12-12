'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

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

// 카테고리 수정 (이미지 업로드 포함)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const formData = await request.formData();

    const name = formData.get('name') as string | null;
    const slug = formData.get('slug') as string | null;
    const code = formData.get('code') as string | null;
    const description = formData.get('description') as string | null;
    const parentId = formData.get('parentId') as string | null;
    const displayOrder = formData.get('displayOrder') as string | null;
    const isActive = formData.get('isActive') as string | null;
    const isVisible = formData.get('isVisible') as string | null;
    const icon = formData.get('icon') as string | null;
    const imageFile = formData.get('image') as File | null;
    const keepExistingImage = formData.get('keepExistingImage') as string | null;

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

    // 업데이트 데이터 구성
    const updateData: any = {};

    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (code) updateData.code = code;
    if (description !== null) updateData.description = description || null;
    if (parentId !== null) updateData.parentId = parentId || null;
    if (displayOrder) updateData.displayOrder = parseInt(displayOrder);
    if (isActive !== null) updateData.isActive = isActive === 'true';
    if (isVisible !== null) updateData.isVisible = isVisible === 'true';
    if (icon !== null) updateData.icon = icon || null;

    // 이미지 처리
    if (imageFile && imageFile.size > 0) {
      const imageUrl = await uploadCategoryImage(imageFile);
      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      }
    } else if (keepExistingImage !== 'true') {
      // 새 이미지도 없고 기존 이미지 유지도 아니면 null로 설정
      updateData.imageUrl = null;
    }

    // 업데이트할 데이터가 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 카테고리 수정
    const category = await prisma.shopCategory.update({
      where: { id },
      data: updateData,
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
