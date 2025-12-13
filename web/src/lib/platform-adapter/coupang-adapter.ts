/**
 * 쿠팡 플랫폼 어댑터
 * 통합 상품 데이터를 쿠팡 Wing API 형식으로 변환하여 등록
 */

import { CoupangWingClient, getCoupangWingClient, CoupangProduct, CoupangProductItem } from '../coupang/wing-api';
import type {
  IPlatformAdapter,
  UnifiedProduct,
  PlatformConfig,
  PlatformUploadResult,
  PlatformCategory,
} from './types';

export class CoupangAdapter implements IPlatformAdapter {
  platform = 'COUPANG' as const;
  private client: CoupangWingClient;

  constructor() {
    this.client = getCoupangWingClient();
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  /**
   * 통합 상품 데이터를 쿠팡 형식으로 변환하여 등록
   */
  async uploadProduct(
    product: UnifiedProduct,
    config: PlatformConfig
  ): Promise<PlatformUploadResult> {
    try {
      // 쿠팡 상품 데이터로 변환
      const coupangProduct = this.convertToNativeFormat(product, config);

      // 등록 실행
      const result = await this.client.registerProduct(coupangProduct);

      return {
        success: result.success,
        platform: 'COUPANG',
        platformProductId: result.sellerProductId,
        message: result.message,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        platform: 'COUPANG',
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
    // 쿠팡은 상품 수정 API가 제한적이므로 가격/재고 수정만 지원
    // 전체 수정 시 삭제 후 재등록 필요
    try {
      // TODO: 쿠팡 상품 수정 API 구현
      return {
        success: false,
        platform: 'COUPANG',
        message: '쿠팡 상품 수정 기능은 아직 지원되지 않습니다.',
      };
    } catch (error) {
      return {
        success: false,
        platform: 'COUPANG',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async deleteProduct(
    platformProductId: string,
    config: PlatformConfig
  ): Promise<boolean> {
    // TODO: 쿠팡 상품 삭제 API 구현
    console.log(`[CoupangAdapter] 상품 삭제 요청: ${platformProductId}`);
    return false;
  }

  async getCategories(parentCode?: string): Promise<PlatformCategory[]> {
    try {
      const result = await this.client.getCategories(parentCode ? parseInt(parentCode) : undefined);

      if (result.code === 'ERROR') {
        return [];
      }

      // 쿠팡 카테고리를 통합 형식으로 변환
      if (Array.isArray(result.data)) {
        return result.data.map((cat: any) => ({
          code: String(cat.categoryId || cat.displayCategoryCode),
          name: cat.categoryName || cat.displayCategoryName,
          fullPath: cat.wholeCategoryName || cat.categoryName,
          isLeaf: cat.leaf !== false,
          parentCode: parentCode,
        }));
      }

      return [];
    } catch (error) {
      console.error('[CoupangAdapter] 카테고리 조회 오류:', error);
      return [];
    }
  }

  async searchCategories(keyword: string): Promise<PlatformCategory[]> {
    // 쿠팡은 카테고리 검색 API가 없어서 전체 조회 후 필터링
    const allCategories = await this.getCategories();
    return allCategories.filter(cat =>
      cat.name.includes(keyword) || cat.fullPath.includes(keyword)
    );
  }

  async getNoticeTemplate(categoryCode: string): Promise<Record<string, string>> {
    // 카테고리별 상품 고시 템플릿 반환
    // TODO: 실제 API에서 조회
    return {
      '포장단위별 용량': '',
      '원산지': '',
      '제조연월일': '',
      '보관방법': '',
      '생산자': '',
    };
  }

  /**
   * 통합 형식 → 쿠팡 형식 변환
   */
  private convertToNativeFormat(
    product: UnifiedProduct,
    config: PlatformConfig
  ): CoupangProduct {
    // 이미지 변환
    const images: CoupangProductItem['images'] = [];
    if (product.thumbnailUrl) {
      images.push({
        imageOrder: 0,
        imageType: 'REPRESENTATION',
        vendorPath: product.thumbnailUrl,
      });
    }
    product.images.forEach((url, index) => {
      images.push({
        imageOrder: index + 1,
        imageType: 'DETAIL',
        vendorPath: url,
      });
    });

    // 상품 고시 변환
    const notices: CoupangProductItem['notices'] = [];
    if (product.notices) {
      Object.entries(product.notices).forEach(([key, value]) => {
        notices.push({
          noticeCategoryName: '식품(농산물)', // 기본값, 카테고리에 따라 변경 필요
          noticeCategoryDetailName: key,
          content: value || '상세 설명 참조',
        });
      });
    }

    // 배송비 타입 결정
    let deliveryChargeType: 'FREE' | 'PAID' | 'CONDITIONAL';
    if (product.deliveryType === 'FREE') {
      deliveryChargeType = 'FREE';
    } else if (product.deliveryType === 'CONDITIONAL' && product.freeShipOverAmount) {
      deliveryChargeType = 'CONDITIONAL';
    } else {
      deliveryChargeType = 'PAID';
    }

    // 아이템 생성 (옵션 없는 단일 상품)
    const items: CoupangProductItem[] = [];

    if (product.options && product.options.length > 0) {
      // 옵션이 있는 경우 조합 생성
      const combinations = this.generateOptionCombinations(product);
      combinations.forEach((combo, index) => {
        items.push({
          itemName: `${product.name} - ${combo.optionName}`,
          originalPrice: combo.price,
          salePrice: combo.price,
          maximumBuyCount: 100,
          maximumBuyForPerson: 10,
          outboundShippingTimeDay: 3,
          unitCount: 1,
          adultOnly: product.adultOnly ? 'ADULT_ONLY' : 'EVERYONE',
          taxType: 'FREE', // 농수산물 기본값
          parallelImported: 'NOT_PARALLEL_IMPORTED',
          overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
          pccNeeded: false,
          externalVendorSku: combo.sku || `SKU-${Date.now()}-${index}`,
          images,
          notices,
          contents: product.detailHtml ? [
            {
              contentsType: 'HTML',
              contentDetails: [{ content: product.detailHtml }],
            },
          ] : [],
          offerCondition: 'NEW',
          searchTags: product.searchTags || [],
        });
      });
    } else {
      // 옵션 없는 단일 상품
      items.push({
        itemName: product.name,
        originalPrice: product.salePrice,
        salePrice: product.salePrice,
        maximumBuyCount: 100,
        maximumBuyForPerson: 10,
        outboundShippingTimeDay: 3,
        unitCount: 1,
        adultOnly: product.adultOnly ? 'ADULT_ONLY' : 'EVERYONE',
        taxType: 'FREE',
        parallelImported: 'NOT_PARALLEL_IMPORTED',
        overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
        pccNeeded: false,
        externalVendorSku: `SKU-${Date.now()}`,
        images,
        notices,
        contents: product.detailHtml ? [
          {
            contentsType: 'HTML',
            contentDetails: [{ content: product.detailHtml }],
          },
        ] : [],
        offerCondition: 'NEW',
        searchTags: product.searchTags || [],
      });
    }

    return {
      sellerProductName: product.name,
      displayCategoryCode: parseInt(product.categoryCode || '0'),
      brand: product.brand || '판매자 브랜드',
      generalProductName: product.name,
      productGroup: 'NONE',
      deliveryMethod: 'DIRECT',
      deliveryCompanyCode: 'CJGLS',
      deliveryChargeType,
      deliveryCharge: product.deliveryFee || 0,
      freeShipOverAmount: product.freeShipOverAmount,
      returnCenterCode: config.returnCode || '',
      returnCharge: 5000,
      vendorId: config.sellerId || config.credentials?.vendorId || '',
      manufacture: product.brand || '판매자 정보 참조',
      items,
    };
  }

  /**
   * 옵션 조합 생성
   */
  private generateOptionCombinations(
    product: UnifiedProduct
  ): { optionName: string; price: number; sku?: string }[] {
    if (!product.options || product.options.length === 0) {
      return [{ optionName: '기본', price: product.salePrice }];
    }

    // 모든 옵션 조합 생성
    const combinations: { optionName: string; price: number; sku?: string }[] = [];

    const generateCombos = (
      optionIndex: number,
      currentCombo: { name: string; additionalPrice: number }[]
    ) => {
      if (optionIndex >= product.options!.length) {
        const optionName = currentCombo.map(c => c.name).join(' / ');
        const totalAdditional = currentCombo.reduce((sum, c) => sum + c.additionalPrice, 0);
        combinations.push({
          optionName,
          price: product.salePrice + totalAdditional,
        });
        return;
      }

      const option = product.options![optionIndex];
      option.values.forEach(value => {
        generateCombos(optionIndex + 1, [
          ...currentCombo,
          { name: value.name, additionalPrice: value.additionalPrice || 0 },
        ]);
      });
    };

    generateCombos(0, []);
    return combinations;
  }
}

// 싱글톤
let coupangAdapterInstance: CoupangAdapter | null = null;

export function getCoupangAdapter(): CoupangAdapter {
  if (!coupangAdapterInstance) {
    coupangAdapterInstance = new CoupangAdapter();
  }
  return coupangAdapterInstance;
}
