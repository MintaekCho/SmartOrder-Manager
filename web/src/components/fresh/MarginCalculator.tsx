'use client';

import { useState, useMemo } from 'react';
import { Card, Input, Select, Button } from '@/components/ui';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';

// 배송 타입별 비용
const SHIPPING_COSTS = {
  cold: { name: '냉장 배송', base: 4000, perKg: 500 },
  frozen: { name: '냉동 배송', base: 5000, perKg: 600 },
  normal: { name: '일반 배송', base: 3000, perKg: 300 },
};

// 포장재 비용
const PACKAGING_COSTS = {
  styrofoam: { name: '스티로폼 박스', cost: 1500 },
  paper: { name: '종이 박스', cost: 800 },
  ice: { name: '아이스팩 (개당)', cost: 300 },
};

// 카테고리별 쿠팡 수수료율
const COMMISSION_RATES: Record<string, number> = {
  fruits: 10.8,
  vegetables: 10.8,
  seafood: 10.8,
  meat: 10.8,
  default: 10.8,
};

interface MarginResult {
  revenue: number;           // 판매 수익
  totalCost: number;         // 총 비용
  profit: number;            // 순이익
  marginRate: number;        // 마진율
  breakEvenPrice: number;    // 손익분기 가격
  recommendedPrice: number;  // 권장 판매가
  riskLevel: 'low' | 'medium' | 'high';
}

interface MarginCalculatorProps {
  initialValues?: {
    wholesalePrice?: number;
    weight?: number;
    category?: string;
  };
  onCalculate?: (result: MarginResult) => void;
}

