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
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Truck,
  Package,
  FileText,
  Settings,
} from 'lucide-react';

// 배송비 타입
const DELIVERY_CHARGE_TYPES = [
  { value: 'FREE', label: '무료배송' },
  { value: 'NOT_FREE', label: '유료배송' },
  { value: 'CONDITIONAL_FREE', label: '조건부 무료' },
  { value: 'CHARGE_RECEIVED', label: '착불' },
];

// 배송방법
const DELIVERY_METHODS = [
  { value: 'SEQUENCIAL', label: '일반배송' },
  { value: 'VENDOR_DIRECT', label: '업체직송' },
  { value: 'MAKE_ORDER', label: '주문제작' },
];

// 택배사 목록
const DELIVERY_COMPANIES = [
  { value: 'CJGLS', label: 'CJ대한통운' },
  { value: 'LOTTE', label: '롯데택배' },
  { value: 'HANJIN', label: '한진택배' },
  { value: 'EPOST', label: '우체국택배' },
  { value: 'LOGEN', label: '로젠택배' },
  { value: 'KGB', label: 'KGB택배' },
];

// 묶음배송 타입
const UNION_DELIVERY_TYPES = [
  { value: 'UNION_DELIVERY', label: '묶음배송 가능' },
  { value: 'NOT_UNION_DELIVERY', label: '묶음배송 불가' },
];

// 카테고리 타입
interface PlatformCategory {
  code: string;
  name: string;
  fullPath?: string;
  isLeaf?: boolean;
}

// 출고지/반품지 타입
interface ShippingPlace {
  code: number | string;
  name: string;
  address?: string;
  addressDetail?: string;
  zipCode?: string;
  contactNumber?: string;
  usable?: boolean;
}

// 카테고리 메타 정보 (상품고시정보, 옵션 등)
interface CategoryMeta {
  displayCategoryCode: number;
  displayCategoryName: string;
  noticeCategories?: {
    noticeCategoryId: string;
    noticeCategoryName: string;
    required: boolean;
    noticeItemNames: string[];
  }[];
  attributes?: {
    attributeTypeName: string;
    required: boolean;
    dataType: string;
    attributeValues?: string[];
  }[];
}

// 아이템 (옵션) 타입
interface ProductItem {
  id: string;
  itemName: string;
  originalPrice: number;
  salePrice: number;
  maximumBuyCount: number;
  outboundShippingTimeDay: number;
  unitCount: number;
  adultOnly: string;
  taxType: string;
  parallelImported: string;
  overseasPurchased: string;
  externalVendorSku: string;
  barcode: string;
  images: string[];
}

