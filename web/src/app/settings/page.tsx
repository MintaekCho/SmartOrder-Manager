'use client';

import { useState, useEffect } from 'react';
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
  Store,
  Globe,
  ExternalLink,
  Truck,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api');

  // 쿠팡 API 설정
  const [coupangApi, setCoupangApi] = useState({
    accessKey: '',
    secretKey: '',
    vendorId: '',
    userId: '',           // 업체 담당자 ID (필수)
    outboundCode: '',     // 출고지 코드 (필수)
    returnCode: '',       // 반품지 코드 (필수)
    contactNumber: '',    // A/S 연락처 (필수)
    isConnected: false,
    isConfigured: false,
    lastVerifiedAt: null as string | null,
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [outboundPlaces, setOutboundPlaces] = useState<Array<{ code: string; name: string; address: string }>>([]);
  const [returnCenters, setReturnCenters] = useState<Array<{ code: string; name: string; address: string }>>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  // 쿠팡 API 설정 로드
  useEffect(() => {
    const loadCoupangConfig = async () => {
      try {
        const response = await fetch('/api/platform/config?platform=COUPANG');
        const result = await response.json();

        if (result.success && result.data?.length > 0) {
          const config = result.data[0];
          const creds = config.credentials || {};

          setCoupangApi({
            accessKey: creds.accessKey || '',
            secretKey: creds.secretKey || '',
            vendorId: creds.vendorId || '',
            userId: config.userId || '',
            outboundCode: config.outboundCode || '',
            returnCode: config.returnCode || '',
            contactNumber: config.contactNumber || '',
            isConnected: config.isActive || false,
            isConfigured: config.isConfigured || false,
            lastVerifiedAt: config.lastVerifiedAt,
          });

          // API 키가 설정되어 있으면 출고지/반품지 목록 로드
          if (creds.accessKey && creds.secretKey && creds.vendorId) {
            loadShippingPlaces();
          }
        }
      } catch (error) {
        console.error('쿠팡 설정 로드 오류:', error);
      } finally {
        setIsLoadingApi(false);
      }
    };

    loadCoupangConfig();
  }, []);

  // 출고지/반품지 목록 로드
  const loadShippingPlaces = async () => {
    setIsLoadingPlaces(true);
    try {
      // 출고지 목록
      const outboundResponse = await fetch('/api/coupang/shipping?type=outbound');
      const outboundResult = await outboundResponse.json();
      if (outboundResult.success) {
        setOutboundPlaces(outboundResult.data || []);
      }

      // 반품지 목록
      const returnResponse = await fetch('/api/coupang/shipping?type=return');
      const returnResult = await returnResponse.json();
      if (returnResult.success) {
        setReturnCenters(returnResult.data || []);
      }
    } catch (error) {
      console.error('출고지/반품지 로드 오류:', error);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

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

  // 자사몰 설정
  const [shopSettings, setShopSettings] = useState({
    shopName: '싱싱마켓',
    shopUrl: 'http://localhost:3005',
    shopEnabled: true,
    autoSync: true,
    syncInterval: '30',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCoupangApi = async () => {
    // PDF 가이드 기반 필수 필드 검증
    const errors: string[] = [];
    if (!coupangApi.accessKey) errors.push('Access Key');
    if (!coupangApi.secretKey) errors.push('Secret Key');
    if (!coupangApi.vendorId) errors.push('Vendor ID');
    if (!coupangApi.userId) errors.push('업체 담당자 ID');
    if (!coupangApi.outboundCode) errors.push('출고지');
    if (!coupangApi.returnCode) errors.push('반품지');
    if (!coupangApi.contactNumber) errors.push('A/S 연락처');

    if (errors.length > 0) {
      alert(`다음 필수 항목을 입력해주세요:\n${errors.join(', ')}`);
      return;
    }

    setIsTesting(true);
    try {
      // 1. DB에 저장
      const saveResponse = await fetch('/api/platform/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'COUPANG',
          credentials: {
            accessKey: coupangApi.accessKey,
            secretKey: coupangApi.secretKey,
            vendorId: coupangApi.vendorId,
          },
          userId: coupangApi.userId,
          outboundCode: coupangApi.outboundCode,
          returnCode: coupangApi.returnCode,
          contactNumber: coupangApi.contactNumber,
        }),
      });

      const saveResult = await saveResponse.json();
      if (!saveResult.success) {
        throw new Error(saveResult.error || '저장에 실패했습니다.');
      }

      setCoupangApi((prev) => ({ ...prev, isConfigured: true }));

      // 2. 연결 테스트
      const verifyResponse = await fetch('/api/platform/config/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'COUPANG' }),
      });

      const verifyResult = await verifyResponse.json();
      if (verifyResult.success) {
        setCoupangApi((prev) => ({
          ...prev,
          isConnected: true,
          lastVerifiedAt: new Date().toISOString(),
        }));
        alert('쿠팡 API 연결이 확인되었습니다!');
      } else {
        setCoupangApi((prev) => ({ ...prev, isConnected: false }));
        alert(`설정이 저장되었지만 연결 테스트 실패: ${verifyResult.error}`);
      }

      // 출고지/반품지 목록 새로고침
      await loadShippingPlaces();
    } catch (error) {
      console.error('쿠팡 API 설정 오류:', error);
      alert(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestCoupangApi = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/platform/config/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'COUPANG' }),
      });

      const result = await response.json();
      if (result.success) {
        setCoupangApi((prev) => ({ ...prev, isConnected: true }));
        alert('쿠팡 API 연결이 확인되었습니다!');
      } else {
        setCoupangApi((prev) => ({ ...prev, isConnected: false }));
        alert(`연결 테스트 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('쿠팡 API 테스트 오류:', error);
      alert('API 연결 테스트에 실패했습니다.');
    } finally {
      setIsTesting(false);
    }
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
    { id: 'shop', label: '자사몰', icon: <Store size={18} /> },
    { id: 'notifications', label: '알림', icon: <Bell size={18} /> },
    { id: 'pricing', label: '가격 정책', icon: <Percent size={18} /> },
  ];

  return (
    <DashboardLayout
      title="설정"
      breadcrumb={[{ name: '홈', href: '/' }, { name: '설정' }]}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 탭 메뉴 */}
        <div className="lg:w-56 flex-shrink-0">
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
                    {isLoadingApi ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-gray-400" />
                        <span className="text-sm text-gray-500">로딩 중...</span>
                      </>
                    ) : coupangApi.isConnected ? (
                      <>
                        <CheckCircle size={18} className="text-green-500" />
                        <span className="text-sm text-green-600">연동됨</span>
                        {coupangApi.lastVerifiedAt && (
                          <span className="text-xs text-gray-400 ml-2">
                            (마지막 확인: {new Date(coupangApi.lastVerifiedAt).toLocaleString('ko-KR')})
                          </span>
                        )}
                      </>
                    ) : coupangApi.isConfigured ? (
                      <>
                        <XCircle size={18} className="text-yellow-500" />
                        <span className="text-sm text-yellow-600">설정됨 (연결 확인 필요)</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-500">연동되지 않음</span>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                        className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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

                  <Input
                    label="업체 담당자 ID"
                    placeholder="쿠팡 Wing 사용자 ID를 입력하세요"
                    value={coupangApi.userId}
                    onChange={(e) =>
                      setCoupangApi((prev) => ({ ...prev, userId: e.target.value }))
                    }
                    helperText="상품 등록 시 필수 항목입니다"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      출고지 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={coupangApi.outboundCode}
                      onChange={(e) =>
                        setCoupangApi((prev) => ({ ...prev, outboundCode: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoadingPlaces || outboundPlaces.length === 0}
                    >
                      <option value="">출고지를 선택하세요</option>
                      {outboundPlaces.map((place) => (
                        <option key={place.code} value={place.code}>
                          {place.name} ({place.address})
                        </option>
                      ))}
                    </select>
                    {outboundPlaces.length === 0 && !isLoadingPlaces && coupangApi.isConfigured && (
                      <p className="text-xs text-orange-600 mt-1">
                        쿠팡 Wing에서 출고지를 먼저 등록해주세요
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      반품지 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={coupangApi.returnCode}
                      onChange={(e) =>
                        setCoupangApi((prev) => ({ ...prev, returnCode: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoadingPlaces || returnCenters.length === 0}
                    >
                      <option value="">반품지를 선택하세요</option>
                      {returnCenters.map((center) => (
                        <option key={center.code} value={center.code}>
                          {center.name} ({center.address})
                        </option>
                      ))}
                    </select>
                    {returnCenters.length === 0 && !isLoadingPlaces && coupangApi.isConfigured && (
                      <p className="text-xs text-orange-600 mt-1">
                        쿠팡 Wing에서 반품지를 먼저 등록해주세요
                      </p>
                    )}
                  </div>

                  <Input
                    label="A/S 연락처"
                    placeholder="02-1234-5678"
                    value={coupangApi.contactNumber}
                    onChange={(e) =>
                      setCoupangApi((prev) => ({ ...prev, contactNumber: e.target.value }))
                    }
                    helperText="고객 A/S 문의 연락처 (필수)"
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveCoupangApi}
                      loading={isTesting}
                      disabled={
                        !coupangApi.accessKey ||
                        !coupangApi.secretKey ||
                        !coupangApi.vendorId ||
                        !coupangApi.userId ||
                        !coupangApi.outboundCode ||
                        !coupangApi.returnCode ||
                        !coupangApi.contactNumber
                      }
                    >
                      <Save size={16} className="mr-2" />
                      저장 및 연결 테스트
                    </Button>
                    {coupangApi.isConfigured && (
                      <Button
                        variant="secondary"
                        onClick={handleTestCoupangApi}
                        loading={isTesting}
                      >
                        <TestTube size={16} className="mr-2" />
                        연결 테스트
                      </Button>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Truck size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-2">설정 가이드</p>
                        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                          <li>쿠팡 Wing 로그인 → 판매자정보 → OPEN API에서 API Key 발급</li>
                          <li>판매자정보 → 출고지/반품지 관리에서 출고지와 반품지 등록</li>
                          <li>위 양식에 모든 필수 항목(*) 입력 후 저장</li>
                          <li>연결 테스트로 API 정상 작동 확인</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-2">
                          ⚠️ 출고지/반품지가 Wing에 등록되어 있지 않으면 상품 등록이 실패합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 자사몰 설정 */}
          {activeTab === 'shop' && (
            <div className="space-y-6">
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

              <Card title="자사몰 기본 설정">
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
                  />

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium">자사몰 연동 활성화</h4>
                      <p className="text-sm text-gray-500">비활성화 시 상품이 자사몰에 노출되지 않습니다</p>
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
                        <CheckCircle size={18} className="text-green-500" />
                        <span className="text-sm text-green-600">연동됨</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-500">연동되지 않음</span>
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

                  <Button variant="secondary" onClick={handleTestTelegram} loading={isTesting}>
                    <Send size={16} className="mr-2" />
                    테스트 메시지 전송
                  </Button>
                </div>
              </Card>

              <Card title="알림 유형">
                <div className="space-y-4">
                  {[
                    { key: 'newOrder', label: '신규 주문', desc: '새로운 주문이 들어오면 알림' },
                    { key: 'priceChange', label: '가격 변동', desc: '경쟁 상품 가격 변동 시 알림' },
                    { key: 'outOfStock', label: '품절 알림', desc: '도매처 상품 품절 시 알림' },
                    { key: 'dailyReport', label: '일일 리포트', desc: '매일 판매 현황 요약' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{item.label}</h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
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
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* 가격 정책 */}
          {activeTab === 'pricing' && (
            <Card title="가격 정책" subtitle="상품 등록 시 적용될 기본 가격 정책">
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

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">판매가에 배송비 포함</h4>
                    <p className="text-sm text-gray-500">배송비를 마진 계산에 포함합니다</p>
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
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">마진 계산 공식</h4>
                  <p className="text-sm text-gray-600 font-mono">
                    순이익 = 판매가 - 도매가 - 배송비 - 쿠팡수수료(10%)
                  </p>
                  <p className="text-sm text-gray-600 font-mono">
                    마진율 = (순이익 / 판매가) × 100
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 저장 버튼 */}
          {activeTab !== 'api' && (
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} loading={isSaving}>
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