export default function MarginCalculator({ initialValues, onCalculate }: MarginCalculatorProps) {
  const [inputs, setInputs] = useState({
    wholesalePrice: initialValues?.wholesalePrice?.toString() || '',
    sellingPrice: '',
    weight: initialValues?.weight?.toString() || '1',
    shippingType: 'cold',
    packagingType: 'styrofoam',
    icePackCount: '2',
    category: initialValues?.category || 'fruits',
    targetMargin: '20',
  });

  const updateInput = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const calculation = useMemo((): MarginResult | null => {
    const wholesalePrice = parseFloat(inputs.wholesalePrice) || 0;
    const sellingPrice = parseFloat(inputs.sellingPrice) || 0;
    const weight = parseFloat(inputs.weight) || 1;
    const icePackCount = parseInt(inputs.icePackCount) || 0;

    if (wholesalePrice === 0) return null;

    // 배송비 계산
    const shipping = SHIPPING_COSTS[inputs.shippingType as keyof typeof SHIPPING_COSTS];
    const shippingCost = shipping.base + (weight * shipping.perKg);

    // 포장비 계산
    const packaging = PACKAGING_COSTS[inputs.packagingType as keyof typeof PACKAGING_COSTS];
    const packagingCost = packaging.cost + (icePackCount * PACKAGING_COSTS.ice.cost);

    // 쿠팡 수수료 계산
    const commissionRate = COMMISSION_RATES[inputs.category] || COMMISSION_RATES.default;
    const commission = sellingPrice * (commissionRate / 100);

    // 총 비용
    const totalCost = wholesalePrice + shippingCost + packagingCost + commission;

    // 순이익
    const profit = sellingPrice - totalCost;

    // 마진율
    const marginRate = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    // 손익분기 가격 (수수료 포함 역산)
    const baseCost = wholesalePrice + shippingCost + packagingCost;
    const breakEvenPrice = Math.ceil(baseCost / (1 - commissionRate / 100));

    // 권장 판매가 (목표 마진율 적용)
    const targetMargin = parseFloat(inputs.targetMargin) || 20;
    const recommendedPrice = Math.ceil(baseCost / (1 - (commissionRate + targetMargin) / 100));

    // 리스크 레벨
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (marginRate < 10) riskLevel = 'high';
    else if (marginRate < 15) riskLevel = 'medium';

    const result: MarginResult = {
      revenue: sellingPrice,
      totalCost,
      profit,
      marginRate,
      breakEvenPrice,
      recommendedPrice,
      riskLevel,
    };

    onCalculate?.(result);
    return result;
  }, [inputs, onCalculate]);

  const applyRecommendedPrice = () => {
    if (calculation) {
      updateInput('sellingPrice', calculation.recommendedPrice.toString());
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
    }
  };

  const getRiskText = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return '안전';
      case 'medium': return '주의';
      case 'high': return '위험';
    }
  };

  return (
    <Card
      title="신선식품 마진 계산기"
      subtitle="냉장/냉동 배송비와 포장비를 포함한 정확한 마진 계산"
    >
      <div className="space-y-6">
        {/* 입력 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="도매가 (원)"
            type="number"
            placeholder="0"
            value={inputs.wholesalePrice}
            onChange={(e) => updateInput('wholesalePrice', e.target.value)}
            helperText="도매처 매입 가격"
          />
          <Input
            label="판매가 (원)"
            type="number"
            placeholder="0"
            value={inputs.sellingPrice}
            onChange={(e) => updateInput('sellingPrice', e.target.value)}
            helperText="쿠팡 판매 가격"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="상품 중량 (kg)"
            type="number"
            placeholder="1"
            value={inputs.weight}
            onChange={(e) => updateInput('weight', e.target.value)}
          />
          <Select
            label="카테고리"
            options={[
              { value: 'fruits', label: '과일' },
              { value: 'vegetables', label: '채소' },
              { value: 'seafood', label: '수산물' },
              { value: 'meat', label: '정육' },
            ]}
            value={inputs.category}
            onChange={(e) => updateInput('category', e.target.value)}
          />
          <Input
            label="목표 마진율 (%)"
            type="number"
            placeholder="20"
            value={inputs.targetMargin}
            onChange={(e) => updateInput('targetMargin', e.target.value)}
          />
        </div>

        {/* 배송/포장 설정 */}
        <div className="p-4 bg-[var(--color-gray-50)] rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Info size={16} className="text-[var(--color-gray-500)]" />
            배송 및 포장 설정
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="배송 타입"
              options={[
                { value: 'cold', label: '냉장 배송 (₩4,000~)' },
                { value: 'frozen', label: '냉동 배송 (₩5,000~)' },
                { value: 'normal', label: '일반 배송 (₩3,000~)' },
              ]}
              value={inputs.shippingType}
              onChange={(e) => updateInput('shippingType', e.target.value)}
            />
            <Select
              label="포장재"
              options={[
                { value: 'styrofoam', label: '스티로폼 박스 (₩1,500)' },
                { value: 'paper', label: '종이 박스 (₩800)' },
              ]}
              value={inputs.packagingType}
              onChange={(e) => updateInput('packagingType', e.target.value)}
            />
            <Input
              label="아이스팩 수량"
              type="number"
              placeholder="2"
              value={inputs.icePackCount}
              onChange={(e) => updateInput('icePackCount', e.target.value)}
              helperText="개당 ₩300"
            />
          </div>
        </div>

        {/* 계산 결과 */}
        {calculation && (
          <div className="border-t border-[var(--color-gray-200)] pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calculator size={18} />
                계산 결과
              </h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(calculation.riskLevel)}`}>
                리스크: {getRiskText(calculation.riskLevel)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-[var(--color-gray-50)] rounded-lg text-center">
                <p className="text-sm text-[var(--color-gray-500)] mb-1">총 비용</p>
                <p className="text-lg font-bold text-[var(--color-gray-900)]">
                  {Math.round(calculation.totalCost).toLocaleString()}원
                </p>
              </div>
              <div className="p-4 bg-[var(--color-gray-50)] rounded-lg text-center">
                <p className="text-sm text-[var(--color-gray-500)] mb-1">순이익</p>
                <p className={`text-lg font-bold ${calculation.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.round(calculation.profit).toLocaleString()}원
                </p>
              </div>
              <div className="p-4 bg-[var(--color-gray-50)] rounded-lg text-center">
                <p className="text-sm text-[var(--color-gray-500)] mb-1">마진율</p>
                <p className={`text-lg font-bold flex items-center justify-center gap-1 ${calculation.marginRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculation.marginRate > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {calculation.marginRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-[var(--color-gray-50)] rounded-lg text-center">
                <p className="text-sm text-[var(--color-gray-500)] mb-1">손익분기가</p>
                <p className="text-lg font-bold text-[var(--color-gray-900)]">
                  {calculation.breakEvenPrice.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 권장 가격 */}
            <div className="flex items-center justify-between p-4 bg-[var(--color-primary-50)] rounded-lg">
              <div>
                <p className="text-sm text-[var(--color-primary-600)] mb-1">
                  목표 마진율 {inputs.targetMargin}% 기준 권장 판매가
                </p>
                <p className="text-2xl font-bold text-[var(--color-primary-700)]">
                  {calculation.recommendedPrice.toLocaleString()}원
                </p>
              </div>
              <Button onClick={applyRecommendedPrice} size="sm">
                적용
              </Button>
            </div>

            {/* 경고 메시지 */}
            {calculation.riskLevel === 'high' && (
              <div className="flex items-start gap-2 p-3 mt-4 bg-red-50 rounded-lg">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">마진율이 너무 낮습니다!</p>
                  <p>반품, 환불, 폐기 손실을 고려하면 손해가 발생할 수 있습니다.
                     신선식품은 최소 15% 이상의 마진을 확보하는 것이 권장됩니다.</p>
                </div>
              </div>
            )}

            {calculation.riskLevel === 'medium' && (
              <div className="flex items-start gap-2 p-3 mt-4 bg-yellow-50 rounded-lg">
                <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">마진율을 확인하세요</p>
                  <p>신선식품의 경우 폐기 손실이 발생할 수 있으므로,
                     최소 15% 이상의 마진을 확보하는 것이 안전합니다.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 비용 상세 내역 */}
        {calculation && inputs.sellingPrice && (
          <div className="border-t border-[var(--color-gray-200)] pt-4">
            <h4 className="font-medium mb-3">비용 상세 내역</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-gray-600)]">도매가</span>
                <span>{parseInt(inputs.wholesalePrice).toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-gray-600)]">
                  배송비 ({SHIPPING_COSTS[inputs.shippingType as keyof typeof SHIPPING_COSTS].name})
                </span>
                <span>
                  {(SHIPPING_COSTS[inputs.shippingType as keyof typeof SHIPPING_COSTS].base +
                    (parseFloat(inputs.weight) || 1) *
                    SHIPPING_COSTS[inputs.shippingType as keyof typeof SHIPPING_COSTS].perKg).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-gray-600)]">
                  포장비 (박스 + 아이스팩 {inputs.icePackCount}개)
                </span>
                <span>
                  {(PACKAGING_COSTS[inputs.packagingType as keyof typeof PACKAGING_COSTS].cost +
                    (parseInt(inputs.icePackCount) || 0) * PACKAGING_COSTS.ice.cost).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-gray-600)]">
                  쿠팡 수수료 ({COMMISSION_RATES[inputs.category] || COMMISSION_RATES.default}%)
                </span>
                <span>
                  {Math.round((parseFloat(inputs.sellingPrice) || 0) *
                    ((COMMISSION_RATES[inputs.category] || COMMISSION_RATES.default) / 100)).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--color-gray-200)] font-medium">
                <span>총 비용</span>
                <span>{Math.round(calculation.totalCost).toLocaleString()}원</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
