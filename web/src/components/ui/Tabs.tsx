'use client';

import { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: 'success' | 'warning' | 'error';
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export default function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  const getBadgeIcon = (badge?: 'success' | 'warning' | 'error') => {
    switch (badge) {
      case 'success':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={14} className="text-yellow-500" />;
      case 'error':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                aria-selected={isActive}
                role="tab"
              >
                {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="flex-shrink-0 ml-1">
                    {getBadgeIcon(tab.badge)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-6" role="tabpanel">
        {children}
      </div>
    </div>
  );
}

// TabPanel 컴포넌트 - 조건부 렌더링을 위한 헬퍼
interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null;
  return <>{children}</>;
}
