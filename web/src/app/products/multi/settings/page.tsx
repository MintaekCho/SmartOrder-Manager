'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import {
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Settings,
  Key,
  Store,
  Package,
} from 'lucide-react';

// 플랫폼 정보
const platforms = [
  {
    id: 'COUPANG',
    label: '쿠팡 Wing API',
    description: '쿠팡 마켓플레이스 상품 등록 및 관리',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-100',
    docUrl: 'https://developers.coupangcorp.com/hc/ko',
    credentials: [
      { key: 'vendorId', label: 'Vendor ID', type: 'text', placeholder: 'A00XXXXXX' },
      { key: 'accessKey', label: 'Access Key', type: 'text', placeholder: '발급받은 Access Key' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: '발급받은 Secret Key' },
    ],
  },
  {
    id: 'NAVER',
    label: '네이버 Commerce API',
    description: '네이버 스마트스토어 상품 등록 및 관리',
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
    docUrl: 'https://apicenter.commerce.naver.com/',
    credentials: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: '애플리케이션 ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: '애플리케이션 Secret' },
    ],
  },
];

interface PlatformConfig {
  platform: string;
  credentials: Record<string, string>;
  isConfigured: boolean;
  isVerified: boolean;
  lastVerifiedAt?: string;
  outboundCode?: string;
  returnCode?: string;
}

