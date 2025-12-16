import { NextRequest, NextResponse } from 'next/server';
import { getCoupangWingClient, COUPANG_FRESH_CATEGORIES, getFreshProductNotices } from '@/lib/coupang/wing-api';
import { WholesaleProduct } from '@/lib/crawler/domeggook-crawler';

export const dynamic = 'force-dynamic';

interface RegisterRequest {
  product: WholesaleProduct;
  sellingPrice: number;
  detailHtml: string;
}

/**
 * 쿠팡 상품 등록 API
 * POST /api/products/register
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { product, sellingPrice, detailHtml } = body;

    if (!product || !sellingPrice) {
      return NextResponse.json(
        { success: false, error: '상품 정보와 판매가가 필요합니다.' },
        { status: 400 }
      );
    }

    const wingClient = await getCoupangWingClient();

    // Wing API 설정 여부 확인
    if (!wingClient.isConfigured()) {
      return NextResponse.json(
        { success: false, error: '쿠팡 API 설정이 필요합니다. 설정 페이지에서 API 키를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 실제 Wing API 등록
    // 카테고리 코드 결정
    const categoryCode = getCategoryCode(product.category);

    // 상품 고시 정보
    const notices = getFreshProductNotices({
      productName: product.name,
      origin: product.origin || '국내산',
      weight: '상품 상세 참조',
    });

    // Wing API 상품 데이터 구성
    const coupangProduct = {
      sellerProductName: product.name,
      displayCategoryCode: categoryCode,
      brand: product.seller || '농장직송',
      generalProductName: product.name,
      productGroup: 'NONE',
      deliveryMethod: 'DIRECT' as const,
      deliveryCompanyCode: 'CJGLS',
      deliveryChargeType: 'NOT_FREE' as const,
      deliveryCharge: product.shippingFee,
      returnCenterCode: '', // 실제 등록 시 필요
      returnCharge: 5000,
      vendorId: wingClient.getVendorId(),
      manufacture: product.seller || '판매자 정보 참조',
      items: [
        {
          itemName: product.name,
          originalPrice: sellingPrice,
          salePrice: sellingPrice,
          maximumBuyCount: 100,
          maximumBuyForPerson: 10,
          outboundShippingTimeDay: 3,
          unitCount: 1,
          adultOnly: 'EVERYONE' as const,
          taxType: 'FREE' as const, // 농수산물 면세
          parallelImported: 'NOT_PARALLEL_IMPORTED' as const,
          overseasPurchased: 'NOT_OVERSEAS_PURCHASED' as const,
          pccNeeded: false,
          externalVendorSku: product.id,
          images: [
            {
              imageOrder: 0,
              imageType: 'REPRESENTATION' as const,
              vendorPath: product.thumbnailUrl,
            },
          ],
          notices,
          contents: [
            {
              contentsType: 'HTML' as const,
              contentDetails: [{ content: detailHtml }],
            },
          ],
          offerCondition: 'NEW' as const,
          searchTags: [product.category, product.origin || '', product.name.split(' ')[0]].filter(Boolean),
        },
      ],
    };

    const result = await wingClient.registerProduct(coupangProduct);

    return NextResponse.json({
      success: result.success,
      productId: result.sellerProductId,
      message: result.message,
      error: result.error,
    });
  } catch (error) {
    console.error('[API] 상품 등록 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상품 등록 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * 카테고리명으로 쿠팡 카테고리 코드 결정
 */
function getCategoryCode(category: string): number {
  const categoryMap: Record<string, number> = {
    '과일': COUPANG_FRESH_CATEGORIES.fruits,
    '채소': COUPANG_FRESH_CATEGORIES.vegetables,
    '수산물': COUPANG_FRESH_CATEGORIES.seafood,
    '정육': COUPANG_FRESH_CATEGORIES.meat,
    '쌀': COUPANG_FRESH_CATEGORIES.rice,
    '쌀/잡곡': COUPANG_FRESH_CATEGORIES.rice,
    '김치': COUPANG_FRESH_CATEGORIES.kimchi,
  };

  return categoryMap[category] || COUPANG_FRESH_CATEGORIES.fruits;
}
