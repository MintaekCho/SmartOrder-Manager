'use client';

import { useState, useEffect, useMemo, use } from 'react';
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
  Package,
  Loader2,
  RefreshCw,
  ExternalLink,
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

interface PlatformProduct {
  id: string;
  platform: string;
  platformProductId: string | null;
  status: string;
  lastSyncedAt: string | null;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // 초기 로딩
  const [loading, setLoading] = useState(true);

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

  // 플랫폼 선택 (새로 등록할 플랫폼)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // 이미 등록된 플랫폼
  const [platformProducts, setPlatformProducts] = useState<PlatformProduct[]>([]);

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
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 카테고리 로드
        const catResponse = await fetch('/api/shop/categories');
        const catResult = await catResponse.json();
        if (catResult.success && catResult.data) {
          setCategories(catResult.data);
        }
        setLoadingCategories(false);

        // 쿠팡 설정 확인
        try {
          const settingsResponse = await fetch('/api/coupang/settings');
          const settingsResult = await settingsResponse.json();
          setCoupangSettingsConfigured(settingsResult.isConfigured);
        } catch {
          setCoupangSettingsConfigured(false);
        }

        // 네이버 설정 확인 (현재 미구현)
        setNaverSettingsConfigured(null);

        // 상품 데이터 로드
        const response = await fetch(`/api/products/master/${id}`);
        const result = await response.json();

        if (result.success && result.data) {
          const product = result.data;

          // 플랫폼 제품 정보 저장
          if (product.platformProducts) {
            setPlatformProducts(product.platformProducts);
          }

          setFormData({
            name: product.name || '',
            description: product.description || '',
            brand: product.brand || '',
            categoryId: product.categoryId || '',
            costPrice: product.costPrice?.toString() || '',
            basePrice: product.basePrice?.toString() || '',
            stockQuantity: '100',
            deliveryType: product.shippingFee === 0
              ? (product.freeShipOver ? 'CONDITIONAL' : 'FREE')
              : 'PAID',
            deliveryFee: product.shippingFee?.toString() || '3000',
            freeShipOver: product.freeShipOver?.toString() || '',
            adultOnly: product.adultOnly || false,
            taxType: product.taxType || 'TAX',
          });

          setThumbnailUrl(product.thumbnailUrl || '');
          setImages(product.images || []);
          setDetailHtml(product.detailHtml || '');
          setSearchTags(product.searchTags || []);

          // 옵션 변환
          if (product.options && product.options.length > 0) {
            setHasOptions(true);
            setOptions(product.options.map((opt: { name: string; values: string[] }, index: number) => ({
              id: `opt-${index}`,
              groupName: opt.name,
              values: opt.values.map((v: string) => ({ name: v, additionalPrice: 0 })),
            })));
          }

          // 플랫폼 설정 로드
          if (product.platformSettings) {
            setPlatformSettings(product.platformSettings);

            // platformSpecificData도 복원
            if (product.platformSettings.COUPANG?.notices) {
              setPlatformSpecificData(prev => ({
                ...prev,
                COUPANG: { notices: product.platformSettings.COUPANG.notices },
              }));
            }
            if (product.platformSettings.NAVER) {
              setPlatformSpecificData(prev => ({
                ...prev,
                NAVER: {
                  originAreaCode: product.platformSettings.NAVER.originAreaCode || '00',
                  originContent: product.platformSettings.NAVER.originContent || '',
                },
              }));
            }
            if (product.platformSettings.SHOP) {
              setPlatformSpecificData(prev => ({
                ...prev,
                SHOP: {
                  isVisible: product.platformSettings.SHOP.isVisible ?? true,
                },
              }));
            }
          }
        } else {
          alert('상품을 찾을 수 없습니다.');
          router.push('/products');
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        alert('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  // 선택된 카테고리 정보
  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  // 등록되지 않은 플랫폼 목록
  const unregisteredPlatforms = platforms.filter(
    p => !platformProducts.some(pp => pp.platform === p.id && pp.platformProductId)
  );

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

    // 선택된 플랫폼 + 이미 등록된 플랫폼 탭 표시
    const platformsToShow = [...new Set([
      ...selectedPlatforms,
      ...platformProducts.filter(pp => pp.platformProductId).map(pp => pp.platform),
    ])];

    if (platformsToShow.includes('COUPANG')) {
      tabList.push({
        id: 'coupang',
        label: '쿠팡',
        icon: <span className="w-3 h-3 rounded-full bg-orange-500" />,
        badge: validation.getTabBadge('COUPANG'),
      });
    }

    if (platformsToShow.includes('NAVER')) {
      tabList.push({
        id: 'naver',
        label: '네이버',
        icon: <span className="w-3 h-3 rounded-full bg-green-500" />,
        badge: validation.getTabBadge('NAVER'),
      });
    }

    if (platformsToShow.includes('SHOP')) {
      tabList.push({
        id: 'shop',
        label: '자사몰',
        icon: <span className="w-3 h-3 rounded-full bg-blue-500" />,
        badge: validation.getTabBadge('SHOP'),
      });
    }

    return tabList;
  }, [selectedPlatforms, platformProducts, validation]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      const newPlatforms = prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId];

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

