'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Select, Card, Badge } from '@/components/ui';
import {
  Upload,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

// Mock 카테고리 데이터
const categoryOptions = [
  { value: '', label: '카테고리 선택' },
  { value: '1001', label: '디지털/가전 > 이어폰/헤드폰' },
  { value: '1002', label: '디지털/가전 > 충전기/케이블' },
  { value: '1003', label: '디지털/가전 > 마우스/키보드' },
  { value: '2001', label: '생활용품 > 주방용품' },
  { value: '2002', label: '생활용품 > 욕실용품' },
];

interface ProductOption {
  id: string;
  name: string;
  values: { name: string; priceAdjust: number }[];
}

export default function ProductRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplierPrice: '',
    sellingPrice: '',
    shippingFee: '0',
    description: '',
  });

  const [images, setImages] = useState<string[]>([
    'https://via.placeholder.com/400',
    'https://via.placeholder.com/400',
  ]);

  const [options, setOptions] = useState<ProductOption[]>([
    {
      id: '1',
      name: '색상',
      values: [
        { name: '블랙', priceAdjust: 0 },
        { name: '화이트', priceAdjust: 0 },
      ],
    },
  ]);

  const [showOptions, setShowOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 마진 계산
  const calculateMargin = () => {
    const supplierPrice = parseInt(formData.supplierPrice) || 0;
    const sellingPrice = parseInt(formData.sellingPrice) || 0;
    const shippingFee = parseInt(formData.shippingFee) || 0;
    const coupangFee = sellingPrice * 0.1; // 10% 수수료 가정

    if (sellingPrice === 0) return { margin: 0, profit: 0 };

    const profit = sellingPrice - supplierPrice - shippingFee - coupangFee;
    const margin = (profit / sellingPrice) * 100;

    return {
      margin: margin.toFixed(1),
      profit: Math.round(profit),
    };
  };

  const { margin, profit } = calculateMargin();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        values: [{ name: '', priceAdjust: 0 }],
      },
    ]);
  };

  const removeOption = (optionId: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== optionId));
  };

  const addOptionValue = (optionId: string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? { ...opt, values: [...opt.values, { name: '', priceAdjust: 0 }] }
          : opt
      )
    );
  };

  const handleSubmit = async (isDraft: boolean) => {
    setIsSubmitting(true);
    // 실제 구현에서는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    alert(isDraft ? '임시 저장되었습니다.' : '상품이 등록되었습니다.');
  };

  return (
    <DashboardLayout
      title="상품 등록"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: '상품 등록' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 폼 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card title="기본 정보">
            <div className="space-y-4">
              <Input
                label="상품명"
                placeholder="상품명을 입력하세요"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              <Select
                label="카테고리"
                options={categoryOptions}
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">
                  상품 설명
                </label>
                <textarea
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[var(--color-gray-300)] rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent
                    hover:border-[var(--color-gray-400)] transition-colors resize-none"
                  rows={4}
                  placeholder="상품 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* 이미지 */}
          <Card title="상품 이미지" subtitle="최대 10장까지 등록 가능합니다">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-[var(--color-gray-100)] rounded-lg overflow-hidden group"
                >
                  <img src={img} alt={`상품 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-[var(--color-primary-500)] text-white text-xs rounded">
                      대표
                    </span>
                  )}
                </div>
              ))}
              {images.length < 10 && (
                <button className="aspect-square border-2 border-dashed border-[var(--color-gray-300)] rounded-lg flex flex-col items-center justify-center text-[var(--color-gray-500)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-500)] transition-colors">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm">이미지 추가</span>
                </button>
              )}
            </div>
          </Card>

          {/* 옵션 */}
          <Card
            title="상품 옵션"
            actions={
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 hover:bg-[var(--color-gray-100)] rounded"
              >
                {showOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            }
          >
            {showOptions && (
              <div className="space-y-4">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="p-4 border border-[var(--color-gray-200)] rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Input
                        placeholder="옵션명 (예: 색상)"
                        value={option.name}
                        onChange={(e) =>
                          setOptions((prev) =>
                            prev.map((opt) =>
                              opt.id === option.id ? { ...opt, name: e.target.value } : opt
                            )
                          )
                        }
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeOption(option.id)}
                        className="p-2 text-[var(--color-danger)] hover:bg-[var(--color-gray-100)] rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {option.values.map((value, vIndex) => (
                        <div key={vIndex} className="flex items-center gap-2">
                          <Input
                            placeholder="옵션값 (예: 블랙)"
                            value={value.name}
                            className="flex-1"
                            onChange={() => {}}
                          />
                          <Input
                            type="number"
                            placeholder="추가금"
                            value={value.priceAdjust.toString()}
                            className="w-28"
                            onChange={() => {}}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addOptionValue(option.id)}
                      className="mt-2 text-sm text-[var(--color-primary-500)] hover:underline"
                    >
                      + 옵션값 추가
                    </button>
                  </div>
                ))}
                <Button variant="secondary" onClick={addOption} className="w-full">
                  <Plus size={16} className="mr-1" />
                  옵션 추가
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* 사이드바 - 가격 설정 */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="가격 설정">
            <div className="space-y-4">
              <Input
                label="도매가"
                type="number"
                placeholder="0"
                value={formData.supplierPrice}
                onChange={(e) => handleInputChange('supplierPrice', e.target.value)}
                helperText="도매처에서 구매하는 가격"
              />
              <Input
                label="판매가"
                type="number"
                placeholder="0"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                helperText="쿠팡에서 판매할 가격"
              />
              <Input
                label="배송비"
                type="number"
                placeholder="0"
                value={formData.shippingFee}
                onChange={(e) => handleInputChange('shippingFee', e.target.value)}
              />

              {/* 마진 계산 결과 */}
              <div className="pt-4 border-t border-[var(--color-gray-200)]">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[var(--color-gray-600)]">쿠팡 수수료 (10%)</span>
                  <span className="text-sm">
                    {Math.round((parseInt(formData.sellingPrice) || 0) * 0.1).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[var(--color-gray-600)]">예상 순이익</span>
                  <span
                    className={`font-bold ${
                      profit > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                    }`}
                  >
                    {profit.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-gray-600)]">마진율</span>
                  <span
                    className={`font-bold ${
                      parseFloat(margin as string) > 0
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-danger)]'
                    }`}
                  >
                    {margin}%
                  </span>
                </div>
              </div>

              {/* 경고 */}
              {parseFloat(margin as string) < 15 && parseFloat(margin as string) > 0 && (
                <div className="flex items-start gap-2 p-3 bg-[#FFF3E0] rounded-lg">
                  <AlertCircle size={18} className="text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#E65100]">
                    마진율이 15% 미만입니다. 반품/교환 비용을 고려하면 손해가 발생할 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 등록 버튼 */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => handleSubmit(false)}
              loading={isSubmitting}
            >
              <Send size={16} className="mr-2" />
              쿠팡에 등록하기
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              <Save size={16} className="mr-2" />
              임시 저장
            </Button>
          </div>

          {/* 안내 */}
          <div className="text-sm text-[var(--color-gray-500)]">
            <p className="mb-2">※ 등록 전 확인사항</p>
            <ul className="list-disc list-inside space-y-1">
              <li>상품 이미지는 최소 1장 필요</li>
              <li>카테고리 선택 필수</li>
              <li>쿠팡 Wing API 연동 필요</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
