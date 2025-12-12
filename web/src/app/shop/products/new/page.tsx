'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  ImageIcon,
  Loader2,
  Trash2,
  Copy,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Upload,
  FileImage,
  Eye,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';

// 타입 정의
interface ImageWithPreview {
  file: File;
  preview: string;
}

interface ProductOption {
  id: string;
  name: string; // 옵션명 (예: 1kg, 3kg)
  costPrice: number; // 원가 (매입가)
  sellingPrice: number; // 판매가 (현재 가격)
  comparePrice?: number; // 정상가 (할인 전 가격, 세일 표시용)
  stock: number; // 재고
  sku?: string; // 개별 SKU
  isDefault: boolean; // 기본 옵션 여부
  images?: ImageWithPreview[]; // 옵션별 이미지 (옵션별 이미지 사용 시)
  detailContent?: string; // 옵션별 상세페이지 (옵션별 사용 시)
  detailImages?: ImageWithPreview[]; // 옵션별 상세페이지 이미지
}

interface Category {
  id: string;
  name: string;
  slug: string;
  code: string;
  parentId: string | null;
}

interface ImageValidation {
  valid: boolean;
  message: string;
  width?: number;
  height?: number;
}

// 상세페이지 이미지 밸리데이션
const validateDetailImage = (file: File): Promise<ImageValidation> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 권장 사이즈: 가로 860px 이상, 세로 제한 없음
      // 최소 사이즈: 가로 500px 이상
      // 최대 파일 크기: 10MB
      const minWidth = 500;
      const recommendedWidth = 860;
      const maxFileSize = 10 * 1024 * 1024; // 10MB

      if (file.size > maxFileSize) {
        resolve({
          valid: false,
          message: `파일 크기가 너무 큽니다. (최대 10MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
          width: img.width,
          height: img.height,
        });
        return;
      }

      if (img.width < minWidth) {
        resolve({
          valid: false,
          message: `이미지 가로 크기가 너무 작습니다. (최소 ${minWidth}px, 현재 ${img.width}px)`,
          width: img.width,
          height: img.height,
        });
        return;
      }

      const isRecommended = img.width >= recommendedWidth;
      resolve({
        valid: true,
        message: isRecommended
          ? `적합한 이미지입니다. (${img.width} x ${img.height}px)`
          : `사용 가능하지만 ${recommendedWidth}px 이상 권장 (현재 ${img.width}px)`,
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        message: '이미지를 로드할 수 없습니다.',
      });
    };

    img.src = url;
  });
};

export default function NewShopProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 기본 정보
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // 옵션 관리
  const [options, setOptions] = useState<ProductOption[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      isDefault: true,
    },
  ]);

  // 이미지 관리
  const [imageMode, setImageMode] = useState<'same' | 'perOption'>('same');
  const [commonImages, setCommonImages] = useState<ImageWithPreview[]>([]);

  // 상세페이지 관리
  const [detailMode, setDetailMode] = useState<'same' | 'perOption'>('same');
  const [commonDetailContent, setCommonDetailContent] = useState('');
  const [commonDetailImages, setCommonDetailImages] = useState<{ file: File; url: string; validation: ImageValidation }[]>([]);

  // 노출 설정
  const [isShopVisible, setIsShopVisible] = useState(true);

  // 미리보기 모달 상태
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/shop/categories?flat=true');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // 옵션 추가
  const addOption = () => {
    setOptions([
      ...options,
      {
        id: crypto.randomUUID(),
        name: '',
        costPrice: 0,
        sellingPrice: 0,
        stock: 0,
        isDefault: false,
      },
    ]);
  };

  // 옵션 삭제
  const removeOption = (id: string) => {
    if (options.length <= 1) {
      alert('최소 1개의 옵션이 필요합니다.');
      return;
    }
    const newOptions = options.filter((opt) => opt.id !== id);
    // 기본 옵션이 삭제되면 첫 번째를 기본으로
    if (!newOptions.some((opt) => opt.isDefault)) {
      newOptions[0].isDefault = true;
    }
    setOptions(newOptions);
  };

  // 옵션 업데이트
  const updateOption = (id: string, field: keyof ProductOption, value: any) => {
    setOptions(
      options.map((opt) => {
        if (opt.id !== id) return opt;
        return { ...opt, [field]: value };
      })
    );
  };

  // 할인율 계산 (정상가 대비 판매가)
  const calculateDiscountRate = (comparePrice?: number, sellingPrice?: number) => {
    if (!comparePrice || !sellingPrice || comparePrice <= sellingPrice) return 0;
    return Math.round(((comparePrice - sellingPrice) / comparePrice) * 100);
  };

  // 기본 옵션 설정
  const setDefaultOption = (id: string) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        isDefault: opt.id === id,
      }))
    );
  };

  // 옵션 복제
  const duplicateOption = (id: string) => {
    const target = options.find((opt) => opt.id === id);
    if (!target) return;

    const newOption: ProductOption = {
      ...target,
      id: crypto.randomUUID(),
      name: `${target.name} (복사)`,
      isDefault: false,
    };
    setOptions([...options, newOption]);
  };

  // 이미지 업로드 (공통)
  const handleCommonImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setCommonImages([...commonImages, ...newImages]);
  };

  // 이미지 업로드 (옵션별)
  const handleOptionImageUpload = (optionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setOptions(
      options.map((opt) =>
        opt.id === optionId
          ? { ...opt, images: [...(opt.images || []), ...newImages] }
          : opt
      )
    );
  };

  // 상세페이지 이미지 업로드
  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, optionId?: string) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const validation = await validateDetailImage(file);
      const url = URL.createObjectURL(file);

      if (optionId) {
        // 옵션별 상세페이지 이미지
        setOptions(
          options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  detailImages: [...(opt.detailImages || []), { file, preview: url }],
                }
              : opt
          )
        );
      } else {
        // 공통 상세페이지 이미지
        setCommonDetailImages([...commonDetailImages, { file, url, validation }]);
      }
    }
  };

  // 상세페이지 이미지 삭제
  const removeDetailImage = (index: number, optionId?: string) => {
    if (optionId) {
      setOptions(
        options.map((opt) =>
          opt.id === optionId
            ? {
                ...opt,
                detailImages: opt.detailImages?.filter((_, i) => i !== index),
              }
            : opt
        )
      );
    } else {
      setCommonDetailImages(commonDetailImages.filter((_, i) => i !== index));
    }
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 마진 계산 (원가 대비 판매가)
  const calculateMargin = (cost: number, selling: number) => {
    const margin = selling - cost;
    const marginRate = selling > 0 ? (margin / selling) * 100 : 0;
    return { margin, marginRate };
  };

  // 폼 유효성 검사
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // 기본정보
        return productName.trim() !== '' && categoryId !== '';
      case 2: // 옵션/가격
        return options.every(
          (opt) => opt.name.trim() !== '' && opt.sellingPrice > 0
        );
      case 3: // 이미지
        if (imageMode === 'same') {
          return commonImages.length > 0;
        }
        return options.every((opt) => opt.images && opt.images.length > 0);
      case 4: // 상세페이지
        return true; // 선택사항
      default:
        return true;
    }
  };

  // 제출
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // 기본 정보
      formData.append('name', productName);
      formData.append('categoryId', categoryId);
      if (description) formData.append('description', description);
      formData.append('isShopVisible', String(isShopVisible));

      // 기본 옵션의 가격/재고 정보 사용
      const defaultOption = options.find(opt => opt.isDefault) || options[0];
      formData.append('costPrice', String(defaultOption.costPrice || 0));
      formData.append('sellingPrice', String(defaultOption.sellingPrice));
      if (defaultOption.comparePrice) {
        formData.append('comparePrice', String(defaultOption.comparePrice));
      }
      formData.append('quantity', String(defaultOption.stock || 0));

      // 상세 설명
      if (commonDetailContent) {
        formData.append('shopDescription', commonDetailContent);
      }

      // 이미지 업로드
      const imagesToUpload = imageMode === 'same' ? commonImages : (defaultOption.images || []);

      // 첫 번째 이미지를 썸네일로 설정
      if (imagesToUpload.length > 0) {
        formData.append('thumbnail', imagesToUpload[0].file);
      }

      // 나머지 이미지들
      imagesToUpload.forEach((img) => {
        formData.append('images', img.file);
      });

      // 상세페이지 이미지
      commonDetailImages.forEach((img) => {
        formData.append('detailImages', img.file);
      });

      console.log('Submitting FormData with images...');

      const response = await fetch('/api/shop/products/with-images', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '상품 등록에 실패했습니다.');
      }

      alert('상품이 등록되었습니다.');
      router.push('/shop/products');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : '상품 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 스텝 정보
  const steps = [
    { number: 1, title: '기본 정보', description: '상품명, 카테고리' },
    { number: 2, title: '옵션/가격', description: '옵션별 가격 설정' },
    { number: 3, title: '이미지', description: '대표 이미지' },
    { number: 4, title: '상세페이지', description: '상품 설명' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--color-gray-200)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/shop/products"
                className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-[var(--color-gray-600)]" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-gray-900)]">
                  자사몰 상품 등록
                </h1>
                <p className="text-sm text-[var(--color-gray-500)]">
                  싱싱마켓에 새로운 상품을 등록합니다
                </p>
              </div>
            </div>

            {/* 노출 설정 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-[var(--color-gray-600)]">자사몰 노출</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isShopVisible}
                  onChange={(e) => setIsShopVisible(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  isShopVisible ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-gray-300)]'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    isShopVisible ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </div>
            </label>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => validateStep(currentStep) && setCurrentStep(step.number)}
                  className={`flex items-center gap-2 ${
                    currentStep === step.number
                      ? 'text-[var(--color-primary-600)]'
                      : currentStep > step.number
                      ? 'text-[var(--color-gray-600)]'
                      : 'text-[var(--color-gray-400)]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.number
                      ? 'bg-[var(--color-primary-500)] text-white'
                      : currentStep > step.number
                      ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-600)]'
                      : 'bg-[var(--color-gray-200)] text-[var(--color-gray-500)]'
                  }`}>
                    {currentStep > step.number ? <Check size={16} /> : step.number}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-[var(--color-gray-500)]">{step.description}</div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.number
                      ? 'bg-[var(--color-primary-300)]'
                      : 'bg-[var(--color-gray-200)]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Step 1: 기본 정보 */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6 space-y-6">
            <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">기본 정보</h2>

            {/* 상품명 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                상품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="예: 성주 꿀참외"
                className="w-full px-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-lg"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-[var(--color-gray-700)]">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <Link href="/shop/categories" className="text-xs text-[var(--color-primary-500)] hover:underline">
                  관리
                </Link>
              </div>
              <Dropdown
                options={categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                  description: cat.code ? `코드: ${cat.code}` : undefined,
                }))}
                value={categoryId}
                onChange={(value) => setCategoryId(value)}
                placeholder={loadingCategories ? '로딩중...' : '카테고리 선택'}
                disabled={loadingCategories}
                searchable
                clearable
                size="lg"
              />
              {categoryId && (
                <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                  상품코드가 자동 생성됩니다 (예: {categories.find(c => c.id === categoryId)?.code || 'CAT'}-001)
                </p>
              )}
            </div>

            {/* 간단 설명 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                간단 설명 <span className="text-[var(--color-gray-400)] text-xs font-normal">(선택)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="상품에 대한 간단한 설명을 입력하세요"
                className="w-full px-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: 옵션/가격 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">옵션/가격 설정</h2>
                  <p className="text-sm text-[var(--color-gray-500)] mt-1">
                    최소 1개의 옵션이 필요합니다. 각 옵션별로 가격을 설정하세요.
                  </p>
                </div>
                <button
                  onClick={addOption}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
                >
                  <Plus size={18} />
                  옵션 추가
                </button>
              </div>

              {/* 옵션 목록 */}
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`border rounded-lg p-4 ${
                      option.isDefault
                        ? 'border-[var(--color-primary-300)] bg-[var(--color-primary-50)]/30'
                        : 'border-[var(--color-gray-200)]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 옵션 번호/기본 표시 */}
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          option.isDefault
                            ? 'bg-[var(--color-primary-500)] text-white'
                            : 'bg-[var(--color-gray-200)] text-[var(--color-gray-600)]'
                        }`}>
                          {index + 1}
                        </div>
                        {option.isDefault && (
                          <span className="text-[10px] text-[var(--color-primary-600)] font-medium">기본</span>
                        )}
                      </div>

                      {/* 옵션 정보 */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* 옵션명 */}
                        <div className="md:col-span-2">
                          <label className="block text-xs text-[var(--color-gray-600)] mb-1">
                            옵션명 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => updateOption(option.id, 'name', e.target.value)}
                            placeholder="예: 1kg, 3kg, 5kg"
                            className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                          />
                        </div>

                        {/* 원가 (매입가) */}
                        <div>
                          <label className="block text-xs text-[var(--color-gray-600)] mb-1">원가</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={option.costPrice || ''}
                              onChange={(e) => updateOption(option.id, 'costPrice', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full px-3 py-2 pr-8 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] text-sm">원</span>
                          </div>
                        </div>

                        {/* 정상가 (할인 전 가격) */}
                        <div>
                          <label className="block text-xs text-[var(--color-gray-600)] mb-1">
                            정상가 <span className="text-[var(--color-gray-400)]">(선택)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={option.comparePrice || ''}
                              onChange={(e) => updateOption(option.id, 'comparePrice', parseInt(e.target.value) || undefined)}
                              placeholder="0"
                              className="w-full px-3 py-2 pr-8 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] text-sm">원</span>
                          </div>
                        </div>

                        {/* 판매가 */}
                        <div>
                          <label className="block text-xs text-[var(--color-gray-600)] mb-1">
                            판매가 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={option.sellingPrice || ''}
                              onChange={(e) => updateOption(option.id, 'sellingPrice', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full px-3 py-2 pr-8 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] text-sm">원</span>
                          </div>
                        </div>

                        {/* 재고 */}
                        <div>
                          <label className="block text-xs text-[var(--color-gray-600)] mb-1">재고</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={option.stock || ''}
                              onChange={(e) => updateOption(option.id, 'stock', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full px-3 py-2 pr-8 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)] text-sm">개</span>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateOption(option.id)}
                          className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                          title="복제"
                        >
                          <Copy size={16} className="text-[var(--color-gray-500)]" />
                        </button>
                        <button
                          onClick={() => removeOption(option.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                          disabled={options.length <= 1}
                        >
                          <Trash2 size={16} className={options.length <= 1 ? 'text-[var(--color-gray-300)]' : 'text-red-500'} />
                        </button>
                      </div>
                    </div>

                    {/* 할인율 & 마진 정보 */}
                    <div className="mt-4 pt-4 border-t border-[var(--color-gray-200)] flex flex-wrap items-center gap-6">
                      {/* 할인율 표시 (자동 계산) */}
                      {option.comparePrice && option.comparePrice > option.sellingPrice && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                            -{calculateDiscountRate(option.comparePrice, option.sellingPrice)}%
                          </span>
                          <span className="text-sm text-[var(--color-gray-500)]">
                            <span className="line-through">{formatPrice(option.comparePrice)}원</span>
                            {' → '}
                            <span className="text-red-600 font-medium">{formatPrice(option.sellingPrice)}원</span>
                          </span>
                        </div>
                      )}

                      {/* 마진 정보 */}
                      {option.costPrice > 0 && option.sellingPrice > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--color-gray-500)]">예상 마진:</span>
                          {(() => {
                            const { margin, marginRate } = calculateMargin(option.costPrice, option.sellingPrice);
                            return (
                              <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatPrice(margin)}원 ({marginRate.toFixed(1)}%)
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {/* 기본 옵션 설정 */}
                      {!option.isDefault && (
                        <button
                          onClick={() => setDefaultOption(option.id)}
                          className="text-xs text-[var(--color-primary-500)] hover:underline"
                        >
                          기본 옵션으로 설정
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 이미지 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6">
              <h2 className="text-lg font-semibold text-[var(--color-gray-900)] mb-4">대표 이미지</h2>

              {/* 이미지 모드 선택 */}
              <div className="flex gap-4 mb-6">
                <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  imageMode === 'same'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}>
                  <input
                    type="radio"
                    name="imageMode"
                    checked={imageMode === 'same'}
                    onChange={() => setImageMode('same')}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      imageMode === 'same' ? 'border-[var(--color-primary-500)]' : 'border-[var(--color-gray-300)]'
                    }`}>
                      {imageMode === 'same' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)]" />}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-gray-900)]">모든 옵션 동일</div>
                      <div className="text-sm text-[var(--color-gray-500)]">하나의 이미지 세트를 모든 옵션에 적용</div>
                    </div>
                  </div>
                </label>

                <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  imageMode === 'perOption'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}>
                  <input
                    type="radio"
                    name="imageMode"
                    checked={imageMode === 'perOption'}
                    onChange={() => setImageMode('perOption')}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      imageMode === 'perOption' ? 'border-[var(--color-primary-500)]' : 'border-[var(--color-gray-300)]'
                    }`}>
                      {imageMode === 'perOption' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)]" />}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-gray-900)]">옵션별 개별 설정</div>
                      <div className="text-sm text-[var(--color-gray-500)]">각 옵션마다 다른 이미지 적용</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* 공통 이미지 업로드 */}
              {imageMode === 'same' && (
                <div>
                  <div className="grid grid-cols-5 gap-4">
                    {commonImages.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-gray-200)]">
                        <img src={image.preview} alt={`상품 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setCommonImages(commonImages.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                          <X size={14} />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-[var(--color-primary-500)] text-white text-[10px] rounded">
                            대표
                          </span>
                        )}
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-gray-300)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-colors">
                      <ImageIcon size={24} className="text-[var(--color-gray-400)] mb-2" />
                      <span className="text-xs text-[var(--color-gray-500)]">이미지 추가</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCommonImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* 옵션별 이미지 업로드 */}
              {imageMode === 'perOption' && (
                <div className="space-y-4">
                  {options.map((option) => (
                    <div key={option.id} className="border border-[var(--color-gray-200)] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-[var(--color-gray-900)]">{option.name || '옵션명 미설정'}</span>
                        {option.isDefault && (
                          <span className="px-2 py-0.5 bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-xs rounded">기본</span>
                        )}
                      </div>
                      <div className="grid grid-cols-6 gap-3">
                        {(option.images || []).map((image, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-gray-200)]">
                            <img src={image.preview} alt={`${option.name} 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => setOptions(
                                options.map((opt) =>
                                  opt.id === option.id
                                    ? { ...opt, images: opt.images?.filter((_, i) => i !== index) }
                                    : opt
                                )
                              )}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <label className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-gray-300)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-primary-500)] transition-colors">
                          <Plus size={20} className="text-[var(--color-gray-400)]" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleOptionImageUpload(option.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: 상세페이지 */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">상세페이지</h2>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gray-100)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-200)] transition-colors"
                >
                  <Eye size={18} />
                  미리보기
                </button>
              </div>

              {/* 상세페이지 모드 선택 */}
              <div className="flex gap-4 mb-6">
                <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  detailMode === 'same'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}>
                  <input
                    type="radio"
                    name="detailMode"
                    checked={detailMode === 'same'}
                    onChange={() => setDetailMode('same')}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      detailMode === 'same' ? 'border-[var(--color-primary-500)]' : 'border-[var(--color-gray-300)]'
                    }`}>
                      {detailMode === 'same' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)]" />}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-gray-900)]">모든 옵션 동일</div>
                      <div className="text-sm text-[var(--color-gray-500)]">하나의 상세페이지를 모든 옵션에 적용</div>
                    </div>
                  </div>
                </label>

                <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  detailMode === 'perOption'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}>
                  <input
                    type="radio"
                    name="detailMode"
                    checked={detailMode === 'perOption'}
                    onChange={() => setDetailMode('perOption')}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      detailMode === 'perOption' ? 'border-[var(--color-primary-500)]' : 'border-[var(--color-gray-300)]'
                    }`}>
                      {detailMode === 'perOption' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)]" />}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-gray-900)]">옵션별 개별 설정</div>
                      <div className="text-sm text-[var(--color-gray-500)]">각 옵션마다 다른 상세페이지 적용</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* 공통 상세페이지 */}
              {detailMode === 'same' && (
                <div className="space-y-6">
                  {/* 상세페이지 이미지 업로드 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-[var(--color-gray-700)]">
                        상세페이지 이미지
                      </label>
                      <div className="text-xs text-[var(--color-gray-500)]">
                        권장: 가로 860px 이상 | 최소: 가로 500px | 최대: 10MB
                      </div>
                    </div>

                    {/* 이미지 목록 */}
                    <div className="space-y-3 mb-4">
                      {commonDetailImages.map((img, index) => (
                        <div key={index} className={`flex items-start gap-4 p-3 rounded-lg border ${
                          img.validation.valid ? 'border-[var(--color-gray-200)]' : 'border-red-300 bg-red-50'
                        }`}>
                          <img src={img.url} alt={`상세 이미지 ${index + 1}`} className="w-32 h-20 object-cover rounded" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {img.validation.valid ? (
                                <Check size={16} className="text-green-600" />
                              ) : (
                                <AlertCircle size={16} className="text-red-500" />
                              )}
                              <span className={`text-sm ${img.validation.valid ? 'text-green-600' : 'text-red-500'}`}>
                                {img.validation.message}
                              </span>
                            </div>
                            {img.validation.width && img.validation.height && (
                              <span className="text-xs text-[var(--color-gray-500)]">
                                {img.validation.width} x {img.validation.height}px
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeDetailImage(index)}
                            className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg"
                          >
                            <Trash2 size={16} className="text-[var(--color-gray-500)]" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 업로드 영역 */}
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--color-gray-300)] rounded-lg cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-colors">
                      <FileImage size={32} className="text-[var(--color-gray-400)] mb-2" />
                      <span className="text-sm text-[var(--color-gray-600)]">상세페이지 이미지 추가</span>
                      <span className="text-xs text-[var(--color-gray-400)] mt-1">여러 장 선택 가능</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleDetailImageUpload(e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* HTML 입력 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-[var(--color-gray-700)]">
                        HTML 직접 입력 <span className="text-[var(--color-gray-400)] text-xs font-normal">(선택)</span>
                      </label>
                      <Link
                        href="/product-creation/detail-editor"
                        target="_blank"
                        className="text-xs text-[var(--color-primary-500)] hover:underline"
                      >
                        상세페이지 에디터 열기
                      </Link>
                    </div>
                    <textarea
                      value={commonDetailContent}
                      onChange={(e) => setCommonDetailContent(e.target.value)}
                      rows={8}
                      placeholder="<div>상품 상세 설명 HTML...</div>"
                      className="w-full px-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] font-mono text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 옵션별 상세페이지 */}
              {detailMode === 'perOption' && (
                <div className="space-y-4">
                  {options.map((option) => (
                    <div key={option.id} className="border border-[var(--color-gray-200)] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-medium text-[var(--color-gray-900)]">{option.name || '옵션명 미설정'}</span>
                        {option.isDefault && (
                          <span className="px-2 py-0.5 bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-xs rounded">기본</span>
                        )}
                      </div>

                      {/* 옵션별 상세 이미지 */}
                      <div className="mb-4">
                        <label className="block text-xs text-[var(--color-gray-600)] mb-2">상세페이지 이미지</label>
                        <div className="flex flex-wrap gap-2">
                          {(option.detailImages || []).map((img, index) => (
                            <div key={index} className="relative w-24 h-16">
                              <img src={img.preview} alt="" className="w-full h-full object-cover rounded" />
                              <button
                                onClick={() => removeDetailImage(index, option.id)}
                                className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          <label className="w-24 h-16 flex items-center justify-center border-2 border-dashed border-[var(--color-gray-300)] rounded cursor-pointer hover:border-[var(--color-primary-500)]">
                            <Plus size={20} className="text-[var(--color-gray-400)]" />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleDetailImageUpload(e, option.id)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* 옵션별 HTML */}
                      <div>
                        <label className="block text-xs text-[var(--color-gray-600)] mb-1">HTML 내용</label>
                        <textarea
                          value={option.detailContent || ''}
                          onChange={(e) => updateOption(option.id, 'detailContent', e.target.value)}
                          rows={4}
                          placeholder="<div>상세 설명...</div>"
                          className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] font-mono text-sm resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 상세페이지 미리보기 모달 */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-200)]">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-[var(--color-gray-900)]">상세페이지 미리보기</h3>
                  {/* 디바이스 선택 */}
                  <div className="flex items-center gap-1 bg-[var(--color-gray-100)] rounded-lg p-1">
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        previewDevice === 'mobile'
                          ? 'bg-white text-[var(--color-gray-900)] shadow-sm'
                          : 'text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]'
                      }`}
                    >
                      <Smartphone size={16} />
                      모바일
                    </button>
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-[var(--color-gray-900)] shadow-sm'
                          : 'text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]'
                      }`}
                    >
                      <Monitor size={16} />
                      데스크톱
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                >
                  <X size={20} className="text-[var(--color-gray-600)]" />
                </button>
              </div>

              {/* 미리보기 컨텐츠 - 상세페이지만 */}
              <div className="flex-1 overflow-auto bg-[var(--color-gray-100)] p-4 flex justify-center">
                <div
                  className={`bg-white shadow-lg transition-all ${
                    previewDevice === 'mobile'
                      ? 'w-[375px] rounded-2xl'
                      : 'w-full max-w-[860px] rounded-lg'
                  }`}
                >
                  <div className={`${previewDevice === 'mobile' ? 'p-3' : 'p-4'}`}>
                    {/* 상세페이지 이미지들 */}
                    {(detailMode === 'same' ? commonDetailImages : []).length > 0 && (
                      <div className="space-y-1">
                        {(detailMode === 'same' ? commonDetailImages : []).map((img, index) => (
                          <img
                            key={index}
                            src={img.url}
                            alt={`상세 이미지 ${index + 1}`}
                            className="w-full"
                          />
                        ))}
                      </div>
                    )}

                    {/* HTML 컨텐츠 */}
                    {(detailMode === 'same' ? commonDetailContent : options.find(o => o.isDefault)?.detailContent) && (
                      <div
                        className={`prose max-w-none ${previewDevice === 'mobile' ? 'prose-sm' : ''} ${commonDetailImages.length > 0 ? 'mt-4' : ''}`}
                        dangerouslySetInnerHTML={{
                          __html: detailMode === 'same'
                            ? commonDetailContent
                            : options.find(o => o.isDefault)?.detailContent || ''
                        }}
                      />
                    )}

                    {/* 상세페이지 콘텐츠가 없을 때 */}
                    {(detailMode === 'same' ? commonDetailImages : []).length === 0 &&
                     !(detailMode === 'same' ? commonDetailContent : options.find(o => o.isDefault)?.detailContent) && (
                      <div className="py-16 text-center">
                        <FileImage size={48} className="mx-auto text-[var(--color-gray-300)] mb-3" />
                        <p className="text-[var(--color-gray-500)]">
                          상세페이지 이미지나 HTML을 추가하면<br />
                          여기에 미리보기가 표시됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="p-4 border-t border-[var(--color-gray-200)] flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-[var(--color-gray-100)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-200)] transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 border border-[var(--color-gray-300)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={18} />
            이전
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep(currentStep + 1);
                } else {
                  alert('필수 항목을 입력해주세요.');
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
            >
              다음
              <ChevronDown size={18} className="rotate-[-90deg]" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !validateStep(1) || !validateStep(2)}
              className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Save size={18} />
                  상품 등록
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
