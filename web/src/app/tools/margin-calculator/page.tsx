'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calculator, Info, Copy, Check, RefreshCw } from 'lucide-react';

export default function MarginCalculatorPage() {
  // 입력값
  const [supplyPrice, setSupplyPrice] = useState<string>('10000'); // 공급가
  const [targetMargin, setTargetMargin] = useState<string>('30'); // 목표 마진율 (%)
  const [commissionRate, setCommissionRate] = useState<string>('10.8'); // 수수료율 (%)
  const [shippingCost, setShippingCost] = useState<string>('3000'); // 배송비
  const [additionalCost, setAdditionalCost] = useState<string>('0'); // 기타 비용
  const [copied, setCopied] = useState(false);

  // 계산 결과
  const calculation = useMemo(() => {
    const supply = parseFloat(supplyPrice) || 0;
    const margin = parseFloat(targetMargin) || 0;
    const commission = parseFloat(commissionRate) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    const additional = parseFloat(additionalCost) || 0;

    // 총 원가 = 공급가 + 배송비 + 기타비용
    const totalCost = supply + shipping + additional;

    // 목표 판매가 계산
    // 판매가 = 총원가 / (1 - 수수료율 - 마진율)
    const marginDecimal = margin / 100;
    const commissionDecimal = commission / 100;
    const divisor = 1 - commissionDecimal - marginDecimal;

    if (divisor <= 0) {
      return {
        error: '마진율 + 수수료율이 100%를 초과합니다',
        sellingPrice: 0,
        commissionAmount: 0,
        profit: 0,
        profitPerUnit: 0,
        totalCost: totalCost,
      };
    }

    const sellingPrice = Math.ceil(totalCost / divisor);
    const commissionAmount = Math.round(sellingPrice * commissionDecimal);
    const profit = sellingPrice - totalCost - commissionAmount;
    const actualMarginRate = (profit / sellingPrice) * 100;

    return {
      error: null,
      sellingPrice,
      commissionAmount,
      profit,
      actualMarginRate,
      totalCost,
    };
  }, [supplyPrice, targetMargin, commissionRate, shippingCost, additionalCost]);

  // 역산 계산 (판매가 기준)
  const [reverseSellingPrice, setReverseSellingPrice] = useState<string>('15000');

  const reverseCalculation = useMemo(() => {
    const selling = parseFloat(reverseSellingPrice) || 0;
    const supply = parseFloat(supplyPrice) || 0;
    const commission = parseFloat(commissionRate) || 0;
    const shipping = parseFloat(shippingCost) || 0;
    const additional = parseFloat(additionalCost) || 0;

    const totalCost = supply + shipping + additional;
    const commissionDecimal = commission / 100;
    const commissionAmount = Math.round(selling * commissionDecimal);
    const profit = selling - totalCost - commissionAmount;
    const marginRate = selling > 0 ? (profit / selling) * 100 : 0;

    return {
      commissionAmount,
      profit,
      marginRate,
      totalCost,
    };
  }, [reverseSellingPrice, supplyPrice, commissionRate, shippingCost, additionalCost]);

  const handleCopy = (value: number) => {
    navigator.clipboard.writeText(value.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSupplyPrice('10000');
    setTargetMargin('30');
    setCommissionRate('10.8');
    setShippingCost('3000');
    setAdditionalCost('0');
    setReverseSellingPrice('15000');
  };

  const commissionPresets = [
    { name: '쿠팡 로켓그로스', rate: '10.8' },
    { name: '쿠팡 마켓플레이스', rate: '5.8' },
    { name: '네이버 스마트스토어', rate: '5.0' },
    { name: '11번가', rate: '13.0' },
    { name: 'G마켓/옥션', rate: '12.0' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-xl flex items-center justify-center">
                <Calculator className="text-[var(--color-gray-600)]" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-gray-900)]">마진 계산기</h1>
                <p className="text-sm text-[var(--color-gray-500)]">목표 마진에 맞는 판매가를 계산하세요</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              초기화
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 입력 섹션 */}
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-gray-900)] mb-4">비용 입력</h2>

            <div className="space-y-4">
              {/* 공급가 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  공급가 (원가)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={supplyPrice}
                    onChange={(e) => setSupplyPrice(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent text-lg"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">원</span>
                </div>
              </div>

              {/* 배송비 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  배송비
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">원</span>
                </div>
              </div>

              {/* 기타 비용 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  기타 비용 (포장재 등)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">원</span>
                </div>
              </div>

              <hr className="my-4" />

              {/* 수수료율 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  플랫폼 수수료율
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">%</span>
                </div>
                {/* 프리셋 버튼들 */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {commissionPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setCommissionRate(preset.rate)}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        commissionRate === preset.rate
                          ? 'bg-[var(--color-primary-500)] text-white'
                          : 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-200)]'
                      }`}
                    >
                      {preset.name} ({preset.rate}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* 목표 마진율 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  목표 마진율
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent text-lg font-semibold"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">%</span>
                </div>
                {/* 마진율 슬라이더 */}
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  className="w-full mt-2 accent-[var(--color-primary-500)]"
                />
                <div className="flex justify-between text-xs text-[var(--color-gray-500)]">
                  <span>5%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 결과 섹션 */}
          <div className="space-y-6">
            {/* 권장 판매가 */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6">
              <h2 className="text-lg font-semibold text-[var(--color-gray-900)] mb-4">권장 판매가</h2>

              {calculation.error ? (
                <div className="text-center py-8">
                  <p className="text-amber-600 font-medium">{calculation.error}</p>
                  <p className="text-sm text-[var(--color-gray-500)] mt-2">마진율이나 수수료율을 조정해주세요</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-[var(--color-gray-600)] mb-1">이 가격으로 판매하세요</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-emerald-600">
                        {calculation.sellingPrice.toLocaleString()}
                      </span>
                      <span className="text-xl text-[var(--color-gray-600)]">원</span>
                      <button
                        onClick={() => handleCopy(calculation.sellingPrice)}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="복사"
                      >
                        {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} className="text-[var(--color-gray-500)]" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                      <span className="text-[var(--color-gray-600)]">총 원가</span>
                      <span className="font-medium">{calculation.totalCost.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                      <span className="text-[var(--color-gray-600)]">수수료 ({commissionRate}%)</span>
                      <span className="font-medium text-[var(--color-gray-500)]">-{calculation.commissionAmount.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[var(--color-gray-700)] font-medium">예상 순이익</span>
                      <span className="text-xl font-bold text-emerald-600">+{calculation.profit.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-emerald-100 rounded-lg px-3 -mx-3">
                      <span className="text-[var(--color-gray-700)] font-medium">실제 마진율</span>
                      <span className="text-lg font-bold text-emerald-700">{calculation.actualMarginRate?.toFixed(1)}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 역산 계산기 */}
            <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-gray-900)] mb-4">
                역산 계산기
                <span className="text-sm font-normal text-[var(--color-gray-500)] ml-2">판매가 기준</span>
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  예상 판매가
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={reverseSellingPrice}
                    onChange={(e) => setReverseSellingPrice(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]">원</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-[var(--color-gray-200)]">
                  <span className="text-[var(--color-gray-600)]">총 원가</span>
                  <span>{reverseCalculation.totalCost.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--color-gray-200)]">
                  <span className="text-[var(--color-gray-600)]">수수료</span>
                  <span className="text-[var(--color-gray-500)]">-{reverseCalculation.commissionAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--color-gray-200)]">
                  <span className="text-[var(--color-gray-700)] font-medium">순이익</span>
                  <span className={`font-bold ${reverseCalculation.profit >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {reverseCalculation.profit >= 0 ? '+' : ''}{reverseCalculation.profit.toLocaleString()}원
                  </span>
                </div>
                <div className={`flex justify-between items-center py-2 px-3 -mx-3 rounded-lg ${
                  reverseCalculation.marginRate >= 20 ? 'bg-emerald-100' :
                  reverseCalculation.marginRate >= 10 ? 'bg-[var(--color-gray-100)]' : 'bg-amber-100'
                }`}>
                  <span className="text-[var(--color-gray-700)] font-medium">마진율</span>
                  <span className={`font-bold ${
                    reverseCalculation.marginRate >= 20 ? 'text-emerald-700' :
                    reverseCalculation.marginRate >= 10 ? 'text-[var(--color-gray-700)]' : 'text-amber-700'
                  }`}>
                    {reverseCalculation.marginRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 안내 */}
            <div className="bg-[var(--color-gray-50)] rounded-xl border border-[var(--color-gray-200)] p-4">
              <div className="flex gap-3">
                <Info size={20} className="text-[var(--color-gray-600)] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--color-gray-800)]">
                  <p className="font-medium mb-1">마진 계산 공식</p>
                  <p className="text-[var(--color-gray-700)]">
                    판매가 = 총원가 ÷ (1 - 수수료율 - 마진율)<br/>
                    순이익 = 판매가 - 총원가 - 수수료
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
