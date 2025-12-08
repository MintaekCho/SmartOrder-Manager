// 도매꾹 크롤러 (구현 예정)
// Playwright 설치 후 실제 크롤링 구현

import { BaseCrawler } from './base';
import type {
  SearchParams,
  SearchResult,
  SupplierProductDetail,
} from './types';

/**
 * 도매꾹 크롤러
 *
 * 도매꾹(domeggook.com)은 국내 최대 도매 플랫폼
 * - 회원가입 필요 (사업자/개인 모두 가능)
 * - 가격 조회는 로그인 없이 가능
 * - 주문은 로그인 필요
 *
 * 주의사항:
 * - robots.txt 및 이용약관 확인 필요
 * - 과도한 요청 자제 (Rate Limiting 고려)
 */
export class DomeggookCrawler extends BaseCrawler {
  readonly name = '도매꾹';
  readonly code = 'DOMEGGOOK';
  readonly baseUrl = 'https://domeggook.com';

  async search(params: SearchParams): Promise<SearchResult> {
    // TODO: Playwright로 실제 크롤링 구현
    // 1. 검색 페이지 접속
    // 2. 검색어 입력 및 검색
    // 3. 상품 목록 파싱
    // 4. 페이지네이션 처리

    console.log(`[도매꾹] 검색: ${params.query}`);

    // 임시 반환 (개발 중)
    return {
      items: [],
      total: 0,
      page: params.page || 1,
      hasMore: false,
    };
  }

  async getProduct(productId: string): Promise<SupplierProductDetail> {
    // TODO: 상품 상세 페이지 크롤링
    // 1. 상품 상세 페이지 접속
    // 2. 상품명, 가격, 이미지, 옵션 파싱
    // 3. 상세 설명 (iframe 내 HTML) 파싱

    console.log(`[도매꾹] 상품 조회: ${productId}`);

    throw new Error('Not implemented');
  }

  // 로그인 구현 (선택적)
  async login(credentials: { username: string; password: string }): Promise<boolean> {
    // TODO: 로그인 구현
    console.log(`[도매꾹] 로그인 시도: ${credentials.username}`);
    return false;
  }
}

/**
 * 도매꾹 URL 패턴
 *
 * 검색: https://domeggook.com/main/item/search.php?keyword={검색어}
 * 상품: https://domeggook.com/main/item/itemView.php?t=0&s=14&i={상품ID}
 * 카테고리: https://domeggook.com/main/item/itemList.php?c={카테고리ID}
 */
