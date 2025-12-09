import { SubscriptionPlan } from '@prisma/client';

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

export interface Plan {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number; // 월 요금 (원)
  yearlyPrice?: number; // 연간 요금 (원)
  features: PlanFeature[];
  limits: {
    productsPerMonth: number; // 월 등록 가능 상품 수
    ordersPerMonth: number; // 월 관리 가능 주문 수
    aiGenerations: number; // AI 이미지 생성 횟수
    suppliers: number; // 등록 가능 공급처 수
  };
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Free',
    description: '쿠팡 판매를 시작하는 분들을 위한 무료 플랜',
    price: 0,
    features: [
      { name: '상품 등록', included: true, limit: '월 10개' },
      { name: '주문 관리', included: true, limit: '월 50건' },
      { name: '기본 통계', included: true },
      { name: '공급처 관리', included: true, limit: '3개' },
      { name: '트렌드 분석', included: false },
      { name: 'AI 상세페이지', included: false },
      { name: 'AI 썸네일 생성', included: false },
      { name: '고급 리포트', included: false },
      { name: '우선 지원', included: false },
    ],
    limits: {
      productsPerMonth: 10,
      ordersPerMonth: 50,
      aiGenerations: 0,
      suppliers: 3,
    },
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    description: '본격적인 쿠팡 사업을 위한 프리미엄 플랜',
    price: 49900,
    yearlyPrice: 479000, // 연 구독 시 약 20% 할인
    features: [
      { name: '상품 등록', included: true, limit: '무제한' },
      { name: '주문 관리', included: true, limit: '무제한' },
      { name: '기본 통계', included: true },
      { name: '공급처 관리', included: true, limit: '무제한' },
      { name: '트렌드 분석', included: true },
      { name: 'AI 상세페이지', included: true },
      { name: 'AI 썸네일 생성', included: true, limit: '월 100회' },
      { name: '고급 리포트', included: true },
      { name: '우선 지원', included: true },
    ],
    limits: {
      productsPerMonth: -1, // -1 = 무제한
      ordersPerMonth: -1,
      aiGenerations: 100,
      suppliers: -1,
    },
    popular: true,
  },
];

export function getPlan(planId: SubscriptionPlan): Plan | undefined {
  return PLANS.find((p) => p.id === planId);
}

export function canAccessFeature(
  plan: SubscriptionPlan,
  feature: string
): boolean {
  const planData = getPlan(plan);
  if (!planData) return false;

  const featureData = planData.features.find((f) => f.name === feature);
  return featureData?.included ?? false;
}

export function isWithinLimit(
  plan: SubscriptionPlan,
  limitType: keyof Plan['limits'],
  currentCount: number
): boolean {
  const planData = getPlan(plan);
  if (!planData) return false;

  const limit = planData.limits[limitType];
  if (limit === -1) return true; // 무제한
  return currentCount < limit;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price);
}
