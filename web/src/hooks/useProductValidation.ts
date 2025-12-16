'use client';

import { useMemo } from 'react';

// 검증 결과 타입
export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

// 폼 데이터 타입
export interface ProductFormData {
  name: string;
  description: string;
  brand: string;
  categoryId: string;
  costPrice: string;
  basePrice: string;
  stockQuantity: string;
  deliveryType: string;
  deliveryFee: string;
  freeShipOver: string;
  adultOnly: boolean;
  taxType: 'TAX' | 'FREE';
}

// 플랫폼 설정 타입
export interface PlatformSettings {
  [platform: string]: {
    price?: string;
    categoryCode?: string;
    categoryName?: string;
  };
}

// 플랫폼별 추가 데이터 타입
export interface PlatformSpecificData {
  COUPANG: {
    notices: Record<string, string>;
  };
  NAVER: {
    originAreaCode: string;
    originContent: string;
  };
  SHOP: {
    isVisible: boolean;
  };
}

interface UseProductValidationParams {
  formData: ProductFormData;
  platformSettings: PlatformSettings;
  platformSpecificData: PlatformSpecificData;
  selectedPlatforms: string[];
  thumbnailUrl: string;
  images: string[];
  coupangSettingsConfigured: boolean | null;
  naverSettingsConfigured?: boolean | null;
}

interface UseProductValidationReturn {
  coupang: ValidationResult;
  naver: ValidationResult;
  shop: ValidationResult;
  canRegister: (platform: string) => boolean;
  canRegisterAll: () => boolean;
  getTabBadge: (platform: string) => 'success' | 'warning' | 'error' | undefined;
}

/**
 * 쿠팡 플랫폼 검증
 */