export default function CoupangProductRegisterPage() {
  const router = useRouter();

  // 단계 관리
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { id: 1, name: '기본정보', icon: Package },
    { id: 2, name: '배송설정', icon: Truck },
    { id: 3, name: '상품고시정보', icon: FileText },
    { id: 4, name: '옵션/속성', icon: Settings },
  ];

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 카테고리 검색
  const [categorySearchKeyword, setCategorySearchKeyword] = useState('');
  const [categorySearchResults, setCategorySearchResults] = useState<PlatformCategory[]>([]);
  const [isSearchingCategory, setIsSearchingCategory] = useState(false);
  const [categoryMeta, setCategoryMeta] = useState<CategoryMeta | null>(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  // 출고지/반품지
  const [outboundPlaces, setOutboundPlaces] = useState<ShippingPlace[]>([]);
  const [returnCenters, setReturnCenters] = useState<ShippingPlace[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // 기본 정보
  const [formData, setFormData] = useState({
    // 필수 기본정보
    sellerProductName: '',
    displayProductName: '',
    brand: '',
    generalProductName: '',
    productGroup: 'SINGLE',
    displayCategoryCode: '',
    displayCategoryName: '',

    // 배송 설정
    deliveryMethod: 'SEQUENCIAL',
    deliveryCompanyCode: 'CJGLS',
    deliveryChargeType: 'NOT_FREE',
    deliveryCharge: 3000,
    freeShipOverAmount: 50000,
    deliveryChargeOnReturn: 6000,
    remoteAreaDeliverable: 'Y',
    unionDeliveryType: 'UNION_DELIVERY',
    outboundShippingPlaceCode: '',
    returnCenterCode: '',
    returnCharge: 6000,
    returnChargeVendor: 'VENDOR',

    // 반품지 주소 (선택)
    returnChargeName: '',
    returnZipCode: '',
    returnAddress: '',
    returnAddressDetail: '',
    companyContactNumber: '',

    // A/S 정보
    afterServiceInformation: '고객센터로 문의해주세요.',
    afterServiceContactNumber: '',

    // 판매 기간
    saleStartedAt: new Date().toISOString().slice(0, 16),
    saleEndedAt: '2099-12-31T23:59',
  });

  // 아이템 (옵션)
  const [items, setItems] = useState<ProductItem[]>([
    {
      id: '1',
      itemName: '',
      originalPrice: 0,
      salePrice: 0,
      maximumBuyCount: 999,
      outboundShippingTimeDay: 3,
      unitCount: 1,
      adultOnly: 'EVERYONE',
      taxType: 'TAX',
      parallelImported: 'NOT_PARALLEL_IMPORTED',
      overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
      externalVendorSku: '',
      barcode: '',
      images: [],
    },
  ]);

  // 상품고시정보
  const [notices, setNotices] = useState<{ noticeCategoryName: string; noticeCategoryDetailName: string; content: string }[]>([]);

  // 구매옵션 (attributes)
  const [attributes, setAttributes] = useState<{ attributeTypeName: string; attributeValueName: string }[]>([]);

  // 상세 설명
  const [detailHtml, setDetailHtml] = useState('');

  // 출고지/반품지 로드
  useEffect(() => {
    loadShippingPlaces();
  }, []);

  const loadShippingPlaces = async () => {
    setIsLoadingShipping(true);
    try {
      const [outboundRes, returnRes] = await Promise.all([
        fetch('/api/coupang/shipping?type=outbound'),
        fetch('/api/coupang/shipping?type=return'),
      ]);

      const outboundData = await outboundRes.json();
      const returnData = await returnRes.json();

      if (outboundData.success) {
        setOutboundPlaces(outboundData.data || []);
        // 첫 번째 출고지 자동 선택
        if (outboundData.data?.length > 0) {
          setFormData(prev => ({ ...prev, outboundShippingPlaceCode: String(outboundData.data[0].code) }));
        }
      }

      if (returnData.success) {
        setReturnCenters(returnData.data || []);
        // 첫 번째 반품지 자동 선택
        if (returnData.data?.length > 0) {
          setFormData(prev => ({ ...prev, returnCenterCode: String(returnData.data[0].code) }));
        }
      }
    } catch (error) {
      console.error('출고지/반품지 로드 실패:', error);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // 카테고리 검색
  const searchCategories = async (keyword: string) => {
    if (!keyword.trim()) {
      setCategorySearchResults([]);
      return;
    }

    setIsSearchingCategory(true);
    try {
      const response = await fetch(`/api/platform/categories?platform=COUPANG&keyword=${encodeURIComponent(keyword)}`);
      const result = await response.json();
      if (result.success) {
        setCategorySearchResults(result.data || []);
      }
    } catch (error) {
      console.error('카테고리 검색 실패:', error);
    } finally {
      setIsSearchingCategory(false);
    }
  };

  // 카테고리 선택 시 메타 정보 로드
  const selectCategory = async (category: PlatformCategory) => {
    setFormData(prev => ({
      ...prev,
      displayCategoryCode: category.code,
      displayCategoryName: category.fullPath || category.name,
    }));
    setCategorySearchResults([]);
    setCategorySearchKeyword('');

    // 카테고리 메타 정보 로드
    setIsLoadingMeta(true);
    try {
      const response = await fetch(`/api/coupang/categories?meta=${category.code}`);
      const result = await response.json();
      if (result.success && result.data) {
        setCategoryMeta(result.data);

        // 상품고시정보 초기화
        if (result.data.noticeCategories) {
          type NoticeCategoryItem = {
            noticeCategoryId: string;
            noticeCategoryName: string;
            required: boolean;
            noticeItemNames: string[];
          };
          const initialNotices = result.data.noticeCategories.flatMap((nc: NoticeCategoryItem) =>
            nc.noticeItemNames.map(itemName => ({
              noticeCategoryName: nc.noticeCategoryName,
              noticeCategoryDetailName: itemName,
              content: '',
            }))
          );
          setNotices(initialNotices);
        }

        // 구매옵션 초기화
        if (result.data.attributes) {
          type AttributeItem = {
            attributeTypeName: string;
            required: boolean;
            dataType: string;
            attributeValues?: string[];
          };
          const initialAttributes = result.data.attributes
            .filter((attr: AttributeItem) => attr.required)
            .map((attr: AttributeItem) => ({
              attributeTypeName: attr.attributeTypeName,
              attributeValueName: '',
            }));
          setAttributes(initialAttributes);
        }
      }
    } catch (error) {
      console.error('카테고리 메타 로드 실패:', error);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  // 아이템 추가
  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        itemName: '',
        originalPrice: items[0]?.originalPrice || 0,
        salePrice: items[0]?.salePrice || 0,
        maximumBuyCount: 999,
        outboundShippingTimeDay: 3,
        unitCount: 1,
        adultOnly: 'EVERYONE',
        taxType: 'TAX',
        parallelImported: 'NOT_PARALLEL_IMPORTED',
        overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
        externalVendorSku: '',
        barcode: '',
        images: [],
      },
    ]);
  };

  // 아이템 삭제
  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // 아이템 수정
  const updateItem = (itemId: string, field: string, value: string | number | string[]) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  // 폼 저장/등록
  const handleSubmit = async (requested: boolean) => {
    setIsSaving(true);
    try {
      // 필수값 검증
      if (!formData.displayCategoryCode) {
        alert('카테고리를 선택해주세요.');
        setCurrentStep(1);
        return;
      }
      if (!formData.sellerProductName) {
        alert('등록상품명을 입력해주세요.');
        setCurrentStep(1);
        return;
      }
      if (!formData.brand) {
        alert('브랜드를 입력해주세요.');
        setCurrentStep(1);
        return;
      }
      if (!formData.outboundShippingPlaceCode) {
        alert('출고지를 선택해주세요.');
        setCurrentStep(2);
        return;
      }
      if (!formData.returnCenterCode) {
        alert('반품지를 선택해주세요.');
        setCurrentStep(2);
        return;
      }
      if (items.some(item => !item.itemName || item.salePrice <= 0)) {
        alert('모든 옵션의 상품명과 판매가를 입력해주세요.');
        setCurrentStep(4);
        return;
      }

      // API 요청 데이터 구성
      const requestBody = {
        displayCategoryCode: parseInt(formData.displayCategoryCode),
        sellerProductName: formData.sellerProductName,
        displayProductName: formData.displayProductName || formData.sellerProductName,
        vendorId: process.env.NEXT_PUBLIC_COUPANG_VENDOR_ID || '',
        saleStartedAt: formData.saleStartedAt.replace('T', ' ') + ':00',
        saleEndedAt: formData.saleEndedAt.replace('T', ' ') + ':00',
        brand: formData.brand,
        generalProductName: formData.generalProductName || formData.sellerProductName,
        productGroup: formData.productGroup,
        deliveryMethod: formData.deliveryMethod,
        deliveryCompanyCode: formData.deliveryCompanyCode,
        deliveryChargeType: formData.deliveryChargeType,
        deliveryCharge: formData.deliveryCharge,
        freeShipOverAmount: formData.freeShipOverAmount,
        deliveryChargeOnReturn: formData.deliveryChargeOnReturn,
        remoteAreaDeliverable: formData.remoteAreaDeliverable,
        unionDeliveryType: formData.unionDeliveryType,
        returnCenterCode: formData.returnCenterCode,
        returnCharge: formData.returnCharge,
        returnChargeVendor: formData.returnChargeVendor,
        afterServiceInformation: formData.afterServiceInformation,
        afterServiceContactNumber: formData.afterServiceContactNumber,
        outboundShippingPlaceCode: parseInt(formData.outboundShippingPlaceCode),
        vendorUserId: '', // 셀러 아이디
        requested: requested, // true면 승인요청, false면 임시저장
        items: items.map(item => ({
          itemName: item.itemName,
          originalPrice: item.originalPrice,
          salePrice: item.salePrice,
          maximumBuyCount: item.maximumBuyCount,
          maximumBuyForPerson: 0,
          maximumBuyForPersonPeriod: 0,
          outboundShippingTimeDay: item.outboundShippingTimeDay,
          unitCount: item.unitCount,
          adultOnly: item.adultOnly,
          taxType: item.taxType,
          parallelImported: item.parallelImported,
          overseasPurchased: item.overseasPurchased,
          pccNeeded: 'NOT_NEED',
          externalVendorSku: item.externalVendorSku || `SKU-${Date.now()}`,
          barcode: item.barcode,
          emptyBarcode: !item.barcode,
          emptyBarcodeReason: item.barcode ? '' : 'PRODUCT_OWN',
          modelNo: '',
          extraProperties: {},
          certifications: [],
          searchTags: [],
          images: item.images.length > 0
            ? item.images.map((url, idx) => ({
                imageOrder: idx,
                imageType: idx === 0 ? 'REPRESENTATION' : 'DETAIL',
                cdnPath: url,
                vendorPath: url,
              }))
            : [],
          notices: notices.filter(n => n.content),
          attributes: attributes.filter(a => a.attributeValueName),
          contents: detailHtml
            ? [{ contentsType: 'HTML', contentDetails: [{ content: detailHtml, detailType: 'HTML' }] }]
            : [],
          offerCondition: 'NEW',
          offerDescription: '',
        })),
        requiredDocuments: [],
        extraInfoMessage: '',
        manufacture: formData.brand,
        contents: detailHtml
          ? [{ contentsType: 'HTML', contentDetails: [{ content: detailHtml, detailType: 'HTML' }] }]
          : [],
        notices: notices.filter(n => n.content),
        attributes: attributes.filter(a => a.attributeValueName),
      };

      const response = await fetch('/api/coupang/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.code === 'SUCCESS' || result.data?.sellerProductId) {
        alert(requested ? '상품이 등록되었습니다. 승인 대기 중입니다.' : '임시 저장되었습니다.');
        router.push('/products/coupang');
      } else {
        throw new Error(result.message || result.error || '등록 실패');
      }
    } catch (error) {
      console.error('상품 등록 실패:', error);
      alert(error instanceof Error ? error.message : '상품 등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 유효성 검사
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.displayCategoryCode && formData.sellerProductName && formData.brand);
      case 2:
        return !!(formData.outboundShippingPlaceCode && formData.returnCenterCode);
      case 3:
        // 필수 상품고시정보가 모두 입력되었는지 확인
        const requiredNotices = categoryMeta?.noticeCategories?.filter(nc => nc.required) || [];
        if (requiredNotices.length === 0) return true;
        return requiredNotices.every(nc =>
          nc.noticeItemNames.every(itemName =>
            notices.some(n => n.noticeCategoryName === nc.noticeCategoryName && n.noticeCategoryDetailName === itemName && n.content)
          )
        );
      case 4:
        return items.every(item => item.itemName && item.salePrice > 0);
      default:
        return false;
    }
  };

  return (
    <DashboardLayout
      title="쿠팡 상품 등록"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '쿠팡 상품', href: '/products/coupang' },
        { name: '상품 등록' },
      ]}
    >
      {/* 단계 표시 */}
      <div className="mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center ${
                  currentStep === step.id
                    ? 'text-orange-600'
                    : isStepValid(step.id)
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === step.id
                      ? 'bg-orange-600 text-white'
                      : isStepValid(step.id)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100'
                  }`}
                >
                  {isStepValid(step.id) && currentStep !== step.id ? (
                    <CheckCircle size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{step.name}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${isStepValid(step.id) ? 'bg-green-200' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: 기본 정보 */}
          {currentStep === 1 && (
            <>
              <Card title="카테고리 선택" subtitle="판매할 상품의 쿠팡 카테고리를 선택하세요">
                <div className="space-y-4">
                  {/* 현재 선택된 카테고리 */}
                  {formData.displayCategoryCode ? (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-orange-800">선택된 카테고리</span>
                        <p className="text-sm text-orange-600">{formData.displayCategoryName}</p>
                      </div>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, displayCategoryCode: '', displayCategoryName: '' }))}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 rounded-lg flex items-center gap-2">
                      <AlertTriangle size={18} className="text-yellow-500" />
                      <span className="text-sm text-yellow-700">카테고리를 선택해주세요 (필수)</span>
                    </div>
                  )}

                  {/* 카테고리 검색 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="카테고리 검색어 입력 (예: 과일, 의류)"
                      value={categorySearchKeyword}
                      onChange={(e) => setCategorySearchKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchCategories(categorySearchKeyword);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => searchCategories(categorySearchKeyword)}
                      disabled={isSearchingCategory}
                    >
                      {isSearchingCategory ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </Button>
                  </div>

                  {/* 검색 결과 */}
                  {categorySearchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {categorySearchResults.map((cat) => (
                        <button
                          key={cat.code}
                          type="button"
                          onClick={() => selectCategory(cat)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium text-gray-900">{cat.name}</span>
                          {cat.fullPath && (
                            <p className="text-sm text-gray-500 mt-0.5">{cat.fullPath}</p>
                          )}
                          {cat.isLeaf && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              선택가능
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {isLoadingMeta && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={14} className="animate-spin" />
                      카테고리 정보 로딩 중...
                    </div>
                  )}
                </div>
              </Card>

              <Card title="기본 정보" subtitle="상품의 기본 정보를 입력하세요">
                <div className="space-y-4">
                  <Input
                    label="등록상품명"
                    placeholder="상품명을 입력하세요 (최대 100자)"
                    value={formData.sellerProductName}
                    onChange={(e) => setFormData(prev => ({ ...prev, sellerProductName: e.target.value }))}
                    required
                    maxLength={100}
                  />
                  <Input
                    label="노출상품명"
                    placeholder="고객에게 노출되는 상품명 (미입력시 등록상품명 사용)"
                    value={formData.displayProductName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayProductName: e.target.value }))}
                    maxLength={100}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="브랜드"
                      placeholder="브랜드명"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      required
                    />
                    <Input
                      label="제조사"
                      placeholder="제조사 (미입력시 브랜드 사용)"
                      value={formData.generalProductName}
                      onChange={(e) => setFormData(prev => ({ ...prev, generalProductName: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="판매 시작일"
                      type="datetime-local"
                      value={formData.saleStartedAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, saleStartedAt: e.target.value }))}
                    />
                    <Input
                      label="판매 종료일"
                      type="datetime-local"
                      value={formData.saleEndedAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, saleEndedAt: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Step 2: 배송 설정 */}
          {currentStep === 2 && (
            <>
              <Card title="출고지 / 반품지" subtitle="상품 출고 및 반품 위치를 설정하세요">
                <div className="space-y-4">
                  {isLoadingShipping ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 size={16} className="animate-spin" />
                      출고지/반품지 로딩 중...
                    </div>
                  ) : (
                    <>
                      <Select
                        label="출고지"
                        options={[
                          { value: '', label: '출고지 선택' },
                          ...outboundPlaces.map(p => ({
                            value: String(p.code),
                            label: `${p.name} (${p.address || ''})`,
                          })),
                        ]}
                        value={formData.outboundShippingPlaceCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, outboundShippingPlaceCode: e.target.value }))}
                        required
                      />
                      <Select
                        label="반품지"
                        options={[
                          { value: '', label: '반품지 선택' },
                          ...returnCenters.map(p => ({
                            value: String(p.code),
                            label: `${p.name} (${p.address || ''})`,
                          })),
                        ]}
                        value={formData.returnCenterCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, returnCenterCode: e.target.value }))}
                        required
                      />
                      {outboundPlaces.length === 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            등록된 출고지가 없습니다. 쿠팡 Wing에서 출고지를 먼저 등록해주세요.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>

              <Card title="배송 설정" subtitle="배송 방법과 배송비를 설정하세요">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="배송방법"
                      options={DELIVERY_METHODS}
                      value={formData.deliveryMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                    />
                    <Select
                      label="택배사"
                      options={DELIVERY_COMPANIES}
                      value={formData.deliveryCompanyCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryCompanyCode: e.target.value }))}
                    />
                  </div>

                  <Select
                    label="배송비 유형"
                    options={DELIVERY_CHARGE_TYPES}
                    value={formData.deliveryChargeType}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryChargeType: e.target.value }))}
                  />

                  {formData.deliveryChargeType !== 'FREE' && (
                    <Input
                      label="배송비"
                      type="number"
                      value={formData.deliveryCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryCharge: parseInt(e.target.value) || 0 }))}
                    />
                  )}

                  {formData.deliveryChargeType === 'CONDITIONAL_FREE' && (
                    <Input
                      label="무료배송 기준금액"
                      type="number"
                      value={formData.freeShipOverAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, freeShipOverAmount: parseInt(e.target.value) || 0 }))}
                    />
                  )}

                  <Select
                    label="묶음배송"
                    options={UNION_DELIVERY_TYPES}
                    value={formData.unionDeliveryType}
                    onChange={(e) => setFormData(prev => ({ ...prev, unionDeliveryType: e.target.value }))}
                  />

                  <Select
                    label="도서산간 배송 가능"
                    options={[
                      { value: 'Y', label: '가능' },
                      { value: 'N', label: '불가능' },
                    ]}
                    value={formData.remoteAreaDeliverable}
                    onChange={(e) => setFormData(prev => ({ ...prev, remoteAreaDeliverable: e.target.value }))}
                  />
                </div>
              </Card>

              <Card title="반품/교환 설정">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="반품배송비 (편도)"
                      type="number"
                      value={formData.returnCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, returnCharge: parseInt(e.target.value) || 0 }))}
                    />
                    <Input
                      label="교환배송비 (왕복)"
                      type="number"
                      value={formData.deliveryChargeOnReturn}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryChargeOnReturn: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <Select
                    label="반품/교환비 부담"
                    options={[
                      { value: 'VENDOR', label: '판매자 선불' },
                      { value: 'BUYER', label: '구매자 착불' },
                    ]}
                    value={formData.returnChargeVendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, returnChargeVendor: e.target.value }))}
                  />
                </div>
              </Card>

              <Card title="A/S 정보">
                <div className="space-y-4">
                  <Input
                    label="A/S 연락처"
                    placeholder="010-1234-5678"
                    value={formData.afterServiceContactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, afterServiceContactNumber: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">A/S 안내</label>
                    <textarea
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="A/S 안내 문구를 입력하세요"
                      value={formData.afterServiceInformation}
                      onChange={(e) => setFormData(prev => ({ ...prev, afterServiceInformation: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Step 3: 상품고시정보 */}
          {currentStep === 3 && (
            <Card title="상품고시정보" subtitle="선택한 카테고리에 맞는 필수 정보를 입력하세요">
              {!categoryMeta ? (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500">카테고리를 먼저 선택해주세요.</p>
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setCurrentStep(1)}
                  >
                    카테고리 선택하기
                  </Button>
                </div>
              ) : categoryMeta.noticeCategories && categoryMeta.noticeCategories.length > 0 ? (
                <div className="space-y-6">
                  {categoryMeta.noticeCategories.map((nc, ncIndex) => (
                    <div key={ncIndex} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        {nc.noticeCategoryName}
                        {nc.required && <span className="text-xs text-red-500">(필수)</span>}
                      </h4>
                      <div className="space-y-3">
                        {nc.noticeItemNames.map((itemName, itemIndex) => {
                          const noticeIndex = notices.findIndex(
                            n => n.noticeCategoryName === nc.noticeCategoryName && n.noticeCategoryDetailName === itemName
                          );
                          const noticeValue = noticeIndex >= 0 ? notices[noticeIndex].content : '';

                          return (
                            <Input
                              key={itemIndex}
                              label={itemName}
                              placeholder={`${itemName}을(를) 입력하세요`}
                              value={noticeValue}
                              onChange={(e) => {
                                if (noticeIndex >= 0) {
                                  setNotices(prev =>
                                    prev.map((n, i) =>
                                      i === noticeIndex ? { ...n, content: e.target.value } : n
                                    )
                                  );
                                } else {
                                  setNotices(prev => [
                                    ...prev,
                                    {
                                      noticeCategoryName: nc.noticeCategoryName,
                                      noticeCategoryDetailName: itemName,
                                      content: e.target.value,
                                    },
                                  ]);
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
                  <p className="text-green-700">이 카테고리는 필수 상품고시정보가 없습니다.</p>
                </div>
              )}
            </Card>
          )}

          {/* Step 4: 옵션/속성 */}
          {currentStep === 4 && (
            <>
              <Card
                title="상품 옵션 (아이템)"
                subtitle="판매할 상품의 옵션별 정보를 입력하세요"
                actions={
                  <Button variant="secondary" size="sm" onClick={addItem}>
                    <Plus size={14} className="mr-1" />
                    옵션 추가
                  </Button>
                }
              >
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">옵션 {index + 1}</span>
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Input
                          label="옵션명"
                          placeholder="예: 빨강 / L, 1kg 세트"
                          value={item.itemName}
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="정가"
                            type="number"
                            value={item.originalPrice}
                            onChange={(e) => updateItem(item.id, 'originalPrice', parseInt(e.target.value) || 0)}
                          />
                          <Input
                            label="판매가"
                            type="number"
                            value={item.salePrice}
                            onChange={(e) => updateItem(item.id, 'salePrice', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            label="최대구매수량"
                            type="number"
                            value={item.maximumBuyCount}
                            onChange={(e) => updateItem(item.id, 'maximumBuyCount', parseInt(e.target.value) || 0)}
                          />
                          <Input
                            label="출고소요일"
                            type="number"
                            value={item.outboundShippingTimeDay}
                            onChange={(e) => updateItem(item.id, 'outboundShippingTimeDay', parseInt(e.target.value) || 0)}
                          />
                          <Input
                            label="단위수량"
                            type="number"
                            value={item.unitCount}
                            onChange={(e) => updateItem(item.id, 'unitCount', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <Input
                          label="판매자 SKU"
                          placeholder="상품 관리 코드"
                          value={item.externalVendorSku}
                          onChange={(e) => updateItem(item.id, 'externalVendorSku', e.target.value)}
                        />

                        {/* 이미지 URL 입력 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">상품 이미지</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="이미지 URL 입력"
                              value=""
                              onChange={() => {}}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  if (input.value) {
                                    updateItem(item.id, 'images', [...item.images, input.value]);
                                    input.value = '';
                                  }
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="secondary"
                              onClick={() => {
                                const url = prompt('이미지 URL을 입력하세요');
                                if (url) {
                                  updateItem(item.id, 'images', [...item.images, url]);
                                }
                              }}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                          {item.images.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {item.images.map((url, imgIndex) => (
                                <div key={imgIndex} className="relative">
                                  <img
                                    src={url}
                                    alt={`이미지 ${imgIndex + 1}`}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  <button
                                    onClick={() => {
                                      updateItem(item.id, 'images', item.images.filter((_, i) => i !== imgIndex));
                                    }}
                                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 구매옵션 (Attributes) */}
              {categoryMeta?.attributes && categoryMeta.attributes.length > 0 && (
                <Card title="구매옵션 (속성)" subtitle="카테고리에 맞는 상품 속성을 입력하세요">
                  <div className="space-y-4">
                    {categoryMeta.attributes.map((attr, index) => {
                      const attrIndex = attributes.findIndex(a => a.attributeTypeName === attr.attributeTypeName);
                      const attrValue = attrIndex >= 0 ? attributes[attrIndex].attributeValueName : '';

                      return (
                        <div key={index}>
                          {attr.attributeValues && attr.attributeValues.length > 0 ? (
                            <Select
                              label={`${attr.attributeTypeName}${attr.required ? ' (필수)' : ''}`}
                              options={[
                                { value: '', label: '선택하세요' },
                                ...attr.attributeValues.map(v => ({ value: v, label: v })),
                              ]}
                              value={attrValue}
                              onChange={(e) => {
                                if (attrIndex >= 0) {
                                  setAttributes(prev =>
                                    prev.map((a, i) =>
                                      i === attrIndex ? { ...a, attributeValueName: e.target.value } : a
                                    )
                                  );
                                } else {
                                  setAttributes(prev => [
                                    ...prev,
                                    {
                                      attributeTypeName: attr.attributeTypeName,
                                      attributeValueName: e.target.value,
                                    },
                                  ]);
                                }
                              }}
                            />
                          ) : (
                            <Input
                              label={`${attr.attributeTypeName}${attr.required ? ' (필수)' : ''}`}
                              placeholder={`${attr.attributeTypeName} 입력`}
                              value={attrValue}
                              onChange={(e) => {
                                if (attrIndex >= 0) {
                                  setAttributes(prev =>
                                    prev.map((a, i) =>
                                      i === attrIndex ? { ...a, attributeValueName: e.target.value } : a
                                    )
                                  );
                                } else {
                                  setAttributes(prev => [
                                    ...prev,
                                    {
                                      attributeTypeName: attr.attributeTypeName,
                                      attributeValueName: e.target.value,
                                    },
                                  ]);
                                }
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* 상세 설명 */}
              <Card title="상세 설명 (HTML)">
                <textarea
                  className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  rows={10}
                  placeholder="<div>상세 설명 HTML을 입력하세요...</div>"
                  value={detailHtml}
                  onChange={(e) => setDetailHtml(e.target.value)}
                />
              </Card>
            </>
          )}
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 등록 상태 요약 */}
          <Card title="등록 상태">
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded ${
                    isStepValid(step.id) ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {isStepValid(step.id) ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-sm ${isStepValid(step.id) ? 'text-green-700' : 'text-gray-500'}`}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* 선택된 정보 요약 */}
          <Card title="상품 요약">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">카테고리</span>
                <span className="font-medium text-right max-w-[150px] truncate">
                  {formData.displayCategoryName || '미선택'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">상품명</span>
                <span className="font-medium text-right max-w-[150px] truncate">
                  {formData.sellerProductName || '미입력'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">브랜드</span>
                <span className="font-medium">{formData.brand || '미입력'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">옵션 수</span>
                <span className="font-medium">{items.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">판매가</span>
                <span className="font-medium">
                  {items[0]?.salePrice ? `${items[0].salePrice.toLocaleString()}원` : '미입력'}
                </span>
              </div>
            </div>
          </Card>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={() => handleSubmit(true)}
              loading={isSaving}
              disabled={!isStepValid(1) || !isStepValid(2) || !isStepValid(4)}
            >
              <Upload size={16} className="mr-2" />
              쿠팡에 등록 요청
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleSubmit(false)}
              loading={isSaving}
            >
              <Save size={16} className="mr-2" />
              임시 저장
            </Button>
          </div>

          {/* 단계 네비게이션 */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              이전
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              disabled={currentStep === 4}
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
