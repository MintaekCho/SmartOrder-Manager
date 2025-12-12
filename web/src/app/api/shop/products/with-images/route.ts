'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId, getOrCreateDefaultWarehouseId } from '@/lib/auth';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10; // 상품당 최대 이미지 수

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

// 카테고리별 상품코드 자동 생성 함수
async function generateProductCode(categoryId: string | null): Promise<string> {
  if (!categoryId) {
    const timestamp = Date.now().toString().slice(-6);
    return `ETC-${timestamp}`;
  }

  const category = await prisma.shopCategory.update({
    where: { id: categoryId },
    data: {
      productSeq: { increment: 1 },
    },
  });

  const paddedSeq = String(category.productSeq).padStart(3, '0');
  return `${category.code}-${paddedSeq}`;
}

// 상품 등록 (이미지 업로드 포함)
export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const defaultWarehouseId = await getOrCreateDefaultWarehouseId(userId);

    const formData = await request.formData();

    // 기본 정보
    const name = formData.get('name') as string;
    const categoryId = formData.get('categoryId') as string | null;
    const description = formData.get('description') as string | null;
    const costPrice = parseFloat(formData.get('costPrice') as string) || 0;
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    const comparePrice = formData.get('comparePrice') ? parseFloat(formData.get('comparePrice') as string) : null;
    const quantity = parseInt(formData.get('quantity') as string) || 0;
    const isShopVisible = formData.get('isShopVisible') !== 'false';
    const shopDescription = formData.get('shopDescription') as string | null;

    // 이미지 파일들
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const imageFiles = formData.getAll('images') as File[];
    const detailImageFiles = formData.getAll('detailImages') as File[];

    // 기존 이미지 URL들 (유지할 이미지)
    const existingImages = formData.get('existingImages');
    let existingImageUrls: string[] = [];
    if (existingImages) {
      try {
        existingImageUrls = JSON.parse(existingImages as string);
      } catch {}
    }

    // 필수 필드 검증
    if (!name || !sellingPrice) {
      return NextResponse.json(
        { success: false, error: '상품명과 판매가는 필수입니다.' },
        { status: 400 }
      );
    }

    // 카테고리 확인
    let categoryInfo = null;
    if (categoryId) {
      categoryInfo = await prisma.shopCategory.findUnique({
        where: { id: categoryId },
      });

      if (!categoryInfo) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 카테고리입니다.' },
          { status: 400 }
        );
      }
    }

    // 이미지 업로드
    const uploadedImages: string[] = [...existingImageUrls];
    let thumbnailUrl: string | null = null;

    // 썸네일 업로드
    if (thumbnailFile && thumbnailFile.size > 0) {
      thumbnailUrl = await uploadImage(thumbnailFile, STORAGE_BUCKETS.PRODUCTS);
    }

    // 상품 이미지들 업로드
    for (const file of imageFiles.slice(0, MAX_IMAGES - uploadedImages.length)) {
      if (file.size > 0) {
        const url = await uploadImage(file, STORAGE_BUCKETS.PRODUCTS);
        if (url) uploadedImages.push(url);
      }
    }

    // 상세 이미지들 업로드
    const detailImageUrls: string[] = [];
    for (const file of detailImageFiles) {
      if (file.size > 0) {
        const url = await uploadImage(file, STORAGE_BUCKETS.PRODUCT_DETAILS);
        if (url) detailImageUrls.push(url);
      }
    }

    // 상품코드 자동 생성
    const finalSku = await generateProductCode(categoryId || null);

    // 상품 생성
    const product = await prisma.inventoryItem.create({
      data: {
        userId,
        sku: finalSku,
        name,
        category: categoryInfo?.name || '기타',
        costPrice,
        sellingPrice,
        comparePrice,
        quantity,
        availableQty: quantity,
        safetyStock: 10,
        unit: 'EA',
        warehouseId: defaultWarehouseId,
        description,
        imageUrl: thumbnailUrl || uploadedImages[0] || null,
        isShopVisible,
        shopDescription,
        shopImages: uploadedImages,
      },
    });

    // 생성된 상품 조회
    const productWithOptions = await prisma.inventoryItem.findUnique({
      where: { id: product.id },
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
      data: productWithOptions,
    });
  } catch (error) {
    console.error('상품 등록 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}
