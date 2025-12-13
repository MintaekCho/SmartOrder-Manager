'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// 개별 기능 설정 (그룹 없이 각 기능별 on/off)
export interface FeatureSettings {
  // 위탁판매 관련
  sourcing: boolean;        // 상품 소싱
  autoOrder: boolean;       // 자동 발주
  marginCalc: boolean;      // 마진 계산
  coupangProducts: boolean; // 쿠팡 상품 관리
  coupangOrders: boolean;   // 쿠팡 주문/배송

  // 통합 상품 관리
  multiPlatform: boolean;   // 통합 상품 (멀티 플랫폼)

  // 재고 관리 관련
  inventory: boolean;       // 재고 관리
  warehouse: boolean;       // 창고 관리
  stockIn: boolean;         // 입고 관리
  stockOut: boolean;        // 출고 관리
  stockCount: boolean;      // 재고 실사
  purchaseOrder: boolean;   // 발주 관리

  // 자사몰 관련
  shopProducts: boolean;    // 자사몰 상품 관리
  shopCategories: boolean;  // 자사몰 카테고리 관리
  shopOrders: boolean;      // 자사몰 주문 관리
  shopCustomers: boolean;   // 자사몰 고객 관리

  // 기타
  reports: boolean;         // 리포트
  settlements: boolean;     // 정산 관리
  suppliers: boolean;       // 공급처 관리
  tools: boolean;           // 도구 (AI 썸네일 등)
}

// 기본 기능 설정 (모두 비활성화)
export const defaultFeatureSettings: FeatureSettings = {
  // 위탁판매
  sourcing: false,
  autoOrder: false,
  marginCalc: false,
  coupangProducts: false,
  coupangOrders: false,

  // 통합 상품 관리
  multiPlatform: true, // 통합 상품 기본 활성화

  // 재고 관리
  inventory: false,
  warehouse: false,
  stockIn: false,
  stockOut: false,
  stockCount: false,
  purchaseOrder: false,

  // 자사몰
  shopProducts: false,
  shopCategories: false,
  shopOrders: false,
  shopCustomers: false,

  // 기타
  reports: true, // 리포트는 기본 활성화
  settlements: false,
  suppliers: false,
  tools: false,
};

// 기능 정보 (라벨, 설명, 아이콘명)
export interface FeatureInfo {
  key: keyof FeatureSettings;
  label: string;
  description: string;
  icon: string; // lucide-react 아이콘명
}

// 기능 목록 (개별 기능으로 표시)
export const featureList: FeatureInfo[] = [
  // 위탁판매 관련
  { key: 'sourcing', label: '상품 소싱', description: '트렌드 분석을 통한 상품 소싱', icon: 'TrendingUp' },
  { key: 'multiPlatform', label: '통합 상품', description: '쿠팡/네이버/자사몰 멀티 플랫폼 상품 등록', icon: 'Globe' },
  { key: 'coupangProducts', label: '쿠팡 상품 관리', description: '쿠팡 상품 등록 및 관리 (레거시)', icon: 'Package' },
  { key: 'coupangOrders', label: '쿠팡 주문/배송', description: '쿠팡 주문 처리 및 배송 관리', icon: 'ShoppingCart' },
  { key: 'autoOrder', label: '자동 발주', description: '주문 발생 시 도매처 자동 발주', icon: 'Truck' },
  { key: 'marginCalc', label: '마진 계산기', description: '마진율 계산 도구', icon: 'Calculator' },
  { key: 'settlements', label: '정산 관리', description: '쿠팡 정산 내역 관리', icon: 'BarChart3' },

  // 재고 관리 관련
  { key: 'inventory', label: '재고 관리', description: '재고 현황 조회 및 관리', icon: 'Boxes' },
  { key: 'warehouse', label: '창고 관리', description: '다중 창고, 로케이션 관리', icon: 'Warehouse' },
  { key: 'stockIn', label: '입고 관리', description: '구매 입고, 반품 입고 등', icon: 'PackagePlus' },
  { key: 'stockOut', label: '출고 관리', description: '판매 출고, 이동 출고 등', icon: 'PackageMinus' },
  { key: 'stockCount', label: '재고 실사', description: '정기/수시 재고 실사', icon: 'ClipboardList' },
  { key: 'purchaseOrder', label: '발주 관리', description: '공급처 발주 관리', icon: 'FileText' },

  // 자사몰 관련
  { key: 'shopProducts', label: '자사몰 상품', description: '자사몰 상품 등록 및 관리', icon: 'Store' },
  { key: 'shopCategories', label: '자사몰 카테고리', description: '자사몰 카테고리 설정', icon: 'Layers' },
  { key: 'shopOrders', label: '자사몰 주문', description: '자사몰 주문 처리', icon: 'ShoppingBag' },
  { key: 'shopCustomers', label: '자사몰 고객', description: '자사몰 고객 정보 관리', icon: 'Users' },

  // 기타
  { key: 'suppliers', label: '공급처 관리', description: '도매처 및 공급처 관리', icon: 'Building2' },
  { key: 'tools', label: '도구', description: 'AI 썸네일 등 유틸리티', icon: 'Wrench' },
  { key: 'reports', label: '리포트', description: '매출/판매 리포트', icon: 'BarChart3' },
];

