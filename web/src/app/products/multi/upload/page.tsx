'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input, Select } from '@/components/ui';
import {
  Save,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Link2,
  Loader2,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

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

// 플랫폼 카테고리 타입
interface PlatformCategory {
  code: string;
  name: string;
  fullPath?: string;
  isLeaf?: boolean;
}

// 모든 옵션 조합 생성 함수
function generateOptionCombinations(options: ProductOption[]): { combination: string; additionalPrice: number }[] {
  if (options.length === 0) return [];

  const validOptions = options.filter(o => o.groupName && o.values.some(v => v.name));
  if (validOptions.length === 0) return [];

  const combinations: { combination: string; additionalPrice: number }[] = [];

  function generate(index: number, current: string[], totalPrice: number) {
    if (index === validOptions.length) {
      combinations.push({
        combination: current.join(' / '),
        additionalPrice: totalPrice,
      });
      return;
    }

    const option = validOptions[index];
    for (const value of option.values) {
      if (value.name) {
        generate(index + 1, [...current, value.name], totalPrice + value.additionalPrice);
      }
    }
  }

  generate(0, [], 0);
  return combinations;
}

export default function MultiPlatformUploadPage() {
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
    deliveryType: 'PAID',
    deliveryFee: '3000',
    freeShipOver: '',
  });

  // 이미지
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [detailHtml, setDetailHtml] = useState('');

  // 카테고리 및 쿠팡 설정 로드
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

    // 쿠팡 기본 설정 확인
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
  }, []);

  // 선택된 카테고리 정보
  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  // 옵션
  const [hasOptions, setHasOptions] = useState(false);
  const [options, setOptions] = useState<ProductOption[]>([]);

  // 플랫폼 선택
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['SHOP']);

  // 플랫폼별 설정 (가격 차등 등)
  const [platformSettings, setPlatformSettings] = useState<Record<string, { price?: string; categoryCode?: string; categoryName?: string }>>({});

  // 플랫폼 카테고리 검색
  const [showCategorySearch, setShowCategorySearch] = useState<'COUPANG' | 'NAVER' | null>(null);
  const [categorySearchKeyword, setCategorySearchKeyword] = useState('');
  const [categorySearchResults, setCategorySearchResults] = useState<PlatformCategory[]>([]);
  const [isSearchingCategory, setIsSearchingCategory] = useState(false);

  // 고급 설정 펼침
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 쿠팡 기본 설정 상태
  const [coupangSettingsConfigured, setCoupangSettingsConfigured] = useState<boolean | null>(null);

  // 저장/업로드 상태
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 플랫폼 카테고리 검색
  const searchPlatformCategories = async (platform: 'COUPANG' | 'NAVER', keyword: string) => {
    if (!keyword.trim()) {
      setCategorySearchResults([]);
      return;
    }

    setIsSearchingCategory(true);
    try {
      const response = await fetch(`/api/platform/categories?platform=${platform}&keyword=${encodeURIComponent(keyword)}`);
      const result = await response.json();
      if (result.success) {
        setCategorySearchResults(result.data || []);
      } else {
        console.error('카테고리 검색 실패:', result.error);
        setCategorySearchResults([]);
      }
    } catch (error) {
      console.error('카테고리 검색 오류:', error);
      setCategorySearchResults([]);
    } finally {
      setIsSearchingCategory(false);
    }
  };

  // 상품명으로 카테고리 자동 추천
  const predictCategory = async (platform: 'COUPANG' | 'NAVER') => {
    if (!formData.name.trim()) {
      alert('상품명을 먼저 입력해주세요.');
      return;
    }

    setIsSearchingCategory(true);
    try {
      const response = await fetch(`/api/platform/categories?platform=${platform}&predict=${encodeURIComponent(formData.name)}`);
      const result = await response.json();
      if (result.success && result.data?.length > 0) {
        setCategorySearchResults(result.data);
      } else {
        alert('추천 카테고리를 찾지 못했습니다. 직접 검색해주세요.');
      }
    } catch (error) {
      console.error('카테고리 추천 오류:', error);
    } finally {
      setIsSearchingCategory(false);
    }
  };

  // 플랫폼 카테고리 선택
  const selectPlatformCategory = (platform: 'COUPANG' | 'NAVER', category: PlatformCategory) => {
    setPlatformSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        categoryCode: category.code,
        categoryName: category.fullPath || category.name,
      },
    }));
    setShowCategorySearch(null);
    setCategorySearchKeyword('');
    setCategorySearchResults([]);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
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
      // 마스터 상품 생성
      const productData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        categoryId: formData.categoryId || undefined,
        thumbnailUrl,
        images,
        costPrice: parseInt(formData.costPrice) || 0,
        basePrice: parseInt(formData.basePrice) || 0,
        options: hasOptions ? options.map(o => ({
          name: o.groupName,
          values: o.values.filter(v => v.name).map(v => v.name),
        })) : [],
        detailHtml,
        shippingFee: formData.deliveryType === 'FREE' ? 0 : parseInt(formData.deliveryFee) || 0,
        freeShipOver: formData.deliveryType === 'CONDITIONAL' ? parseInt(formData.freeShipOver) || null : null,
        status: publish ? 'READY' : 'DRAFT',
        platforms: publish ? selectedPlatforms : [],
        platformSettings,
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

      // 플랫폼에 등록 요청
      if (publish && selectedPlatforms.length > 0) {
        const uploadResponse = await fetch(`/api/products/master/${result.data.id}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platforms: selectedPlatforms }),
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResult.success) {
          const successCount = uploadResult.results.filter((r: { success: boolean }) => r.success).length;
          const failCount = uploadResult.results.filter((r: { success: boolean }) => !r.success).length;
          alert(`등록 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
        } else {
          alert('플랫폼 등록 요청 중 오류가 발생했습니다.');
        }
      } else {
        alert('임시 저장되었습니다.');
      }

      router.push('/products/multi');
    } catch (error) {
      console.error('저장 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '저장에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const calculateMargin = () => {
    const cost = parseInt(formData.costPrice) || 0;
    const price = parseInt(formData.basePrice) || 0;
    const delivery = parseInt(formData.deliveryFee) || 0;

    if (price === 0) return { margin: 0, profit: 0 };

    const avgFeeRate = 0.1; // 평균 10% 수수료 가정
    const profit = price - cost - delivery - (price * avgFeeRate);
    const margin = (profit / price) * 100;

    return {
      margin: margin.toFixed(1),
      profit: Math.round(profit),
    };
  };

  const { margin, profit } = calculateMargin();

  return (
    <DashboardLayout
      title="통합 상품 등록"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '통합 상품', href: '/products/multi' },
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
              {/* 플랫폼별 카테고리 설정 */}
              {(selectedPlatforms.includes('COUPANG') || selectedPlatforms.includes('NAVER')) && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-gray-700">플랫폼 카테고리 설정</p>

                  {/* 쿠팡 카테고리 */}
                  {selectedPlatforms.includes('COUPANG') && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500" />
                          <span className="text-sm font-medium">쿠팡 카테고리</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategorySearch(showCategorySearch === 'COUPANG' ? null : 'COUPANG');
                            setCategorySearchKeyword('');
                            setCategorySearchResults([]);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Search size={12} />
                          {showCategorySearch === 'COUPANG' ? '닫기' : '검색'}
                        </button>
                      </div>

                      {/* 현재 설정된 카테고리 표시 */}
                      {platformSettings.COUPANG?.categoryCode ? (
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                          <span className="text-green-700 truncate flex-1">
                            {platformSettings.COUPANG.categoryName || platformSettings.COUPANG.categoryCode}
                          </span>
                          <button
                            onClick={() => setPlatformSettings(prev => ({
                              ...prev,
                              COUPANG: { ...prev.COUPANG, categoryCode: undefined, categoryName: undefined }
                            }))}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : selectedCategory?.coupangCategoryCode ? (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                          <Link2 size={12} className="text-blue-500" />
                          <span className="text-blue-700">카테고리 매핑 사용: {selectedCategory.coupangCategoryCode}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-red-500">카테고리 미설정</p>
                      )}

                      {/* 카테고리 검색 UI */}
                      {showCategorySearch === 'COUPANG' && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="카테고리 검색어 입력"
                              value={categorySearchKeyword}
                              onChange={(e) => setCategorySearchKeyword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  searchPlatformCategories('COUPANG', categorySearchKeyword);
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => searchPlatformCategories('COUPANG', categorySearchKeyword)}
                              disabled={isSearchingCategory}
                            >
                              {isSearchingCategory ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                            </Button>
                          </div>
                          <button
                            type="button"
                            onClick={() => predictCategory('COUPANG')}
                            className="text-xs text-purple-600 hover:text-purple-800"
                            disabled={isSearchingCategory}
                          >
                            상품명으로 카테고리 자동 추천
                          </button>

                          {/* 검색 결과 */}
                          {categorySearchResults.length > 0 && (
                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                              {categorySearchResults.map((cat) => (
                                <button
                                  key={cat.code}
                                  type="button"
                                  onClick={() => selectPlatformCategory('COUPANG', cat)}
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 border-b border-gray-100 last:border-0"
                                >
                                  <span className="font-medium">{cat.name}</span>
                                  {cat.fullPath && (
                                    <span className="block text-gray-500 truncate">{cat.fullPath}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 네이버 카테고리 */}
                  {selectedPlatforms.includes('NAVER') && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-sm font-medium">네이버 카테고리</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategorySearch(showCategorySearch === 'NAVER' ? null : 'NAVER');
                            setCategorySearchKeyword('');
                            setCategorySearchResults([]);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Search size={12} />
                          {showCategorySearch === 'NAVER' ? '닫기' : '검색'}
                        </button>
                      </div>

                      {/* 현재 설정된 카테고리 표시 */}
                      {platformSettings.NAVER?.categoryCode ? (
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                          <span className="text-green-700 truncate flex-1">
                            {platformSettings.NAVER.categoryName || platformSettings.NAVER.categoryCode}
                          </span>
                          <button
                            onClick={() => setPlatformSettings(prev => ({
                              ...prev,
                              NAVER: { ...prev.NAVER, categoryCode: undefined, categoryName: undefined }
                            }))}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : selectedCategory?.naverCategoryId ? (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                          <Link2 size={12} className="text-blue-500" />
                          <span className="text-blue-700">카테고리 매핑 사용: {selectedCategory.naverCategoryId}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-red-500">카테고리 미설정</p>
                      )}

                      {/* 카테고리 검색 UI */}
                      {showCategorySearch === 'NAVER' && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="카테고리 검색어 입력"
                              value={categorySearchKeyword}
                              onChange={(e) => setCategorySearchKeyword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  searchPlatformCategories('NAVER', categorySearchKeyword);
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => searchPlatformCategories('NAVER', categorySearchKeyword)}
                              disabled={isSearchingCategory}
                            >
                              {isSearchingCategory ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                            </Button>
                          </div>

                          {/* 검색 결과 */}
                          {categorySearchResults.length > 0 && (
                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                              {categorySearchResults.map((cat) => (
                                <button
                                  key={cat.code}
                                  type="button"
                                  onClick={() => selectPlatformCategory('NAVER', cat)}
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 border-b border-gray-100 last:border-0"
                                >
                                  <span className="font-medium">{cat.name}</span>
                                  {cat.fullPath && (
                                    <span className="block text-gray-500 truncate">{cat.fullPath}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 안내 메시지 */}
                  <p className="text-xs text-gray-500">
                    자사몰 카테고리에 플랫폼 매핑이 설정되어 있으면 자동으로 적용됩니다.
                    개별 상품에서 직접 지정하면 해당 설정이 우선 적용됩니다.
                  </p>
                </div>
              )}
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
          <Card title="상품 이미지" subtitle="대표 이미지와 추가 이미지를 등록하세요">
            <div className="space-y-4">
              {/* 대표 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">대표 이미지</label>
                <div className="flex items-start gap-4">
                  {thumbnailUrl ? (
                    <div className="relative">
                      <img
                        src={thumbnailUrl}
                        alt="대표 이미지"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setThumbnailUrl('')}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={24} />
                      <span className="text-xs mt-1">대표 이미지</span>
                    </div>
                  )}
                  <Input
                    placeholder="이미지 URL 입력"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* 추가 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">추가 이미지</label>
                <div className="grid grid-cols-4 gap-3">
                  {images.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`이미지 ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {images.length < 9 && (
                    <button
                      onClick={() => {
                        const url = prompt('이미지 URL을 입력하세요');
                        if (url) setImages(prev => [...prev, url]);
                      }}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500"
                    >
                      <Plus size={20} />
                      <span className="text-xs mt-1">추가</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* 상세 설명 */}
          <Card title="상세 설명 (HTML)">
            <textarea
              className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              rows={10}
              placeholder="<div>상세 설명 HTML을 입력하세요...</div>"
              value={detailHtml}
              onChange={(e) => setDetailHtml(e.target.value)}
            />
          </Card>

          {/* 옵션 */}
          <Card
            title="상품 옵션"
            subtitle="옵션명과 옵션값을 입력하세요. 가격은 아래 '가격 설정'에서 설정합니다."
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
                  {formData.basePrice && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        예: 기본가 {parseInt(formData.basePrice).toLocaleString()}원 + 추가금
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 마진 계산 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">예상 순이익</span>
                  <span className={`font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">마진율</span>
                  <span className={`font-bold ${parseFloat(String(margin)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margin}%
                  </span>
                </div>
              </div>

              {parseFloat(String(margin)) > 0 && parseFloat(String(margin)) < 15 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    마진율이 15% 미만입니다.
                  </p>
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

          {/* 플랫폼 선택 */}
          <Card title="등록 플랫폼">
            <div className="space-y-3">
              {platforms.map((platform) => (
                <label
                  key={platform.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-blue-500 bg-blue-50'
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
                  <span className="flex-1 text-sm font-medium">{platform.label}</span>
                  {selectedPlatforms.includes(platform.id) && (
                    <CheckCircle2 size={16} className="text-blue-500" />
                  )}
                </label>
              ))}
            </div>

            {/* 플랫폼별 가격 설정 */}
            {selectedPlatforms.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  플랫폼별 가격 설정
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-3">
                    {selectedPlatforms.map((platformId) => (
                      <div key={platformId} className="text-sm">
                        <span className="text-gray-600">
                          {platforms.find(p => p.id === platformId)?.label}
                        </span>
                        <Input
                          type="number"
                          placeholder={formData.basePrice || '기본가 사용'}
                          value={platformSettings[platformId]?.price || ''}
                          onChange={(e) =>
                            setPlatformSettings(prev => ({
                              ...prev,
                              [platformId]: { ...prev[platformId], price: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 쿠팡 설정 경고 */}
            {selectedPlatforms.includes('COUPANG') && coupangSettingsConfigured === false && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-700 font-medium">쿠팡 기본 설정 필요</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      출고지, 반품지, 배송비 등 기본 설정을 먼저 완료해주세요.
                    </p>
                    <Link
                      href="/products/coupang/settings"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-orange-600 hover:text-orange-800 font-medium"
                    >
                      <Settings size={12} />
                      기본 설정하러 가기
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {selectedPlatforms.includes('COUPANG') && coupangSettingsConfigured === true && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">쿠팡 기본 설정 완료</span>
                </div>
              </div>
            )}
          </Card>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => handleSave(true)}
              loading={isUploading}
              disabled={!formData.name || !formData.basePrice || selectedPlatforms.length === 0 || (selectedPlatforms.includes('COUPANG') && coupangSettingsConfigured === false)}
            >
              <Upload size={16} className="mr-2" />
              선택 플랫폼에 등록하기
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleSave(false)}
              loading={isSaving}
            >
              <Save size={16} className="mr-2" />
              임시 저장
            </Button>
          </div>

          {/* 안내 */}
          <div className="text-sm text-gray-500">
            <p className="mb-2">선택된 플랫폼:</p>
            <div className="flex flex-wrap gap-2">
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find(p => p.id === platformId);
                return (
                  <span
                    key={platformId}
                    className="px-2 py-1 bg-gray-100 rounded text-xs flex items-center gap-1"
                  >
                    <span className={`w-2 h-2 rounded-full ${platform?.color}`} />
                    {platform?.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
