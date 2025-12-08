/**
 * 상세페이지 자동 생성기
 *
 * 도매처에서 가져온 상품 정보를 바탕으로
 * 쿠팡용 상세페이지 HTML을 자동 생성합니다.
 */

import { WholesaleProduct } from '../crawler/domeggook-crawler';

export interface DetailPageConfig {
  template: 'basic' | 'premium' | 'minimal';
  showOrigin: boolean;
  showSeller: boolean;
  showShippingInfo: boolean;
  additionalInfo?: string;
  brandName?: string;
}

export interface GeneratedDetailPage {
  html: string;
  preview: string;
  images: string[];
}

/**
 * 상세페이지 HTML 생성
 */
export function generateDetailPage(
  product: WholesaleProduct,
  config: DetailPageConfig = {
    template: 'basic',
    showOrigin: true,
    showSeller: false,
    showShippingInfo: true,
  }
): GeneratedDetailPage {
  const { template } = config;

  switch (template) {
    case 'premium':
      return generatePremiumTemplate(product, config);
    case 'minimal':
      return generateMinimalTemplate(product, config);
    default:
      return generateBasicTemplate(product, config);
  }
}

/**
 * 기본 템플릿
 */
function generateBasicTemplate(
  product: WholesaleProduct,
  config: DetailPageConfig
): GeneratedDetailPage {
  const html = `
<div style="max-width: 860px; margin: 0 auto; font-family: 'Noto Sans KR', sans-serif; color: #333;">
  <!-- 헤더 배너 -->
  <div style="background: linear-gradient(135deg, #4AC1E0 0%, #2E9BBF 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
    <h1 style="color: white; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">${product.name}</h1>
    ${config.showOrigin && product.origin ? `<p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">원산지: ${product.origin}</p>` : ''}
  </div>

  <!-- 상품 이미지 -->
  <div style="margin-bottom: 30px;">
    <img src="${product.thumbnailUrl}" alt="${product.name}" style="width: 100%; max-width: 600px; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
  </div>

  <!-- 상품 설명 -->
  <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
    <h2 style="font-size: 20px; color: #2c3e50; margin: 0 0 15px 0; border-bottom: 2px solid #4AC1E0; padding-bottom: 10px;">상품 설명</h2>
    <p style="font-size: 16px; line-height: 1.8; color: #555; margin: 0;">${product.description || '신선하고 맛있는 농수산물입니다.'}</p>
  </div>

  <!-- 상품 정보 -->
  <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
    <h2 style="font-size: 20px; color: #2c3e50; margin: 0 0 20px 0;">상품 정보</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; font-weight: 600; color: #666; width: 120px;">상품명</td>
        <td style="padding: 12px 0; color: #333;">${product.name}</td>
      </tr>
      ${config.showOrigin && product.origin ? `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; font-weight: 600; color: #666;">원산지</td>
        <td style="padding: 12px 0; color: #333;">${product.origin}</td>
      </tr>
      ` : ''}
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; font-weight: 600; color: #666;">카테고리</td>
        <td style="padding: 12px 0; color: #333;">${product.category}</td>
      </tr>
    </table>
  </div>

  ${config.showShippingInfo ? `
  <!-- 배송 안내 -->
  <div style="background: #fff3e0; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
    <h2 style="font-size: 18px; color: #e65100; margin: 0 0 15px 0;">배송 안내</h2>
    <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
      <li>산지에서 직접 발송되어 신선하게 받아보실 수 있습니다.</li>
      <li>기상 상황에 따라 배송이 지연될 수 있습니다.</li>
      <li>냉장/냉동 상품은 아이스박스 포장으로 발송됩니다.</li>
    </ul>
  </div>
  ` : ''}

  <!-- 교환/반품 안내 -->
  <div style="background: #f5f5f5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
    <h2 style="font-size: 18px; color: #333; margin: 0 0 15px 0;">교환/반품 안내</h2>
    <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8; font-size: 14px;">
      <li>상품 수령 후 24시간 이내 사진과 함께 문의해 주세요.</li>
      <li>단순 변심에 의한 교환/반품은 불가합니다.</li>
      <li>농수산물 특성상 자연적인 크기/모양 차이는 교환 사유가 아닙니다.</li>
    </ul>
  </div>

  ${config.additionalInfo ? `
  <!-- 추가 정보 -->
  <div style="background: #e8f5e9; border-radius: 12px; padding: 25px;">
    <p style="margin: 0; color: #2e7d32; line-height: 1.6;">${config.additionalInfo}</p>
  </div>
  ` : ''}
</div>
`;

  return {
    html,
    preview: html,
    images: [product.thumbnailUrl, ...(product.detailImages || [])],
  };
}

/**
 * 프리미엄 템플릿 (더 화려한 디자인)
 */
function generatePremiumTemplate(
  product: WholesaleProduct,
  config: DetailPageConfig
): GeneratedDetailPage {
  const html = `
<div style="max-width: 900px; margin: 0 auto; font-family: 'Noto Sans KR', sans-serif;">
  <!-- 프리미엄 헤더 -->
  <div style="position: relative; overflow: hidden; border-radius: 16px; margin-bottom: 40px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 30px; text-align: center;">
      <span style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; margin-bottom: 15px;">PREMIUM QUALITY</span>
      <h1 style="color: white; font-size: 32px; margin: 0 0 15px 0; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${product.name}</h1>
      ${product.origin ? `<p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0;"><span style="margin-right: 8px;">📍</span>${product.origin} 직송</p>` : ''}
    </div>
  </div>

  <!-- 메인 이미지 갤러리 -->
  <div style="margin-bottom: 40px; text-align: center;">
    <img src="${product.thumbnailUrl}" alt="${product.name}" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" />
  </div>

  ${product.detailImages && product.detailImages.length > 0 ? `
  <div style="display: flex; gap: 15px; margin-bottom: 40px; overflow-x: auto; padding: 10px 0;">
    ${product.detailImages.map(img => `
      <img src="${img}" alt="상세 이미지" style="width: 200px; height: 200px; object-fit: cover; border-radius: 12px; flex-shrink: 0;" />
    `).join('')}
  </div>
  ` : ''}

  <!-- 상품 특징 카드 -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 16px; text-align: center; color: white;">
      <div style="font-size: 32px; margin-bottom: 10px;">🌿</div>
      <div style="font-weight: 700; font-size: 16px;">신선함</div>
      <div style="font-size: 13px; opacity: 0.9; margin-top: 5px;">산지 직송</div>
    </div>
    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 25px; border-radius: 16px; text-align: center; color: white;">
      <div style="font-size: 32px; margin-bottom: 10px;">✨</div>
      <div style="font-weight: 700; font-size: 16px;">프리미엄</div>
      <div style="font-size: 13px; opacity: 0.9; margin-top: 5px;">엄선된 품질</div>
    </div>
    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 25px; border-radius: 16px; text-align: center; color: white;">
      <div style="font-size: 32px; margin-bottom: 10px;">🚚</div>
      <div style="font-weight: 700; font-size: 16px;">빠른배송</div>
      <div style="font-size: 13px; opacity: 0.9; margin-top: 5px;">냉장 포장</div>
    </div>
  </div>

  <!-- 상품 설명 -->
  <div style="background: #f8f9fa; padding: 40px; border-radius: 16px; margin-bottom: 40px;">
    <h2 style="font-size: 24px; color: #333; margin: 0 0 20px 0; text-align: center;">🍀 상품 소개</h2>
    <p style="font-size: 17px; line-height: 2; color: #555; text-align: center; max-width: 600px; margin: 0 auto;">${product.description || '엄선된 최상급 농수산물을 산지에서 직접 배송해 드립니다.'}</p>
  </div>

  <!-- 상품 정보 테이블 -->
  <div style="background: white; border: 2px solid #eee; border-radius: 16px; padding: 30px; margin-bottom: 40px;">
    <h2 style="font-size: 20px; color: #333; margin: 0 0 25px 0; padding-bottom: 15px; border-bottom: 2px solid #eee;">📋 상품 정보</h2>
    <div style="display: grid; gap: 15px;">
      <div style="display: flex; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <span style="width: 120px; font-weight: 600; color: #666;">상품명</span>
        <span style="color: #333;">${product.name}</span>
      </div>
      ${product.origin ? `
      <div style="display: flex; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <span style="width: 120px; font-weight: 600; color: #666;">원산지</span>
        <span style="color: #333;">${product.origin}</span>
      </div>
      ` : ''}
      <div style="display: flex; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <span style="width: 120px; font-weight: 600; color: #666;">카테고리</span>
        <span style="color: #333;">${product.category}</span>
      </div>
    </div>
  </div>

  <!-- 배송 안내 -->
  <div style="background: linear-gradient(135deg, #fff6e5 0%, #ffe4c4 100%); border-radius: 16px; padding: 30px; margin-bottom: 40px;">
    <h2 style="font-size: 20px; color: #e65100; margin: 0 0 20px 0;">🚚 배송 안내</h2>
    <div style="display: grid; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: #e65100;">✓</span>
        <span style="color: #555;">산지에서 직접 발송 - 가장 신선한 상태로 배송</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: #e65100;">✓</span>
        <span style="color: #555;">냉장/냉동 상품 아이스박스 포장</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: #e65100;">✓</span>
        <span style="color: #555;">기상 상황에 따라 배송일이 변경될 수 있습니다</span>
      </div>
    </div>
  </div>
</div>
`;

  return {
    html,
    preview: html,
    images: [product.thumbnailUrl, ...(product.detailImages || [])],
  };
}

/**
 * 미니멀 템플릿 (간단한 디자인)
 */
function generateMinimalTemplate(
  product: WholesaleProduct,
  config: DetailPageConfig
): GeneratedDetailPage {
  const html = `
<div style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #333; padding: 20px;">
  <!-- 상품 이미지 -->
  <img src="${product.thumbnailUrl}" alt="${product.name}" style="width: 100%; margin-bottom: 30px;" />

  <!-- 상품명 -->
  <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 10px 0;">${product.name}</h1>
  ${product.origin ? `<p style="color: #888; font-size: 14px; margin: 0 0 30px 0;">원산지: ${product.origin}</p>` : ''}

  <!-- 구분선 -->
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

  <!-- 상품 설명 -->
  <p style="font-size: 15px; line-height: 1.8; color: #555;">${product.description || '신선한 농수산물입니다.'}</p>

  <!-- 구분선 -->
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

  <!-- 배송 안내 -->
  <div style="background: #f9f9f9; padding: 20px; margin-top: 20px;">
    <p style="font-weight: 600; margin: 0 0 10px 0;">배송 안내</p>
    <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.6;">
      • 산지 직송으로 배송됩니다.<br/>
      • 신선 상품은 아이스박스 포장됩니다.
    </p>
  </div>
</div>
`;

  return {
    html,
    preview: html,
    images: [product.thumbnailUrl],
  };
}

/**
 * 상세페이지 미리보기 HTML (iframe용)
 */
export function getPreviewHtml(html: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #fff; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
`;
}