function validateCoupang(
  formData: ProductFormData,
  platformSettings: PlatformSettings,
  platformSpecificData: PlatformSpecificData,
  thumbnailUrl: string,
  images: string[],
  coupangSettingsConfigured: boolean | null
): ValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // 1. API 설정 확인
  if (coupangSettingsConfigured === false || coupangSettingsConfigured === null) {
    missingFields.push('쿠팡 API 설정 (출고지, 반품지, 연락처)');
  }

  // 2. 상품명
  if (!formData.name.trim()) {
    missingFields.push('상품명');
  } else if (formData.name.length > 200) {
    missingFields.push('상품명 (200자 이하)');
  }

  // 3. 판매가
  const salePrice = parseInt(formData.basePrice);
  if (!formData.basePrice || salePrice <= 0) {
    missingFields.push('판매가');
  }

  // 4. 원가 < 판매가 검증
  const costPrice = parseInt(formData.costPrice);
  if (costPrice && salePrice && costPrice >= salePrice) {
    warnings.push('원가가 판매가보다 높거나 같습니다');
  }

  // 5. 카테고리
  if (!platformSettings.COUPANG?.categoryCode) {
    missingFields.push('쿠팡 카테고리');
  }

  // 6. 이미지 (최소 1개)
  if (!thumbnailUrl && images.length === 0) {
    missingFields.push('상품 이미지 (최소 1개)');
  }

  // 7. 상품 고시정보 (권장)
  const notices = platformSpecificData.COUPANG?.notices || {};
  const recommendedNotices = ['원산지', '제조사'];
  const missingNotices = recommendedNotices.filter(key => !notices[key]);
  if (missingNotices.length > 0) {
    warnings.push(`권장 고시정보: ${missingNotices.join(', ')} (미입력시 "상세페이지 참조"로 등록)`);
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * 네이버 플랫폼 검증
 */
function validateNaver(
  formData: ProductFormData,
  platformSettings: PlatformSettings,
  platformSpecificData: PlatformSpecificData,
  thumbnailUrl: string,
  images: string[],
  naverSettingsConfigured: boolean | null
): ValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // 1. API 설정 확인 (현재는 미구현이므로 경고만)
  if (naverSettingsConfigured === false) {
    missingFields.push('네이버 API 설정');
  }

  // 2. 상품명
  if (!formData.name.trim()) {
    missingFields.push('상품명');
  }

  // 3. 판매가
  if (!formData.basePrice || parseInt(formData.basePrice) <= 0) {
    missingFields.push('판매가');
  }

  // 4. 카테고리
  if (!platformSettings.NAVER?.categoryCode) {
    missingFields.push('네이버 카테고리');
  }

  // 5. 이미지 (최소 1개)
  if (!thumbnailUrl && images.length === 0) {
    missingFields.push('상품 이미지 (최소 1개)');
  }

  // 6. 원산지 (권장)
  const originCode = platformSpecificData.NAVER?.originAreaCode;
  if (!originCode || originCode === '') {
    warnings.push('원산지 정보 (미입력시 "국내산"으로 등록)');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * 자사몰 플랫폼 검증
 */
function validateShop(
  formData: ProductFormData,
  thumbnailUrl: string,
  images: string[]
): ValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // 1. 상품명
  if (!formData.name.trim()) {
    missingFields.push('상품명');
  }

  // 2. 판매가
  if (!formData.basePrice || parseInt(formData.basePrice) <= 0) {
    missingFields.push('판매가');
  }

  // 3. 이미지 (권장)
  if (!thumbnailUrl && images.length === 0) {
    warnings.push('상품 이미지 권장');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * 상품 등록 검증 훅
 */
export function useProductValidation({
  formData,
  platformSettings,
  platformSpecificData,
  selectedPlatforms,
  thumbnailUrl,
  images,
  coupangSettingsConfigured,
  naverSettingsConfigured = null,
}: UseProductValidationParams): UseProductValidationReturn {
  // 각 플랫폼 검증 결과 계산 (memoized)
  const coupangValidation = useMemo(
    () =>
      validateCoupang(
        formData,
        platformSettings,
        platformSpecificData,
        thumbnailUrl,
        images,
        coupangSettingsConfigured
      ),
    [formData, platformSettings, platformSpecificData, thumbnailUrl, images, coupangSettingsConfigured]
  );

  const naverValidation = useMemo(
    () =>
      validateNaver(
        formData,
        platformSettings,
        platformSpecificData,
        thumbnailUrl,
        images,
        naverSettingsConfigured
      ),
    [formData, platformSettings, platformSpecificData, thumbnailUrl, images, naverSettingsConfigured]
  );

  const shopValidation = useMemo(
    () => validateShop(formData, thumbnailUrl, images),
    [formData, thumbnailUrl, images]
  );

  // 특정 플랫폼 등록 가능 여부
  const canRegister = (platform: string): boolean => {
    if (!selectedPlatforms.includes(platform)) return false;

    switch (platform) {
      case 'COUPANG':
        return coupangValidation.isValid;
      case 'NAVER':
        return naverValidation.isValid;
      case 'SHOP':
        return shopValidation.isValid;
      default:
        return false;
    }
  };

  // 선택된 모든 플랫폼 등록 가능 여부
  const canRegisterAll = (): boolean => {
    return selectedPlatforms.every(platform => canRegister(platform));
  };

  // 탭 배지 상태 결정
  const getTabBadge = (platform: string): 'success' | 'warning' | 'error' | undefined => {
    let validation: ValidationResult;

    switch (platform) {
      case 'COUPANG':
        validation = coupangValidation;
        break;
      case 'NAVER':
        validation = naverValidation;
        break;
      case 'SHOP':
        validation = shopValidation;
        break;
      default:
        return undefined;
    }

    if (validation.missingFields.length > 0) {
      return 'error';
    }
    if (validation.warnings.length > 0) {
      return 'warning';
    }
    return 'success';
  };

  return {
    coupang: coupangValidation,
    naver: naverValidation,
    shop: shopValidation,
    canRegister,
    canRegisterAll,
    getTabBadge,
  };
}
