'use client';

import { DashboardLayout } from '@/components/layout';
import { StatCard, DataTable, Badge, Button } from '@/components/ui';
import { RevenueChart, CategoryChart } from '@/components/charts';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  Eye,
} from 'lucide-react';

// 임시 데이터
const recentOrders = [
  {
    id: '1',
    orderId: '#COU-12345',
    productName: '블루투스 이어폰 TWS-500',
    quantity: 1,
    amount: 25000,
    status: 'pending' as const,
    orderedAt: '2024-01-15 14:30',
  },
  {
    id: '2',
    orderId: '#COU-12344',
    productName: 'USB-C 충전 케이블 1.5m',
    quantity: 2,
    amount: 12000,
    status: 'processing' as const,
    orderedAt: '2024-01-15 13:22',
  },
  {
    id: '3',
    orderId: '#COU-12343',
    productName: '무선 마우스 M-200',
    quantity: 1,
    amount: 18500,
    status: 'completed' as const,
    orderedAt: '2024-01-15 11:45',
  },
  {
    id: '4',
    orderId: '#COU-12342',
    productName: '노트북 거치대 알루미늄',
    quantity: 1,
    amount: 35000,
    status: 'completed' as const,
    orderedAt: '2024-01-15 10:15',
  },
  {
    id: '5',
    orderId: '#COU-12341',
    productName: '미니 선풍기 휴대용',
    quantity: 3,
    amount: 27000,
    status: 'error' as const,
    orderedAt: '2024-01-15 09:30',
  },
];

const revenueData = [
  { date: '01/09', revenue: 1250000, profit: 187500 },
  { date: '01/10', revenue: 980000, profit: 147000 },
  { date: '01/11', revenue: 1520000, profit: 228000 },
  { date: '01/12', revenue: 1180000, profit: 177000 },
  { date: '01/13', revenue: 2100000, profit: 315000 },
  { date: '01/14', revenue: 1850000, profit: 277500 },
  { date: '01/15', revenue: 2340000, profit: 351000 },
];

const categoryData = [
  { name: '전자기기', value: 4520000, color: '#4AC1E0' },
  { name: '생활용품', value: 2180000, color: '#4CAF50' },
  { name: '패션잡화', value: 1650000, color: '#F5A623' },
  { name: '뷰티', value: 890000, color: '#E74C3C' },
];

const statusMap = {
  pending: { label: '발주 대기', variant: 'pending' as const },
  processing: { label: '처리중', variant: 'processing' as const },
  completed: { label: '완료', variant: 'completed' as const },
  error: { label: '오류', variant: 'error' as const },
};

export default function DashboardPage() {
  const orderColumns = [
    { key: 'orderId', header: '주문번호', width: '120px' },
    {
      key: 'productName',
      header: '상품명',
      render: (item: (typeof recentOrders)[0]) => (
        <span className="font-medium">{item.productName}</span>
      ),
    },
    {
      key: 'quantity',
      header: '수량',
      width: '80px',
      render: (item: (typeof recentOrders)[0]) => `${item.quantity}개`,
    },
    {
      key: 'amount',
      header: '금액',
      width: '100px',
      render: (item: (typeof recentOrders)[0]) =>
        `${item.amount.toLocaleString()}원`,
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (item: (typeof recentOrders)[0]) => (
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

  return (
    <DashboardLayout
      title="대시보드"
      breadcrumb={[{ name: '홈', href: '/' }, { name: '대시보드' }]}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="오늘 주문"
          value={127}
          icon={<ShoppingCart size={24} className="text-[var(--color-primary-600)]" />}
          iconBgColor="bg-[var(--color-primary-100)]"
          change={12}
          changeLabel="전일 대비"
        />
        <StatCard
          title="미처리 주문"
          value={17}
          icon={<AlertCircle size={24} className="text-[var(--color-warning)]" />}
          iconBgColor="bg-[#FFF3E0]"
          subtitle="발주 대기 중"
        />
        <StatCard
          title="오늘 매출"
          value="2,340,000원"
          icon={<TrendingUp size={24} className="text-[var(--color-success)]" />}
          iconBgColor="bg-[#E8F5E9]"
          change={8.5}
          changeLabel="전일 대비"
        />
        <StatCard
          title="등록 상품"
          value={342}
          icon={<Package size={24} className="text-[var(--color-info)]" />}
          iconBgColor="bg-[#E3F2FD]"
          subtitle="판매중 289개"
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
        data={recentOrders}
        actions={
          <Button variant="ghost" size="sm">
            전체 보기
          </Button>
        }
        onRowClick={(item) => console.log('Clicked:', item)}
      />
    </DashboardLayout>
  );
}
