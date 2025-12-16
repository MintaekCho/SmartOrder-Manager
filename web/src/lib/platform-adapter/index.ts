/**
 * 플랫폼 어댑터 모듈
 * 멀티 플랫폼 상품 등록을 위한 통합 인터페이스 제공
 */

export * from './types';
export * from './coupang-adapter';
export * from './naver-adapter';

import { getCoupangAdapter, CoupangAdapter } from './coupang-adapter';
import { getNaverAdapter, NaverAdapter } from './naver-adapter';
import type {
  Platform,
  IPlatformAdapter,
  UnifiedProduct,
  PlatformConfig,
  PlatformUploadResult,
} from './types';

// 플랫폼별 어댑터 팩토리
export function getPlatformAdapter(platform: Platform): IPlatformAdapter {
  switch (platform) {
    case 'COUPANG':
      return getCoupangAdapter();
    case 'NAVER':
      return getNaverAdapter();
    case 'SHOP':
      throw new Error('자사몰은 직접 DB 저장으로 처리됩니다.');
    default:
      throw new Error(`지원하지 않는 플랫폼: ${platform}`);
  }
}

// 모든 플랫폼 어댑터 가져오기
export function getAllPlatformAdapters(): IPlatformAdapter[] {
  return [getCoupangAdapter(), getNaverAdapter()];
}

/**
 * 멀티 플랫폼 상품 업로드 서비스
 */
export class MultiPlatformUploadService {
  /**
   * 여러 플랫폼에 상품 일괄 등록
   */
  async uploadToMultiplePlatforms(
    product: UnifiedProduct,
    platforms: { platform: Platform; config: PlatformConfig }[]
  ): Promise<Map<Platform, PlatformUploadResult>> {
    const results = new Map<Platform, PlatformUploadResult>();

    // 병렬 등록 실행
    const uploadPromises = platforms.map(async ({ platform, config }) => {
      try {
        const adapter = getPlatformAdapter(platform);
        const result = await adapter.uploadProduct(product, config);
        return { platform, result };
      } catch (error) {
        return {
          platform,
          result: {
            success: false,
            platform,
            error: error instanceof Error ? error.message : String(error),
          } as PlatformUploadResult,
        };
      }
    });

    const uploadResults = await Promise.allSettled(uploadPromises);

    uploadResults.forEach((settled) => {
      if (settled.status === 'fulfilled') {
        results.set(settled.value.platform, settled.value.result);
      }
    });

    return results;
  }

  /**
   * 플랫폼 설정 상태 확인
   */
  async checkPlatformConfigurations(): Promise<Map<Platform, boolean>> {
    const status = new Map<Platform, boolean>();

    status.set('COUPANG', await getCoupangAdapter().isConfigured());
    status.set('NAVER', getNaverAdapter().isConfigured());
    status.set('SHOP', true); // 자사몰은 항상 사용 가능

    return status;
  }

  /**
   * 카테고리 매핑 조회 (내부 카테고리 → 플랫폼별 카테고리)
   */
  async getCategoryMappings(
    internalCategoryCode: string
  ): Promise<Map<Platform, { code: string; name: string } | null>> {
    // TODO: DB에서 카테고리 매핑 조회
    const mappings = new Map<Platform, { code: string; name: string } | null>();

    mappings.set('COUPANG', null);
    mappings.set('NAVER', null);
    mappings.set('SHOP', { code: internalCategoryCode, name: '' });

    return mappings;
  }
}

// 싱글톤 서비스
let uploadServiceInstance: MultiPlatformUploadService | null = null;

export function getMultiPlatformUploadService(): MultiPlatformUploadService {
  if (!uploadServiceInstance) {
    uploadServiceInstance = new MultiPlatformUploadService();
  }
  return uploadServiceInstance;
}
