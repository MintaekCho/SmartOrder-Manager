'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5; // 리뷰당 최대 이미지 수

// 리뷰 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, helpful, rating

    const skip = (page - 1) * limit;

    // 검색 조건
    const where: any = {
      isVisible: true,
    };

    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    // 정렬 옵션
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'helpful') {
      orderBy = { helpfulCount: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    // 별점 통계 (productId가 있는 경우)
    let stats = null;
    if (productId) {
      const ratingStats = await prisma.review.groupBy({
        by: ['rating'],
        where: { productId, isVisible: true },
        _count: true,
      });

      const totalReviews = ratingStats.reduce((sum, r) => sum + r._count, 0);
      const avgRating = totalReviews > 0
        ? ratingStats.reduce((sum, r) => sum + (r.rating * r._count), 0) / totalReviews
        : 0;

      stats = {
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        distribution: {
          5: ratingStats.find(r => r.rating === 5)?._count || 0,
          4: ratingStats.find(r => r.rating === 4)?._count || 0,
          3: ratingStats.find(r => r.rating === 3)?._count || 0,
          2: ratingStats.find(r => r.rating === 2)?._count || 0,
          1: ratingStats.find(r => r.rating === 1)?._count || 0,
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('리뷰 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '리뷰 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 리뷰 작성 (이미지 업로드 포함)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const orderId = formData.get('orderId') as string | null;
    const rating = parseInt(formData.get('rating') as string);
    const content = formData.get('content') as string | null;
    const files = formData.getAll('images') as File[];

    // 필수 필드 검증
    if (!productId || !rating) {
      return NextResponse.json(
        { success: false, error: '상품ID와 별점은 필수입니다.' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: '별점은 1-5 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 상품 존재 확인
    const product = await prisma.inventoryItem.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 중복 리뷰 확인 (동일 주문에 대해서만)
    if (orderId) {
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: session.user.id,
          productId,
          orderId,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { success: false, error: '이미 해당 주문에 대한 리뷰를 작성하셨습니다.' },
          { status: 400 }
        );
      }
    }

    // 이미지 업로드 처리
    const uploadedImages: string[] = [];

    if (files.length > 0) {
      if (files.length > MAX_IMAGES) {
        return NextResponse.json(
          { success: false, error: `이미지는 최대 ${MAX_IMAGES}개까지 업로드 가능합니다.` },
          { status: 400 }
        );
      }

      for (const file of files) {
        // 파일 타입 검증
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          continue; // 허용되지 않는 타입은 건너뜀
        }

        // 파일 크기 검증
        if (file.size > MAX_FILE_SIZE) {
          continue; // 크기 초과는 건너뜀
        }

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
          uploadedImages.push(publicUrl);
        }
      }
    }

    // 구매 인증 확인 (orderId가 있으면 주문 확인)
    // 주의: 관리자 웹은 shop_orders 모델이 없으므로 검증 스킵
    let isVerified = false;
    // if (orderId) {
    //   const order = await prisma.shop_orders.findFirst({
    //     where: {
    //       id: orderId,
    //       userId: session.user.id,
    //       status: 'DELIVERED', // 배송 완료된 주문만
    //     },
    //     include: {
    //       shop_order_items: true,
    //     },
    //   });

    //   if (order) {
    //     // 주문에 해당 상품이 포함되어 있는지 확인
    //     const hasProduct = order.shop_order_items.some(item => item.productId === productId);
    //     isVerified = hasProduct;
    //   }
    // }

    // 리뷰 생성
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        orderId: orderId || null,
        rating,
        content: content || null,
        images: uploadedImages,
        isVerified,
        isVisible: true,
        helpfulCount: 0,
      },
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
    console.error('리뷰 작성 에러:', error);
    return NextResponse.json(
      { success: false, error: '리뷰 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
