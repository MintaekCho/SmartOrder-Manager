'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { useSystemMode, SystemMode, FeatureSettings } from '@/contexts/SystemModeContext';
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
  Info,
  Store,
  Globe,
  ExternalLink,
} from 'lucide-react';

// 모드 옵션 정의
const modeOptions: {
  value: SystemMode;
  label: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  color: string;
}[] = [
  {
    value: 'dropshipping',
    label: '위탁판매',
    description: '무재고 드롭쉬핑 방식으로 운영합니다.',
    icon: ShoppingCart,
    features: ['상품 소싱', '트렌드 분석', '자동 발주', '마진 계산'],
    color: 'blue',
  },
  {
    value: 'inventory',
    label: '재고관리',
    description: '자체 재고를 보유하고 관리합니다.',
    icon: Package,
    features: ['재고 관리', '창고 관리', '입출고', '재고 실사'],
    color: 'green',
  },
  {
    value: 'hybrid',
    label: '통합',
    description: '위탁판매와 재고관리를 함께 사용합니다.',
    icon: Layers,
    features: ['전체 기능'],
    color: 'purple',
  },
  {
    value: 'shop',
    label: '자사몰 관리',
    description: '자사 쇼핑몰(싱싱마켓)을 운영합니다.',
    icon: Store,
    features: ['상품 관리', '카테고리 관리', '주문 관리', '고객 관리'],
    color: 'emerald',
  },
];

