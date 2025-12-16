import { createCoupangClient } from '../src/lib/coupang/client';

async function testShipping() {
  const vendorId = process.env.COUPANG_VENDOR_ID;
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;

  console.log('VendorId:', vendorId);
  console.log('AccessKey:', accessKey ? '설정됨' : '없음');
  console.log('SecretKey:', secretKey ? '설정됨' : '없음');

  if (!vendorId || !accessKey || !secretKey) {
    console.error('COUPANG_VENDOR_ID, COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY가 모두 설정되어야 합니다.');
    return;
  }

  // 테스트용으로 직접 클라이언트 생성 (환경변수 사용)
  const client = createCoupangClient({ accessKey, secretKey });

  console.log('\n=== 출고지 조회 테스트 ===');
  try {
    const outboundRes = await client.getOutboundShippingPlaces(vendorId, 1, 50);
    console.log('출고지 응답:', JSON.stringify(outboundRes, null, 2));
  } catch (error) {
    console.error('출고지 조회 실패:', error);
  }

  console.log('\n=== 반품지 조회 테스트 ===');
  try {
    const returnRes = await client.getReturnShippingCenters(vendorId, 1, 50);
    console.log('반품지 응답:', JSON.stringify(returnRes, null, 2));
  } catch (error) {
    console.error('반품지 조회 실패:', error);
  }
}

testShipping();
