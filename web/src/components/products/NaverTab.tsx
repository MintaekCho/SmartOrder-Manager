'use client';

import { useState } from 'react';
import { Card, Button, Input, Select } from '@/components/ui';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Settings,
  Search,
  Loader2,
  X,
  Link2,
} from 'lucide-react';
import { ValidationResult } from '@/hooks/useProductValidation';

interface PlatformCategory {
  code: string;
  name: string;
  fullPath?: string;
  isLeaf?: boolean;
}

// 원산지 코드 목록
const ORIGIN_AREA_OPTIONS = [
  { value: '', label: '선택하세요' },
  { value: '00', label: '국내산' },
  { value: '01', label: '수입산' },
  { value: '02', label: '국내산+수입산' },
  { value: '03', label: '기타' },
];

interface NaverTabProps {
  // 설정 상태
  naverSettingsConfigured: boolean | null;
  onOpenSettings?: () => void;

  // 카테고리
  categoryCode?: string;
  categoryName?: string;
  linkedCategoryCode?: string | null;
  onCategorySelect: (code: string, name: string) => void;
  onCategoryRemove: () => void;

  // 원산지
  originAreaCode: string;
  originContent: string;
  onOriginChange: (areaCode: string, content: string) => void;

  // 검증 결과
  validation: ValidationResult;

  // 상품명 (카테고리 자동 추천용)
  productName: string;
}

export default function NaverTab({
  naverSettingsConfigured,
  onOpenSettings,
  categoryCode,
  categoryName,
  linkedCategoryCode,
  onCategorySelect,
  onCategoryRemove,
  originAreaCode,
  originContent,
  onOriginChange,
  validation,
  productName,
}: NaverTabProps) {
  // 카테고리 검색 상태
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [categorySearchKeyword, setCategorySearchKeyword] = useState('');
  const [categorySearchResults, setCategorySearchResults] = useState<PlatformCategory[]>([]);
  const [isSearchingCategory, setIsSearchingCategory] = useState(false);

  // 카테고리 검색
  const searchCategories = async (keyword: string) => {
    if (!keyword.trim()) {
      setCategorySearchResults([]);
      return;
    }

    setIsSearchingCategory(true);
    try {
      const response = await fetch(`/api/platform/categories?platform=NAVER&keyword=${encodeURIComponent(keyword)}`);
      const result = await response.json();
      if (result.success) {
        setCategorySearchResults(result.data || []);
      } else {
        setCategorySearchResults([]);
      }
    } catch (error) {
      console.error('카테고리 검색 오류:', error);
      setCategorySearchResults([]);
    } finally {
      setIsSearchingCategory(false);
    }
  };

  // 상품명으로 카테고리 추천
  const predictCategory = async () => {
    if (!productName.trim()) {
      alert('상품명을 먼저 입력해주세요.');
      return;
    }

    setIsSearchingCategory(true);
    try {
      const response = await fetch(`/api/platform/categories?platform=NAVER&predict=${encodeURIComponent(productName)}`);
      const result = await response.json();
      if (result.success && result.data?.length > 0) {
        setCategorySearchResults(result.data);
      } else {
        alert('추천 카테고리를 찾지 못했습니다. 직접 검색해주세요.');
      }
    } catch (error) {
      console.error('카테고리 추천 오류:', error);
    } finally {
      setIsSearchingCategory(false);
    }
  };

  // 카테고리 선택
  const handleCategorySelect = (category: PlatformCategory) => {
    onCategorySelect(category.code, category.fullPath || category.name);
    setShowCategorySearch(false);
    setCategorySearchKeyword('');
    setCategorySearchResults([]);
  };

  return (
    <div className="space-y-6">
      {/* 설정 상태 */}
      <Card title="네이버 API 설정" icon={<Settings size={18} />}>
        {naverSettingsConfigured === null ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">설정 확인 중...</span>
          </div>
        ) : naverSettingsConfigured ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">설정 완료</span>
            </div>
            {onOpenSettings && (
              <Button variant="secondary" size="sm" onClick={onOpenSettings}>
                설정 변경
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">설정 필요</span>
              <span className="text-xs text-gray-500">(네이버 커머스 API 연동 준비 중)</span>
            </div>
            {onOpenSettings && (
              <Button size="sm" onClick={onOpenSettings}>
                설정하기
              </Button>
            )}
          </div>
        )}

        {/* 네이버 연동 안내 */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            네이버 스마트스토어 상품 등록은 커머스 API 연동이 필요합니다.
            현재 개발 중인 기능이며, 카테고리 설정은 미리 가능합니다.
          </p>
        </div>
      </Card>

      {/* 카테고리 설정 */}
      <Card title="네이버 카테고리" subtitle="상품이 등록될 네이버 카테고리를 선택하세요">
        <div className="space-y-3">
          {/* 현재 설정된 카테고리 */}
          {categoryCode ? (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-sm text-green-700 font-medium truncate max-w-md">
                  {categoryName || categoryCode}
                </span>
              </div>
              <button
                onClick={onCategoryRemove}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              >
                <X size={16} />
              </button>
            </div>
          ) : linkedCategoryCode ? (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Link2 size={14} className="text-blue-500" />
              <span className="text-sm text-blue-700">
                자사몰 카테고리 매핑 사용: {linkedCategoryCode}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <XCircle size={16} className="text-red-500" />
              <span className="text-sm text-red-600">카테고리 미설정</span>
            </div>
          )}

          {/* 검색 토글 버튼 */}
          <button
            onClick={() => setShowCategorySearch(!showCategorySearch)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Search size={14} />
            {showCategorySearch ? '검색 닫기' : '카테고리 검색'}
          </button>

          {/* 검색 UI */}
          {showCategorySearch && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <Input
                  placeholder="카테고리 검색어 입력 (예: 식품, 의류)"
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
                  size="sm"
                  onClick={() => searchCategories(categorySearchKeyword)}
                  disabled={isSearchingCategory}
                >
                  {isSearchingCategory ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                </Button>
              </div>

              <button
                type="button"
                onClick={predictCategory}
                className="text-xs text-purple-600 hover:text-purple-800"
                disabled={isSearchingCategory}
              >
                상품명으로 카테고리 자동 추천
              </button>

              {/* 검색 결과 */}
              {categorySearchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded bg-white">
                  {categorySearchResults.map((cat) => (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium">{cat.name}</span>
                      {cat.fullPath && (
                        <span className="block text-xs text-gray-500 truncate">{cat.fullPath}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 원산지 정보 */}
      <Card title="원산지 정보" subtitle="상품의 원산지 정보를 입력하세요">
        <div className="space-y-4">
          <Select
            label="원산지 구분"
            options={ORIGIN_AREA_OPTIONS}
            value={originAreaCode}
            onChange={(e) => onOriginChange(e.target.value, originContent)}
          />

          <Input
            label="원산지 상세 (선택)"
            placeholder="예: 전라남도 해남군"
            value={originContent}
            onChange={(e) => onOriginChange(originAreaCode, e.target.value)}
            helperText="구체적인 생산지를 입력하면 신뢰도가 높아집니다"
          />

          <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            미입력시 "국내산"으로 자동 등록됩니다.
          </p>
        </div>
      </Card>

      {/* 검증 요약 */}
      <Card title="등록 준비 상태">
        <div className="space-y-3">
          {validation.isValid ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">네이버 등록 준비 완료</span>
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
