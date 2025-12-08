'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, Input, Select } from '@/components/ui';
import {
  Search,
  Package,
  FileText,
  Send,
  ChevronRight,
  Loader2,
  Check,
  X,
  Eye,
  ShoppingCart,
  RefreshCw,
  Info,
  Sparkles,
  Download,
  Image as ImageIcon,
} from 'lucide-react';

// 도매처 상품 타입
interface WholesaleProduct {
  id: string;
  name: string;
  price: number;
  retailPrice?: number;
  minOrderQuantity: number;
  thumbnailUrl: string;
  url: string;
  seller: string;
  shippingFee: number;
  category: string;
  origin?: string;
  description?: string;
  dropshippingAvailable?: boolean;
}

// 자동화 단계
type AutomationStep = 'search' | 'select' | 'detail' | 'register' | 'complete';

// 입력 모드
type InputMode = 'crawl' | 'search' | 'manual';

export default function ProductAutomationPage() {
  // 상태
  const [currentStep, setCurrentStep] = useState<AutomationStep>('search');
  const [inputMode, setInputMode] = useState<InputMode>('crawl');
  const [keyword, setKeyword] = useState('과일');
  const [category, setCategory] = useState('fruits');

  // 수동 입력 상태
  const [manualProduct, setManualProduct] = useState({
    name: '',
    price: '',
    shippingFee: '3000',
    origin: '',
    thumbnailUrl: '',
    detailImageUrls: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<WholesaleProduct | null>(null);
  const [detailHtml, setDetailHtml] = useState<string>('');
  const [detailTemplate, setDetailTemplate] = useState<'basic' | 'premium' | 'minimal' | 'wholesale'>('wholesale');
  const [wholesaleImages, setWholesaleImages] = useState<string[]>([]);
  const [isCrawlingDetail, setIsCrawlingDetail] = useState(false);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [registrationResult, setRegistrationResult] = useState<{
    success: boolean;
    productId?: string;
    message: string;
  } | null>(null);

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'fruits', label: '과일' },
    { value: 'vegetables', label: '채소' },
    { value: 'seafood', label: '수산물' },
    { value: 'all', label: '전체' },
  ];

  // 템플릿 옵션
  const templateOptions = [
    { value: 'wholesale', label: '도매처 이미지 사용 (권장)' },
    { value: 'basic', label: '자체 템플릿 - 기본형' },
    { value: 'premium', label: '자체 템플릿 - 프리미엄' },
    { value: 'minimal', label: '자체 템플릿 - 미니멀' },
  ];

  // 수동 입력으로 상품 생성
  const createManualProduct = () => {
    if (!manualProduct.name || !manualProduct.price) {
      alert('상품명과 도매가를 입력해주세요.');
      return;
    }

    const product: WholesaleProduct = {
      id: `manual-${Date.now()}`,
      name: manualProduct.name,
      price: parseInt(manualProduct.price) || 0,
      retailPrice: undefined,
      minOrderQuantity: 1,
      thumbnailUrl: manualProduct.thumbnailUrl || 'https://via.placeholder.com/300x300?text=No+Image',
      url: '',
      seller: '직접 입력',
      shippingFee: parseInt(manualProduct.shippingFee) || 3000,
      category: category,
      origin: manualProduct.origin || undefined,
      description: '',
      dropshippingAvailable: true,
    };

    setSelectedProduct(product);
    // 기본 판매가 설정 (도매가 + 배송비 + 30% 마진)
    const suggestedPrice = Math.ceil((product.price + product.shippingFee) * 1.3 / 100) * 100;
    setSellingPrice(suggestedPrice);

    // 이미지 URL이 있으면 바로 상세페이지 생성
    if (manualProduct.detailImageUrls.trim()) {
      const imageUrls = manualProduct.detailImageUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
      setWholesaleImages(imageUrls);
      generateFromWholesaleImages(imageUrls, product);
    }

    setCurrentStep('detail');
  };

  // Step 1: 도매처 상품 검색 (실제 크롤링)
  const searchProductsReal = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        keyword,
        maxItems: '10',
        // useMock 파라미터 없음 = 실제 크롤링
      });

      const response = await fetch(`/api/crawl/wholesale?${params}`);
      const result = await response.json();

      if (result.success) {
        setProducts(result.items);
        setCurrentStep('select');
      } else {
        alert('크롤링에 실패했습니다. Mock 데이터로 시도해보세요.');
      }
    } catch (error) {
      console.error('상품 검색 오류:', error);
      alert('크롤링 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Mock 데이터 검색
  const searchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        keyword,
        type: category,
        useMock: 'true', // Mock 데이터 사용
        maxItems: '10',
      });

      const response = await fetch(`/api/crawl/wholesale?${params}`);
      const result = await response.json();

      if (result.success) {
        setProducts(result.items);
        setCurrentStep('select');
      }
    } catch (error) {
      console.error('상품 검색 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: 상품 선택
  const selectProduct = (product: WholesaleProduct) => {
    setSelectedProduct(product);
    // 기본 판매가 설정 (도매가 + 배송비 + 30% 마진)
    const suggestedPrice = Math.ceil((product.price + product.shippingFee) * 1.3 / 100) * 100;
    setSellingPrice(suggestedPrice);
    setCurrentStep('detail');
  };

  // 도매처 상세 이미지 크롤링 (실제 크롤링)
  const crawlWholesaleDetail = async () => {
    if (!selectedProduct) return;

    setIsCrawlingDetail(true);
    try {
      // 실제 도매처 URL로 크롤링 (useMock 없음)
      const params = new URLSearchParams({
        url: selectedProduct.url,
      });

      const response = await fetch(`/api/crawl/detail?${params}`);
      const result = await response.json();

      if (result.success && result.detailImages && result.detailImages.length > 0) {
        setWholesaleImages(result.detailImages);
        // 도매처 이미지 기반 HTML 생성
        generateFromWholesaleImages(result.detailImages);

        // 상품명도 업데이트 (크롤링에서 가져온 경우)
        if (result.productName && selectedProduct) {
          setSelectedProduct({
            ...selectedProduct,
            name: result.productName,
          });
        }
      } else {
        alert('상세 이미지를 가져오지 못했습니다. 상품 URL을 확인해주세요.');
      }
    } catch (error) {
      console.error('상세 이미지 크롤링 오류:', error);
      alert('크롤링 중 오류가 발생했습니다.');
    } finally {
      setIsCrawlingDetail(false);
    }
  };

  // 도매처 이미지 기반 HTML 생성
  const generateFromWholesaleImages = (images: string[], product?: WholesaleProduct) => {
    const targetProduct = product || selectedProduct;
    if (!targetProduct) return;

    const imagesHtml = images
      .map((url, idx) => `<img src="${url}" alt="상세 이미지 ${idx + 1}" style="width: 100%; display: block; margin: 0 auto;" />`)
      .join('\n');

    const html = `
<div style="max-width: 860px; margin: 0 auto; font-family: sans-serif;">
  <div style="background: linear-gradient(135deg, #4AC1E0 0%, #2E9BBF 100%); padding: 30px 20px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; font-size: 24px; margin: 0 0 8px 0;">${targetProduct.name}</h1>
    ${targetProduct.origin ? `<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">원산지: ${targetProduct.origin}</p>` : ''}
  </div>

  <div style="margin-bottom: 30px;">
    ${imagesHtml}
  </div>

  <div style="background: #fff3e0; padding: 20px; margin-bottom: 20px;">
    <h3 style="font-size: 16px; color: #e65100; margin: 0 0 12px 0;">배송 안내</h3>
    <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px;">
      <li>산지에서 직접 발송됩니다.</li>
      <li>신선식품은 아이스박스 포장으로 발송됩니다.</li>
    </ul>
  </div>

  <div style="background: #f5f5f5; padding: 20px;">
    <h3 style="font-size: 16px; color: #333; margin: 0 0 12px 0;">교환/반품 안내</h3>
    <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
      <li>상품 수령 후 24시간 이내 사진과 함께 문의해 주세요.</li>
      <li>단순 변심에 의한 교환/반품은 불가합니다.</li>
    </ul>
  </div>
</div>`;

    setDetailHtml(html);
  };

  // Step 3: 상세페이지 생성
  const generateDetailPage = async () => {
    if (!selectedProduct) return;

    // 도매처 이미지 사용 옵션
    if (detailTemplate === 'wholesale') {
      await crawlWholesaleDetail();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/products/generate-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct,
          template: detailTemplate,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setDetailHtml(result.html);
      }
    } catch (error) {
      console.error('상세페이지 생성 오류:', error);
      // 클라이언트에서 직접 생성 (fallback)
      setDetailHtml(generateLocalDetailPage(selectedProduct));
    } finally {
      setIsLoading(false);
    }
  };

  // 로컬 상세페이지 생성 (API 없을 때)
  const generateLocalDetailPage = (product: WholesaleProduct): string => {
    return `
<div style="max-width: 860px; margin: 0 auto; font-family: sans-serif; color: #333;">
  <div style="background: linear-gradient(135deg, #4AC1E0 0%, #2E9BBF 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
    <h1 style="color: white; font-size: 28px; margin: 0 0 10px 0;">${product.name}</h1>
    ${product.origin ? `<p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">원산지: ${product.origin}</p>` : ''}
  </div>
  <div style="margin-bottom: 30px; text-align: center;">
    <img src="${product.thumbnailUrl}" alt="${product.name}" style="max-width: 100%; border-radius: 8px;" />
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
    <h2 style="font-size: 20px; margin: 0 0 15px 0;">상품 설명</h2>
    <p style="font-size: 16px; line-height: 1.8; margin: 0;">${product.description || '신선하고 맛있는 농수산물입니다.'}</p>
  </div>
</div>`;
  };

  // Step 4: 쿠팡 등록
  const registerToCoupang = async () => {
    if (!selectedProduct) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/products/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct,
          sellingPrice,
          detailHtml,
        }),
      });

      const result = await response.json();
      setRegistrationResult(result);
      setCurrentStep('complete');
    } catch (error) {
      console.error('상품 등록 오류:', error);
      // Mock 결과
      setRegistrationResult({
        success: true,
        productId: `MOCK-${Date.now()}`,
        message: '[테스트] 상품이 등록되었습니다. 실제 등록은 Wing API 설정이 필요합니다.',
      });
      setCurrentStep('complete');
    } finally {
      setIsLoading(false);
    }
  };

  // 템플릿 변경 시 상세페이지 재생성
  useEffect(() => {
    if (selectedProduct && currentStep === 'detail') {
      generateDetailPage();
    }
  }, [detailTemplate]);

  // 마진 계산
  const calculateMargin = () => {
    if (!selectedProduct) return { profit: 0, margin: 0 };
    const cost = selectedProduct.price + selectedProduct.shippingFee;
    const fee = sellingPrice * 0.1; // 쿠팡 수수료 10%
    const profit = sellingPrice - cost - fee;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    return { profit: Math.round(profit), margin: margin.toFixed(1) };
  };

  // 리셋
  const resetAutomation = () => {
    setCurrentStep('search');
    setProducts([]);
    setSelectedProduct(null);
    setDetailHtml('');
    setRegistrationResult(null);
    setWholesaleImages([]);
    setManualProduct({
      name: '',
      price: '',
      shippingFee: '3000',
      origin: '',
      thumbnailUrl: '',
      detailImageUrls: '',
    });
  };

  // Step 표시
  const steps = [
    { id: 'search', label: '상품 검색', icon: Search },
    { id: 'select', label: '상품 선택', icon: Package },
    { id: 'detail', label: '상세페이지', icon: FileText },
    { id: 'register', label: '쿠팡 등록', icon: Send },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <DashboardLayout
      title="상품 자동화"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: '상품 자동화' },
      ]}
    >
      {/* 진행 단계 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-[var(--color-primary-500)] text-white'
                        : isCompleted
                        ? 'bg-[var(--color-success)] text-white'
                        : 'bg-[var(--color-gray-200)] text-[var(--color-gray-500)]'
                    }`}
                  >
                    {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                  </div>
                  <span
                    className={`mt-2 text-sm ${
                      isActive
                        ? 'text-[var(--color-primary-600)] font-medium'
                        : 'text-[var(--color-gray-500)]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 rounded ${
                      index < currentStepIndex
                        ? 'bg-[var(--color-success)]'
                        : 'bg-[var(--color-gray-200)]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: 상품 검색 / 수동 입력 */}
      {currentStep === 'search' && (
        <div className="space-y-6">
          {/* 모드 선택 탭 */}
          <div className="flex gap-2 p-1 bg-[var(--color-gray-100)] rounded-lg w-fit">
            <button
              onClick={() => setInputMode('crawl')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'crawl'
                  ? 'bg-white text-[var(--color-gray-900)] shadow-sm'
                  : 'text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]'
              }`}
            >
              <Download size={16} className="inline mr-2" />
              실제 크롤링
            </button>
            <button
              onClick={() => setInputMode('search')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'search'
                  ? 'bg-white text-[var(--color-gray-900)] shadow-sm'
                  : 'text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]'
              }`}
            >
              <Search size={16} className="inline mr-2" />
              Mock 데이터
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'manual'
                  ? 'bg-white text-[var(--color-gray-900)] shadow-sm'
                  : 'text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              수동 입력
            </button>
          </div>

          {/* 실제 크롤링 모드 */}
          {inputMode === 'crawl' && (
            <Card title="도매꾹 실제 크롤링" subtitle="도매꾹에서 실시간으로 상품을 검색합니다">
              <div className="space-y-4">
                <div className="p-4 bg-[#E8F5E9] rounded-lg">
                  <div className="flex items-start gap-3">
                    <Check size={20} className="text-[#2E7D32] mt-0.5" />
                    <div>
                      <p className="font-medium text-[#2E7D32] text-sm">Stealth 모드 활성화</p>
                      <p className="text-sm text-[#1B5E20] mt-1">
                        봇 탐지 우회 기술이 적용되어 도매꾹에서 실제 상품을 크롤링합니다.
                        첫 검색은 10-15초 정도 소요될 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <Input
                  label="검색어"
                  placeholder="상품명을 입력하세요 (예: 마스크, 양말, 담요)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />

                <Button onClick={searchProductsReal} loading={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      도매꾹 크롤링 중... (10-15초 소요)
                    </>
                  ) : (
                    <>
                      <Download size={18} className="mr-2" />
                      도매꾹에서 상품 검색
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Mock 데이터 검색 모드 */}
          {inputMode === 'search' && (
            <Card title="Mock 데이터 검색" subtitle="테스트용 샘플 데이터로 빠르게 검색합니다">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="검색어"
                      placeholder="상품명을 입력하세요"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                  <div className="w-40">
                    <Select
                      label="카테고리"
                      options={categoryOptions}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[var(--color-gray-50)] rounded-lg">
                  <Info size={20} className="text-[var(--color-primary-500)]" />
                  <p className="text-sm text-[var(--color-gray-600)]">
                    테스트용 샘플 데이터입니다. 실제 상품을 검색하려면 "실제 크롤링" 탭을 사용하세요.
                  </p>
                </div>
                <Button onClick={searchProducts} loading={isLoading} className="w-full">
                  <Search size={18} className="mr-2" />
                  Mock 데이터 검색
                </Button>
              </div>
            </Card>
          )}

          {/* 수동 입력 모드 */}
          {inputMode === 'manual' && (
            <Card
              title="상품 정보 직접 입력"
              subtitle="도매처에서 복사한 상품 정보를 직접 입력합니다"
            >
              <div className="space-y-4">
                <div className="p-4 bg-[#E8F5E9] rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <Check size={20} className="text-[#2E7D32] mt-0.5" />
                    <div>
                      <p className="font-medium text-[#2E7D32] text-sm">권장 방법</p>
                      <p className="text-sm text-[#1B5E20] mt-1">
                        도매꾹 등 도매처 사이트에서 상품 정보를 직접 복사하여 입력하세요.
                        크롤링 차단 없이 안정적으로 상품을 등록할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="상품명 *"
                    placeholder="예: 제주 감귤 5kg 선물세트"
                    value={manualProduct.name}
                    onChange={(e) =>
                      setManualProduct((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                  <Input
                    label="도매가 (원) *"
                    type="number"
                    placeholder="예: 15000"
                    value={manualProduct.price}
                    onChange={(e) =>
                      setManualProduct((prev) => ({ ...prev, price: e.target.value }))
                    }
                  />
                  <Input
                    label="배송비 (원)"
                    type="number"
                    placeholder="예: 3000"
                    value={manualProduct.shippingFee}
                    onChange={(e) =>
                      setManualProduct((prev) => ({ ...prev, shippingFee: e.target.value }))
                    }
                  />
                  <Input
                    label="원산지"
                    placeholder="예: 국산 (제주도)"
                    value={manualProduct.origin}
                    onChange={(e) =>
                      setManualProduct((prev) => ({ ...prev, origin: e.target.value }))
                    }
                  />
                </div>

                <Input
                  label="대표 이미지 URL"
                  placeholder="https://example.com/thumbnail.jpg"
                  value={manualProduct.thumbnailUrl}
                  onChange={(e) =>
                    setManualProduct((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
                  }
                  helperText="도매처 상품 페이지에서 이미지 주소 복사"
                />

                <div>
                  <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                    상세페이지 이미지 URL (줄바꿈으로 구분)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] min-h-[120px]"
                    placeholder={`https://example.com/detail1.jpg\nhttps://example.com/detail2.jpg\nhttps://example.com/detail3.jpg`}
                    value={manualProduct.detailImageUrls}
                    onChange={(e) =>
                      setManualProduct((prev) => ({ ...prev, detailImageUrls: e.target.value }))
                    }
                  />
                  <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                    도매처 상세페이지의 이미지 URL들을 한 줄에 하나씩 입력하세요
                  </p>
                </div>

                <Button onClick={createManualProduct} className="w-full">
                  <ChevronRight size={18} className="mr-2" />
                  다음 단계로
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: 상품 선택 */}
      {currentStep === 'select' && (
        <Card
          title="상품 선택"
          subtitle={`${products.length}개의 상품을 찾았습니다`}
          actions={
            <Button variant="secondary" size="sm" onClick={() => setCurrentStep('search')}>
              다시 검색
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden hover:border-[var(--color-primary-500)] hover:shadow-md transition-all cursor-pointer"
                onClick={() => selectProduct(product)}
              >
                <div className="aspect-square relative">
                  <img
                    src={product.thumbnailUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.dropshippingAvailable && (
                    <Badge className="absolute top-2 left-2" variant="completed">
                      위탁배송
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-[var(--color-primary-600)]">
                      {product.price.toLocaleString()}원
                    </span>
                    <span className="text-xs text-[var(--color-gray-500)]">
                      배송비 {product.shippingFee.toLocaleString()}원
                    </span>
                  </div>
                  {product.origin && (
                    <p className="text-xs text-[var(--color-gray-500)] mt-1">
                      원산지: {product.origin}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3: 상세페이지 생성 */}
      {currentStep === 'detail' && selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 설정 */}
          <div className="space-y-6">
            <Card title="선택한 상품">
              <div className="flex gap-4">
                <img
                  src={selectedProduct.thumbnailUrl}
                  alt={selectedProduct.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium mb-2">{selectedProduct.name}</h3>
                  <p className="text-sm text-[var(--color-gray-500)]">
                    도매가: {selectedProduct.price.toLocaleString()}원
                  </p>
                  <p className="text-sm text-[var(--color-gray-500)]">
                    배송비: {selectedProduct.shippingFee.toLocaleString()}원
                  </p>
                </div>
              </div>
            </Card>

            <Card title="가격 설정">
              <div className="space-y-4">
                <Input
                  label="판매가"
                  type="number"
                  value={sellingPrice.toString()}
                  onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                  helperText="쿠팡에서 판매할 가격"
                />
                <div className="p-4 bg-[var(--color-gray-50)] rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-gray-600)]">도매가</span>
                    <span>{selectedProduct.price.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-gray-600)]">배송비</span>
                    <span>{selectedProduct.shippingFee.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-gray-600)]">쿠팡 수수료 (10%)</span>
                    <span>{Math.round(sellingPrice * 0.1).toLocaleString()}원</span>
                  </div>
                  <hr className="border-[var(--color-gray-200)]" />
                  <div className="flex justify-between font-medium">
                    <span>예상 순이익</span>
                    <span
                      className={
                        calculateMargin().profit > 0
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-danger)]'
                      }
                    >
                      {calculateMargin().profit.toLocaleString()}원 ({calculateMargin().margin}%)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="상세페이지 생성 방식">
              <div className="space-y-4">
                <Select
                  label="생성 방식 선택"
                  options={templateOptions}
                  value={detailTemplate}
                  onChange={(e) => setDetailTemplate(e.target.value as any)}
                />

                {/* 도매처 이미지 사용 설명 */}
                {detailTemplate === 'wholesale' && (
                  <div className="p-4 bg-[#E3F2FD] rounded-lg">
                    <div className="flex items-start gap-3">
                      <ImageIcon size={20} className="text-[#1976D2] mt-0.5" />
                      <div>
                        <p className="font-medium text-[#1976D2] text-sm">도매처 상세 이미지 사용</p>
                        <p className="text-sm text-[#1565C0] mt-1">
                          도매처에서 제공하는 상세페이지 이미지를 크롤링하여 그대로 사용합니다.
                          실제 위탁판매에서는 이 방식을 권장합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {detailTemplate !== 'wholesale' && (
                  <div className="p-4 bg-[var(--color-gray-50)] rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info size={20} className="text-[var(--color-gray-500)] mt-0.5" />
                      <p className="text-sm text-[var(--color-gray-600)]">
                        자체 템플릿을 사용하면 상품 정보를 기반으로 새로운 상세페이지를 생성합니다.
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={generateDetailPage}
                  loading={isLoading || isCrawlingDetail}
                  className="w-full"
                >
                  {detailTemplate === 'wholesale' ? (
                    <>
                      <Download size={18} className="mr-2" />
                      도매처 이미지 가져오기
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="mr-2" />
                      상세페이지 생성
                    </>
                  )}
                </Button>

                {/* 크롤링된 이미지 미리보기 */}
                {wholesaleImages.length > 0 && detailTemplate === 'wholesale' && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">크롤링된 이미지 ({wholesaleImages.length}장)</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {wholesaleImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`상세 ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded border flex-shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCurrentStep('select')} className="flex-1">
                이전
              </Button>
              <Button
                onClick={() => setCurrentStep('register')}
                disabled={!detailHtml}
                className="flex-1"
              >
                다음
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </div>
          </div>

          {/* 오른쪽: 미리보기 */}
          <Card title="상세페이지 미리보기" className="h-fit">
            {detailHtml ? (
              <div
                className="border border-[var(--color-gray-200)] rounded-lg p-4 max-h-[600px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: detailHtml }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-[var(--color-gray-400)]">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-3" />
                  <p>템플릿을 선택하고 생성 버튼을 클릭하세요</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Step 4: 쿠팡 등록 */}
      {currentStep === 'register' && selectedProduct && (
        <Card title="쿠팡 등록 확인" subtitle="상품 정보를 확인하고 등록하세요">
          <div className="space-y-6">
            {/* 상품 요약 */}
            <div className="flex gap-6 p-4 bg-[var(--color-gray-50)] rounded-lg">
              <img
                src={selectedProduct.thumbnailUrl}
                alt={selectedProduct.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--color-gray-500)]">도매가:</span>
                    <span className="ml-2">{selectedProduct.price.toLocaleString()}원</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">판매가:</span>
                    <span className="ml-2 font-bold text-[var(--color-primary-600)]">
                      {sellingPrice.toLocaleString()}원
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">원산지:</span>
                    <span className="ml-2">{selectedProduct.origin || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">예상 마진:</span>
                    <span
                      className={`ml-2 font-medium ${
                        calculateMargin().profit > 0
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-danger)]'
                      }`}
                    >
                      {calculateMargin().profit.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="p-4 bg-[#FFF3E0] rounded-lg">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-[var(--color-warning)] mt-0.5" />
                <div>
                  <p className="font-medium text-[#E65100]">테스트 모드</p>
                  <p className="text-sm text-[#E65100] mt-1">
                    현재 테스트 모드로 실행됩니다. 실제 쿠팡 등록을 위해서는:
                  </p>
                  <ul className="text-sm text-[#E65100] mt-2 list-disc list-inside">
                    <li>쿠팡 Wing 판매자 계정</li>
                    <li>Wing API Access Key / Secret Key</li>
                    <li>사업자 등록</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCurrentStep('detail')} className="flex-1">
                이전
              </Button>
              <Button onClick={registerToCoupang} loading={isLoading} className="flex-1">
                <ShoppingCart size={18} className="mr-2" />
                쿠팡에 등록하기
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 5: 완료 */}
      {currentStep === 'complete' && registrationResult && (
        <Card className="text-center py-12">
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
              registrationResult.success
                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            }`}
          >
            {registrationResult.success ? <Check size={40} /> : <X size={40} />}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {registrationResult.success ? '등록 완료!' : '등록 실패'}
          </h2>
          <p className="text-[var(--color-gray-600)] mb-4">{registrationResult.message}</p>
          {registrationResult.productId && (
            <p className="text-sm text-[var(--color-gray-500)] mb-8">
              상품 ID: {registrationResult.productId}
            </p>
          )}
          <div className="flex justify-center gap-4">
            <Button variant="secondary" onClick={resetAutomation}>
              <RefreshCw size={18} className="mr-2" />
              새 상품 등록
            </Button>
            {registrationResult.success && (
              <Button onClick={() => (window.location.href = '/products')}>
                상품 목록 보기
              </Button>
            )}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
