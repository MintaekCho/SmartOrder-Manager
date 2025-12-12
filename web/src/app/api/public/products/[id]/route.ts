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

// 자사몰 공개 상품 상세 조회 (인증 불필요)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.inventoryItem.findFirst({
      where: {
        id,
        isShopVisible: true,
        status: 'ACTIVE',
      },
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
    });

    if (!product) {
      const response = NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 응답 데이터 가공
    const formattedProduct = {
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
    };

    const response = NextResponse.json({
      success: true,
      data: formattedProduct,
    });

    // CORS 헤더 추가
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('공개 상품 상세 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 조회에 실패했습니다.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
