'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 시스템 모드 타입
export type SystemMode = 'dropshipping' | 'inventory' | 'hybrid' | 'shop';

// 기능별 활성화 설정
export interface FeatureSettings {
  // 위탁판매 기능
  sourcing: boolean;      // 상품 소싱
  autoOrder: boolean;     // 자동 발주
  marginCalc: boolean;    // 마진 계산

  // 재고 관리 기능
  inventory: boolean;     // 재고 관리
  warehouse: boolean;     // 창고 관리
  stockIn: boolean;       // 입고 관리
  stockOut: boolean;      // 출고 관리
  stockCount: boolean;    // 재고 실사
  purchaseOrder: boolean; // 발주 관리

  // 자사몰 관리 기능
  shopProducts: boolean;    // 자사몰 상품 관리
  shopCategories: boolean;  // 자사몰 카테고리 관리
  shopOrders: boolean;      // 자사몰 주문 관리
  shopCustomers: boolean;   // 자사몰 고객 관리
}

// 시스템 설정 인터페이스
export interface SystemSettings {
  mode: SystemMode;
  features: FeatureSettings;
  companyName?: string;
  businessType?: string;
}

// 기본 기능 설정 (모드별)
const defaultFeaturesByMode: Record<SystemMode, FeatureSettings> = {
  dropshipping: {
    sourcing: true,
    autoOrder: true,
    marginCalc: true,
    inventory: false,
    warehouse: false,
    stockIn: false,
    stockOut: false,
    stockCount: false,
    purchaseOrder: false,
    shopProducts: false,
    shopCategories: false,
    shopOrders: false,
    shopCustomers: false,
  },
  inventory: {
    sourcing: false,
    autoOrder: false,
    marginCalc: true,
    inventory: true,
    warehouse: true,
    stockIn: true,
    stockOut: true,
    stockCount: true,
    purchaseOrder: true,
    shopProducts: false,
    shopCategories: false,
    shopOrders: false,
    shopCustomers: false,
  },
  hybrid: {
    sourcing: true,
    autoOrder: true,
    marginCalc: true,
    inventory: true,
    warehouse: true,
    stockIn: true,
    stockOut: true,
    stockCount: true,
    purchaseOrder: true,
    shopProducts: false,
    shopCategories: false,
    shopOrders: false,
    shopCustomers: false,
  },
  shop: {
    sourcing: false,
    autoOrder: false,
    marginCalc: false,
    inventory: true,
    warehouse: false,
    stockIn: false,
    stockOut: false,
    stockCount: false,
    purchaseOrder: false,
    shopProducts: true,
    shopCategories: true,
    shopOrders: true,
    shopCustomers: true,
  },
};

// 컨텍스트 타입
interface SystemModeContextType {
  settings: SystemSettings;
  setMode: (mode: SystemMode) => void;
  setFeature: (feature: keyof FeatureSettings, enabled: boolean) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  isFeatureEnabled: (feature: keyof FeatureSettings) => boolean;
  getModeLabel: (mode: SystemMode) => string;
}

// 기본값
const defaultSettings: SystemSettings = {
  mode: 'dropshipping',
  features: defaultFeaturesByMode.dropshipping,
};

// 컨텍스트 생성
const SystemModeContext = createContext<SystemModeContextType | undefined>(undefined);

// 로컬 스토리지 키
const STORAGE_KEY = 'system-settings';

// Provider 컴포넌트
export function SystemModeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // 로컬 스토리지에서 설정 로드
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      } catch {
        console.error('Failed to parse stored settings');
      }
    }
    setIsLoaded(true);
  }, []);

  // 설정 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  // 모드 변경
  const setMode = (mode: SystemMode) => {
    setSettings(prev => ({
      ...prev,
      mode,
      features: defaultFeaturesByMode[mode],
    }));
  };

  // 개별 기능 토글
  const setFeature = (feature: keyof FeatureSettings, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled,
      },
    }));
  };

  // 설정 업데이트
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  // 기능 활성화 여부 확인
  const isFeatureEnabled = (feature: keyof FeatureSettings) => {
    return settings.features[feature];
  };

  // 모드 라벨
  const getModeLabel = (mode: SystemMode) => {
    const labels: Record<SystemMode, string> = {
      dropshipping: '위탁판매',
      inventory: '재고관리',
      hybrid: '통합',
      shop: '자사몰 관리',
    };
    return labels[mode];
  };

  return (
    <SystemModeContext.Provider
      value={{
        settings,
        setMode,
        setFeature,
        updateSettings,
        isFeatureEnabled,
        getModeLabel,
      }}
    >
      {children}
    </SystemModeContext.Provider>
  );
}

// Hook
export function useSystemMode() {
  const context = useContext(SystemModeContext);
  if (context === undefined) {
    throw new Error('useSystemMode must be used within a SystemModeProvider');
  }
  return context;
}
