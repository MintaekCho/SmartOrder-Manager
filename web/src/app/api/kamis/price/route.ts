import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * KAMIS 농산물 가격정보 API
 * GET /api/kamis/price?category=100&itemCode=111&kindCode=01
 *
 * KAMIS Open API 문서: https://www.kamis.or.kr/customer/reference/openapi_list.do
 *
 * 환경변수 필요:
 * KAMIS_API_KEY - KAMIS에서 발급받은 API 인증키
 * KAMIS_CERT_ID - KAMIS에서 발급받은 인증 ID
 */

interface KamisPriceItem {
  itemName: string;
  kindName: string;
  rank: string; // 등급: 상품, 중품 등
  unit: string;
  price: string;
  direction: string; // 1: 상승, -1: 하락, 0: 보합
  value: string; // 등락율
}

interface KamisResponse {
  success: boolean;
  data?: {
    price: KamisPriceItem[];
  };
  error?: string;
}

// KAMIS 품목 카테고리
const KAMIS_CATEGORIES: Record<string, string> = {
  '100': '식량작물',
  '200': '채소류',
  '300': '특용작물',
  '400': '과일류',
  '500': '축산물',
  '600': '수산물',
};

// 주요 품목 코드 (일부)
const POPULAR_ITEMS = [
  { category: '400', itemCode: '411', name: '사과' },
  { category: '400', itemCode: '412', name: '배' },
  { category: '400', itemCode: '418', name: '감귤' },
  { category: '400', itemCode: '420', name: '딸기' },
  { category: '200', itemCode: '211', name: '배추' },
  { category: '200', itemCode: '214', name: '무' },
  { category: '200', itemCode: '246', name: '토마토' },
  { category: '200', itemCode: '223', name: '양파' },
  { category: '500', itemCode: '511', name: '소' },
  { category: '500', itemCode: '512', name: '돼지' },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || '400'; // 기본: 과일류
  const productClass = searchParams.get('productClass') || '01'; // 01: 소매, 02: 도매

  const apiKey = process.env.KAMIS_API_KEY;
  const certId = process.env.KAMIS_CERT_ID;

  // API 키가 없으면 안내 메시지 반환
  if (!apiKey || !certId) {
    return NextResponse.json({
      success: false,
      error: 'KAMIS API 키가 설정되지 않았습니다.',
      info: 'KAMIS_API_KEY와 KAMIS_CERT_ID를 .env 파일에 설정해주세요.',
      guide: 'https://www.kamis.or.kr 에서 회원가입 후 Open API 신청',
      categories: KAMIS_CATEGORIES,
      popularItems: POPULAR_ITEMS,
    });
  }

  try {
    // KAMIS 일별 품목별 도소매가격 API
    const today = new Date();
    const regDay = today.toISOString().split('T')[0].replace(/-/g, '-');

    const params = new URLSearchParams({
      action: 'dailyPriceByCategoryList',
      p_product_cls_code: productClass,
      p_item_category_code: category,
      p_country_code: '',
      p_regday: regDay,
      p_convert_kg_yn: 'N',
      p_cert_key: apiKey,
      p_cert_id: certId,
      p_returntype: 'json',
    });

    const apiUrl = `https://www.kamis.or.kr/service/price/xml.do?${params}`;
    console.log('[KAMIS API] Requesting:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`KAMIS API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    // KAMIS API 응답 파싱
    if (data.data?.error_code === '000') {
      // 성공
      const items = data.data.item || [];
      const priceList: KamisPriceItem[] = items.map((item: any) => ({
        itemName: item.item_name || '',
        kindName: item.kind_name || '',
        rank: item.rank || '', // 등급: 상품, 중품
        unit: item.unit || '',
        price: item.dpr1 || '0', // 당일 가격
        direction: item.direction || '0',
        value: item.value || '0',
      }));

      return NextResponse.json({
        success: true,
        source: 'kamis-api',
        data: {
          date: regDay,
          category: KAMIS_CATEGORIES[category] || category,
          productClass: productClass === '01' ? '소매' : '도매',
          items: priceList,
        },
      });
    } else {
      // API 에러
      return NextResponse.json({
        success: false,
        error: data.data?.error_code || 'API 응답 오류',
        message: data.data?.error_message || '알 수 없는 오류',
      });
    }
  } catch (error) {
    console.error('[KAMIS API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'KAMIS API 호출 실패',
    });
  }
}
