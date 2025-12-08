// 크롤러 모듈 진입점

export * from './types';
export * from './base';
export { DomeggookCrawler } from './domeggook';

import { MockCrawler } from './base';
import { DomeggookCrawler } from './domeggook';
import type { SupplierAdapter } from './types';

// 도매처 크롤러 레지스트리
const crawlerRegistry: Record<string, () => SupplierAdapter> = {
  MOCK: () => new MockCrawler(),
  DOMEGGOOK: () => new DomeggookCrawler(),
  // 추후 추가 예정:
  // DOMEMAE: () => new DomemaeCrawler(),
  // OWNERCLAN: () => new OwnerClanCrawler(),
};

/**
 * 도매처 코드로 크롤러 인스턴스 생성
 */
export function getCrawler(supplierCode: string): SupplierAdapter {
  const factory = crawlerRegistry[supplierCode.toUpperCase()];
  if (!factory) {
    throw new Error(`Unknown supplier: ${supplierCode}`);
  }
  return factory();
}

/**
 * 등록된 모든 도매처 목록
 */
export function getAvailableSuppliers(): { code: string; name: string }[] {
  return [
    { code: 'DOMEGGOOK', name: '도매꾹' },
    // { code: 'DOMEMAE', name: '도매매' },
    // { code: 'OWNERCLAN', name: '오너클랜' },
  ];
}