/**
 * 도매처 상세페이지 이미지 기반 HTML 생성
 * 실제 위탁판매에서는 이 방식을 사용해야 함
 */
export interface WholesaleDetailData {
  detailImages: string[];  // 도매처에서 크롤링한 상세 이미지들
  detailHtml?: string;     // 도매처의 원본 HTML (있는 경우)
  description?: string;    // 상품 설명
}

export function generateFromWholesaleImages(
  product: WholesaleProduct,
  wholesaleDetail: WholesaleDetailData,
  options: {
    addHeader?: boolean;      // 상단 헤더 추가 여부
    addShippingInfo?: boolean; // 배송 안내 추가 여부
    addReturnPolicy?: boolean; // 교환/반품 안내 추가 여부
  } = {}
): GeneratedDetailPage {
  const {
    addHeader = true,
    addShippingInfo = true,
    addReturnPolicy = true,
  } = options;

  // 상세 이미지들을 이어붙여 HTML 생성
  const imagesHtml = wholesaleDetail.detailImages
    .map((imgUrl, index) => `
      <img
        src="${imgUrl}"
        alt="${product.name} 상세 이미지 ${index + 1}"
        style="width: 100%; display: block; margin: 0 auto;"
      />
    `)
    .join('\n');

  const html = `
<div style="max-width: 860px; margin: 0 auto; font-family: 'Noto Sans KR', sans-serif; color: #333;">
  ${addHeader ? `
  <!-- 상단 헤더 (선택사항) -->
  <div style="background: linear-gradient(135deg, #4AC1E0 0%, #2E9BBF 100%); padding: 30px 20px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; font-size: 24px; margin: 0 0 8px 0; font-weight: 700;">${product.name}</h1>
    ${product.origin ? `<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">원산지: ${product.origin}</p>` : ''}
  </div>
  ` : ''}

  <!-- 도매처 상세 이미지 (핵심!) -->
  <div style="margin-bottom: 30px;">
    ${imagesHtml || `
      <div style="padding: 40px; text-align: center; background: #f5f5f5; color: #999;">
        상세 이미지가 없습니다.
      </div>
    `}
  </div>

  ${addShippingInfo ? `
  <!-- 배송 안내 -->
  <div style="background: #fff3e0; padding: 20px; margin-bottom: 20px;">
    <h3 style="font-size: 16px; color: #e65100; margin: 0 0 12px 0;">배송 안내</h3>
    <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.6; font-size: 14px;">
      <li>산지에서 직접 발송됩니다.</li>
      <li>신선식품은 아이스박스 포장으로 발송됩니다.</li>
      <li>기상 상황에 따라 배송이 지연될 수 있습니다.</li>
    </ul>
  </div>
  ` : ''}

  ${addReturnPolicy ? `
  <!-- 교환/반품 안내 -->
  <div style="background: #f5f5f5; padding: 20px;">
    <h3 style="font-size: 16px; color: #333; margin: 0 0 12px 0;">교환/반품 안내</h3>
    <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6; font-size: 14px;">
      <li>상품 수령 후 24시간 이내 사진과 함께 문의해 주세요.</li>
      <li>단순 변심에 의한 교환/반품은 불가합니다.</li>
      <li>농수산물 특성상 자연적인 크기/모양 차이는 교환 사유가 아닙니다.</li>
    </ul>
  </div>
  ` : ''}
</div>
`;

  return {
    html,
    preview: html,
    images: [product.thumbnailUrl, ...wholesaleDetail.detailImages],
  };
}

/**
 * 도매처 원본 HTML을 그대로 사용 (가장 간단한 방식)
 */
export function useWholesaleHtmlDirectly(
  wholesaleHtml: string,
  product: WholesaleProduct,
  addWrapper: boolean = true
): GeneratedDetailPage {
  const html = addWrapper
    ? `
<div style="max-width: 860px; margin: 0 auto;">
  <!-- 도매처 원본 상세페이지 -->
  ${wholesaleHtml}

  <!-- 추가 안내 -->
  <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; font-size: 14px; color: #666;">
    <p style="margin: 0;">※ 본 상품은 산지에서 직접 발송됩니다.</p>
  </div>
</div>
`
    : wholesaleHtml;

  return {
    html,
    preview: html,
    images: [product.thumbnailUrl],
  };
}
