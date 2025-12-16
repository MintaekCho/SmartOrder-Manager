import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId } from '@/lib/auth';
import { MasterProductStatus } from '@prisma/client';

// 마스터 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as MasterProductStatus | null;
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = {
      userId,
      // status가 명시적으로 지정되면 해당 상태만, 아니면 DELETED 제외
      ...(status ? { status } : { status: { not: 'DELETED' as MasterProductStatus } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { brand: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.masterProduct.findMany({
        where,
        include: {
          platformProducts: {
            select: {
              id: true,
              platform: true,
              status: true,
              platformProductId: true,
              platformUrl: true,
              platformPrice: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.masterProduct.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('마스터 상품 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '상품 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 마스터 상품 생성
export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const body = await request.json();

    const {
      name,
      description,
      brand,
      categoryId,
      thumbnailUrl,
      images,
      costPrice,
      basePrice,
      options,
      detailHtml,
      notices,
      shippingFee,
      status,
      selectedPlatforms, // 등록할 플랫폼 목록 ['COUPANG', 'NAVER', 'SHOP']
      platformSettings, // 플랫폼별 설정 { COUPANG: {...}, NAVER: {...}, SHOP: {...} }
    } = body;

    if (!name || !basePrice) {
      return NextResponse.json(
        { success: false, error: '상품명과 판매가는 필수입니다.' },
        { status: 400 }
      );
    }

    // 마스터 상품 생성
    const masterProduct = await prisma.masterProduct.create({
      data: {
        userId,
        name,
        description,
        brand,
        categoryId,
        thumbnailUrl,
        images: images || [],
        costPrice: parseInt(costPrice) || 0,
        basePrice: parseInt(basePrice),
        options: options || [],
        detailHtml,
        notices: notices || {},
        platformSettings: platformSettings || {},
        shippingFee: parseInt(shippingFee) || 0,
        status: status || 'DRAFT',
      },
      include: {
        platformProducts: true,
      },
    });

    // 선택된 플랫폼에 대해 PlatformProduct 생성 (PENDING 상태)
    if (selectedPlatforms && selectedPlatforms.length > 0) {
      const platformProductsData = selectedPlatforms.map((platform: string) => ({
        masterProductId: masterProduct.id,
        platform: platform as 'COUPANG' | 'NAVER' | 'SHOP',
        status: 'PENDING' as const,
      }));

      await prisma.platformProduct.createMany({
        data: platformProductsData,
      });
    }

    // 생성된 상품 다시 조회 (platformProducts 포함)
    const result = await prisma.masterProduct.findUnique({
      where: { id: masterProduct.id },
      include: {
        platformProducts: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('마스터 상품 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '상품 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
