import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.SHOP_URL || 'http://localhost:3005',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 자사몰 공개 상품 목록 조회 (인증 불필요)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest'; // newest, price_asc, price_desc, popular, best, new
    const filter = searchParams.get('filter'); // sale (할인 상품만)

    const skip = (page - 1) * limit;

    // 검색 조건: 노출 설정된 상품만
    const where: any = {
      isShopVisible: true,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // NEW 필터: 최근 14일 이내 등록 상품
    if (sort === 'new') {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      where.createdAt = { gte: twoWeeksAgo };
    }

    // SALE 필터 플래그 (조회 후 필터링)
    const filterSale = filter === 'sale';

    // 정렬 조건
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc':
        orderBy = { sellingPrice: 'asc' };
        break;
      case 'price_desc':
        orderBy = { sellingPrice: 'desc' };
        break;
      case 'popular':
      case 'best':
        // 판매량 기준 (soldCount 필드가 없으면 quantity 역순으로 대체)
        orderBy = { quantity: 'desc' };
        break;
      case 'new':
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          category: true,
          imageUrl: true,
          sellingPrice: true,
          comparePrice: true,
          quantity: true,
          availableQty: true,
          unit: true,
          shopDescription: true,
          shopImages: true,
          createdAt: true,
          optionGroups: {
            select: {
              id: true,
              name: true,
              displayOrder: true,
              isRequired: true,
              options: {
                select: {
                  id: true,
                  name: true,
                  additionalPrice: true,
                  displayOrder: true,
                  isActive: true,
                },
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
          variants: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              comparePrice: true,
              stock: true,
              isActive: true,
              options: {
                select: {
                  option: {
                    select: {
                      id: true,
                      name: true,
                      additionalPrice: true,
                    },
                  },
                },
              },
            },
            where: { isActive: true },
          },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // 응답 데이터 가공
    let formattedProducts = products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.imageUrl,
      images: product.shopImages || [],
      price: product.sellingPrice,
      originalPrice: product.comparePrice && product.comparePrice > product.sellingPrice ? product.comparePrice : null,
      stock: product.availableQty,
      unit: product.unit,
      shopDescription: product.shopDescription,
      hasVariants: product.variants.length > 0,
      optionGroups: product.optionGroups,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price,
        comparePrice: v.comparePrice,
        stock: v.stock,
        options: v.options.map((o) => ({
          id: o.option.id,
          name: o.option.name,
          additionalPrice: o.option.additionalPrice,
        })),
      })),
    }));

    // SALE 필터: 할인 상품만 (originalPrice가 있는 상품)
    if (filterSale) {
      formattedProducts = formattedProducts.filter(p => p.originalPrice !== null);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

    // CORS 헤더 추가
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('공개 상품 목록 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 조회에 실패했습니다.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
