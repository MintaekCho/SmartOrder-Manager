'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import {
  X,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  Truck,
} from 'lucide-react';

interface CoupangSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void; // 저장 후 콜백
}

export function CoupangSettingsModal({ isOpen, onClose, onSaved }: CoupangSettingsModalProps) {
  const [coupangApi, setCoupangApi] = useState({
    accessKey: '',
    secretKey: '',
    vendorId: '',
    userId: '',
    outboundCode: '',
    returnCode: '',
    contactNumber: '',
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
    if (!isOpen) return;

    const loadCoupangConfig = async () => {
      setIsLoadingApi(true);
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
  }, [isOpen]);

  const loadShippingPlaces = async () => {
    setIsLoadingPlaces(true);
    try {
      const [outboundResponse, returnResponse] = await Promise.all([
        fetch('/api/coupang/shipping?type=outbound'),
        fetch('/api/coupang/shipping?type=return'),
      ]);

      const outboundResult = await outboundResponse.json();
      if (outboundResult.success) {
        setOutboundPlaces(outboundResult.data || []);
      }

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

  const handleSave = async () => {
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
        alert('쿠팡 API 설정이 저장되고 연결이 확인되었습니다!');
        onSaved?.();
        onClose();
      } else {
        setCoupangApi((prev) => ({ ...prev, isConnected: false }));
        alert(`설정이 저장되었지만 연결 테스트 실패: ${verifyResult.error}`);
      }

      await loadShippingPlaces();
    } catch (error) {
      console.error('쿠팡 API 설정 오류:', error);
      alert(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">쿠팡 Wing API 설정</h2>
            <p className="text-sm text-gray-500 mt-1">상품 등록에 필요한 쿠팡 설정을 완료하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-4">
          {/* 상태 */}
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
            onChange={(e) => setCoupangApi((prev) => ({ ...prev, accessKey: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Secret Key</label>
            <div className="relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                placeholder="Secret Key를 입력하세요"
                value={coupangApi.secretKey}
                onChange={(e) => setCoupangApi((prev) => ({ ...prev, secretKey: e.target.value }))}
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
            onChange={(e) => setCoupangApi((prev) => ({ ...prev, vendorId: e.target.value }))}
          />

          <Input
            label="업체 담당자 ID"
            placeholder="쿠팡 Wing 사용자 ID를 입력하세요"
            value={coupangApi.userId}
            onChange={(e) => setCoupangApi((prev) => ({ ...prev, userId: e.target.value }))}
            helperText="상품 등록 시 필수 항목입니다"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              출고지 <span className="text-red-500">*</span>
            </label>
            <select
              value={coupangApi.outboundCode}
              onChange={(e) => setCoupangApi((prev) => ({ ...prev, outboundCode: e.target.value }))}
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
              <p className="text-xs text-orange-600 mt-1">쿠팡 Wing에서 출고지를 먼저 등록해주세요</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              반품지 <span className="text-red-500">*</span>
            </label>
            <select
              value={coupangApi.returnCode}
              onChange={(e) => setCoupangApi((prev) => ({ ...prev, returnCode: e.target.value }))}
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
              <p className="text-xs text-orange-600 mt-1">쿠팡 Wing에서 반품지를 먼저 등록해주세요</p>
            )}
          </div>

          <Input
            label="A/S 연락처"
            placeholder="02-1234-5678"
            value={coupangApi.contactNumber}
            onChange={(e) => setCoupangApi((prev) => ({ ...prev, contactNumber: e.target.value }))}
            helperText="고객 A/S 문의 연락처 (필수)"
          />

          {/* 가이드 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Truck size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2">설정 가이드</p>
                <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>쿠팡 Wing 로그인 → 판매자정보 → OPEN API에서 API Key 발급</li>
                  <li>판매자정보 → 출고지/반품지 관리에서 출고지와 반품지 등록</li>
                  <li>위 양식에 모든 필수 항목(*) 입력 후 저장</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleSave}
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
        </div>
      </div>
    </div>
  );
}
