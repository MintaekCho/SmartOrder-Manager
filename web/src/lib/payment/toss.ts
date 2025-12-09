// 토스페이먼츠 결제 유틸리티

const TOSS_API_URL = 'https://api.tosspayments.com/v1';

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  totalAmount: number;
  card?: {
    company: string;
    number: string;
  };
  requestedAt: string;
  approvedAt: string;
}

interface TossBillingResponse {
  billingKey: string;
  customerKey: string;
  cardCompany: string;
  cardNumber: string;
}

// 기본 인증 헤더 생성
function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not configured');
  }
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

// 일반 결제 승인
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Payment confirmation failed');
  }

  return response.json();
}

// 빌링키 발급 (정기결제용)
export async function issueBillingKey(
  authKey: string,
  customerKey: string
): Promise<TossBillingResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/authorizations/issue`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authKey,
      customerKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Billing key issuance failed');
  }

  return response.json();
}

// 빌링키로 자동결제
export async function chargeBilling(
  billingKey: string,
  customerKey: string,
  amount: number,
  orderId: string,
  orderName: string
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Billing charge failed');
  }

  return response.json();
}

// 결제 취소
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Payment cancellation failed');
  }

  return response.json();
}

// 결제 조회
export async function getPayment(paymentKey: string): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get payment');
  }

  return response.json();
}

// 주문 ID 생성
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `order_${timestamp}_${randomStr}`;
}
