'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input } from '@/components/ui';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Settings,
  Loader2,
  X,
  Link2,
  ChevronRight,
} from 'lucide-react';
import { ValidationResult } from '@/hooks/useProductValidation';

interface PlatformCategory {
  code: string;
  name: string;
  fullPath?: string;
  isLeaf?: boolean;
  parentCode?: string;
}

// 카테고리 레벨 상태
interface CategoryLevel {
  categories: PlatformCategory[];
  selectedCode: string | null;
  selectedName: string | null;
  isLoading: boolean;
}

interface CoupangTabProps {
  // 설정 상태
  coupangSettingsConfigured: boolean | null;
  onOpenSettings: () => void;

  // 카테고리
  categoryCode?: string;
  categoryName?: string;
  linkedCategoryCode?: string | null; // 자사몰 카테고리에서 매핑된 코드
  onCategorySelect: (code: string, name: string) => void;
  onCategoryRemove: () => void;

  // 고시정보
  notices: Record<string, string>;
  onNoticesChange: (notices: Record<string, string>) => void;

  // 검증 결과
  validation: ValidationResult;

  // 상품명 (카테고리 자동 추천용)
  productName: string;
}

export default function CoupangTab({
  coupangSettingsConfigured,
  onOpenSettings,
  categoryCode,
  categoryName,
  linkedCategoryCode,
  onCategorySelect,
  onCategoryRemove,
  notices,
  onNoticesChange,
  validation,
}: CoupangTabProps) {
  // 계층형 카테고리 상태 (최대 4단계)
  const [categoryLevels, setCategoryLevels] = useState<CategoryLevel[]>([
    { categories: [], selectedCode: null, selectedName: null, isLoading: true },
  ]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // 카테고리 경로 (선택된 카테고리들의 이름)
  const selectedPath = categoryLevels
    .filter(level => level.selectedName)
    .map(level => level.selectedName)
    .join(' > ');

  // 특정 부모 아래의 카테고리 로드
  const loadCategories = useCallback(async (parentCode: string = '0'): Promise<PlatformCategory[]> => {
    try {
      const response = await fetch(`/api/platform/categories?platform=COUPANG&parentCode=${parentCode}`);
      const result = await response.json();
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
      return [];
    }
  }, []);

  // 초기 대분류 로드
  useEffect(() => {
    const loadRootCategories = async () => {
      const categories = await loadCategories('0');
      setCategoryLevels([
        { categories, selectedCode: null, selectedName: null, isLoading: false },
      ]);
    };
    loadRootCategories();
  }, [loadCategories]);

  // 카테고리 선택 처리
  const handleLevelSelect = async (levelIndex: number, category: PlatformCategory) => {
    // 현재 레벨의 선택 업데이트
    setCategoryLevels(prev => {
      const newLevels = prev.slice(0, levelIndex + 1);
      newLevels[levelIndex] = {
        ...newLevels[levelIndex],
        selectedCode: category.code,
        selectedName: category.name,
      };
      return newLevels;
    });

    // 최하위 카테고리면 최종 선택
    if (category.isLeaf) {
      const path = [
        ...categoryLevels.slice(0, levelIndex).map(l => l.selectedName),
        category.name,
      ].filter(Boolean).join(' > ');

      onCategorySelect(category.code, path);
      setShowCategorySelector(false);
      return;
    }

    // 하위 카테고리 로드
    setCategoryLevels(prev => {
      const newLevels = prev.slice(0, levelIndex + 1);
      newLevels[levelIndex] = {
        ...newLevels[levelIndex],
        selectedCode: category.code,
        selectedName: category.name,
      };
      // 로딩 중인 다음 레벨 추가
      newLevels.push({
        categories: [],
        selectedCode: null,
        selectedName: null,
        isLoading: true,
      });
      return newLevels;
    });

    const childCategories = await loadCategories(category.code);

    setCategoryLevels(prev => {
      const newLevels = [...prev];
      if (newLevels[levelIndex + 1]) {
        newLevels[levelIndex + 1] = {
          categories: childCategories,
          selectedCode: null,
          selectedName: null,
          isLoading: false,
        };
      }
      return newLevels;
    });
  };

  // 카테고리 초기화
  const resetCategories = () => {
    onCategoryRemove();
    loadCategories('0').then(categories => {
      setCategoryLevels([
        { categories, selectedCode: null, selectedName: null, isLoading: false },
      ]);
    });
  };

  // 고시정보 변경
  const handleNoticeChange = (key: string, value: string) => {
    onNoticesChange({ ...notices, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* 설정 상태 */}
      <Card title="쿠팡 API 설정" icon={<Settings size={18} />}>
        {coupangSettingsConfigured === null ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">설정 확인 중...</span>
          </div>
        ) : coupangSettingsConfigured ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">설정 완료</span>
            </div>
            <Button variant="secondary" size="sm" onClick={onOpenSettings}>
              설정 변경
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle size={18} />
              <span className="text-sm font-medium">설정 필요</span>
              <span className="text-xs text-gray-500">(출고지, 반품지, A/S 연락처)</span>
            </div>
            <Button size="sm" onClick={onOpenSettings}>
              설정하기
            </Button>
          </div>
        )}
      </Card>

      {/* 카테고리 설정 */}
      <Card title="쿠팡 카테고리" subtitle="상품이 등록될 쿠팡 카테고리를 선택하세요">
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
                onClick={resetCategories}
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

          {/* 카테고리 선택 토글 버튼 */}
          {!categoryCode && (
            <button
              onClick={() => setShowCategorySelector(!showCategorySelector)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ChevronRight size={14} className={showCategorySelector ? 'rotate-90 transition-transform' : 'transition-transform'} />
              {showCategorySelector ? '카테고리 선택 닫기' : '카테고리 선택하기'}
            </button>
          )}

          {/* 현재 선택 경로 표시 */}
          {showCategorySelector && selectedPath && (
            <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              <span className="font-medium">선택 중:</span>
              <span>{selectedPath}</span>
            </div>
          )}

          {/* 계층형 카테고리 선택 UI */}
          {showCategorySelector && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categoryLevels.map((level, levelIndex) => (
                  <div key={levelIndex} className="min-w-[200px] flex-shrink-0">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      {levelIndex === 0 ? '대분류' : levelIndex === 1 ? '중분류' : levelIndex === 2 ? '소분류' : '세부분류'}
                    </div>
                    {level.isLoading ? (
                      <div className="flex items-center justify-center h-32 border border-gray-200 rounded bg-white">
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                      </div>
                    ) : level.categories.length === 0 ? (
                      <div className="flex items-center justify-center h-32 border border-gray-200 rounded bg-white text-gray-400 text-sm">
                        카테고리 없음
                      </div>
                    ) : (
                      <div className="h-48 overflow-y-auto border border-gray-200 rounded bg-white">
                        {level.categories.map((cat) => (
                          <button
                            key={cat.code}
                            type="button"
                            onClick={() => handleLevelSelect(levelIndex, cat)}
                            className={`w-full px-3 py-2 text-left text-sm border-b border-gray-100 last:border-0 flex items-center justify-between gap-2 ${
                              level.selectedCode === cat.code
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            {cat.isLeaf ? (
                              <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                선택
                              </span>
                            ) : (
                              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                * 최하위 카테고리(선택 표시)를 선택해야 상품 등록이 가능합니다.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 상품 고시정보 */}
      <Card title="상품 고시정보" subtitle="쿠팡 상품 등록에 필요한 고시정보를 입력하세요">
        <div className="space-y-4">
          <Input
            label="원산지"
            placeholder="국내산 / 상세페이지 참조"
            value={notices['원산지'] || ''}
            onChange={(e) => handleNoticeChange('원산지', e.target.value)}
          />
          <Input
            label="제조사/생산자"
            placeholder="상세페이지 참조"
            value={notices['제조사'] || ''}
            onChange={(e) => handleNoticeChange('제조사', e.target.value)}
          />
          <Input
            label="품질보증기준"
            placeholder="제품 이상 시 공정거래위원회 고시 소비자분쟁해결기준에 의거 보상"
            value={notices['품질보증기준'] || ''}
            onChange={(e) => handleNoticeChange('품질보증기준', e.target.value)}
          />
          <Input
            label="A/S 연락처"
            placeholder="1588-0000 / 상세페이지 참조"
            value={notices['소비자상담 관련 전화번호'] || ''}
            onChange={(e) => handleNoticeChange('소비자상담 관련 전화번호', e.target.value)}
          />
          <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            비어있는 항목은 "상세페이지 참조"로 자동 입력됩니다.
          </p>
        </div>
      </Card>

      {/* 검증 요약 */}
      <Card title="등록 준비 상태">
        <div className="space-y-3">
          {validation.isValid ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">쿠팡 등록 준비 완료</span>
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
