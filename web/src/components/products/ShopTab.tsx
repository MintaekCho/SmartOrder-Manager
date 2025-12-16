'use client';

import { Card, Input } from '@/components/ui';
import { CheckCircle2, AlertCircle, XCircle, Store, Eye, EyeOff } from 'lucide-react';
import { ValidationResult } from '@/hooks/useProductValidation';

interface ShopTabProps {
  // 노출 설정
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;

  // 재고 설정
  stockQuantity: string;
  onStockChange: (quantity: string) => void;

  // SEO 설정 (선택)
  seoTitle?: string;
  seoDescription?: string;
  onSeoChange?: (title: string, description: string) => void;

  // 검증 결과
  validation: ValidationResult;
}

export default function ShopTab({
  isVisible,
  onVisibilityChange,
  stockQuantity,
  onStockChange,
  seoTitle = '',
  seoDescription = '',
  onSeoChange,
  validation,
}: ShopTabProps) {
  return (
    <div className="space-y-6">
      {/* 노출 설정 */}
      <Card title="상품 노출 설정" icon={<Store size={18} />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {isVisible ? (
                <Eye size={20} className="text-green-600" />
              ) : (
                <EyeOff size={20} className="text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isVisible ? '상품 노출 중' : '상품 숨김'}
                </p>
                <p className="text-xs text-gray-500">
                  {isVisible
                    ? '고객에게 상품이 표시됩니다'
                    : '고객에게 상품이 표시되지 않습니다'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => onVisibilityChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <p className="text-xs text-gray-500">
            숨김 상태로 등록하면 나중에 원하는 시점에 노출할 수 있습니다.
          </p>
        </div>
      </Card>

      {/* 재고 설정 */}
      <Card title="재고 설정" subtitle="자사몰 판매를 위한 재고 수량을 설정하세요">
        <div className="space-y-4">
          <Input
            label="재고 수량"
            type="number"
            placeholder="100"
            value={stockQuantity}
            onChange={(e) => onStockChange(e.target.value)}
            helperText="판매 가능한 재고 수량을 입력하세요"
          />

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              재고가 0이 되면 자동으로 품절 처리됩니다.
              재고 관리는 설정 &gt; 운영 모드에서 변경할 수 있습니다.
            </p>
          </div>
        </div>
      </Card>

      {/* SEO 설정 (선택) */}
      {onSeoChange && (
        <Card title="SEO 설정" subtitle="검색 엔진 최적화를 위한 메타 정보 (선택)">
          <div className="space-y-4">
            <Input
              label="SEO 타이틀"
              placeholder="검색 결과에 표시될 제목 (미입력시 상품명 사용)"
              value={seoTitle}
              onChange={(e) => onSeoChange(e.target.value, seoDescription)}
              helperText="60자 이내 권장"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                SEO 설명
              </label>
              <textarea
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="검색 결과에 표시될 설명 (미입력시 상품 설명 사용)"
                value={seoDescription}
                onChange={(e) => onSeoChange(seoTitle, e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">160자 이내 권장</p>
            </div>
          </div>
        </Card>
      )}

      {/* 자사몰 특징 안내 */}
      <Card title="자사몰 특징">
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">수수료 없음</p>
              <p className="text-xs text-gray-500">외부 플랫폼 수수료 없이 직접 판매</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">고객 데이터 보유</p>
              <p className="text-xs text-gray-500">구매 고객 정보를 직접 관리</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">브랜드 구축</p>
              <p className="text-xs text-gray-500">독립적인 브랜드 아이덴티티 형성</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 검증 요약 */}
      <Card title="등록 준비 상태">
        <div className="space-y-3">
          {validation.isValid ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">자사몰 등록 준비 완료</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <XCircle size={18} className="text-red-600" />
                <span className="text-sm font-medium text-red-700">필수 항목 누락</span>
              </div>
              <ul className="list-disc list-inside text-sm text-red-600 pl-2">
                {validation.missingFields.map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle size={18} className="text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">권장 사항</span>
              </div>
              <ul className="list-disc list-inside text-sm text-yellow-600 pl-2">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
