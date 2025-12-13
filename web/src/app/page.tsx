'use client';

import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { StatCard, DataTable, Badge, Button } from '@/components/ui';
import { RevenueChart, CategoryChart } from '@/components/charts';
import { useFeatureSettings } from '@/contexts/FeatureSettingsContext';
import InventoryDashboard from '@/components/dashboard/InventoryDashboard';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';

// 타입 정의
interface DashboardStats {
  todayOrders: number;
  orderChange: number;
  pendingOrders: number;
  todayRevenue: number;
  revenueChange: number;
  totalProducts: number;
  activeProducts: number;
}

interface Order {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  orderedAt: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  profit: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const statusMap = {
  pending: { label: '발주 대기', variant: 'pending' as const },
  processing: { label: '처리중', variant: 'processing' as const },
  completed: { label: '완료', variant: 'completed' as const },
  error: { label: '오류', variant: 'error' as const },
};

// 위탁판매 대시보드 컴포넌트
function DropshippingDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, ordersRes, revenueRes, categoryRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent-orders?limit=5'),
          fetch('/api/dashboard/revenue?days=7'),
          fetch('/api/dashboard/category-sales'),
        ]);

        if (!statsRes.ok || !ordersRes.ok || !revenueRes.ok || !categoryRes.ok) {
          throw new Error('API 호출 실패');
        }

        const [statsData, ordersData, revenueDataRes, categoryDataRes] = await Promise.all([
          statsRes.json(),
          ordersRes.json(),
          revenueRes.json(),
          categoryRes.json(),
        ]);

        setStats(statsData);
        setOrders(ordersData.orders || []);
        setRevenueData(revenueDataRes.revenueData || []);
        setCategoryData(categoryDataRes.categoryData || []);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const orderColumns = [
    { key: 'orderId', header: '주문번호', width: '120px' },
    {
      key: 'productName',
      header: '상품명',
      render: (item: Order) => (
        <span className="font-medium">{item.productName}</span>
      ),
    },
    {
      key: 'quantity',
      header: '수량',
      width: '80px',
      render: (item: Order) => `${item.quantity}개`,
    },
    {
      key: 'amount',
      header: '금액',
      width: '100px',
      render: (item: Order) =>
        `${item.amount.toLocaleString()}원`,
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (item: Order) => (
        <Badge variant={statusMap[item.status].variant} dot>
          {statusMap[item.status].label}
        </Badge>
      ),
    },
    {
      key: 'orderedAt',
      header: '주문일시',
      width: '140px',
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: () => (
        <Button variant="ghost" size="sm">
          <Eye size={16} />
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
          <p className="text-[var(--color-text-secondary)]">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-error)]" />
          <div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">데이터 로드 실패</p>
            <p className="text-[var(--color-text-secondary)] mt-1">{error}</p>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
              쿠팡 Wing API 설정을 확인해주세요.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="오늘 주문"
          value={stats?.todayOrders || 0}
          icon={<ShoppingCart size={24} className="text-[var(--color-primary-600)]" />}
          iconBgColor="bg-[var(--color-primary-100)]"
          change={stats?.orderChange}
          changeLabel="전일 대비"
        />
        <StatCard
          title="미처리 주문"
          value={stats?.pendingOrders || 0}
          icon={<AlertCircle size={24} className="text-[var(--color-warning)]" />}
          iconBgColor="bg-[#FFF3E0]"
          subtitle="발주 대기 중"
        />
        <StatCard
          title="오늘 매출"
          value={`${(stats?.todayRevenue || 0).toLocaleString()}원`}
          icon={<TrendingUp size={24} className="text-[var(--color-success)]" />}
          iconBgColor="bg-[#E8F5E9]"
          change={stats?.revenueChange}
          changeLabel="전일 대비"
        />
        <StatCard
          title="등록 상품"
          value={stats?.totalProducts || 0}
          icon={<Package size={24} className="text-[var(--color-info)]" />}
          iconBgColor="bg-[#E3F2FD]"
          subtitle={`판매중 ${stats?.activeProducts || 0}개`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <div>
          <CategoryChart data={categoryData} />
        </div>
      </div>

      {/* Recent Orders */}
      <DataTable
        title="최근 주문"
        columns={orderColumns}
        data={orders}
        actions={
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/orders'}>
            전체 보기
          </Button>
        }
        onRowClick={(item) => console.log('Clicked:', item)}
        emptyMessage="최근 주문이 없습니다."
      />
    </>
  );
}

export default function DashboardPage() {
  const { features, isFeatureEnabled } = useFeatureSettings();

  // 활성화된 기능에 따라 대시보드 타입 결정
  const showInventoryDashboard = isFeatureEnabled('inventory') && !isFeatureEnabled('coupangOrders');

  // 대시보드 타이틀 결정
  const getDashboardTitle = () => {
    const activeFeatureCount = Object.values(features).filter(Boolean).length;

    if (showInventoryDashboard) {
      return '재고 관리 대시보드';
    }
    if (isFeatureEnabled('coupangOrders') || isFeatureEnabled('coupangProducts')) {
      return '위탁판매 대시보드';
    }
    if (isFeatureEnabled('shopProducts') || isFeatureEnabled('shopOrders')) {
      return '자사몰 대시보드';
    }
    return '대시보드';
  };

  return (
    <DashboardLayout
      title={getDashboardTitle()}
      breadcrumb={[{ name: '홈', href: '/' }, { name: '대시보드' }]}
    >
      {showInventoryDashboard ? (
        <InventoryDashboard />
      ) : (
        <DropshippingDashboard />
      )}
    </DashboardLayout>
  );
}
