'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input, Select, ImageUploader, DetailImageUploader, Tabs, TabPanel, CoupangSettingsModal } from '@/components/ui';
import type { Tab } from '@/components/ui/Tabs';
import {
  Save,
  Upload,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Settings,
  Package,
} from 'lucide-react';

// 플랫폼별 탭 컴포넌트
import CoupangTab from '@/components/products/CoupangTab';
import NaverTab from '@/components/products/NaverTab';
import ShopTab from '@/components/products/ShopTab';

// 검증 훅
import { useProductValidation, PlatformSpecificData } from '@/hooks/useProductValidation';

// 플랫폼 정보
const platforms = [
  { id: 'COUPANG', label: '쿠팡', color: 'bg-orange-500', enabled: true },
  { id: 'NAVER', label: '네이버 스마트스토어', color: 'bg-green-500', enabled: true },
  { id: 'SHOP', label: '자사몰', color: 'bg-blue-500', enabled: true },
];

// 카테고리 타입
interface Category {
  id: string;
  name: string;
  coupangCategoryCode: string | null;
  naverCategoryId: string | null;
}

interface OptionValue {
  name: string;
  additionalPrice: number;
}

interface ProductOption {
  id: string;
  groupName: string;
  values: OptionValue[];
}

export default function NewProductPage() {
  const router = useRouter();

  // 카테고리 목록
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 기본 정보
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    categoryId: '',
    costPrice: '',
    basePrice: '',
    stockQuantity: '100',
    deliveryType: 'PAID',
    deliveryFee: '3000',
    freeShipOver: '',
    adultOnly: false,
    taxType: 'TAX' as 'TAX' | 'FREE',
  });

  // 검색 태그
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // 이미지
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [detailHtml, setDetailHtml] = useState('');

  // 옵션
  const [hasOptions, setHasOptions] = useState(false);
  const [options, setOptions] = useState<ProductOption[]>([]);

  // 플랫폼 선택
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['SHOP']);

  // 플랫폼별 설정
  const [platformSettings, setPlatformSettings] = useState<Record<string, { price?: string; categoryCode?: string; categoryName?: string }>>({});

  // 플랫폼별 추가 데이터
  const [platformSpecificData, setPlatformSpecificData] = useState<PlatformSpecificData>({
    COUPANG: { notices: {} },
    NAVER: { originAreaCode: '00', originContent: '' },
    SHOP: { isVisible: true },
  });

  // 탭 상태
  const [activeTab, setActiveTab] = useState('common');

  // 쿠팡/네이버 설정 상태
  const [coupangSettingsConfigured, setCoupangSettingsConfigured] = useState<boolean | null>(null);
  const [naverSettingsConfigured, setNaverSettingsConfigured] = useState<boolean | null>(null);
  const [isCoupangSettingsModalOpen, setIsCoupangSettingsModalOpen] = useState(false);

  // 저장/업로드 상태
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 카테고리 및 설정 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/shop/categories');
        const result = await response.json();
        if (result.success && result.data) {
          setCategories(result.data);
        }
      } catch (error) {
        console.error('카테고리 로드 오류:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();

    // 쿠팡 설정 확인
    const checkCoupangSettings = async () => {
      try {
        const response = await fetch('/api/coupang/settings');
        const result = await response.json();
        setCoupangSettingsConfigured(result.isConfigured);
      } catch (error) {
        console.error('쿠팡 설정 확인 오류:', error);
        setCoupangSettingsConfigured(false);
      }
    };
    checkCoupangSettings();

    // 네이버 설정 확인 (현재 미구현)
    setNaverSettingsConfigured(null);
  }, []);

  // 선택된 카테고리 정보
  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  // 검증 훅 사용
  const validation = useProductValidation({
    formData,
    platformSettings,
    platformSpecificData,
    selectedPlatforms,
    thumbnailUrl,
    images,
    coupangSettingsConfigured,
    naverSettingsConfigured,
  });

  // 탭 목록 생성
  const tabs = useMemo(() => {
    const tabList: Tab[] = [
      { id: 'common', label: '공통 정보', icon: <Package size={16} /> },
    ];

    if (selectedPlatforms.includes('COUPANG')) {
      tabList.push({
        id: 'coupang',
        label: '쿠팡',
        icon: <span className="w-3 h-3 rounded-full bg-orange-500" />,
        badge: validation.getTabBadge('COUPANG'),
      });
    }

    if (selectedPlatforms.includes('NAVER')) {
      tabList.push({
        id: 'naver',
        label: '네이버',
        icon: <span className="w-3 h-3 rounded-full bg-green-500" />,
        badge: validation.getTabBadge('NAVER'),
      });
    }

    if (selectedPlatforms.includes('SHOP')) {
      tabList.push({
        id: 'shop',
        label: '자사몰',
        icon: <span className="w-3 h-3 rounded-full bg-blue-500" />,
        badge: validation.getTabBadge('SHOP'),
      });
    }

    return tabList;
  }, [selectedPlatforms, validation]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      const newPlatforms = prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId];

      // 탭이 사라지면 공통 정보 탭으로 이동
      if (!newPlatforms.includes(platformId) && activeTab === platformId.toLowerCase()) {
        setActiveTab('common');
      }

      return newPlatforms;
    });
  };

  const addOption = () => {
    setOptions(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        groupName: '',
        values: [{ name: '', additionalPrice: 0 }],
      },
    ]);
  };

  const removeOption = (optionId: string) => {
    setOptions(prev => prev.filter(o => o.id !== optionId));
  };

  const addOptionValue = (optionId: string) => {
    setOptions(prev =>
      prev.map(opt =>
        opt.id === optionId
          ? { ...opt, values: [...opt.values, { name: '', additionalPrice: 0 }] }
          : opt
      )
    );
  };

  const handleSave = async (publish: boolean) => {
    if (publish) {
      setIsUploading(true);
    } else {
      setIsSaving(true);
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        categoryId: formData.categoryId || undefined,
        thumbnailUrl,
        images,
        costPrice: parseInt(formData.costPrice) || 0,
        basePrice: parseInt(formData.basePrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 100,
        options: hasOptions ? options.map(o => ({
          name: o.groupName,
          values: o.values.filter(v => v.name).map(v => v.name),
        })) : [],
        detailHtml,
        shippingFee: formData.deliveryType === 'FREE' ? 0 : parseInt(formData.deliveryFee) || 0,
        freeShipOver: formData.deliveryType === 'CONDITIONAL' ? parseInt(formData.freeShipOver) || null : null,
        deliveryType: formData.deliveryType,
        searchTags,
        notices: platformSpecificData.COUPANG.notices,
        adultOnly: formData.adultOnly,
        taxType: formData.taxType,
        status: publish ? 'READY' : 'DRAFT',
        platforms: publish ? selectedPlatforms : [],
        platformSettings: {
          ...platformSettings,
          COUPANG: {
            ...platformSettings.COUPANG,
            notices: platformSpecificData.COUPANG.notices,
          },
          NAVER: {
            ...platformSettings.NAVER,
            originAreaCode: platformSpecificData.NAVER.originAreaCode,
            originContent: platformSpecificData.NAVER.originContent,
          },
          SHOP: {
            ...platformSettings.SHOP,
            isVisible: platformSpecificData.SHOP.isVisible,
          },
        },
      };

      const response = await fetch('/api/products/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '저장 실패');
      }

      if (publish && selectedPlatforms.length > 0) {
        const uploadResponse = await fetch(`/api/products/master/${result.data.id}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platforms: selectedPlatforms,
            platformSettings: {
              ...platformSettings,
              COUPANG: {
                ...platformSettings.COUPANG,
                notices: platformSpecificData.COUPANG.notices,
              },
              NAVER: {
                ...platformSettings.NAVER,
                originAreaCode: platformSpecificData.NAVER.originAreaCode,
                originContent: platformSpecificData.NAVER.originContent,
              },
              SHOP: {
                ...platformSettings.SHOP,
                isVisible: platformSpecificData.SHOP.isVisible,
              },
            },
          }),
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResult.success) {
          const resultsObj = uploadResult.results as Record<string, { success: boolean; message: string }>;
          const resultValues = Object.values(resultsObj);
          const successCount = resultValues.filter(r => r.success).length;
          const failCount = resultValues.filter(r => !r.success).length;

          if (failCount > 0) {
            // 실패한 플랫폼이 있으면 상세 에러 표시하고 페이지 유지
            const failedPlatforms = Object.entries(resultsObj)
              .filter(([, result]) => !result.success)
              .map(([platform, result]) => `${platform}: ${result.message}`)
              .join('\n');
            alert(`등록 결과: 성공 ${successCount}개, 실패 ${failCount}개\n\n실패 상세:\n${failedPlatforms}`);
            // 실패 시 페이지 이동하지 않음
            return;
          } else {
            alert(`등록 완료: ${successCount}개 플랫폼에 성공적으로 등록되었습니다.`);
            router.push('/products');
          }
        } else {
          alert('플랫폼 등록 요청 중 오류가 발생했습니다.');
          // 실패 시 페이지 이동하지 않음
          return;
        }
      } else {
        alert('임시 저장되었습니다.');
        router.push('/products');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '저장에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  // 플랫폼별 수수료율 (%)
  const [platformFeeRates, setPlatformFeeRates] = useState<Record<string, number>>({
    COUPANG: 10.8,  // 쿠팡 기본 수수료 (카테고리별 상이)
    NAVER: 5.5,     // 네이버 기본 수수료
    SHOP: 0,        // 자사몰 (결제 수수료 제외)
  });

  const calculateMarginByPlatform = (platform: string) => {
    const cost = parseInt(formData.costPrice) || 0;
    const price = parseInt(formData.basePrice) || 0;
    const delivery = formData.deliveryType === 'FREE' ? 0 : (parseInt(formData.deliveryFee) || 0);

    if (price === 0) return { margin: '0.0', profit: 0 };

    const feeRate = (platformFeeRates[platform] || 0) / 100;
    const profit = price - cost - delivery - (price * feeRate);
    const margin = (profit / price) * 100;

    return {
      margin: margin.toFixed(1),
      profit: Math.round(profit),
    };
  };

  return (
    <DashboardLayout
      title="새 상품 등록"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: '상품 등록' },
      ]}
    >
      {/* 플랫폼 선택 - 최상단 */}
      <Card title="등록 플랫폼 선택" subtitle="상품을 등록할 플랫폼을 선택하세요" className="mb-6">
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <label
              key={platform.id}
              className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                selectedPlatforms.includes(platform.id)
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform.id)}
                onChange={() => togglePlatform(platform.id)}
                className="w-4 h-4 rounded"
              />
              <span className={`w-3 h-3 rounded-full ${platform.color}`} />
              <span className="text-sm font-medium">{platform.label}</span>
              {selectedPlatforms.includes(platform.id) && (
                <CheckCircle2 size={16} className="text-blue-500" />
              )}
            </label>
          ))}
        </div>

        {selectedPlatforms.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">최소 1개 이상의 플랫폼을 선택해주세요.</p>
        )}
      </Card>

      {/* 탭 네비게이션 */}
      <Card className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
          {/* 공통 정보 탭 */}
          <TabPanel id="common" activeTab={activeTab}>
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
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="브랜드"
                        placeholder="브랜드명"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                      />
                      <Select
                        label="카테고리"
                        options={[
                          { value: '', label: loadingCategories ? '로딩 중...' : '카테고리 선택' },
                          ...categories.map(c => ({ value: c.id, label: c.name })),
                        ]}
                        value={formData.categoryId}
                        onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        상품 설명
                      </label>
                      <textarea
                        className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        placeholder="상품 설명을 입력하세요"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                {/* 이미지 */}
                <Card title="상품 이미지" subtitle="파일 업로드 또는 URL로 이미지를 등록하세요">
                  <ImageUploader
                    images={images}
                    onChange={setImages}
                    maxImages={9}
                    thumbnail
                    thumbnailUrl={thumbnailUrl}
                    onThumbnailChange={setThumbnailUrl}
                  />
                </Card>

                {/* 상세 설명 */}
                <Card title="상세 설명" subtitle="이미지 업로드 또는 HTML 직접 입력">
                  <DetailImageUploader
                    value={detailHtml}
                    onChange={setDetailHtml}
                  />
                </Card>

                {/* 옵션 */}
                <Card
                  title="상품 옵션"
                  subtitle="옵션명과 옵션값을 입력하세요"
                  actions={
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasOptions}
                        onChange={(e) => setHasOptions(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">옵션 사용</span>
                    </label>
                  }
                >
                  {hasOptions ? (
                    <div className="space-y-4">
                      {options.map((option) => (
                        <div key={option.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Input
                              placeholder="옵션명 (예: 색상, 사이즈)"
                              value={option.groupName}
                              onChange={(e) =>
                                setOptions(prev =>
                                  prev.map(o =>
                                    o.id === option.id ? { ...o, groupName: e.target.value } : o
                                  )
                                )
                              }
                              className="flex-1"
                            />
                            <button
                              onClick={() => removeOption(option.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value, vIndex) => (
                              <div key={vIndex} className="flex items-center gap-1 bg-gray-100 rounded-lg pl-3 pr-1 py-1">
                                <input
                                  type="text"
                                  placeholder="옵션값"
                                  value={value.name}
                                  onChange={(e) =>
                                    setOptions(prev =>
                                      prev.map(o =>
                                        o.id === option.id
                                          ? {
                                              ...o,
                                              values: o.values.map((v, i) =>
                                                i === vIndex ? { ...v, name: e.target.value } : v
                                              ),
                                            }
                                          : o
                                      )
                                    )
                                  }
                                  className="w-20 bg-transparent text-sm focus:outline-none"
                                />
                                <button
                                  onClick={() =>
                                    setOptions(prev =>
                                      prev.map(o =>
                                        o.id === option.id
                                          ? { ...o, values: o.values.filter((_, i) => i !== vIndex) }
                                          : o
                                      )
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addOptionValue(option.id)}
                              className="px-3 py-1 text-sm text-blue-500 border border-blue-300 rounded-lg hover:bg-blue-50"
                            >
                              + 추가
                            </button>
                          </div>
                        </div>
                      ))}
                      <Button variant="secondary" onClick={addOption} className="w-full">
                        <Plus size={16} className="mr-1" />
                        옵션 그룹 추가
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">옵션을 사용하려면 위의 체크박스를 활성화하세요.</p>
                  )}
                </Card>
              </div>

              {/* 사이드바 */}
              <div className="lg:col-span-1 space-y-6">
                {/* 가격 설정 */}
                <Card title="가격 설정">
                  <div className="space-y-4">
                    <Input
                      label="원가"
                      type="number"
                      placeholder="0"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                    />
                    <Input
                      label="기본 판매가"
                      type="number"
                      placeholder="0"
                      value={formData.basePrice}
                      onChange={(e) => handleInputChange('basePrice', e.target.value)}
                      required
                    />

                    {/* 옵션별 가격 설정 */}
                    {hasOptions && options.some(o => o.groupName && o.values.some(v => v.name)) && (
                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          옵션별 추가금
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {options.map((option) =>
                            option.values
                              .filter(v => v.name)
                              .map((value, vIndex) => (
                                <div
                                  key={`${option.id}-${vIndex}`}
                                  className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
                                >
                                  <span className="text-sm text-gray-700">
                                    {option.groupName}: <strong>{value.name}</strong>
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-gray-500">+</span>
                                    <input
                                      type="number"
                                      value={value.additionalPrice}
                                      onChange={(e) =>
                                        setOptions(prev =>
                                          prev.map(o =>
                                            o.id === option.id
                                              ? {
                                                  ...o,
                                                  values: o.values.map((v, i) =>
                                                    i === vIndex
                                                      ? { ...v, additionalPrice: parseInt(e.target.value) || 0 }
                                                      : v
                                                  ),
                                                }
                                              : o
                                          )
                                        )
                                      }
                                      className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-500">원</span>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* 플랫폼별 마진 계산 */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">플랫폼별 예상 마진</p>
                      <div className="space-y-3">
                        {selectedPlatforms.map((platformId) => {
                          const platform = platforms.find(p => p.id === platformId);
                          const { margin, profit } = calculateMarginByPlatform(platformId);
                          return (
                            <div key={platformId} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${platform?.color}`} />
                                  <span className="text-sm font-medium">{platform?.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">수수료</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={platformFeeRates[platformId]}
                                    onChange={(e) => setPlatformFeeRates(prev => ({
                                      ...prev,
                                      [platformId]: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-16 px-2 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-500">%</span>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">순이익 / 마진율</span>
                                <span className={`font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {profit.toLocaleString()}원 ({margin}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {selectedPlatforms.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-2">플랫폼을 선택하세요</p>
                        )}
                      </div>
                    </div>

                    {selectedPlatforms.some(p => {
                      const { margin } = calculateMarginByPlatform(p);
                      return parseFloat(margin) > 0 && parseFloat(margin) < 15;
                    }) && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700">일부 플랫폼의 마진율이 15% 미만입니다.</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 배송 설정 */}
                <Card title="배송 설정">
                  <div className="space-y-4">
                    <Select
                      label="배송비 유형"
                      options={[
                        { value: 'FREE', label: '무료배송' },
                        { value: 'PAID', label: '유료배송' },
                        { value: 'CONDITIONAL', label: '조건부 무료배송' },
                      ]}
                      value={formData.deliveryType}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                    />
                    {formData.deliveryType !== 'FREE' && (
                      <Input
                        label="배송비"
                        type="number"
                        placeholder="3000"
                        value={formData.deliveryFee}
                        onChange={(e) => handleInputChange('deliveryFee', e.target.value)}
                      />
                    )}
                    {formData.deliveryType === 'CONDITIONAL' && (
                      <Input
                        label="무료배송 기준금액"
                        type="number"
                        placeholder="50000"
                        value={formData.freeShipOver}
                        onChange={(e) => handleInputChange('freeShipOver', e.target.value)}
                      />
                    )}
                  </div>
                </Card>

                {/* 재고 및 추가 설정 */}
                <Card title="재고 및 추가 설정">
                  <div className="space-y-4">
                    <Input
                      label="재고 수량"
                      type="number"
                      placeholder="100"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                      helperText="판매 가능한 재고 수량"
                    />

                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-gray-700">성인 상품</span>
                          <p className="text-xs text-gray-500 mt-0.5">19세 미만 구매 불가 상품</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.adultOnly}
                          onChange={(e) => handleInputChange('adultOnly', e.target.checked)}
                          className="w-5 h-5 rounded"
                        />
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">과세 유형</label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="taxType"
                              value="TAX"
                              checked={formData.taxType === 'TAX'}
                              onChange={(e) => handleInputChange('taxType', e.target.value)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">과세</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="taxType"
                              value="FREE"
                              checked={formData.taxType === 'FREE'}
                              onChange={(e) => handleInputChange('taxType', e.target.value)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">면세 (농수산물 등)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 검색 태그 */}
                <Card title="검색 태그" subtitle="검색 노출을 위한 키워드 (최대 10개)">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="태그 입력 후 Enter"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTag.trim() && searchTags.length < 10) {
                            e.preventDefault();
                            if (!searchTags.includes(newTag.trim())) {
                              setSearchTags(prev => [...prev, newTag.trim()]);
                            }
                            setNewTag('');
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (newTag.trim() && searchTags.length < 10 && !searchTags.includes(newTag.trim())) {
                            setSearchTags(prev => [...prev, newTag.trim()]);
                            setNewTag('');
                          }
                        }}
                        disabled={!newTag.trim() || searchTags.length >= 10}
                      >
                        추가
                      </Button>
                    </div>
                    {searchTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {searchTags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            #{tag}
                            <button
                              onClick={() => setSearchTags(prev => prev.filter((_, i) => i !== index))}
                              className="hover:text-blue-900"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">{searchTags.length}/10개</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabPanel>

          {/* 쿠팡 탭 */}
          <TabPanel id="coupang" activeTab={activeTab}>
            <CoupangTab
              coupangSettingsConfigured={coupangSettingsConfigured}
              onOpenSettings={() => setIsCoupangSettingsModalOpen(true)}
              categoryCode={platformSettings.COUPANG?.categoryCode}
              categoryName={platformSettings.COUPANG?.categoryName}
              linkedCategoryCode={selectedCategory?.coupangCategoryCode}
              onCategorySelect={(code, name) =>
                setPlatformSettings(prev => ({
                  ...prev,
                  COUPANG: { ...prev.COUPANG, categoryCode: code, categoryName: name },
                }))
              }
              onCategoryRemove={() =>
                setPlatformSettings(prev => ({
                  ...prev,
                  COUPANG: { ...prev.COUPANG, categoryCode: undefined, categoryName: undefined },
                }))
              }
              notices={platformSpecificData.COUPANG.notices}
              onNoticesChange={(notices) =>
                setPlatformSpecificData(prev => ({
                  ...prev,
                  COUPANG: { ...prev.COUPANG, notices },
                }))
              }
              validation={validation.coupang}
              productName={formData.name}
            />
          </TabPanel>

          {/* 네이버 탭 */}
          <TabPanel id="naver" activeTab={activeTab}>
            <NaverTab
              naverSettingsConfigured={naverSettingsConfigured}
              categoryCode={platformSettings.NAVER?.categoryCode}
              categoryName={platformSettings.NAVER?.categoryName}
              linkedCategoryCode={selectedCategory?.naverCategoryId}
              onCategorySelect={(code, name) =>
                setPlatformSettings(prev => ({
                  ...prev,
                  NAVER: { ...prev.NAVER, categoryCode: code, categoryName: name },
                }))
              }
              onCategoryRemove={() =>
                setPlatformSettings(prev => ({
                  ...prev,
                  NAVER: { ...prev.NAVER, categoryCode: undefined, categoryName: undefined },
                }))
              }
              originAreaCode={platformSpecificData.NAVER.originAreaCode}
              originContent={platformSpecificData.NAVER.originContent}
              onOriginChange={(areaCode, content) =>
                setPlatformSpecificData(prev => ({
                  ...prev,
                  NAVER: { ...prev.NAVER, originAreaCode: areaCode, originContent: content },
                }))
              }
              validation={validation.naver}
              productName={formData.name}
            />
          </TabPanel>

          {/* 자사몰 탭 */}
          <TabPanel id="shop" activeTab={activeTab}>
            <ShopTab
              isVisible={platformSpecificData.SHOP.isVisible}
              onVisibilityChange={(visible) =>
                setPlatformSpecificData(prev => ({
                  ...prev,
                  SHOP: { ...prev.SHOP, isVisible: visible },
                }))
              }
              stockQuantity={formData.stockQuantity}
              onStockChange={(quantity) => handleInputChange('stockQuantity', quantity)}
              validation={validation.shop}
            />
          </TabPanel>
        </Tabs>
      </Card>

      {/* 액션 버튼 (하단 고정) */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 mt-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* 선택된 플랫폼 요약 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">선택된 플랫폼:</span>
            <div className="flex gap-2">
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find(p => p.id === platformId);
                const canRegister = validation.canRegister(platformId);
                return (
                  <span
                    key={platformId}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                      canRegister
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${platform?.color}`} />
                    {platform?.label}
                    {canRegister ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => handleSave(false)}
              loading={isSaving}
            >
              <Save size={16} className="mr-2" />
              임시 저장
            </Button>
            <Button
              onClick={() => handleSave(true)}
              loading={isUploading}
              disabled={!formData.name || !formData.basePrice || selectedPlatforms.length === 0 || !validation.canRegisterAll()}
            >
              <Upload size={16} className="mr-2" />
              선택 플랫폼에 등록
            </Button>
          </div>
        </div>

        {/* 등록 불가 사유 표시 */}
        {selectedPlatforms.length > 0 && !validation.canRegisterAll() && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg max-w-7xl mx-auto">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">등록 불가 사유:</p>
                <ul className="list-disc list-inside mt-1">
                  {selectedPlatforms.map((platformId) => {
                    if (validation.canRegister(platformId)) return null;
                    const validationResult = platformId === 'COUPANG' ? validation.coupang : platformId === 'NAVER' ? validation.naver : validation.shop;
                    return validationResult.missingFields.map((field, idx) => (
                      <li key={`${platformId}-${idx}`}>
                        {platforms.find(p => p.id === platformId)?.label}: {field}
                      </li>
                    ));
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 쿠팡 설정 모달 */}
      <CoupangSettingsModal
        isOpen={isCoupangSettingsModalOpen}
        onClose={() => setIsCoupangSettingsModalOpen(false)}
        onSaved={() => {
          const checkCoupangSettings = async () => {
            try {
              const response = await fetch('/api/coupang/settings');
              const result = await response.json();
              setCoupangSettingsConfigured(result.isConfigured);
            } catch (error) {
              console.error('쿠팡 설정 확인 오류:', error);
            }
          };
          checkCoupangSettings();
        }}
      />
    </DashboardLayout>
  );
}
