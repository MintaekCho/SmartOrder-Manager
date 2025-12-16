/**
 * 네이버 스마트스토어 플랫폼 어댑터
 * 통합 상품 데이터를 네이버 Commerce API 형식으로 변환하여 등록
 */

import { NaverCommerceClient, getNaverCommerceClient } from '../naver-api/client';
import type {
  NaverProductRequest,
  NaverOptionCombination,
} from '../naver-api/types';
import type {
  IPlatformAdapter,
  UnifiedProduct,
  PlatformConfig,
  PlatformUploadResult,
  PlatformCategory,
} from './types';

export class NaverAdapter implements IPlatformAdapter {
  platform = 'NAVER' as const;
  private client: NaverCommerceClient;

  constructor() {
    this.client = getNaverCommerceClient();
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  /**
   * 통합 상품 데이터를 네이버 형식으로 변환하여 등록
   */
  async uploadProduct(
    product: UnifiedProduct,
    config: PlatformConfig
  ): Promise<PlatformUploadResult> {
    try {
      // 네이버 상품 데이터로 변환
      const naverProduct = this.convertToNativeFormat(product, config);

      // 등록 실행
      const result = await this.client.createProduct(naverProduct);

      const productNo = result.originProductNo.toString();
      const channelNo = result.smartstoreChannelProductNo.toString();

      return {
        success: true,
        platform: 'NAVER',
        platformProductId: productNo,
        platformItemId: channelNo,
        platformUrl: `https://smartstore.naver.com/products/${channelNo}`,
        message: '상품이 성공적으로 등록되었습니다.',
      };
    } catch (error) {
      return {
        success: false,
        platform: 'NAVER',
        message: '상품 등록 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async updateProduct(
    platformProductId: string,
    product: UnifiedProduct,
    config: PlatformConfig
  ): Promise<PlatformUploadResult> {
    try {
      const naverProduct = this.convertToNativeFormat(product, config);
      const result = await this.client.updateProduct(
        parseInt(platformProductId),
        naverProduct
      );

      return {
        success: true,
        platform: 'NAVER',
        platformProductId: result.originProductNo.toString(),
        message: '상품이 성공적으로 수정되었습니다.',
      };
    } catch (error) {
      return {
        success: false,
        platform: 'NAVER',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async deleteProduct(
    platformProductId: string,
    config: PlatformConfig
  ): Promise<boolean> {
    try {
      return await this.client.deleteProduct(parseInt(platformProductId));
    } catch {
      return false;
    }
  }

  async getCategories(parentCode?: string): Promise<PlatformCategory[]> {
    try {
      const categories = await this.client.getCategories(parentCode);

      return categories.map(cat => ({
        code: cat.id,
        name: cat.name,
        fullPath: cat.wholeCategoryName,
        isLeaf: cat.isLeaf,
        parentCode: cat.parentId,
      }));
    } catch (error) {
      console.error('[NaverAdapter] 카테고리 조회 오류:', error);
      return [];
    }
  }

  async searchCategories(keyword: string): Promise<PlatformCategory[]> {
    try {
      const categories = await this.client.searchCategories(keyword);

      return categories.map(cat => ({
        code: cat.id,
        name: cat.name,
        fullPath: cat.wholeCategoryName,
        isLeaf: cat.isLeaf,
        parentCode: cat.parentId,
      }));
    } catch (error) {
      console.error('[NaverAdapter] 카테고리 검색 오류:', error);
      return [];
    }
  }

  async getNoticeTemplate(categoryCode: string): Promise<Record<string, string>> {
    // 카테고리별 상품 고시 템플릿 반환
    // TODO: 실제 API에서 조회
    return {
      '품명 및 모델명': '',
      '인증정보': '',
      '제조국(원산지)': '',
      '제조자(수입자)': '',
      'AS 책임자/전화번호': '',
    };
  }

  /**
   * 통합 형식 → 네이버 형식 변환
   */
  private convertToNativeFormat(
    product: UnifiedProduct,
    config: PlatformConfig
  ): NaverProductRequest {
    // 배송비 타입 결정
    let deliveryFeeType: 'FREE' | 'PAID' | 'CONDITIONAL_FREE';
    if (product.deliveryType === 'FREE') {
      deliveryFeeType = 'FREE';
    } else if (product.deliveryType === 'CONDITIONAL' && product.freeShipOverAmount) {
      deliveryFeeType = 'CONDITIONAL_FREE';
    } else {
      deliveryFeeType = 'PAID';
    }

    // 옵션 정보 구성
    let optionInfo: NaverProductRequest['originProduct']['optionInfo'] | undefined;

    if (product.options && product.options.length > 0) {
      // 옵션 그룹명 설정
      const optionGroupNames: Record<string, string> = {};
      product.options.forEach((opt, index) => {
        optionGroupNames[`optionGroupName${index + 1}`] = opt.groupName;
      });

      // 옵션 조합 생성
      const optionCombinations = this.generateOptionCombinations(product);

      optionInfo = {
        optionCombinationGroupNames: optionGroupNames as any,
        optionCombinations,
        useStockManagement: true,
        optionCombinationSortType: 'CREATE',
      };
    }

    return {
      originProduct: {
        statusType: 'SALE',
        saleType: 'NEW',
        leafCategoryId: product.categoryCode || '',
        name: product.name.substring(0, 100), // 최대 100자
        images: {
          representativeImage: {
            url: product.thumbnailUrl || product.images[0] || '',
          },
          optionalImages: product.images.slice(1).map(url => ({ url })),
        },
        detailContent: product.detailHtml || '<p>상세 설명</p>',
        salePrice: product.salePrice,
        stockQuantity: product.stockQuantity,
        deliveryInfo: {
          deliveryType: 'DELIVERY',
          deliveryAttributeType: 'NORMAL',
          deliveryFee: {
            deliveryFeeType,
            baseFee: deliveryFeeType === 'PAID' ? (product.deliveryFee || 3000) : undefined,
            freeConditionalAmount: deliveryFeeType === 'CONDITIONAL_FREE' ? product.freeShipOverAmount : undefined,
            deliveryFeeByArea: {
              deliveryAreaType: 'AREA_2',
              area2extraFee: 3000, // 제주 추가 배송비
              area3extraFee: 5000, // 도서산간 추가 배송비
            },
          },
          claimDeliveryInfo: {
            returnDeliveryFee: product.deliveryFee || 3000,
            exchangeDeliveryFee: (product.deliveryFee || 3000) * 2,
            shippingAddressId: config.outboundCode ? parseInt(config.outboundCode) : undefined,
            returnAddressId: config.returnCode ? parseInt(config.returnCode) : undefined,
          },
        },
        detailAttribute: {
          naverShoppingSearchInfo: {
            brandName: product.brand,
            manufacturerName: product.brand,
          },
          afterServiceInfo: {
            afterServiceTelephoneNumber: '010-0000-0000', // 설정에서 가져와야 함
            afterServiceGuideContent: '상품 수령 후 7일 이내 교환/반품 가능',
          },
          minorPurchasable: !product.adultOnly,
          seoInfo: {
            sellerTags: (product.searchTags || []).map((tag, index) => ({
              code: index + 1,
              text: tag,
            })).slice(0, 10), // 최대 10개
          },
        },
        customerBenefit: product.comparePrice && product.comparePrice > product.salePrice ? {
          immediateDiscountPolicy: {
            discountMethod: {
              value: product.comparePrice - product.salePrice,
              unitType: 'WON',
            },
          },
        } : undefined,
        optionInfo,
      },
    };
  }

  /**
   * 옵션 조합 생성
   */
  private generateOptionCombinations(product: UnifiedProduct): NaverOptionCombination[] {
    if (!product.options || product.options.length === 0) {
      return [];
    }

    const combinations: NaverOptionCombination[] = [];

    const generateCombos = (
      optionIndex: number,
      currentCombo: { name: string; additionalPrice: number; stock?: number }[]
    ) => {
      if (optionIndex >= product.options!.length) {
        const combination: NaverOptionCombination = {
          optionName1: currentCombo[0]?.name || '',
          optionName2: currentCombo[1]?.name,
          optionName3: currentCombo[2]?.name,
          optionName4: currentCombo[3]?.name,
          stockQuantity: currentCombo.reduce(
            (min, c) => c.stock !== undefined ? Math.min(min, c.stock) : min,
            product.stockQuantity
          ),
          price: product.salePrice + currentCombo.reduce((sum, c) => sum + c.additionalPrice, 0),
          usable: true,
        };
        combinations.push(combination);
        return;
      }

      const option = product.options![optionIndex];
      option.values.forEach(value => {
        generateCombos(optionIndex + 1, [
          ...currentCombo,
          {
            name: value.name,
            additionalPrice: value.additionalPrice || 0,
            stock: value.stockQuantity,
          },
        ]);
      });
    };

    generateCombos(0, []);
    return combinations;
  }
}

// 싱글톤
let naverAdapterInstance: NaverAdapter | null = null;

export function getNaverAdapter(): NaverAdapter {
  if (!naverAdapterInstance) {
    naverAdapterInstance = new NaverAdapter();
  }
  return naverAdapterInstance;
}
