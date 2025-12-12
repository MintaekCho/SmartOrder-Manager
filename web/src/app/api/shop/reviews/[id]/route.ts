'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, isAdminOrStaff } from '@/lib/auth';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

// 리뷰 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('리뷰 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '리뷰 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 리뷰 수정 (이미지 업로드 포함)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 기존 리뷰 확인
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (본인 또는 관리자)
    const isAdmin = await isAdminOrStaff();
    if (existingReview.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const rating = formData.get('rating');
    const content = formData.get('content');
    const files = formData.getAll('images') as File[];
    const keepImages = formData.get('keepImages'); // 기존 이미지 중 유지할 URL들 (JSON 배열)

    // 업데이트할 데이터
    const updateData: any = {};

    if (rating) {
      const ratingNum = parseInt(rating as string);
      if (ratingNum < 1 || ratingNum > 5) {
        return NextResponse.json(
          { success: false, error: '별점은 1-5 사이여야 합니다.' },
          { status: 400 }
        );
      }
      updateData.rating = ratingNum;
    }

    if (content !== null) {
      updateData.content = content as string || null;
    }

    // 이미지 처리
    let finalImages: string[] = [];

    // 기존 이미지 중 유지할 것들
    if (keepImages) {
      try {
        finalImages = JSON.parse(keepImages as string);
      } catch {
        finalImages = [];
      }
    }

    // 새 이미지 업로드
    if (files.length > 0) {
      const remainingSlots = MAX_IMAGES - finalImages.length;

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];

        if (!ALLOWED_MIME_TYPES.includes(file.type)) continue;
        if (file.size > MAX_FILE_SIZE) continue;

        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${uuidv4()}.${ext}`;
        const now = new Date();
        const folderPath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
        const filePath = `${folderPath}/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKETS.REVIEWS)
          .upload(filePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (!error) {
          const publicUrl = getPublicUrl(STORAGE_BUCKETS.REVIEWS, filePath);
          finalImages.push(publicUrl);
        }
      }
    }

    // 이미지 변경이 있으면 업데이트
    if (files.length > 0 || keepImages !== null) {
      updateData.images = finalImages;
    }

    // 리뷰 업데이트
    const review = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('리뷰 수정 에러:', error);
    return NextResponse.json(
      { success: false, error: '리뷰 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 리뷰 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 기존 리뷰 확인
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (본인 또는 관리자)
    const isAdmin = await isAdminOrStaff();
    if (existingReview.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 리뷰 삭제
    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '리뷰가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('리뷰 삭제 에러:', error);
    return NextResponse.json(
      { success: false, error: '리뷰 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
