import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultUserId } from '@/lib/auth';
import { Platform } from '@prisma/client';
import { CoupangApiClient } from '@/lib/coupang-api';
import { NaverCommerceClient } from '@/lib/naver-api';
import type { CoupangProduct, Notice } from '@/lib/coupang-api/types';
import type { NaverProductRequest, NaverOriginProduct } from '@/lib/naver-api/types';

// MasterProduct 타입 정의
interface MasterProductData {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  thumbnailUrl: string | null;
  images: unknown;
  costPrice: number;
  basePrice: number;
  options: unknown;
  detailHtml: string | null;
  notices: unknown;
  shippingFee: number;
  freeShipOver: number | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    coupangCategoryCode: string | null;
    naverCategoryId: string | null;
  } | null;
}

// PlatformConfig 타입 정의
interface PlatformConfigData {
  credentials: unknown;
  outboundCode: string | null;
  returnCode: string | null;
  sellerId: string | null;
  sellerName: string | null;
}

// 마스터 상품을 플랫폼에 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getOrCreateDefaultUserId();
    const { id } = await params;
    const body = await request.json();

    const { platforms } = body; // ['COUPANG', 'NAVER', 'SHOP']

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: '등록할 플랫폼을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 마스터 상품 조회
    const masterProduct = await prisma.masterProduct.findFirst({
      where: { id, userId },
      include: {
        platformProducts: true,
        category: true,
      },
    });

    if (!masterProduct) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 플랫폼 설정 조회
    const platformConfigs = await prisma.platformConfig.findMany({
      where: {
        userId,
        platform: { in: platforms },
        isActive: true,
      },
    });

    const results: Record<string, { success: boolean; message: string; data?: unknown }> = {};

    for (const platform of platforms as Platform[]) {
      const config = platformConfigs.find(c => c.platform === platform);

      // 자사몰은 설정 없이도 등록 가능
      if (platform !== 'SHOP' && !config) {
        results[platform] = {
          success: false,
          message: '플랫폼 API 설정이 없거나 비활성화되어 있습니다.',
        };
        continue;
      }

      // 기존 PlatformProduct 찾기 또는 생성
      let platformProduct = masterProduct.platformProducts.find(pp => pp.platform === platform);

      if (!platformProduct) {
        platformProduct = await prisma.platformProduct.create({
          data: {
            masterProductId: masterProduct.id,
            platform,
            status: 'PENDING',
          },
        });
      }

      // 업로드 로그 생성
      const uploadLog = await prisma.productUploadLog.create({
        data: {
          masterProductId: masterProduct.id,
          platformProductId: platformProduct.id,
          platform,
          action: 'CREATE',
          status: 'PENDING',
        },
      });

      try {
        // 플랫폼별 업로드 실행
        let uploadResult: { success: boolean; productId?: string; url?: string; message?: string };

        switch (platform) {
          case 'COUPANG':
            uploadResult = await uploadToCoupang(masterProduct as MasterProductData, config as unknown as PlatformConfigData);
            break;
          case 'NAVER':
            uploadResult = await uploadToNaver(masterProduct as MasterProductData, config as unknown as PlatformConfigData);
            break;
          case 'SHOP':
            uploadResult = await uploadToShop(masterProduct as MasterProductData, userId);
            break;
          default:
            uploadResult = { success: false, message: '지원하지 않는 플랫폼입니다.' };
        }

        if (uploadResult.success) {
          // 성공 시 PlatformProduct 업데이트
          await prisma.platformProduct.update({
            where: { id: platformProduct.id },
            data: {
              status: 'REGISTERED',
              platformProductId: uploadResult.productId,
              platformUrl: uploadResult.url,
              lastSyncedAt: new Date(),
            },
          });

          // 로그 업데이트
          await prisma.productUploadLog.update({
            where: { id: uploadLog.id },
            data: {
              status: 'SUCCESS',
              message: uploadResult.message || '등록 완료',
              completedAt: new Date(),
            },
          });

          results[platform] = {
            success: true,
            message: uploadResult.message || '등록 완료',
            data: {
              productId: uploadResult.productId,
              url: uploadResult.url,
            },
          };
        } else {
          // 실패 시
          await prisma.platformProduct.update({
            where: { id: platformProduct.id },
            data: {
              status: 'ERROR',
              statusMessage: uploadResult.message,
            },
          });

          await prisma.productUploadLog.update({
            where: { id: uploadLog.id },
            data: {
              status: 'FAILED',
              message: uploadResult.message,
              completedAt: new Date(),
            },
          });

          results[platform] = {
            success: false,
            message: uploadResult.message || '등록 실패',
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

        await prisma.platformProduct.update({
          where: { id: platformProduct.id },
          data: {
            status: 'ERROR',
            statusMessage: errorMessage,
          },
        });

        await prisma.productUploadLog.update({
          where: { id: uploadLog.id },
          data: {
            status: 'FAILED',
            message: errorMessage,
            completedAt: new Date(),
          },
        });

        results[platform] = {
          success: false,
          message: errorMessage,
        };
      }
    }

    // 마스터 상품 상태 업데이트
    const successCount = Object.values(results).filter(r => r.success).length;
    if (successCount > 0) {
      await prisma.masterProduct.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('플랫폼 상품 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: '상품 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 쿠팡 기본 설정 타입
interface CoupangDefaultSettings {
  deliveryMethod: string;
  deliveryCompanyCode: string;
  deliveryChargeType: string;
  deliveryCharge: number;
  freeShipOverAmount: number;
  deliveryChargeOnReturn: number;
  remoteAreaDeliverable: string;
  unionDeliveryType: string;
  outboundShippingPlaceCode: string;
  returnCenterCode: string;
  returnCharge: number;
  returnChargeVendor: string;
  afterServiceInformation: string;
  afterServiceContactNumber: string;
  defaultBrand: string;
  vendorUserId: string;
}

/**
 * 쿠팡 기본 설정 로드
 */
async function loadCoupangSettings(): Promise<CoupangDefaultSettings | null> {
  try {
    // 내부 API 호출 (서버 사이드)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/coupang/settings`);
    const result = await response.json();

    if (result.success && result.isConfigured) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('쿠팡 설정 로드 실패:', error);
    return null;
  }
}

/**
 * 쿠팡에 상품 등록
 *
 * API 문서: https://developers.coupangcorp.com/hc/en-us/articles/360033877853-Product-Creation
 *
 * 필수 필드:
 * - displayCategoryCode: 전시 카테고리 코드 (카테고리 메타정보 조회 API로 확인)
 * - sellerProductName: 판매자 상품명 (관리용)
 * - vendorId: 업체 코드
 * - items: 옵션별 상품 정보 배열
 *   - itemName: 옵션명
 *   - originalPrice: 정가
 *   - salePrice: 판매가
 *   - notices: 상품고시정보 배열 (noticeCategoryName, noticeCategoryDetailName, content)
 *   - images: 이미지 배열
 *   - contents: 상세 설명 (HTML)
 * - returnCenterCode: 반품센터 코드
 * - outboundShippingPlaceCode: 출고지 코드
 */
async function uploadToCoupang(
  masterProduct: MasterProductData,
  config: PlatformConfigData
): Promise<{ success: boolean; productId?: string; url?: string; message?: string }> {
  const credentials = config.credentials as Record<string, string>;
  const { vendorId, accessKey, secretKey } = credentials;

  if (!vendorId || !accessKey || !secretKey) {
    return { success: false, message: '쿠팡 API 인증 정보가 없습니다.' };
  }

  // 쿠팡 기본 설정 로드
  const coupangSettings = await loadCoupangSettings();

  // 출고지/반품지: 기본설정 > PlatformConfig 순으로 확인
  const outboundCode = coupangSettings?.outboundShippingPlaceCode || config.outboundCode;
  const returnCode = coupangSettings?.returnCenterCode || config.returnCode;

  if (!outboundCode || !returnCode) {
    return { success: false, message: '출고지/반품지 코드가 설정되지 않았습니다. 쿠팡 기본 설정을 확인해주세요.' };
  }

  // 카테고리 코드 확인
  const categoryCode = masterProduct.category?.coupangCategoryCode;
  if (!categoryCode) {
    return { success: false, message: '쿠팡 카테고리가 매핑되지 않았습니다. 카테고리 설정을 확인해주세요.' };
  }

  try {
    const client = new CoupangApiClient({ accessKey, secretKey, vendorId });

    // 이미지 준비
    const images = (masterProduct.images as string[]) || [];
    const allImages = masterProduct.thumbnailUrl
      ? [masterProduct.thumbnailUrl, ...images]
      : images;

    if (allImages.length === 0) {
      return { success: false, message: '상품 이미지가 필요합니다.' };
    }

    // 상품고시정보 구성 (notices 필드에서 가져오거나 기본값 사용)
    const productNotices = buildCoupangNotices(masterProduct.notices);

    // 옵션 처리
    const options = masterProduct.options as { name: string; values: string[] }[] || [];
    const items = buildCoupangItems(
      masterProduct,
      allImages,
      productNotices,
      options
    );

    // 배송비 결정: 상품 설정 > 기본 설정
    const deliveryChargeType = masterProduct.shippingFee > 0
      ? 'NOT_FREE'
      : (masterProduct.freeShipOver ? 'CONDITIONAL_FREE' : 'FREE');
    const deliveryCharge = masterProduct.shippingFee || coupangSettings?.deliveryCharge || 0;
    const freeShipOverAmount = masterProduct.freeShipOver || coupangSettings?.freeShipOverAmount || 0;

    // 쿠팡 상품 데이터 구성 (기본 설정 활용)
    const coupangProduct: CoupangProduct = {
      sellerProductName: masterProduct.name,
      vendorId,
      displayCategoryCode: parseInt(categoryCode, 10),
      brand: masterProduct.brand || coupangSettings?.defaultBrand || '',
      generalProductName: masterProduct.name,
      productGroup: '',
      deliveryMethod: (coupangSettings?.deliveryMethod || 'SEQUENCIAL') as 'DIRECT' | 'VENDOR_FULFILLMENT',
      deliveryCompanyCode: coupangSettings?.deliveryCompanyCode || 'CJGLS',
      deliveryChargeType,
      deliveryCharge,
      freeShipOverAmount,
      deliveryChargeOnReturn: coupangSettings?.deliveryChargeOnReturn || 6000,
      remoteAreaDeliverable: coupangSettings?.remoteAreaDeliverable || 'Y',
      unionDeliveryType: coupangSettings?.unionDeliveryType || 'UNION_DELIVERY',
      returnCenterCode: returnCode,
      returnChargeName: '반품배송비',
      companyContactNumber: coupangSettings?.afterServiceContactNumber || '',
      returnZipCode: '',
      returnAddress: '',
      returnAddressDetail: '',
      returnCharge: coupangSettings?.returnCharge || 6000,
      returnChargeVendor: coupangSettings?.returnChargeVendor || 'VENDOR',
      afterServiceInformation: coupangSettings?.afterServiceInformation || '상품 상세페이지 참조',
      afterServiceContactNumber: coupangSettings?.afterServiceContactNumber || '',
      outboundShippingPlaceCode: outboundCode,
      vendorUserId: coupangSettings?.vendorUserId || '',
      requested: true, // 승인 요청
      items,
      requiredDocuments: [],
      extraInfos: [],
    };

    const result = await client.createProduct(coupangProduct);

    if (result?.data?.sellerProductId) {
      return {
        success: true,
        productId: result.data.sellerProductId.toString(),
        url: `https://www.coupang.com/vp/products/${result.data.sellerProductId}`,
        message: '쿠팡 상품 등록 완료 (승인 대기중)',
      };
    }

    return {
      success: false,
      message: result?.message || '쿠팡 상품 등록 실패',
    };
  } catch (error) {
    console.error('쿠팡 상품 등록 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '쿠팡 API 오류',
    };
  }
}

/**
 * 쿠팡 상품고시정보 구성
 *
 * 카테고리 메타정보 조회 API에서 해당 카테고리의 noticeCategories를 확인하고,
 * 해당 noticeCategoryName에 포함된 모든 noticeCategoryDetailName을 입력해야 함
 */
function buildCoupangNotices(noticesData: unknown): Notice[] {
  const notices = noticesData as Record<string, string> | null;

  // 기본값: "기타 재화" 카테고리 사용 (가장 일반적)
  const defaultNotices: Notice[] = [
    { noticeCategoryName: '기타 재화', noticeCategoryDetailName: '품명 및 모델명', content: notices?.['품명'] || '상품 상세 참조' },
    { noticeCategoryName: '기타 재화', noticeCategoryDetailName: '인증/허가 사항', content: notices?.['인증사항'] || '해당없음' },
    { noticeCategoryName: '기타 재화', noticeCategoryDetailName: '제조국(원산지)', content: notices?.['원산지'] || '상품 상세 참조' },
    { noticeCategoryName: '기타 재화', noticeCategoryDetailName: '제조자(수입자)', content: notices?.['제조사'] || '상품 상세 참조' },
    { noticeCategoryName: '기타 재화', noticeCategoryDetailName: 'A/S 책임자와 전화번호', content: notices?.['AS연락처'] || '상품 상세 참조' },
  ];

  return defaultNotices;
}

/**
 * 쿠팡 items 배열 구성
 */
function buildCoupangItems(
  masterProduct: MasterProductData,
  images: string[],
  notices: Notice[],
  options: { name: string; values: string[] }[]
) {
  // 이미지 구성
  const productImages = images.slice(0, 10).map((url, index) => ({
    imageOrder: index,
    imageType: (index === 0 ? 'REPRESENTATIVE' : 'DETAIL') as 'REPRESENTATIVE' | 'REPRESENTATION' | 'DETAIL',
    cdnPath: url,
    vendorPath: url,
  }));

  // 상세 설명 구성
  const contents = [
    {
      contentsType: 'IMAGE_NO_SPACE' as const,
      contentDetails: [
        {
          content: masterProduct.detailHtml || masterProduct.description || '',
          detailType: 'TEXT' as const,
        },
      ],
    },
  ];

  // 옵션이 없는 경우 단일 아이템
  if (options.length === 0) {
    return [
      {
        itemName: masterProduct.name,
        originalPrice: masterProduct.basePrice,
        salePrice: masterProduct.basePrice,
        maximumBuyCount: 100,
        maximumBuyForPerson: 0,
        maximumBuyForPersonPeriod: 1,
        outboundShippingTimeDay: 3,
        unitCount: 1,
        adultOnly: 'EVERYONE' as const,
        taxType: 'TAX' as const,
        parallelImported: 'NOT_PARALLEL_IMPORTED' as const,
        overseasPurchased: 'NOT_OVERSEAS_PURCHASED' as const,
        pccNeeded: false,
        bestPriceGuaranteed3P: false,
        externalVendorSku: '',
        barcode: '',
        modelNo: '',
        images: productImages,
        notices,
        attributes: [],
        contents,
        certifications: [],
        extraInfos: [],
        searchTags: [],
      },
    ];
  }

  // 옵션이 있는 경우 옵션 조합 생성
  const combinations = generateOptionCombinations(options);

  return combinations.map((combo, index) => ({
    itemName: combo.join('_'),
    originalPrice: masterProduct.basePrice,
    salePrice: masterProduct.basePrice,
    maximumBuyCount: 100,
    maximumBuyForPerson: 0,
    maximumBuyForPersonPeriod: 1,
    outboundShippingTimeDay: 3,
    unitCount: 1,
    adultOnly: 'EVERYONE' as const,
    taxType: 'TAX' as const,
    parallelImported: 'NOT_PARALLEL_IMPORTED' as const,
    overseasPurchased: 'NOT_OVERSEAS_PURCHASED' as const,
    pccNeeded: false,
    bestPriceGuaranteed3P: false,
    externalVendorSku: '',
    barcode: '',
    modelNo: '',
    images: index === 0 ? productImages : [], // 첫 번째 옵션에만 이미지
    notices,
    attributes: options.map((opt, i) => ({
      attributeTypeName: opt.name,
      attributeValueName: combo[i],
    })),
    contents: index === 0 ? contents : [], // 첫 번째 옵션에만 상세 설명
    certifications: [],
    extraInfos: [],
    searchTags: [],
  }));
}

/**
 * 옵션 조합 생성
 */
function generateOptionCombinations(options: { name: string; values: string[] }[]): string[][] {
  if (options.length === 0) return [];

  const result: string[][] = [];

  function combine(index: number, current: string[]) {
    if (index === options.length) {
      result.push([...current]);
      return;
    }

    for (const value of options[index].values) {
      current.push(value);
      combine(index + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return result;
}

/**
 * 네이버에 상품 등록
 *
 * API 문서: https://apicenter.commerce.naver.com/
 * API 버전: v2
 *
 * 필수 필드:
 * - originProduct.statusType: 상품 상태 ('SALE' | 'WAIT')
 * - originProduct.leafCategoryId: 최하위 카테고리 ID
 * - originProduct.name: 상품명
 * - originProduct.images.representativeImage.url: 대표 이미지 URL
 * - originProduct.detailContent: 상품 상세 설명 (HTML)
 * - originProduct.salePrice: 판매가
 * - originProduct.deliveryInfo: 배송 정보
 */
async function uploadToNaver(
  masterProduct: MasterProductData,
  config: PlatformConfigData
): Promise<{ success: boolean; productId?: string; url?: string; message?: string }> {
  const credentials = config.credentials as Record<string, string>;
  const { clientId, clientSecret } = credentials;

  if (!clientId || !clientSecret) {
    return { success: false, message: '네이버 API 인증 정보가 없습니다.' };
  }

  // 카테고리 ID 확인
  const categoryId = masterProduct.category?.naverCategoryId;
  if (!categoryId) {
    return { success: false, message: '네이버 카테고리가 매핑되지 않았습니다. 카테고리 설정을 확인해주세요.' };
  }

  try {
    const client = new NaverCommerceClient({ clientId, clientSecret });

    // 이미지 준비
    const images = (masterProduct.images as string[]) || [];
    const allImages = masterProduct.thumbnailUrl
      ? [masterProduct.thumbnailUrl, ...images]
      : images;

    if (allImages.length === 0) {
      return { success: false, message: '상품 이미지가 필요합니다.' };
    }

    // 네이버 상품 데이터 구성
    const originProduct: NaverOriginProduct = {
      statusType: 'SALE',
      saleType: 'NEW',
      leafCategoryId: categoryId,
      name: masterProduct.name,
      images: {
        representativeImage: { url: allImages[0] },
        optionalImages: allImages.slice(1, 10).map(url => ({ url })),
      },
      detailContent: escapeHtmlForJson(masterProduct.detailHtml || masterProduct.description || ''),
      salePrice: masterProduct.basePrice,
      stockQuantity: 100, // 기본 재고
      deliveryInfo: {
        deliveryType: 'DELIVERY',
        deliveryAttributeType: 'NORMAL',
        deliveryFee: {
          deliveryFeeType: masterProduct.shippingFee > 0 ? 'PAID' : 'FREE',
          baseFee: masterProduct.shippingFee,
          freeConditionalAmount: masterProduct.freeShipOver || undefined,
        },
        claimDeliveryInfo: {
          returnDeliveryFee: 3000,
          exchangeDeliveryFee: 6000,
          shippingAddressId: config.outboundCode ? parseInt(config.outboundCode, 10) : undefined,
          returnAddressId: config.returnCode ? parseInt(config.returnCode, 10) : undefined,
        },
      },
      detailAttribute: {
        naverShoppingSearchInfo: {
          manufacturerName: masterProduct.brand || undefined,
          brandName: masterProduct.brand || undefined,
        },
        afterServiceInfo: {
          afterServiceTelephoneNumber: '',
          afterServiceGuideContent: '상품 상세페이지 참조',
        },
        originAreaInfo: {
          originAreaCode: '00', // 국내
          content: '상품 상세설명 참조',
        },
        minorPurchasable: true,
      },
    };

    // 옵션 처리
    const options = masterProduct.options as { name: string; values: string[] }[] || [];
    if (options.length > 0) {
      originProduct.optionInfo = buildNaverOptions(options, masterProduct.basePrice);
    }

    const naverProduct: NaverProductRequest = { originProduct };

    const result = await client.createProduct(naverProduct);

    if (result?.originProductNo) {
      // 스토어 URL 구성 (실제 스토어명은 설정에서 가져와야 함)
      const storeUrl = config.sellerName
        ? `https://smartstore.naver.com/${config.sellerName}/products/${result.originProductNo}`
        : `https://shopping.naver.com/products/${result.originProductNo}`;

      return {
        success: true,
        productId: result.originProductNo.toString(),
        url: storeUrl,
        message: '네이버 스마트스토어 상품 등록 완료',
      };
    }

    return {
      success: false,
      message: '네이버 상품 등록 실패',
    };
  } catch (error) {
    console.error('네이버 상품 등록 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '네이버 API 오류',
    };
  }
}

/**
 * HTML 특수문자 이스케이프 (JSON 전송용)
 */
function escapeHtmlForJson(html: string): string {
  return html
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * 네이버 옵션 구성
 */
function buildNaverOptions(options: { name: string; values: string[] }[], basePrice: number) {
  if (options.length === 0) return undefined;

  // 단순 옵션 (1개 옵션 그룹)
  if (options.length === 1) {
    return {
      simpleOptionSortType: 'CREATE' as const,
      optionSimple: options[0].values.map(value => ({
        groupName: options[0].name,
        name: value,
        usable: true,
      })),
    };
  }

  // 조합형 옵션 (2개 이상 옵션 그룹)
  const combinations = generateOptionCombinations(options);

  return {
    optionCombinationSortType: 'CREATE' as const,
    optionCombinationGroupNames: {
      optionGroupName1: options[0]?.name,
      optionGroupName2: options[1]?.name,
      optionGroupName3: options[2]?.name,
      optionGroupName4: options[3]?.name,
    },
    optionCombinations: combinations.map(combo => ({
      optionName1: combo[0],
      optionName2: combo[1],
      optionName3: combo[2],
      optionName4: combo[3],
      stockQuantity: 100,
      price: basePrice,
      usable: true,
    })),
    useStockManagement: true,
  };
}

/**
 * 자사몰에 상품 등록 (InventoryItem 생성)
 */
async function uploadToShop(
  masterProduct: MasterProductData,
  userId: string
): Promise<{ success: boolean; productId?: string; url?: string; message?: string }> {
  try {
    const images = (masterProduct.images as string[]) || [];

    // 기본 창고 가져오기
    let warehouse = await prisma.warehouse.findFirst({
      where: { userId, code: 'DEFAULT' },
    });

    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          userId,
          name: '기본 창고',
          code: 'DEFAULT',
          type: 'MAIN',
          isActive: true,
        },
      });
    }

    // 자사몰 상품 = InventoryItem 생성
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        userId,
        warehouseId: warehouse.id,
        sku: `SHOP-${Date.now()}`,
        name: masterProduct.name,
        description: masterProduct.description,
        category: masterProduct.category?.name || undefined,
        brand: masterProduct.brand,
        sellingPrice: masterProduct.basePrice,
        costPrice: masterProduct.costPrice,
        quantity: 100, // 기본 재고
        imageUrl: masterProduct.thumbnailUrl || (images.length > 0 ? images[0] : undefined),
        status: 'ACTIVE',
      },
    });

    // MasterProduct와 InventoryItem 연결
    await prisma.masterProduct.update({
      where: { id: masterProduct.id },
      data: { inventoryItemId: inventoryItem.id },
    });

    return {
      success: true,
      productId: inventoryItem.id,
      url: `/shop/products/${inventoryItem.id}`,
      message: '자사몰 상품 등록 완료',
    };
  } catch (error) {
    console.error('자사몰 상품 등록 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '자사몰 등록 오류',
    };
  }
}