export default function PlatformSettingsPage() {
  const [configs, setConfigs] = useState<Record<string, PlatformConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // 초기 로드
  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/platform/config');
        const result = await response.json();

        const configMap: Record<string, PlatformConfig> = {};

        // 기본 빈 설정 초기화
        platforms.forEach(p => {
          configMap[p.id] = {
            platform: p.id,
            credentials: {},
            isConfigured: false,
            isVerified: false,
          };
        });

        if (result.success && result.data) {
          // API에서 받은 데이터로 업데이트
          result.data.forEach((config: {
            platform: string;
            credentials: Record<string, string>;
            isConfigured: boolean;
            isActive: boolean;
            lastVerifiedAt: string | null;
            outboundCode: string | null;
            returnCode: string | null;
          }) => {
            configMap[config.platform] = {
              platform: config.platform,
              credentials: config.credentials || {},
              isConfigured: config.isConfigured,
              isVerified: config.isActive,
              lastVerifiedAt: config.lastVerifiedAt || undefined,
              outboundCode: config.outboundCode || undefined,
              returnCode: config.returnCode || undefined,
            };
          });
        }

        setConfigs(configMap);
      } catch (error) {
        console.error('설정 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, []);

  const handleCredentialChange = (platform: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        credentials: {
          ...prev[platform]?.credentials,
          [key]: value,
        },
        isVerified: false, // 변경 시 검증 상태 리셋
      },
    }));
  };

  const handleSave = async (platformId: string) => {
    setSaving(platformId);
    try {
      const config = configs[platformId];
      const response = await fetch('/api/platform/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformId,
          credentials: config.credentials,
          outboundCode: config.outboundCode,
          returnCode: config.returnCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConfigs(prev => ({
          ...prev,
          [platformId]: {
            ...prev[platformId],
            isConfigured: true,
          },
        }));
        alert('설정이 저장되었습니다.');
      } else {
        throw new Error(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(null);
    }
  };

  const handleVerify = async (platformId: string) => {
    setVerifying(platformId);
    try {
      const response = await fetch('/api/platform/config/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      });

      const result = await response.json();

      if (result.success) {
        setConfigs(prev => ({
          ...prev,
          [platformId]: {
            ...prev[platformId],
            isVerified: true,
            lastVerifiedAt: new Date().toLocaleString('ko-KR'),
          },
        }));
        alert(`API 연결이 확인되었습니다.${result.sellerInfo ? `\n판매자: ${result.sellerInfo}` : ''}`);
      } else {
        throw new Error(result.error || '연결 실패');
      }
    } catch (error) {
      setConfigs(prev => ({
        ...prev,
        [platformId]: {
          ...prev[platformId],
          isVerified: false,
        },
      }));
      const errorMessage = error instanceof Error ? error.message : 'API 연결에 실패했습니다.';
      alert(`API 연결 실패: ${errorMessage}`);
    } finally {
      setVerifying(null);
    }
  };

  const toggleShowSecret = (platformId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [platformId]: !prev[platformId],
    }));
  };

  return (
    <DashboardLayout
      title="플랫폼 설정"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '통합 상품', href: '/products/multi' },
        { name: '플랫폼 설정' },
      ]}
    >
      {/* 안내 */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Settings size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">API 설정 안내</h3>
            <p className="text-sm text-blue-700 mt-1">
              각 플랫폼의 API 인증 정보를 설정하면 상품 등록/수정/삭제가 자동화됩니다.
              API 키는 각 플랫폼의 개발자 센터에서 발급받을 수 있습니다.
            </p>
          </div>
        </div>
      </Card>

      {/* 플랫폼별 설정 */}
      <div className="space-y-6">
        {platforms.map((platform) => {
          const config = configs[platform.id];
          const isConfigured = config?.isConfigured;
          const isVerified = config?.isVerified;

          return (
            <Card key={platform.id}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                    <Store size={24} className={platform.color.replace('bg-', 'text-')} />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{platform.label}</h3>
                    <p className="text-sm text-gray-500">{platform.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      <CheckCircle2 size={14} />
                      연결됨
                    </span>
                  ) : isConfigured ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                      <AlertTriangle size={14} />
                      미검증
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      <XCircle size={14} />
                      미설정
                    </span>
                  )}
                  <a
                    href={platform.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded text-gray-500"
                    title="API 문서"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* 인증 정보 입력 */}
                  <div className="space-y-4 mb-6">
                    {platform.credentials.map((cred) => (
                      <div key={cred.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {cred.label}
                        </label>
                        <div className="relative">
                          <Input
                            type={
                              cred.type === 'password' && !showSecrets[platform.id]
                                ? 'password'
                                : 'text'
                            }
                            placeholder={cred.placeholder}
                            value={config?.credentials?.[cred.key] || ''}
                            onChange={(e) =>
                              handleCredentialChange(platform.id, cred.key, e.target.value)
                            }
                          />
                          {cred.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => toggleShowSecret(platform.id)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showSecrets[platform.id] ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 추가 설정 (출고지/반품지) */}
                  {platform.id === 'COUPANG' && (
                    <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          출고지 코드
                        </label>
                        <Input
                          placeholder="출고지 코드 입력"
                          value={config?.outboundCode || ''}
                          onChange={(e) =>
                            setConfigs(prev => ({
                              ...prev,
                              [platform.id]: {
                                ...prev[platform.id],
                                outboundCode: e.target.value,
                              },
                            }))
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          쿠팡 Wing에서 출고지 코드 확인
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          반품지 코드
                        </label>
                        <Input
                          placeholder="반품지 코드 입력"
                          value={config?.returnCode || ''}
                          onChange={(e) =>
                            setConfigs(prev => ({
                              ...prev,
                              [platform.id]: {
                                ...prev[platform.id],
                                returnCode: e.target.value,
                              },
                            }))
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          쿠팡 Wing에서 반품지 코드 확인
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 검증 정보 */}
                  {config?.lastVerifiedAt && (
                    <p className="text-xs text-gray-500 mb-4">
                      마지막 검증: {config.lastVerifiedAt}
                    </p>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSave(platform.id)}
                      loading={saving === platform.id}
                    >
                      <Save size={16} className="mr-2" />
                      설정 저장
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleVerify(platform.id)}
                      loading={verifying === platform.id}
                      disabled={!config?.isConfigured && !config?.credentials}
                    >
                      <RefreshCw size={16} className="mr-2" />
                      연결 테스트
                    </Button>
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* 자사몰 설정 */}
      <Card className="mt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package size={24} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-lg">자사몰</h3>
              <p className="text-sm text-gray-500">
                자사몰은 별도의 API 설정 없이 바로 사용 가능합니다
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
            <CheckCircle2 size={14} />
            사용 가능
          </span>
        </div>
      </Card>
    </DashboardLayout>
  );
}
