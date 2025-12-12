'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId, getOrCreateDefaultWarehouseId } from '@/lib/auth';

// 자사몰 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const visibility = searchParams.get('visibility'); // 'visible', 'hidden', 'all'
    const category = searchParams.get('category');

    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (visibility === 'visible') {
      where.isShopVisible = true;
    } else if (visibility === 'hidden') {
      where.isShopVisible = false;
    }

    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          warehouse: {
            select: { name: true },
          },
          optionGroups: {
            include: {
              options: {
                orderBy: { displayOrder: 'asc' },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
          variants: {
            include: {
              options: {
                include: {
                  option: true,
                },
              },
            },
          },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('자사몰 상품 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 카테고리별 상품코드 자동 생성 함수
async function generateProductCode(categoryId: string | null): Promise<string> {
  if (!categoryId) {
    // 카테고리가 없으면 ETC 코드 사용
    const timestamp = Date.now().toString().slice(-6);
    return `ETC-${timestamp}`;
  }

  // 트랜잭션으로 시퀀스 증가 + 코드 생성을 원자적으로 처리
  const category = await prisma.shopCategory.update({
    where: { id: categoryId },
    data: {
      productSeq: { increment: 1 },
    },
  });

  // 시퀀스 번호를 3자리로 패딩 (001, 002, ...)
  const paddedSeq = String(category.productSeq).padStart(3, '0');

  return `${category.code}-${paddedSeq}`;
}

// 자사몰 상품 등록 (새로운 옵션 중심 구조)
export async function POST(request: NextRequest) {
  try {
    // 사용자 ID 가져오기 (로그인 안 되어 있으면 기본 사용자 생성)
    const userId = await getOrCreateDefaultUserId();
    // 기본 창고 ID 가져오기 (없으면 생성)
    const defaultWarehouseId = await getOrCreateDefaultWarehouseId(userId);

    const body = await request.json();
    const {
      name,
      categoryId,
      description,
      options, // 새로운 옵션 배열 구조
      imageMode, // 'same' | 'perOption'
      detailMode, // 'same' | 'perOption'
      isShopVisible,
      // 레거시 지원
      category,
      costPrice,
      sellingPrice,
      quantity,
      minQuantity,
      unit,
      warehouseId,
      imageUrl,
      shopDescription,
      shopImages,
      images,
      detailContent,
      optionGroups,
      variants,
    } = body;

    // 새 구조 처리 (options 배열이 있는 경우)
    if (options && options.length > 0) {
      // 필수 필드 검증
      if (!name) {
        return NextResponse.json(
          { success: false, error: '상품명은 필수입니다.' },
          { status: 400 }
        );
      }

      // 옵션 검증
      for (const opt of options) {
        if (!opt.name || !opt.sellingPrice) {
          return NextResponse.json(
            { success: false, error: '모든 옵션에 옵션명과 판매가가 필요합니다.' },
            { status: 400 }
          );
        }
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

      // 상품코드 자동 생성
      const finalSku = await generateProductCode(categoryId || null);

      // 기본 옵션 찾기
      const defaultOption = options.find((opt: any) => opt.isDefault) || options[0];

      // 총 재고 계산
      const totalStock = options.reduce((sum: number, opt: any) => sum + (opt.stock || 0), 0);

      // 대표 이미지 결정
      const mainImage = imageMode === 'same'
        ? defaultOption.images?.[0] || null
        : defaultOption.images?.[0] || null;

      // 상세페이지 내용 결정
      const mainDetailContent = detailMode === 'same'
        ? defaultOption.detailContent || null
        : defaultOption.detailContent || null;

      // 상세페이지 이미지들
      const mainDetailImages = detailMode === 'same'
        ? defaultOption.detailImages || []
        : defaultOption.detailImages || [];

      // 트랜잭션으로 상품 + 변형 생성
      const result = await prisma.$transaction(async (tx) => {
        // 1. 기본 상품 생성
        const product = await tx.inventoryItem.create({
          data: {
            userId,
            sku: finalSku,
            name,
            category: categoryInfo?.name || '기타',
            costPrice: defaultOption.costPrice || 0,
            sellingPrice: defaultOption.sellingPrice,
            comparePrice: defaultOption.comparePrice || null, // 정상가 (할인 전 가격)
            quantity: totalStock,
            availableQty: totalStock,
            safetyStock: 10,
            unit: 'EA',
            warehouseId: defaultWarehouseId,
            description: description || null,
            imageUrl: mainImage,
            isShopVisible: isShopVisible !== false,
            shopDescription: mainDetailContent,
            shopImages: defaultOption.images || [],
          },
        });

        // 2. 옵션 그룹 생성 (단일 그룹으로 관리)
        const optionGroup = await tx.shopProductOptionGroup.create({
          data: {
            inventoryId: product.id,
            name: '옵션',
            displayOrder: 0,
            isRequired: true,
          },
        });

        // 3. 각 옵션을 옵션값 + 변형으로 생성
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];

          // 옵션값 생성
          const createdOption = await tx.shopProductOption.create({
            data: {
              optionGroupId: optionGroup.id,
              name: opt.name,
              additionalPrice: (opt.finalPrice || opt.sellingPrice) - (defaultOption.finalPrice || defaultOption.sellingPrice),
              displayOrder: i,
              isActive: true,
            },
          });

          // 변형 생성 (각 옵션에 대해)
          const variant = await tx.shopProductVariant.create({
            data: {
              inventoryId: product.id,
              name: opt.name,
              price: opt.sellingPrice,
              comparePrice: opt.comparePrice || null, // 정상가 (할인 전 가격)
              stock: opt.stock || 0,
              sku: opt.sku || `${finalSku}-${String(i + 1).padStart(2, '0')}`,
              isActive: true,
            },
          });

          // 변형-옵션 연결
          await tx.shopProductVariantOption.create({
            data: {
              variantId: variant.id,
              optionId: createdOption.id,
            },
          });
        }

        return product;
      });

      // 생성된 상품 조회
      const productWithOptions = await prisma.inventoryItem.findUnique({
        where: { id: result.id },
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
    }

    // ===== 레거시 구조 처리 (기존 optionGroups, variants 방식) =====

    // 필수 필드 검증
    if (!name || !sellingPrice) {
      return NextResponse.json(
        { success: false, error: '상품명, 판매가는 필수입니다.' },
        { status: 400 }
      );
    }

    // 카테고리 존재 확인 (categoryId가 제공된 경우)
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

    // 상품코드 자동 생성 (카테고리 기반)
    const finalSku = await generateProductCode(categoryId || null);

    // 트랜잭션으로 상품 + 옵션 + 변형 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 기본 상품 생성
      const product = await tx.inventoryItem.create({
        data: {
          userId,
          sku: finalSku,
          name,
          category: categoryInfo?.name || category || '기타',
          costPrice: costPrice || 0,
          sellingPrice,
          quantity: quantity || 0,
          availableQty: quantity || 0,
          safetyStock: minQuantity || 10,
          unit: unit || 'EA',
          warehouseId: warehouseId || defaultWarehouseId,
          description,
          imageUrl: imageUrl || images?.[0] || null,
          isShopVisible: isShopVisible !== false,
          shopDescription: detailContent || shopDescription || null,
          shopImages: images || shopImages || [],
        },
      });

      // 2. 옵션 그룹 및 옵션값 생성
      const optionIdMap: Record<string, string> = {}; // 클라이언트ID -> DB ID 매핑

      if (optionGroups && optionGroups.length > 0) {
        for (let i = 0; i < optionGroups.length; i++) {
          const group = optionGroups[i];

          const createdGroup = await tx.shopProductOptionGroup.create({
            data: {
              inventoryId: product.id,
              name: group.name,
              displayOrder: i,
              isRequired: group.isRequired !== false,
            },
          });

          // 옵션값 생성
          if (group.options && group.options.length > 0) {
            for (let j = 0; j < group.options.length; j++) {
              const option = group.options[j];

              const createdOption = await tx.shopProductOption.create({
                data: {
                  optionGroupId: createdGroup.id,
                  name: option.name,
                  additionalPrice: option.additionalPrice || 0,
                  displayOrder: j,
                  isActive: option.isActive !== false,
                },
              });

              // ID 매핑 저장
              optionIdMap[option.id] = createdOption.id;
            }
          }
        }
      }

      // 3. 변형(Variant) 생성
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const createdVariant = await tx.shopProductVariant.create({
            data: {
              inventoryId: product.id,
              name: variant.optionCombination
                ?.map((c: any) => c.optionName)
                .join(' / ') || null,
              price: variant.price || sellingPrice,
              comparePrice: variant.comparePrice || null,
              stock: variant.stock || 0,
              sku: variant.sku || null,
              isActive: variant.isActive !== false,
            },
          });

          // 변형-옵션 연결
          if (variant.optionCombination && variant.optionCombination.length > 0) {
            for (const combo of variant.optionCombination) {
              const realOptionId = optionIdMap[combo.optionId];
              if (realOptionId) {
                await tx.shopProductVariantOption.create({
                  data: {
                    variantId: createdVariant.id,
                    optionId: realOptionId,
                  },
                });
              }
            }
          }
        }
      }

      return product;
    });

    // 생성된 상품을 옵션 정보와 함께 다시 조회
    const productWithOptions = await prisma.inventoryItem.findUnique({
      where: { id: result.id },
      include: {
        optionGroups: {
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        variants: {
          include: {
            options: {
              include: {
                option: true,
              },
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
    console.error('자사몰 상품 등록 에러:', error);
    return NextResponse.json(
      { success: false, error: '상품 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}
