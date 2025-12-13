import { getCoupangClient } from '../src/lib/coupang/client';

async function testShipping() {
  const vendorId = process.env.COUPANG_VENDOR_ID;
  console.log('VendorId:', vendorId);
  console.log('AccessKey:', process.env.COUPANG_ACCESS_KEY ? '설정됨' : '없음');
  console.log('SecretKey:', process.env.COUPANG_SECRET_KEY ? '설정됨' : '없음');
  
  if (!vendorId) {
    console.error('COUPANG_VENDOR_ID가 설정되지 않았습니다.');
    return;
  }

  const client = getCoupangClient();

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
