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
  private client: CoupangWingClient | null = null;

  private async getClient(): Promise<CoupangWingClient> {
    if (!this.client) {
      this.client = await getCoupangWingClient();
    }
    return this.client;
  }

  async isConfigured(): Promise<boolean> {
    try {
      const client = await this.getClient();
      return client.isConfigured();
    } catch {
      return false;
    }
  }

  /**
   * 통합 상품 데이터를 쿠팡 형식으로 변환하여 등록
   */
  async uploadProduct(
    product: UnifiedProduct,
    config: PlatformConfig
  ): Promise<PlatformUploadResult> {
    try {
      const client = await this.getClient();

      // 쿠팡 상품 데이터로 변환
      const coupangProduct = this.convertToNativeFormat(product, config);

      // 등록 실행
      const result = await client.registerProduct(coupangProduct);

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
      const client = await this.getClient();
      const result = await client.getCategories(parentCode ? parseInt(parentCode) : undefined);

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
    try {
      const client = await this.getClient();
      // getCategories에 categoryCode를 전달하면 카테고리 메타 정보 조회
      const metaResponse = await client.getCategories(parseInt(categoryCode));

      if (metaResponse.code === 'SUCCESS' && metaResponse.data?.noticeCategories) {
        // 첫 번째 고시 카테고리의 상세 항목들을 템플릿으로 반환
        const firstNoticeCategory = metaResponse.data.noticeCategories[0];
        if (firstNoticeCategory && firstNoticeCategory.noticeCategoryDetailNames) {
          const template: Record<string, string> = {};
          firstNoticeCategory.noticeCategoryDetailNames.forEach((detail: any) => {
            template[detail.noticeCategoryDetailName] = '';
          });
          return template;
        }
      }
    } catch (error) {
      console.error('[CoupangAdapter] 고시정보 템플릿 조회 오류:', error);
    }

    // 기본 템플릿 (식품)
    return {
      '포장단위별 용량': '',
      '원산지': '',
      '제조연월일': '',
      '보관방법': '',
      '생산자': '',
    };
  }

  /**
   * 카테고리 코드로 고시정보 카테고리명 결정 (PDF 가이드 20-22페이지 기준)
   */
  private getNoticeCategoryName(categoryCode: string): string {
    const code = parseInt(categoryCode);

    // 주요 카테고리별 고시정보 카테고리명 매핑
    // 실제로는 카테고리 메타정보 API에서 조회해야 하지만,
    // convertToNativeFormat이 동기 함수이므로 매핑 테이블 사용
    if (code >= 76000 && code < 77000) return '식품(농산물)';
    if (code >= 56000 && code < 57000) return '화장품';
    if (code >= 186000 && code < 187000) return '의류';
    if (code >= 225000 && code < 226000) return '자동차용품(자동차부품/기타 자동차용품)';
    if (code >= 164000 && code < 165000) return '가전제품';
    if (code >= 115000 && code < 116000) return '식품';

    // 기본값
    return '기타 재화';
  }

  /**
   * 카테고리별 기본 고시정보 반환 (PDF 가이드 20-22페이지 예시 기반)
   */
  private getDefaultNotices(noticeCategoryName: string): Array<[string, string]> {
    switch (noticeCategoryName) {
      case '화장품':
        return [
          ['용량(중량)', '상세페이지 참조'],
          ['제품 주요 사양', '상세페이지 참조'],
          ['사용기한 또는 개봉 후 사용기간', '상세페이지 참조'],
          ['사용방법', '상세페이지 참조'],
          ['제조업자 및 제조판매업자', '상세페이지 참조'],
          ['제조국', '상세페이지 참조'],
          ['화장품법에 따라 기재, 표시하여야 하는 모든 성분', '상세페이지 참조'],
          ['식품의약품안전처 심사 필 유무', '상세페이지 참조'],
          ['사용할 때주의사항', '상세페이지 참조'],
          ['품질보증기준', '제품 이상 시 공정거래위원회 고시 소비자분쟁해결기준에 의거 보상합니다.'],
          ['소비자상담관련 전화번호', '상세페이지 참조'],
        ];

      case '식품(농산물)':
      case '식품':
        return [
          ['포장단위별 용량', '상세페이지 참조'],
          ['원산지', '상세페이지 참조'],
          ['제조연월일', '상세페이지 참조'],
          ['보관방법', '상세페이지 참조'],
          ['생산자', '상세페이지 참조'],
        ];

      case '자동차용품(자동차부품/기타 자동차용품)':
        return [
          ['품명 및 모델명', '상세페이지 참조'],
          ['출시년월', '상세페이지 참조'],
          ['KC 인증 필 유무', '상세페이지 참조'],
          ['제조자(수입자)', '상세페이지 참조'],
          ['제조국', '상세페이지 참조'],
          ['크기', '상세페이지 참조'],
          ['적용차종', '상세페이지 참조'],
          ['품질보증기준', '제품 이상 시 공정거래위원회 고시 소비자분쟁해결기준에 의거 보상합니다.'],
          ['A/S 책임자와 전화번호', '상세페이지 참조'],
        ];

      case '기타 재화':
      default:
        // PDF 가이드 22페이지 기본 항목
        return [
          ['품명 및 모델명', '상세페이지 참조'],
          ['인증사항', '상세페이지 참조'],
          ['제조국(원산지)', '상세페이지 참조'],
          ['제조자(수입자)', '상세페이지 참조'],
          ['소비자상담 관련 전화번호', '상세페이지 참조'],
        ];
    }
  }

  /**
   * 상품 데이터 검증 (PDF FAQ 기반)
   */
  private validateProduct(product: UnifiedProduct, config: PlatformConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 1. 출고지 코드 확인 (FAQ: 출고지 미등록 에러)
    if (!config.outboundCode && !config.returnCode) {
      errors.push('출고지 코드(outboundShippingPlaceCode)가 설정되지 않았습니다. 쿠팡 Wing에서 출고지를 먼저 등록해주세요.');
    }

    // 2. 반품지 코드 확인 (FAQ: 반품지 미등록 에러)
    if (!config.returnCode) {
      errors.push('반품지 코드(returnCenterCode)가 설정되지 않았습니다. 쿠팡 Wing에서 반품지를 먼저 등록해주세요.');
    }

    // 3. 카테고리 코드 확인 (FAQ: 카테고리 코드 오류)
    if (!product.categoryCode || product.categoryCode === '0') {
      errors.push('카테고리를 선택해주세요. 쿠팡 카테고리 선택은 필수입니다.');
    }

    // 4. 이미지 확인 (FAQ: 이미지 URL 오류)
    if (!product.thumbnailUrl && product.images.length === 0) {
      errors.push('최소 1개 이상의 상품 이미지가 필요합니다.');
    }

    // 5. 가격 확인 (FAQ: 가격 정책 위반)
    if (product.salePrice <= 0) {
      errors.push('판매가는 0원보다 커야 합니다.');
    }
    if (product.costPrice && product.costPrice > product.salePrice) {
      errors.push('원가가 판매가보다 높습니다. 마진을 확인해주세요.');
    }

    // 6. 상품명 확인
    if (!product.name || product.name.trim().length === 0) {
      errors.push('상품명은 필수입니다.');
    }
    if (product.name.length > 200) {
      errors.push('상품명은 200자를 초과할 수 없습니다.');
    }

    // 7. 재고 확인
    if (product.stockQuantity < 0) {
      errors.push('재고 수량은 0 이상이어야 합니다.');
    }

    // 8. 판매자 정보 확인
    if (!config.sellerId && !config.credentials?.vendorId) {
      errors.push('판매자 ID(vendorId)가 설정되지 않았습니다.');
    }

    // 9. A/S 연락처 확인 (권장)
    if (!config.contactNumber) {
      // 경고만 (에러는 아님)
      console.warn('[CoupangAdapter] A/S 연락처가 설정되지 않았습니다. 기본값이 사용됩니다.');
    }

    // 10. 배송비 정책 확인
    if (product.deliveryType === 'CONDITIONAL' && !product.freeShipOverAmount) {
      errors.push('조건부 무료배송의 경우 무료배송 기준 금액을 설정해야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 통합 형식 → 쿠팡 형식 변환
   */
  private convertToNativeFormat(
    product: UnifiedProduct,
    config: PlatformConfig
  ): CoupangProduct {
    // PDF FAQ 기반 검증
    const validation = this.validateProduct(product, config);
    if (!validation.isValid) {
      throw new Error(
        '상품 데이터 검증 실패:\n' + validation.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')
      );
    }
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

    // 상품 고시 변환 (PDF 가이드 20-22페이지)
    const notices: CoupangProductItem['notices'] = [];
    const noticeCategoryName = this.getNoticeCategoryName(product.categoryCode || '0');

    if (product.notices && Object.keys(product.notices).length > 0) {
      // 사용자가 제공한 고시정보 사용
      Object.entries(product.notices).forEach(([key, value]) => {
        notices.push({
          noticeCategoryName,
          noticeCategoryDetailName: key,
          content: value || '상세페이지 참조',
        });
      });
    } else {
      // 기본 고시정보 생성 (필수 항목만)
      // PDF 가이드에 따르면 카테고리별로 필수 항목이 다르지만,
      // 최소한의 기본값 제공
      const defaultNotices = this.getDefaultNotices(noticeCategoryName);
      defaultNotices.forEach(([detailName, content]) => {
        notices.push({
          noticeCategoryName,
          noticeCategoryDetailName: detailName,
          content,
        });
      });
    }

    // 배송비 타입 결정 (PDF 가이드 11페이지 기준)
    let deliveryChargeType: 'FREE' | 'NOT_FREE' | 'CONDITIONAL_FREE' | 'CHARGE_RECEIVED';
    let deliveryCharge = 0;
    let freeShipOverAmount = 0;
    let deliveryChargeOnReturn = 0; // 초도반품배송비

    if (product.deliveryType === 'FREE') {
      // 무료배송
      deliveryChargeType = 'FREE';
      deliveryCharge = 0;
      freeShipOverAmount = 0;
      deliveryChargeOnReturn = 2500; // 무료배송 상품 반품 시 고객 부담 배송비
    } else if (product.deliveryType === 'CONDITIONAL' && product.freeShipOverAmount) {
      // 조건부 무료배송
      deliveryChargeType = 'CONDITIONAL_FREE';
      deliveryCharge = product.deliveryFee || 2500; // 기본 배송비
      freeShipOverAmount = product.freeShipOverAmount; // 무료배송 기준 금액
      deliveryChargeOnReturn = 0; // 조건부는 초도반품배송비 없음
    } else {
      // 유료배송
      deliveryChargeType = 'NOT_FREE';
      deliveryCharge = product.deliveryFee || 2500;
      freeShipOverAmount = 0;
      deliveryChargeOnReturn = 0; // 유료배송은 초도반품배송비 없음
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
          maximumBuyCount: 100, // 옵션별 재고는 추후 구현
          maximumBuyForPerson: 0, // 0 = 제한없음 (PDF 가이드 14페이지)
          outboundShippingTimeDay: 3,
          maximumBuyForPersonPeriod: 1, // 일 단위 (PDF 가이드 14페이지)
          unitCount: 1,
          adultOnly: product.adultOnly ? 'ADULT_ONLY' : 'EVERYONE',
          taxType: 'FREE', // 농수산물 기본값
          parallelImported: 'NOT_PARALLEL_IMPORTED',
          overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
          pccNeeded: false,
          externalVendorSku: combo.sku || `SKU-${Date.now()}-${index}`,
          barcode: '',
          emptyBarcode: true,
          emptyBarcodeReason: '바코드 정보 없음',
          modelNo: combo.sku || `MODEL-${index}`,
          certifications: [
            {
              certificationType: 'NOT_REQUIRED',
              certificationCode: '',
            },
          ],
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
        maximumBuyCount: product.stockQuantity || 100,
        maximumBuyForPerson: 0, // 0 = 제한없음
        outboundShippingTimeDay: 3,
        maximumBuyForPersonPeriod: 1, // 일 단위
        unitCount: 1,
        adultOnly: product.adultOnly ? 'ADULT_ONLY' : 'EVERYONE',
        taxType: 'FREE',
        parallelImported: 'NOT_PARALLEL_IMPORTED',
        overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
        pccNeeded: false,
        externalVendorSku: `SKU-${Date.now()}`,
        barcode: '',
        emptyBarcode: true,
        emptyBarcodeReason: '바코드 정보 없음',
        modelNo: `MODEL-${Date.now()}`,
        certifications: [
          {
            certificationType: 'NOT_REQUIRED',
            certificationCode: '',
          },
        ],
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

    // 판매 기간 설정 (PDF 가이드 9페이지)
    const now = new Date();
    const saleStartedAt = now.toISOString().slice(0, 19); // yyyy-MM-ddTHH:mm:ss
    const saleEndedAt = '2099-12-31T23:59:59'; // 장기 판매

    return {
      // 기본 정보
      sellerProductName: product.name,
      displayCategoryCode: parseInt(product.categoryCode || '0'),
      brand: product.brand || '판매자 브랜드',
      generalProductName: product.name,
      productGroup: 'NONE',

      // 판매 기간 (PDF 가이드 9페이지)
      saleStartedAt,
      saleEndedAt,

      // 배송 정보 (PDF 가이드 11-12페이지)
      deliveryMethod: 'DIRECT',
      deliveryCompanyCode: 'CJGLS',
      deliveryChargeType,
      deliveryCharge,
      freeShipOverAmount,
      deliveryChargeOnReturn,
      remoteAreaDeliverable: 'N',
      unionDeliveryType: 'UNION_DELIVERY',

      // 반품/교환 정보 (PDF 가이드 13페이지)
      returnCenterCode: config.returnCode || '',
      returnCharge: 5000,
      returnChargeVendor: 'VENDOR', // 판매자 부담

      // A/S 정보 (PDF 가이드 13페이지)
      afterServiceInformation: '상품 상세 페이지 참조 또는 판매자 문의',
      afterServiceContactNumber: config.contactNumber || '1588-0000',

      // 출고지 및 판매자 정보 (PDF 가이드 9페이지)
      outboundShippingPlaceCode: config.outboundCode || config.returnCode || '',
      vendorId: config.sellerId || config.credentials?.vendorId || '',
      vendorUserId: config.userId || config.credentials?.vendorId || '',

      // 승인 요청 (PDF 가이드 27페이지)
      requested: true, // true: 승인요청, false: 임시저장

      // 기타
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
