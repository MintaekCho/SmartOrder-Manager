'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;

// 이미지 업로드 헬퍼 함수
async function uploadImage(file: File, bucket: string): Promise<string | null> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return null;
  if (file.size > MAX_FILE_SIZE) return null;

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${uuidv4()}.${ext}`;
  const now = new Date();
  const folderPath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const filePath = `${folderPath}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Image upload error:', error);
    return null;
  }

  return getPublicUrl(bucket as any, filePath);
}

// 상품 수정 (이미지 업로드 포함)
export async function PATCH(
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

    const formData = await request.formData();

    // 기본 정보 (선택적)
    const name = formData.get('name') as string | null;
    const category = formData.get('category') as string | null;
    const description = formData.get('description') as string | null;
    const costPriceStr = formData.get('costPrice') as string | null;
    const sellingPriceStr = formData.get('sellingPrice') as string | null;
    const comparePriceStr = formData.get('comparePrice') as string | null;
    const quantityStr = formData.get('quantity') as string | null;
    const isShopVisibleStr = formData.get('isShopVisible') as string | null;
    const shopDescription = formData.get('shopDescription') as string | null;

    // 이미지 파일들
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const imageFiles = formData.getAll('images') as File[];
    const detailImageFiles = formData.getAll('detailImages') as File[];

    // 기존 이미지 URL들 (유지할 이미지)
    const existingImages = formData.get('existingImages');
    const existingThumbnail = formData.get('existingThumbnail') as string | null;

    // 업데이트 데이터 구성
    const updateData: any = {};

    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description !== null) updateData.description = description || null;
    if (costPriceStr) updateData.costPrice = parseFloat(costPriceStr);
    if (sellingPriceStr) updateData.sellingPrice = parseFloat(sellingPriceStr);
    if (comparePriceStr !== null) {
      updateData.comparePrice = comparePriceStr ? parseFloat(comparePriceStr) : null;
    }
    if (quantityStr) {
      const qty = parseInt(quantityStr);
      updateData.quantity = qty;
      updateData.availableQty = qty;
    }
    if (isShopVisibleStr !== null) {
      updateData.isShopVisible = isShopVisibleStr === 'true';
    }
    if (shopDescription !== null) {
      updateData.shopDescription = shopDescription || null;
    }

    // 이미지 처리
    let finalImages: string[] = [];

    // 기존 이미지 유지
    if (existingImages) {
      try {
        finalImages = JSON.parse(existingImages as string);
      } catch {}
    }

    // 새 이미지 업로드
    for (const file of imageFiles.slice(0, MAX_IMAGES - finalImages.length)) {
      if (file.size > 0) {
        const url = await uploadImage(file, STORAGE_BUCKETS.PRODUCTS);
        if (url) finalImages.push(url);
      }
    }

    // 썸네일 처리
    if (thumbnailFile && thumbnailFile.size > 0) {
      const thumbnailUrl = await uploadImage(thumbnailFile, STORAGE_BUCKETS.PRODUCTS);
      if (thumbnailUrl) {
        updateData.imageUrl = thumbnailUrl;
      }
    } else if (existingThumbnail) {
      updateData.imageUrl = existingThumbnail;
    }

    // 상품 이미지 배열 업데이트
    if (imageFiles.length > 0 || existingImages !== null) {
      updateData.shopImages = finalImages;
    }

    // 상세 이미지 업로드 (필요한 경우)
    if (detailImageFiles.length > 0) {
      const detailImageUrls: string[] = [];
      for (const file of detailImageFiles) {
        if (file.size > 0) {
          const url = await uploadImage(file, STORAGE_BUCKETS.PRODUCT_DETAILS);
          if (url) detailImageUrls.push(url);
        }
      }
      // 상세 이미지는 별도 필드가 필요하면 추가
    }

    // 업데이트할 데이터가 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 상품 업데이트
    const product = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        optionGroups: {
          include: {
            options: { orderBy: { displayOrder: 'asc' } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        variants: {
          include: {
            options: {
              include: { option: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('상품 수정 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
