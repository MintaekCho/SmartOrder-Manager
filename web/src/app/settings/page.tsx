'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
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
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api');

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

  const tabs = [
    { id: 'api', label: 'API 연동', icon: <Key size={18} /> },
    { id: 'notifications', label: '알림 설정', icon: <Bell size={18} /> },
    { id: 'pricing', label: '가격 정책', icon: <Percent size={18} /> },
  ];

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
