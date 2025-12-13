'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Globe,
  TrendingUp,
  Package,
} from 'lucide-react';

// 플랫폼 정보
const platformInfo: Record<string, { label: string; color: string; bgColor: string }> = {
  COUPANG: { label: '쿠팡', color: 'text-orange-500', bgColor: 'bg-orange-100' },
  NAVER: { label: '네이버', color: 'text-green-500', bgColor: 'bg-green-100' },
  SHOP: { label: '자사몰', color: 'text-blue-500', bgColor: 'bg-blue-100' },
};

interface PlatformStats {
  platform: string;
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  errorProducts: number;
  lastSyncAt: string;
  isConfigured: boolean;
}

interface RecentActivity {
  id: string;
  productName: string;
  platform: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ERROR';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message?: string;
  timestamp: string;
}

export default function PlatformStatusPage() {
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // 목업 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      setPlatformStats([
        {
          platform: 'COUPANG',
          totalProducts: 45,
          activeProducts: 38,
          pendingProducts: 5,
          errorProducts: 2,
          lastSyncAt: '2024-01-17 14:30',
          isConfigured: true,
        },
        {
          platform: 'NAVER',
          totalProducts: 32,
          activeProducts: 28,
          pendingProducts: 3,
          errorProducts: 1,
          lastSyncAt: '2024-01-17 14:25',
          isConfigured: true,
        },
        {
          platform: 'SHOP',
          totalProducts: 50,
          activeProducts: 45,
          pendingProducts: 5,
          errorProducts: 0,
          lastSyncAt: '2024-01-17 14:35',
          isConfigured: true,
        },
      ]);

      setRecentActivities([
        {
          id: '1',
          productName: '프리미엄 사과 3kg',
          platform: 'COUPANG',
          action: 'CREATE',
          status: 'SUCCESS',
          timestamp: '2024-01-17 14:30',
        },
        {
          id: '2',
          productName: '유기농 토마토 2kg',
          platform: 'NAVER',
          action: 'CREATE',
          status: 'PENDING',
          timestamp: '2024-01-17 14:28',
        },
        {
          id: '3',
          productName: '제주 감귤 5kg',
          platform: 'COUPANG',
          action: 'UPDATE',
          status: 'FAILED',
          message: '카테고리 코드 오류',
          timestamp: '2024-01-17 14:25',
        },
        {
          id: '4',
          productName: '한우 등심 1kg',
          platform: 'SHOP',
          action: 'CREATE',
          status: 'SUCCESS',
          timestamp: '2024-01-17 14:20',
        },
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncing(false);
    alert('동기화가 완료되었습니다.');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'PENDING':
        return <Clock size={16} className="text-yellow-500" />;
      case 'FAILED':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '등록';
      case 'UPDATE':
        return '수정';
      case 'DELETE':
        return '삭제';
      case 'ERROR':
        return '오류';
      default:
        return action;
    }
  };

  // 전체 통계
  const totalStats = platformStats.reduce(
    (acc, curr) => ({
      total: acc.total + curr.totalProducts,
      active: acc.active + curr.activeProducts,
      pending: acc.pending + curr.pendingProducts,
      error: acc.error + curr.errorProducts,
    }),
    { total: 0, active: 0, pending: 0, error: 0 }
  );

  return (
    <DashboardLayout
      title="플랫폼 현황"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '통합 상품', href: '/products/multi' },
        { name: '플랫폼 현황' },
      ]}
    >
      {/* 전체 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">전체 등록</p>
              <p className="text-xl font-bold">{totalStats.total}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">판매중</p>
              <p className="text-xl font-bold">{totalStats.active}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">대기중</p>
              <p className="text-xl font-bold">{totalStats.pending}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">오류</p>
              <p className="text-xl font-bold">{totalStats.error}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 플랫폼별 현황 */}
        <div className="lg:col-span-2">
          <Card
            title="플랫폼별 현황"
            actions={
              <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing}>
                <RefreshCw size={14} className={`mr-1 ${syncing ? 'animate-spin' : ''}`} />
                동기화
              </Button>
            }
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {platformStats.map((stat) => {
                  const info = platformInfo[stat.platform];
                  const successRate = stat.totalProducts > 0
                    ? Math.round((stat.activeProducts / stat.totalProducts) * 100)
                    : 0;

                  return (
                    <div
                      key={stat.platform}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${info.bgColor} rounded-lg flex items-center justify-center`}>
                            <Package size={20} className={info.color} />
                          </div>
                          <div>
                            <h4 className="font-medium">{info.label}</h4>
                            <p className="text-xs text-gray-500">
                              마지막 동기화: {stat.lastSyncAt}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{stat.totalProducts}</p>
                          <p className="text-xs text-gray-500">총 상품</p>
                        </div>
                      </div>

                      {/* 진행 바 */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>활성화율</span>
                          <span>{successRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </div>

                      {/* 상세 수치 */}
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div className="p-2 bg-green-50 rounded">
                          <p className="font-bold text-green-600">{stat.activeProducts}</p>
                          <p className="text-xs text-gray-500">판매중</p>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded">
                          <p className="font-bold text-yellow-600">{stat.pendingProducts}</p>
                          <p className="text-xs text-gray-500">대기중</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <p className="font-bold text-red-600">{stat.errorProducts}</p>
                          <p className="text-xs text-gray-500">오류</p>
                        </div>
                      </div>

                      {!stat.isConfigured && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700 flex items-center gap-2">
                          <AlertTriangle size={14} />
                          API 설정이 필요합니다
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* 최근 활동 */}
        <div className="lg:col-span-1">
          <Card title="최근 활동">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const platform = platformInfo[activity.platform];
                  return (
                    <div
                      key={activity.id}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(activity.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {activity.productName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${platform.bgColor} ${platform.color}`}>
                              {platform.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {getActionLabel(activity.action)}
                            </span>
                          </div>
                          {activity.message && (
                            <p className="text-xs text-red-500 mt-1">{activity.message}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {activity.timestamp.split(' ')[1]}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {recentActivities.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    최근 활동이 없습니다
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