// 기능별 정보
const featureInfo: Record<keyof FeatureSettings, { label: string; icon: React.ElementType; description: string }> = {
  sourcing: { label: '상품 소싱', icon: TrendingUp, description: '트렌드 분석을 통한 상품 소싱' },
  autoOrder: { label: '자동 발주', icon: Truck, description: '주문 발생 시 자동 발주' },
  marginCalc: { label: '마진 계산', icon: Calculator, description: '마진율 계산' },
  inventory: { label: '재고 관리', icon: Package, description: '재고 현황 조회 및 관리' },
  warehouse: { label: '창고 관리', icon: Warehouse, description: '다중 창고, 로케이션 관리' },
  stockIn: { label: '입고 관리', icon: PackagePlus, description: '구매 입고, 반품 입고 등' },
  stockOut: { label: '출고 관리', icon: PackageMinus, description: '판매 출고, 이동 출고 등' },
  stockCount: { label: '재고 실사', icon: ClipboardList, description: '정기/수시 재고 실사' },
  purchaseOrder: { label: '발주 관리', icon: FileText, description: '공급처 발주 관리' },
  shopProducts: { label: '상품 관리', icon: Package, description: '자사몰 상품 등록 및 관리' },
  shopCategories: { label: '카테고리 관리', icon: Layers, description: '자사몰 카테고리 설정' },
  shopOrders: { label: '주문 관리', icon: ShoppingCart, description: '자사몰 주문 처리' },
  shopCustomers: { label: '고객 관리', icon: Store, description: '자사몰 고객 정보 관리' },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system');
  const { settings: systemSettings, setMode, setFeature, getModeLabel } = useSystemMode();

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

  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
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
    { id: 'system', label: '시스템 모드', icon: <Settings size={18} /> },
    { id: 'shop', label: '자사몰 관리', icon: <Store size={18} /> },
    { id: 'api', label: 'API 연동', icon: <Key size={18} /> },
    { id: 'notifications', label: '알림 설정', icon: <Bell size={18} /> },
    { id: 'pricing', label: '가격 정책', icon: <Percent size={18} /> },
  ];

  const getColorClass = (color: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: {
        bg: isSelected ? 'bg-[var(--color-gray-50)]' : 'bg-white',
        border: isSelected ? 'border-[var(--color-gray-900)]' : 'border-gray-200',
        text: 'text-[var(--color-gray-700)]',
      },
      green: {
        bg: isSelected ? 'bg-[var(--color-gray-50)]' : 'bg-white',
        border: isSelected ? 'border-[var(--color-gray-900)]' : 'border-gray-200',
        text: 'text-[var(--color-gray-700)]',
      },
      purple: {
        bg: isSelected ? 'bg-[var(--color-gray-50)]' : 'bg-white',
        border: isSelected ? 'border-[var(--color-gray-900)]' : 'border-gray-200',
        text: 'text-[var(--color-gray-700)]',
      },
      emerald: {
        bg: isSelected ? 'bg-emerald-50' : 'bg-white',
        border: isSelected ? 'border-emerald-600' : 'border-gray-200',
        text: 'text-emerald-700',
      },
    };
    return colors[color];
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
          {/* 시스템 모드 */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* 현재 모드 표시 */}
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Settings size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">현재 시스템 모드</p>
                    <p className="text-xl font-bold text-gray-900">{getModeLabel(systemSettings.mode)}</p>
                  </div>
                </div>
              </Card>

              {/* 모드 선택 */}
              <Card title="시스템 모드 선택" subtitle="비즈니스 유형에 맞는 모드를 선택하세요">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modeOptions.map((option) => {
                    const isSelected = systemSettings.mode === option.value;
                    const colorClass = getColorClass(option.color, isSelected);
                    const Icon = option.icon;

                    return (
                      <button
                        key={option.value}
                        onClick={() => setMode(option.value)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all ${colorClass.bg} ${colorClass.border} hover:shadow-md`}
                      >
                        {isSelected && (
                          <div className={`absolute top-3 right-3 p-1 rounded-full ${colorClass.text} bg-white`}>
                            <Check size={14} />
                          </div>
                        )}
                        <div className={`inline-flex p-2.5 rounded-lg mb-3 ${isSelected ? colorClass.text + ' bg-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Icon size={22} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{option.label}</h3>
                        <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {option.features.map((feature, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 text-xs rounded-full ${isSelected ? `${colorClass.text} bg-white` : 'bg-gray-100 text-gray-600'}`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* 기능 설정 */}
              <Card title="기능 설정" subtitle="개별 기능을 활성화/비활성화할 수 있습니다">
                <div className="flex items-start gap-3 mb-6 p-4 bg-[var(--color-gray-50)] rounded-lg">
                  <Info size={18} className="text-[var(--color-gray-500)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-gray-600)]">
                    시스템 모드를 변경하면 기능 설정이 자동으로 초기화됩니다.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* 위탁판매 기능 - dropshipping, hybrid 모드에서만 표시 */}
                  {(systemSettings.mode === 'dropshipping' || systemSettings.mode === 'hybrid') && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <ShoppingCart size={16} />
                        위탁판매 기능
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(['sourcing', 'autoOrder', 'marginCalc'] as const).map((key) => {
                          const info = featureInfo[key];
                          const Icon = info.icon;
                          const isEnabled = systemSettings.features[key];

                          return (
                            <button
                              key={key}
                              onClick={() => setFeature(key, !isEnabled)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isEnabled ? 'bg-[var(--color-gray-50)] border-[var(--color-gray-300)]' : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)]' : 'bg-gray-200 text-gray-500'}`}>
                                <Icon size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {info.label}
                                </p>
                              </div>
                              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isEnabled ? 'bg-[var(--color-gray-900)]' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 재고관리 기능 - inventory, hybrid, shop 모드에서만 표시 */}
                  {(systemSettings.mode === 'inventory' || systemSettings.mode === 'hybrid' || systemSettings.mode === 'shop') && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Package size={16} />
                        재고관리 기능
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(['inventory', 'warehouse', 'stockIn', 'stockOut', 'stockCount', 'purchaseOrder'] as const).map((key) => {
                          const info = featureInfo[key];
                          const Icon = info.icon;
                          const isEnabled = systemSettings.features[key];

                          return (
                            <button
                              key={key}
                              onClick={() => setFeature(key, !isEnabled)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isEnabled ? 'bg-[var(--color-gray-50)] border-[var(--color-gray-300)]' : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)]' : 'bg-gray-200 text-gray-500'}`}>
                                <Icon size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {info.label}
                                </p>
                              </div>
                              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isEnabled ? 'bg-[var(--color-gray-900)]' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 자사몰 관리 기능 - shop 모드에서만 표시 */}
                  {systemSettings.mode === 'shop' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Store size={16} />
                        자사몰 관리 기능
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(['shopProducts', 'shopCategories', 'shopOrders', 'shopCustomers'] as const).map((key) => {
                          const info = featureInfo[key];
                          const Icon = info.icon;
                          const isEnabled = systemSettings.features[key];

                          return (
                            <button
                              key={key}
                              onClick={() => setFeature(key, !isEnabled)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isEnabled ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                                <Icon size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {info.label}
                                </p>
                                <p className={`text-xs ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {info.description}
                                </p>
                              </div>
                              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 저장 안내 */}
              <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                <Check size={18} className="text-emerald-500" />
                <span className="text-sm text-gray-600">설정은 자동으로 저장됩니다.</span>
              </div>
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
                      <Bell size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">고객 관리</h4>
                      <p className="text-sm text-gray-500">고객 정보 및 문의 관리</p>
                    </div>
                  </a>
                </div>
              </Card>

              {/* 저장 안내 */}
              <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                <Check size={18} className="text-emerald-500" />
                <span className="text-sm text-gray-600">설정은 자동으로 저장됩니다.</span>
              </div>
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

          {/* 저장 버튼 */}
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} loading={isSaving}>
              <Save size={16} className="mr-2" />
              설정 저장
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