  // 저장하기
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }
    if (!formData.basePrice) {
      alert('판매가를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        categoryId: formData.categoryId || null,
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
        searchTags,
        adultOnly: formData.adultOnly,
        taxType: formData.taxType,
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

      const response = await fetch(`/api/products/master/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        alert('상품이 저장되었습니다.');
      } else {
        throw new Error(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 새 플랫폼에 등록
  const handleUploadToPlatforms = async () => {
    if (selectedPlatforms.length === 0) {
      alert('등록할 플랫폼을 선택해주세요.');
      return;
    }

    if (!formData.name.trim() || !formData.basePrice) {
      alert('상품명과 판매가를 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      await handleSave();

      const uploadResponse = await fetch(`/api/products/master/${id}/upload`, {
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
        const resultsObj = uploadResult.results as Record<string, { success: boolean; message: string; productId?: string }>;
        const resultValues = Object.values(resultsObj);
        const successCount = resultValues.filter(r => r.success).length;
        const failCount = resultValues.filter(r => !r.success).length;

        for (const [platform, result] of Object.entries(resultsObj)) {
          if (result.success && result.productId) {
            setPlatformProducts(prev => {
              const existing = prev.find(pp => pp.platform === platform);
              if (existing) {
                return prev.map(pp =>
                  pp.platform === platform
                    ? { ...pp, platformProductId: result.productId!, status: 'ACTIVE' }
                    : pp
                );
              } else {
                return [...prev, {
                  id: `new-${platform}`,
                  platform,
                  platformProductId: result.productId!,
                  status: 'ACTIVE',
                  lastSyncedAt: new Date().toISOString(),
                }];
              }
            });
          }
        }

        setSelectedPlatforms([]);

        if (failCount > 0) {
          const failedPlatforms = Object.entries(resultsObj)
            .filter(([, r]) => !r.success)
            .map(([platform, r]) => `${platform}: ${r.message}`)
            .join('\n');
          alert(`등록 결과: 성공 ${successCount}개, 실패 ${failCount}개\n\n실패 상세:\n${failedPlatforms}`);
        } else {
          alert(`${successCount}개 플랫폼에 등록되었습니다.`);
        }
      } else {
        throw new Error(uploadResult.error || '등록 실패');
      }
    } catch (error) {
      console.error('등록 오류:', error);
      alert(error instanceof Error ? error.message : '등록에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 플랫폼 동기화
  const handlePlatformSync = async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      await handleSave();

      const response = await fetch(`/api/products/master/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: [platform] }),
      });

      const result = await response.json();

      if (result.success) {
        const platformResult = result.results[platform];
        if (platformResult?.success) {
          alert(`${getPlatformLabel(platform)} 동기화 완료!`);
          setPlatformProducts(prev =>
            prev.map(pp =>
              pp.platform === platform
                ? { ...pp, lastSyncedAt: new Date().toISOString() }
                : pp
            )
          );
        } else {
          alert(`동기화 실패: ${platformResult?.message || '알 수 없는 오류'}`);
        }
      } else {
        throw new Error(result.error || '동기화 실패');
      }
    } catch (error) {
      console.error('동기화 오류:', error);
      alert(error instanceof Error ? error.message : '동기화에 실패했습니다.');
    } finally {
      setSyncingPlatform(null);
    }
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = { COUPANG: '쿠팡', NAVER: '네이버', SHOP: '자사몰' };
    return labels[platform] || platform;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = { COUPANG: 'bg-orange-500', NAVER: 'bg-green-500', SHOP: 'bg-blue-500' };
    return colors[platform] || 'bg-gray-500';
  };

  // 플랫폼별 수수료율 (%)
  const [platformFeeRates, setPlatformFeeRates] = useState<Record<string, number>>({
    COUPANG: 10.8,
    NAVER: 5.5,
    SHOP: 0,
  });

  const calculateMarginByPlatform = (platform: string) => {
    const cost = parseInt(formData.costPrice) || 0;
    const price = parseInt(formData.basePrice) || 0;
    const delivery = formData.deliveryType === 'FREE' ? 0 : (parseInt(formData.deliveryFee) || 0);
    if (price === 0) return { margin: '0.0', profit: 0 };
    const feeRate = (platformFeeRates[platform] || 0) / 100;
    const profit = price - cost - delivery - (price * feeRate);
    const margin = (profit / price) * 100;
    return { margin: margin.toFixed(1), profit: Math.round(profit) };
  };

  if (loading) {
    return (
      <DashboardLayout title="상품 수정">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  const registeredPlatforms = platformProducts.filter(pp => pp.platformProductId);

  return (
    <DashboardLayout
      title="상품 수정"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: '상품 수정' },
      ]}
    >
      {/* 등록된 플랫폼 상태 */}
      {registeredPlatforms.length > 0 && (
        <Card title="등록된 플랫폼" className="mb-6">
          <div className="flex flex-wrap gap-3">
            {registeredPlatforms.map((pp) => (
              <div key={pp.platform} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <span className={`w-3 h-3 rounded-full ${getPlatformColor(pp.platform)}`} />
                <span className="font-medium">{getPlatformLabel(pp.platform)}</span>
                <CheckCircle2 size={16} className="text-green-500" />
                {pp.lastSyncedAt && (
                  <span className="text-xs text-gray-500">{new Date(pp.lastSyncedAt).toLocaleDateString('ko-KR')}</span>
                )}
                <button
                  onClick={() => handlePlatformSync(pp.platform)}
                  disabled={syncingPlatform === pp.platform}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                  title="동기화"
                >
                  {syncingPlatform === pp.platform ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                </button>
                {pp.platform === 'COUPANG' && pp.platformProductId && (
                  <a href={`https://wing.coupang.com/product/manage/${pp.platformProductId}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-blue-600" title="쿠팡 Wing에서 보기">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 추가 플랫폼 등록 */}
      {unregisteredPlatforms.length > 0 && (
        <Card title="추가 플랫폼 등록" subtitle="아직 등록되지 않은 플랫폼에 상품을 등록할 수 있습니다" className="mb-6">
          <div className="flex flex-wrap gap-3">
            {unregisteredPlatforms.map((platform) => (
              <label
                key={platform.id}
                className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                  selectedPlatforms.includes(platform.id) ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input type="checkbox" checked={selectedPlatforms.includes(platform.id)} onChange={() => togglePlatform(platform.id)} className="w-4 h-4 rounded" />
                <span className={`w-3 h-3 rounded-full ${platform.color}`} />
                <span className="text-sm font-medium">{platform.label}</span>
                {selectedPlatforms.includes(platform.id) && <CheckCircle2 size={16} className="text-blue-500" />}
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* 탭 네비게이션 */}
      <Card className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
          {/* 공통 정보 탭 */}
          <TabPanel id="common" activeTab={activeTab}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card title="기본 정보">
                  <div className="space-y-4">
                    <Input label="상품명" placeholder="상품명을 입력하세요" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="브랜드" placeholder="브랜드명" value={formData.brand} onChange={(e) => handleInputChange('brand', e.target.value)} />
                      <Select label="카테고리" options={[{ value: '', label: loadingCategories ? '로딩 중...' : '카테고리 선택' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} value={formData.categoryId} onChange={(e) => handleInputChange('categoryId', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">상품 설명</label>
                      <textarea className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder="상품 설명을 입력하세요" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} />
                    </div>
                  </div>
                </Card>

                <Card title="상품 이미지" subtitle="파일 업로드 또는 URL로 이미지를 등록하세요">
                  <ImageUploader images={images} onChange={setImages} maxImages={9} thumbnail thumbnailUrl={thumbnailUrl} onThumbnailChange={setThumbnailUrl} />
                </Card>

                <Card title="상세 설명" subtitle="이미지 업로드 또는 HTML 직접 입력">
                  <DetailImageUploader value={detailHtml} onChange={setDetailHtml} />
                </Card>

                <Card title="상품 옵션" subtitle="옵션명과 옵션값을 입력하세요" actions={<label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasOptions} onChange={(e) => setHasOptions(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm">옵션 사용</span></label>}>
                  {hasOptions ? (
                    <div className="space-y-4">
                      {options.map((option) => (
                        <div key={option.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Input placeholder="옵션명 (예: 색상, 사이즈)" value={option.groupName} onChange={(e) => setOptions(prev => prev.map(o => o.id === option.id ? { ...o, groupName: e.target.value } : o))} className="flex-1" />
                            <button onClick={() => removeOption(option.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><X size={18} /></button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value, vIndex) => (
                              <div key={vIndex} className="flex items-center gap-1 bg-gray-100 rounded-lg pl-3 pr-1 py-1">
                                <input type="text" placeholder="옵션값" value={value.name} onChange={(e) => setOptions(prev => prev.map(o => o.id === option.id ? { ...o, values: o.values.map((v, i) => i === vIndex ? { ...v, name: e.target.value } : v) } : o))} className="w-20 bg-transparent text-sm focus:outline-none" />
                                <button onClick={() => setOptions(prev => prev.map(o => o.id === option.id ? { ...o, values: o.values.filter((_, i) => i !== vIndex) } : o))} className="p-1 text-gray-400 hover:text-red-500"><X size={14} /></button>
                              </div>
                            ))}
                            <button onClick={() => addOptionValue(option.id)} className="px-3 py-1 text-sm text-blue-500 border border-blue-300 rounded-lg hover:bg-blue-50">+ 추가</button>
                          </div>
                        </div>
                      ))}
                      <Button variant="secondary" onClick={addOption} className="w-full"><Plus size={16} className="mr-1" />옵션 그룹 추가</Button>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">옵션을 사용하려면 위의 체크박스를 활성화하세요.</p>
                  )}
                </Card>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <Card title="가격 설정">
                  <div className="space-y-4">
                    <Input label="원가" type="number" placeholder="0" value={formData.costPrice} onChange={(e) => handleInputChange('costPrice', e.target.value)} />
                    <Input label="기본 판매가" type="number" placeholder="0" value={formData.basePrice} onChange={(e) => handleInputChange('basePrice', e.target.value)} required />
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
                                  <input type="number" step="0.1" value={platformFeeRates[platformId]} onChange={(e) => setPlatformFeeRates(prev => ({ ...prev, [platformId]: parseFloat(e.target.value) || 0 }))} className="w-16 px-2 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                  <span className="text-xs text-gray-500">%</span>
                                </div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">순이익 / 마진율</span>
                                <span className={`font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>{profit.toLocaleString()}원 ({margin}%)</span>
                              </div>
                            </div>
                          );
                        })}
                        {selectedPlatforms.length === 0 && <p className="text-sm text-gray-400 text-center py-2">플랫폼을 선택하세요</p>}
                      </div>
                    </div>
                    {selectedPlatforms.some(p => { const { margin } = calculateMarginByPlatform(p); return parseFloat(margin) > 0 && parseFloat(margin) < 15; }) && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700">일부 플랫폼의 마진율이 15% 미만입니다.</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="배송 설정">
                  <div className="space-y-4">
                    <Select label="배송비 유형" options={[{ value: 'FREE', label: '무료배송' }, { value: 'PAID', label: '유료배송' }, { value: 'CONDITIONAL', label: '조건부 무료배송' }]} value={formData.deliveryType} onChange={(e) => handleInputChange('deliveryType', e.target.value)} />
                    {formData.deliveryType !== 'FREE' && <Input label="배송비" type="number" placeholder="3000" value={formData.deliveryFee} onChange={(e) => handleInputChange('deliveryFee', e.target.value)} />}
                    {formData.deliveryType === 'CONDITIONAL' && <Input label="무료배송 기준금액" type="number" placeholder="50000" value={formData.freeShipOver} onChange={(e) => handleInputChange('freeShipOver', e.target.value)} />}
                  </div>
                </Card>

                <Card title="검색 태그" subtitle="검색 노출을 위한 키워드 (최대 10개)">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="태그 입력 후 Enter" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTag.trim() && searchTags.length < 10) { e.preventDefault(); if (!searchTags.includes(newTag.trim())) setSearchTags(prev => [...prev, newTag.trim()]); setNewTag(''); } }} className="flex-1" />
                      <Button variant="secondary" size="sm" onClick={() => { if (newTag.trim() && searchTags.length < 10 && !searchTags.includes(newTag.trim())) { setSearchTags(prev => [...prev, newTag.trim()]); setNewTag(''); } }} disabled={!newTag.trim() || searchTags.length >= 10}>추가</Button>
                    </div>
                    {searchTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {searchTags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            #{tag}
                            <button onClick={() => setSearchTags(prev => prev.filter((_, i) => i !== index))} className="hover:text-blue-900"><X size={12} /></button>
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

          <TabPanel id="coupang" activeTab={activeTab}>
            <CoupangTab
              coupangSettingsConfigured={coupangSettingsConfigured}
              onOpenSettings={() => setIsCoupangSettingsModalOpen(true)}
              categoryCode={platformSettings.COUPANG?.categoryCode}
              categoryName={platformSettings.COUPANG?.categoryName}
              linkedCategoryCode={selectedCategory?.coupangCategoryCode}
              onCategorySelect={(code, name) => setPlatformSettings(prev => ({ ...prev, COUPANG: { ...prev.COUPANG, categoryCode: code, categoryName: name } }))}
              onCategoryRemove={() => setPlatformSettings(prev => ({ ...prev, COUPANG: { ...prev.COUPANG, categoryCode: undefined, categoryName: undefined } }))}
              notices={platformSpecificData.COUPANG.notices}
              onNoticesChange={(notices) => setPlatformSpecificData(prev => ({ ...prev, COUPANG: { ...prev.COUPANG, notices } }))}
              validation={validation.coupang}
              productName={formData.name}
            />
          </TabPanel>

          <TabPanel id="naver" activeTab={activeTab}>
            <NaverTab
              naverSettingsConfigured={naverSettingsConfigured}
              categoryCode={platformSettings.NAVER?.categoryCode}
              categoryName={platformSettings.NAVER?.categoryName}
              linkedCategoryCode={selectedCategory?.naverCategoryId}
              onCategorySelect={(code, name) => setPlatformSettings(prev => ({ ...prev, NAVER: { ...prev.NAVER, categoryCode: code, categoryName: name } }))}
              onCategoryRemove={() => setPlatformSettings(prev => ({ ...prev, NAVER: { ...prev.NAVER, categoryCode: undefined, categoryName: undefined } }))}
              originAreaCode={platformSpecificData.NAVER.originAreaCode}
              originContent={platformSpecificData.NAVER.originContent}
              onOriginChange={(areaCode, content) => setPlatformSpecificData(prev => ({ ...prev, NAVER: { ...prev.NAVER, originAreaCode: areaCode, originContent: content } }))}
              validation={validation.naver}
              productName={formData.name}
            />
          </TabPanel>

          <TabPanel id="shop" activeTab={activeTab}>
            <ShopTab
              isVisible={platformSpecificData.SHOP.isVisible}
              onVisibilityChange={(visible) => setPlatformSpecificData(prev => ({ ...prev, SHOP: { ...prev.SHOP, isVisible: visible } }))}
              stockQuantity={formData.stockQuantity}
              onStockChange={(quantity) => handleInputChange('stockQuantity', quantity)}
              validation={validation.shop}
            />
          </TabPanel>
        </Tabs>
      </Card>

      {/* 액션 버튼 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 mt-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {registeredPlatforms.length > 0 && <span className="text-sm text-gray-600">등록됨: {registeredPlatforms.map(pp => getPlatformLabel(pp.platform)).join(', ')}</span>}
            {selectedPlatforms.length > 0 && <span className="text-sm text-blue-600">추가 등록 예정: {selectedPlatforms.map(id => getPlatformLabel(id)).join(', ')}</span>}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push('/products')}>목록으로</Button>
            <Button variant="secondary" onClick={handleSave} loading={isSaving}><Save size={16} className="mr-2" />저장</Button>
            {selectedPlatforms.length > 0 && (
              <Button onClick={handleUploadToPlatforms} loading={isUploading} disabled={!validation.canRegisterAll()}><Upload size={16} className="mr-2" />선택 플랫폼에 등록</Button>
            )}
          </div>
        </div>
      </div>

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
