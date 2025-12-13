'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input, Select } from '@/components/ui';
import {
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Truck,
  Package,
  Phone,
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

interface ShippingPlace {
  code: number | string;
  name: string;
}

export default function CoupangSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // 출고지/반품지 목록
  const [outboundPlaces, setOutboundPlaces] = useState<ShippingPlace[]>([]);
  const [returnCenters, setReturnCenters] = useState<ShippingPlace[]>([]);

  // 설정 폼
  const [formData, setFormData] = useState({
    // 배송 설정
    deliveryMethod: 'SEQUENCIAL',
    deliveryCompanyCode: 'CJGLS',
    deliveryChargeType: 'NOT_FREE',
    deliveryCharge: 3000,
    freeShipOverAmount: 50000,
    deliveryChargeOnReturn: 6000,
    remoteAreaDeliverable: 'Y',
    unionDeliveryType: 'UNION_DELIVERY',

    // 출고지/반품지
    outboundShippingPlaceCode: '',
    outboundShippingPlaceName: '',
    returnCenterCode: '',
    returnCenterName: '',

    // 반품 설정
    returnCharge: 6000,
    returnChargeVendor: 'VENDOR',

    // A/S 정보
    afterServiceInformation: '고객센터로 문의해주세요.',
    afterServiceContactNumber: '',

    // 기본값
    defaultBrand: '',
    vendorUserId: '',
  });

  // 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/coupang/settings');
      const result = await response.json();

      if (result.success) {
        setFormData(result.data);
        setIsConfigured(result.isConfigured);

        if (result.outboundPlaces) {
          setOutboundPlaces(result.outboundPlaces);
        }
        if (result.returnCenters) {
          setReturnCenters(result.returnCenters);
        }
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 출고지/반품지 이름도 함께 저장
      const outboundPlace = outboundPlaces.find(p => String(p.code) === formData.outboundShippingPlaceCode);
      const returnCenter = returnCenters.find(c => String(c.code) === formData.returnCenterCode);

      const response = await fetch('/api/coupang/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          outboundShippingPlaceName: outboundPlace?.name || '',
          returnCenterName: returnCenter?.name || '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsConfigured(true);
        alert('설정이 저장되었습니다.');
      } else {
        throw new Error(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="쿠팡 기본 설정"
        breadcrumb={[
          { name: '홈', href: '/' },
          { name: '쿠팡 상품', href: '/products/coupang' },
          { name: '기본 설정' },
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="쿠팡 기본 설정"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '쿠팡 상품', href: '/products/coupang' },
        { name: '기본 설정' },
      ]}
    >
      {/* 상태 표시 */}
      <div className="mb-6">
        {isConfigured ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-green-700">기본 설정이 완료되었습니다. 일괄등록 시 이 설정이 적용됩니다.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
            <AlertTriangle size={20} className="text-yellow-600" />
            <span className="text-yellow-700">
              기본 설정을 완료해주세요. 설정하지 않으면 일괄등록 시 쿠팡 상품 등록이 실패할 수 있습니다.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 출고지/반품지 설정 */}
        <Card
          title="출고지 / 반품지"
          subtitle="상품 출고 및 반품 위치를 설정하세요"
          icon={<Package size={20} className="text-orange-600" />}
        >
          <div className="space-y-4">
            <Select
              label="출고지"
              options={[
                { value: '', label: '출고지 선택' },
                ...outboundPlaces.map(p => ({
                  value: String(p.code),
                  label: p.name,
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
                ...returnCenters.map(c => ({
                  value: String(c.code),
                  label: c.name,
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
          </div>
        </Card>

        {/* 배송 설정 */}
        <Card
          title="배송 설정"
          subtitle="기본 배송 방법과 배송비를 설정하세요"
          icon={<Truck size={20} className="text-blue-600" />}
        >
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
              label="도서산간 배송"
              options={[
                { value: 'Y', label: '가능' },
                { value: 'N', label: '불가능' },
              ]}
              value={formData.remoteAreaDeliverable}
              onChange={(e) => setFormData(prev => ({ ...prev, remoteAreaDeliverable: e.target.value }))}
            />
          </div>
        </Card>

        {/* 반품/교환 설정 */}
        <Card
          title="반품/교환 설정"
          subtitle="반품 및 교환 관련 설정"
          icon={<Settings size={20} className="text-gray-600" />}
        >
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

        {/* A/S 및 기타 설정 */}
        <Card
          title="A/S 및 기타 설정"
          subtitle="A/S 정보와 기본값을 설정하세요"
          icon={<Phone size={20} className="text-green-600" />}
        >
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

            <Input
              label="기본 브랜드"
              placeholder="상품 등록 시 기본으로 사용할 브랜드"
              value={formData.defaultBrand}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultBrand: e.target.value }))}
            />

            <Input
              label="판매자 ID (vendorUserId)"
              placeholder="쿠팡 Wing 담당자 ID"
              value={formData.vendorUserId}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorUserId: e.target.value }))}
            />
          </div>
        </Card>
      </div>

      {/* 저장 버튼 */}
      <div className="mt-6 flex justify-end">
        <Button
          className="bg-orange-600 hover:bg-orange-700 px-8"
          onClick={handleSave}
          loading={isSaving}
        >
          <Save size={16} className="mr-2" />
          설정 저장
        </Button>
      </div>
    </DashboardLayout>
  );
}
