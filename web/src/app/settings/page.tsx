'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { useFeatureSettings, featureList, FeatureSettings } from '@/contexts/FeatureSettingsContext';
import {
  Key,
  Bell,
  Percent,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Send,
  Settings,
  ShoppingCart,
  Package,
  Layers,
  Check,
  Truck,
  TrendingUp,
  Calculator,
  Warehouse,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  FileText,
  Store,
  Globe,
  ExternalLink,
  BarChart3,
  Users,
  ShoppingBag,
  Building2,
  Wrench,
  Boxes,
  Loader2,
} from 'lucide-react';

// 아이콘 매핑
const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  Package,
  ShoppingCart,
  Truck,
  Calculator,
  BarChart3,
  Boxes,
  Warehouse,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  FileText,
  Store,
  Layers,
  ShoppingBag,
  Users,
  Building2,
  Wrench,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('features');
  const { features, setFeature, isLoading, isSaving } = useFeatureSettings();

  // API 설정
  const [coupangApi, setCoupangApi] = useState({
    accessKey: '',
    secretKey: '',
    vendorId: '',
    isConnected: false,
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // 알림 설정
  const [notifications, setNotifications] = useState({
    newOrder: true,
    priceChange: true,
    outOfStock: true,
    dailyReport: false,
    telegramBotToken: '',
    telegramChatId: '',
    isTelegramConnected: false,
  });

  // 가격 정책
  const [pricing, setPricing] = useState({
    defaultMarginRate: '20',
    minMarginRate: '10',
    roundingUnit: '100',
    includeShipping: true,
  });

  const [isSavingOther, setIsSavingOther] = useState(false);

  const handleTestCoupangApi = async () => {
    setIsTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setCoupangApi((prev) => ({ ...prev, isConnected: true }));
    setIsTesting(false);
  };

  const handleTestTelegram = async () => {
    setIsTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setNotifications((prev) => ({ ...prev, isTelegramConnected: true }));
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSavingOther(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSavingOther(false);
    alert('설정이 저장되었습니다.');
  };

  // 자사몰 설정
  const [shopSettings, setShopSettings] = useState({
    shopName: '싱싱마켓',
    shopUrl: 'http://localhost:3005',
    shopEnabled: true,
    autoSync: true,
    syncInterval: '30',
  });

  const tabs = [
    { id: 'features', label: '기능 설정', icon: <Settings size={18} /> },
    { id: 'shop', label: '자사몰 관리', icon: <Store size={18} /> },
    { id: 'api', label: 'API 연동', icon: <Key size={18} /> },
    { id: 'notifications', label: '알림 설정', icon: <Bell size={18} /> },
    { id: 'pricing', label: '가격 정책', icon: <Percent size={18} /> },
  ];

  // 기능 토글 렌더링
  const renderFeatureToggle = (featureKey: keyof FeatureSettings, label: string, description: string, iconName: string) => {
    const isEnabled = features[featureKey];
    const Icon = iconMap[iconName] || Package;

    return (
      <button
        key={featureKey}
        onClick={() => setFeature(featureKey, !isEnabled)}
        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
          isEnabled
            ? 'bg-[var(--color-primary-50)] border-[var(--color-primary-300)]'
            : 'bg-gray-50 border-gray-200 opacity-70 hover:opacity-100'
        }`}
      >
        <div
          className={`p-2.5 rounded-lg ${
            isEnabled
              ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-600)]'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1 text-left">
          <p className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-600'}`}>
            {label}
          </p>
          <p className={`text-xs ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
            {description}
          </p>
        </div>
        <div
          className={`w-12 h-6 rounded-full p-1 transition-colors ${
            isEnabled ? 'bg-[var(--color-primary-500)]' : 'bg-gray-300'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    );
  };

  return (
    <DashboardLayout
      title="설정"
      breadcrumb={[{ name: '홈', href: '/' }, { name: '설정' }]}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 탭 메뉴 */}
        <div className="lg:w-64 flex-shrink-0">
          <Card padding={false}>
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                      : 'text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* 설정 내용 */}
        <div className="flex-1">
          {/* 기능 설정 */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              {/* 상태 표시 */}
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Settings size={24} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">기능 설정</p>
                      <p className="text-xl font-bold text-gray-900">
                        {Object.values(features).filter(Boolean).length}개 기능 활성화
                      </p>
                    </div>
                  </div>
                  {isSaving && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={16} className="animate-spin" />
                      저장 중...
                    </div>
                  )}
                  {!isSaving && !isLoading && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <Check size={16} />
                      자동 저장됨
                    </div>
                  )}
                </div>
              </Card>

              {/* 기능 토글 목록 */}
              <Card
                title="사용할 기능 선택"
                subtitle="필요한 기능만 활성화하여 사용하세요. 설정은 자동으로 저장됩니다."
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featureList.map((feature) =>
                      renderFeatureToggle(
                        feature.key,
                        feature.label,
                        feature.description,
                        feature.icon
                      )
                    )}
                  </div>
                )}
              </Card>

              {/* 빠른 설정 프리셋 */}
              <Card title="빠른 설정" subtitle="자주 사용하는 기능 조합을 한 번에 설정합니다">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      // 위탁판매 프리셋
                      setFeature('sourcing', true);
                      setFeature('coupangProducts', true);
                      setFeature('coupangOrders', true);
                      setFeature('autoOrder', true);
                      setFeature('marginCalc', true);
                      setFeature('settlements', true);
                      setFeature('suppliers', true);
                      setFeature('tools', true);
                    }}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ShoppingCart size={18} className="text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">위탁판매</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      쿠팡 상품/주문, 소싱, 자동발주, 마진계산 등
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      // 재고관리 프리셋
                      setFeature('inventory', true);
                      setFeature('warehouse', true);
                      setFeature('stockIn', true);
                      setFeature('stockOut', true);
                      setFeature('stockCount', true);
                      setFeature('purchaseOrder', true);
                    }}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Package size={18} className="text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-900">재고관리</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      재고, 창고, 입출고, 실사, 발주 관리
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      // 자사몰 프리셋
                      setFeature('shopProducts', true);
                      setFeature('shopCategories', true);
                      setFeature('shopOrders', true);
                      setFeature('shopCustomers', true);
                      setFeature('inventory', true);
                    }}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Store size={18} className="text-emerald-600" />
                      </div>
                      <span className="font-semibold text-gray-900">자사몰</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      상품, 카테고리, 주문, 고객 관리
                    </p>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      // 모든 기능 활성화
                      featureList.forEach((f) => setFeature(f.key, true));
                    }}
                    className="text-sm text-[var(--color-primary-600)] hover:underline mr-4"
                  >
                    모두 활성화
                  </button>
                  <button
                    onClick={() => {
                      // 리포트만 남기고 비활성화
                      featureList.forEach((f) => setFeature(f.key, f.key === 'reports'));
                    }}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    모두 비활성화
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* 자사몰 관리 */}
          {activeTab === 'shop' && (
            <div className="space-y-6">
              {/* 자사몰 연결 상태 */}
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Store size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">자사몰 연결 상태</p>
                      <p className="text-xl font-bold text-gray-900">
                        {shopSettings.shopEnabled ? '활성화됨' : '비활성화됨'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={shopSettings.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm text-gray-700"
                  >
                    <Globe size={16} />
                    자사몰 바로가기
                    <ExternalLink size={14} />
                  </a>
                </div>
              </Card>

              {/* 기본 설정 */}
              <Card title="자사몰 기본 설정" subtitle="자사몰 연동에 필요한 기본 정보를 설정합니다">
                <div className="space-y-4">
                  <Input
                    label="쇼핑몰 이름"
                    placeholder="쇼핑몰 이름을 입력하세요"
                    value={shopSettings.shopName}
                    onChange={(e) =>
                      setShopSettings((prev) => ({ ...prev, shopName: e.target.value }))
                    }
                  />
                  <Input
                    label="쇼핑몰 URL"
                    placeholder="http://localhost:3005"
                    value={shopSettings.shopUrl}
                    onChange={(e) =>
                      setShopSettings((prev) => ({ ...prev, shopUrl: e.target.value }))
                    }
                    helperText="자사몰이 실행되는 URL을 입력하세요"
                  />

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium">자사몰 연동 활성화</h4>
                      <p className="text-sm text-gray-500">
                        비활성화 시 상품이 자사몰에 노출되지 않습니다
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shopSettings.shopEnabled}
                        onChange={(e) =>
                          setShopSettings((prev) => ({ ...prev, shopEnabled: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                </div>
              </Card>

              {/* 동기화 설정 */}
              <Card title="상품 동기화 설정" subtitle="자사몰과의 상품 동기화 방식을 설정합니다">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium">자동 동기화</h4>
                      <p className="text-sm text-gray-500">
                        상품 정보 변경 시 자동으로 자사몰에 반영됩니다
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shopSettings.autoSync}
                        onChange={(e) =>
                          setShopSettings((prev) => ({ ...prev, autoSync: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>

                  <Input
                    label="동기화 간격 (분)"
                    type="number"
                    placeholder="30"
                    value={shopSettings.syncInterval}
                    onChange={(e) =>
                      setShopSettings((prev) => ({ ...prev, syncInterval: e.target.value }))
                    }
                    helperText="재고 및 가격 정보를 동기화하는 간격"
                    disabled={!shopSettings.autoSync}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary">
                      수동 동기화 실행
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 관리 페이지 바로가기 */}
              <Card title="자사몰 관리" subtitle="자사몰 관련 관리 페이지로 빠르게 이동합니다">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/shop/products"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Package size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">상품 관리</h4>
                      <p className="text-sm text-gray-500">자사몰 노출 상품 관리</p>
                    </div>
                  </a>

                  <a
                    href="/shop/categories"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Layers size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">카테고리 관리</h4>
                      <p className="text-sm text-gray-500">자사몰 카테고리 설정</p>
                    </div>
                  </a>

                  <a
                    href="/shop/orders"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <ShoppingCart size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">주문 관리</h4>
                      <p className="text-sm text-gray-500">자사몰 주문 현황 확인</p>
                    </div>
                  </a>

                  <a
                    href="/shop/customers"
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Users size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">고객 관리</h4>
                      <p className="text-sm text-gray-500">고객 정보 및 문의 관리</p>
                    </div>
                  </a>
                </div>
              </Card>
            </div>
          )}

          {/* API 연동 */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* 쿠팡 Wing API */}
              <Card
                title="쿠팡 Wing API"
                subtitle="쿠팡 판매자센터에서 발급받은 API 키를 입력하세요"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    {coupangApi.isConnected ? (
                      <>
                        <CheckCircle size={18} className="text-[var(--color-success)]" />
                        <span className="text-sm text-[var(--color-success)]">연동됨</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-[var(--color-gray-400)]" />
                        <span className="text-sm text-[var(--color-gray-500)]">연동되지 않음</span>
                      </>
                    )}
                  </div>

                  <Input
                    label="Access Key"
                    placeholder="Access Key를 입력하세요"
                    value={coupangApi.accessKey}
                    onChange={(e) =>
                      setCoupangApi((prev) => ({ ...prev, accessKey: e.target.value }))
                    }
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">
                      Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showSecretKey ? 'text' : 'password'}
                        placeholder="Secret Key를 입력하세요"
                        value={coupangApi.secretKey}
                        onChange={(e) =>
                          setCoupangApi((prev) => ({ ...prev, secretKey: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 pr-10 text-sm border border-[var(--color-gray-300)] rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]"
                      >
                        {showSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Input
                    label="Vendor ID"
                    placeholder="Vendor ID를 입력하세요"
                    value={coupangApi.vendorId}
                    onChange={(e) =>
                      setCoupangApi((prev) => ({ ...prev, vendorId: e.target.value }))
                    }
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="secondary"
                      onClick={handleTestCoupangApi}
                      loading={isTesting}
                    >
                      <TestTube size={16} className="mr-2" />
                      연결 테스트
                    </Button>
                  </div>

                  <div className="p-4 bg-[var(--color-gray-50)] rounded-lg">
                    <p className="text-sm text-[var(--color-gray-600)] mb-2">
                      API 키 발급 방법:
                    </p>
                    <ol className="text-sm text-[var(--color-gray-500)] list-decimal list-inside space-y-1">
                      <li>쿠팡 Wing 로그인</li>
                      <li>판매자정보 → OPEN API 메뉴 이동</li>
                      <li>API Key 발급 요청</li>
                      <li>발급받은 Access Key, Secret Key 입력</li>
                    </ol>
                  </div>
                </div>
              </Card>

              {/* 도매처 연동 */}
              <Card title="도매처 연동" subtitle="도매처 계정 정보를 입력하세요">
                <div className="space-y-4">
                  <div className="p-4 border border-[var(--color-gray-200)] rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center font-bold text-[var(--color-gray-600)]">
                          도
                        </div>
                        <div>
                          <h4 className="font-medium">도매꾹</h4>
                          <p className="text-sm text-[var(--color-gray-500)]">domeggook.com</p>
                        </div>
                      </div>
                      <span className="text-sm text-[var(--color-gray-500)]">선택 사항</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="아이디" />
                      <Input type="password" placeholder="비밀번호" />
                    </div>
                  </div>

                  <p className="text-sm text-[var(--color-gray-500)]">
                    * 도매처 계정은 자동 발주 기능 사용 시 필요합니다.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* 알림 설정 */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card title="텔레그램 알림" subtitle="텔레그램 봇으로 실시간 알림을 받으세요">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    {notifications.isTelegramConnected ? (
                      <>
                        <CheckCircle size={18} className="text-[var(--color-success)]" />
                        <span className="text-sm text-[var(--color-success)]">연동됨</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-[var(--color-gray-400)]" />
                        <span className="text-sm text-[var(--color-gray-500)]">연동되지 않음</span>
                      </>
                    )}
                  </div>

                  <Input
                    label="Bot Token"
                    placeholder="텔레그램 봇 토큰"
                    value={notifications.telegramBotToken}
                    onChange={(e) =>
                      setNotifications((prev) => ({ ...prev, telegramBotToken: e.target.value }))
                    }
                  />
                  <Input
                    label="Chat ID"
                    placeholder="채팅방 ID"
                    value={notifications.telegramChatId}
                    onChange={(e) =>
                      setNotifications((prev) => ({ ...prev, telegramChatId: e.target.value }))
                    }
                  />

                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleTestTelegram} loading={isTesting}>
                      <Send size={16} className="mr-2" />
                      테스트 메시지 전송
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="알림 유형" subtitle="받고 싶은 알림을 선택하세요">
                <div className="space-y-4">
                  {[
                    { key: 'newOrder', label: '신규 주문', desc: '새로운 주문이 들어오면 알림' },
                    { key: 'priceChange', label: '가격 변동', desc: '경쟁 상품 가격 변동 시 알림' },
                    { key: 'outOfStock', label: '품절 알림', desc: '도매처 상품 품절 시 알림' },
                    { key: 'dailyReport', label: '일일 리포트', desc: '매일 판매 현황 요약' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-[var(--color-gray-200)] rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{item.label}</h4>
                        <p className="text-sm text-[var(--color-gray-500)]">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--color-gray-300)] rounded-full peer peer-checked:bg-[var(--color-primary-500)] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* 가격 정책 */}
          {activeTab === 'pricing' && (
            <Card title="가격 정책" subtitle="상품 등록 시 적용될 기본 가격 정책을 설정하세요">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="기본 마진율 (%)"
                    type="number"
                    placeholder="20"
                    value={pricing.defaultMarginRate}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, defaultMarginRate: e.target.value }))
                    }
                    helperText="상품 등록 시 기본 적용되는 마진율"
                  />
                  <Input
                    label="최소 마진율 (%)"
                    type="number"
                    placeholder="10"
                    value={pricing.minMarginRate}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, minMarginRate: e.target.value }))
                    }
                    helperText="이 이하로 설정 시 경고 표시"
                  />
                </div>

                <Input
                  label="가격 반올림 단위 (원)"
                  type="number"
                  placeholder="100"
                  value={pricing.roundingUnit}
                  onChange={(e) =>
                    setPricing((prev) => ({ ...prev, roundingUnit: e.target.value }))
                  }
                  helperText="예: 100 → 12,345원 → 12,400원"
                />

                <div className="flex items-center justify-between p-4 border border-[var(--color-gray-200)] rounded-lg">
                  <div>
                    <h4 className="font-medium">판매가에 배송비 포함</h4>
                    <p className="text-sm text-[var(--color-gray-500)]">
                      배송비를 마진 계산에 포함합니다
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pricing.includeShipping}
                      onChange={(e) =>
                        setPricing((prev) => ({ ...prev, includeShipping: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--color-gray-300)] rounded-full peer peer-checked:bg-[var(--color-primary-500)] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                <div className="p-4 bg-[var(--color-gray-50)] rounded-lg">
                  <h4 className="font-medium mb-2">마진 계산 공식</h4>
                  <p className="text-sm text-[var(--color-gray-600)] font-mono">
                    순이익 = 판매가 - 도매가 - 배송비 - 쿠팡수수료(10%)
                  </p>
                  <p className="text-sm text-[var(--color-gray-600)] font-mono">
                    마진율 = (순이익 / 판매가) × 100
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 저장 버튼 (API/알림/가격정책 탭에서만) */}
          {activeTab !== 'features' && (
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} loading={isSavingOther}>
                <Save size={16} className="mr-2" />
                설정 저장
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
