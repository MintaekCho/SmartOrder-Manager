import crypto from 'crypto';
import { config } from 'dotenv';

config();

const COUPANG_API_URL = 'https://api-gateway.coupang.com';

function generateSignature(method, path, query, datetime, secretKey) {
  const message = datetime + method + path + query;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
  return signature;
}

function generateAuthorization(accessKey, signature, datetime) {
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

function getFormattedDatetime() {
  const now = new Date();
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

async function testOutboundAPI() {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  const vendorId = process.env.COUPANG_VENDOR_ID;

  console.log('=== 환경변수 확인 ===');
  console.log('VendorId:', vendorId);
  console.log('AccessKey:', accessKey ? `${accessKey.substring(0, 10)}...` : '없음');
  console.log('SecretKey:', secretKey ? '설정됨' : '없음');

  if (!accessKey || !secretKey) {
    console.error('API 키가 설정되지 않았습니다.');
    return;
  }

  // 새 API 경로
  const path = '/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound';
  const queryString = 'pageNum=1&pageSize=50';
  const datetime = getFormattedDatetime();

  const signature = generateSignature('GET', path, queryString, datetime, secretKey);
  const authorization = generateAuthorization(accessKey, signature, datetime);

  const fullUrl = `${COUPANG_API_URL}${path}?${queryString}`;

  console.log('\n=== API 요청 정보 ===');
  console.log('URL:', fullUrl);
  console.log('Datetime:', datetime);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Requested-By': accessKey,
      },
    });

    console.log('\n=== 응답 ===');
    console.log('Status:', response.status);

    const text = await response.text();
    console.log('Body:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n=== 파싱된 데이터 ===');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('요청 실패:', error);
  }
}

testOutboundAPI();