// 컨텍스트 타입
interface FeatureSettingsContextType {
  features: FeatureSettings;
  setFeature: (feature: keyof FeatureSettings, enabled: boolean) => void;
  setFeatures: (features: Partial<FeatureSettings>) => void;
  isFeatureEnabled: (feature: keyof FeatureSettings) => boolean;
  isLoading: boolean;
  isSaving: boolean;
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

// 컨텍스트 생성
const FeatureSettingsContext = createContext<FeatureSettingsContextType | undefined>(undefined);

// 로컬 스토리지 키
const STORAGE_KEY = 'feature-settings';

// Provider 컴포넌트
export function FeatureSettingsProvider({ children }: { children: ReactNode }) {
  const [features, setFeaturesState] = useState<FeatureSettings>(defaultFeatureSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 서버에서 설정 로드
  const loadFromServer = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/features');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFeaturesState(prev => ({ ...prev, ...data.data }));
          // 로컬 스토리지에도 저장 (오프라인 캐시)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.error('Failed to load feature settings from server:', error);
      // 서버 로드 실패 시 로컬 스토리지에서 로드
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFeaturesState(prev => ({ ...prev, ...parsed }));
        } catch {
          console.error('Failed to parse stored settings');
        }
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // 서버에 설정 저장
  const saveToServer = useCallback(async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // 로컬 스토리지에도 저장
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
    } catch (error) {
      console.error('Failed to save feature settings:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [features]);

  // 초기 로드 (로컬 스토리지 먼저, 그 다음 서버)
  useEffect(() => {
    // 로컬 스토리지에서 먼저 로드 (빠른 초기화)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFeaturesState(prev => ({ ...prev, ...parsed }));
      } catch {
        console.error('Failed to parse stored settings');
      }
    }

    // 서버에서 최신 설정 로드
    loadFromServer();
  }, [loadFromServer]);

  // 설정 변경 시 자동 저장 (debounce)
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      saveToServer().catch(console.error);
    }, 1000); // 1초 디바운스

    return () => clearTimeout(timer);
  }, [features, isInitialized, saveToServer]);

  // 개별 기능 토글
  const setFeature = useCallback((feature: keyof FeatureSettings, enabled: boolean) => {
    setFeaturesState(prev => ({
      ...prev,
      [feature]: enabled,
    }));
  }, []);

  // 여러 기능 한번에 설정
  const setFeatures = useCallback((newFeatures: Partial<FeatureSettings>) => {
    setFeaturesState(prev => ({
      ...prev,
      ...newFeatures,
    }));
  }, []);

  // 기능 활성화 여부 확인
  const isFeatureEnabled = useCallback((feature: keyof FeatureSettings) => {
    return features[feature];
  }, [features]);

  return (
    <FeatureSettingsContext.Provider
      value={{
        features,
        setFeature,
        setFeatures,
        isFeatureEnabled,
        isLoading,
        isSaving,
        saveToServer,
        loadFromServer,
      }}
    >
      {children}
    </FeatureSettingsContext.Provider>
  );
}

// Hook
export function useFeatureSettings() {
  const context = useContext(FeatureSettingsContext);
  if (context === undefined) {
    throw new Error('useFeatureSettings must be used within a FeatureSettingsProvider');
  }
  return context;
}

// 호환성을 위한 별칭 (기존 useSystemMode 사용처 대응)
export function useSystemMode() {
  const { features, setFeature, isFeatureEnabled } = useFeatureSettings();

  return {
    settings: {
      mode: 'custom' as const, // 더 이상 모드 개념 없음
      features,
    },
    setMode: () => {}, // no-op (더 이상 모드 변경 없음)
    setFeature,
    updateSettings: () => {}, // no-op
    isFeatureEnabled,
    getModeLabel: () => '사용자 설정',
  };
}
