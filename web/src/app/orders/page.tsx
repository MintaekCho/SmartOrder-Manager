'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Select, Card, Badge, DataTable } from '@/components/ui';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// Mock 주문 데이터
const mockOrders = [
  {
    id: '1',
    coupangOrderId: 'COU-2024011501234',
    productName: '블루투스 이어폰 TWS-500',
    optionName: '블랙',
    quantity: 1,
    amount: 25900,
    buyerName: '김*호',
    status: 'NEW',
    orderedAt: '2024-01-15 14:30:22',
  },
  {
    id: '2',
    coupangOrderId: 'COU-2024011501235',
    productName: 'USB-C 고속 충전 케이블 1.5m',
    optionName: '화이트',
    quantity: 2,
    amount: 17800,
    buyerName: '이*영',
    status: 'PENDING_ORDER',
    orderedAt: '2024-01-15 13:22:15',
  },
  {
    id: '3',
    coupangOrderId: 'COU-2024011501236',
    productName: '무선 마우스 M-200',
    optionName: '그레이',
    quantity: 1,
    amount: 15900,
    buyerName: '박*수',
    status: 'ORDERED',
    orderedAt: '2024-01-15 11:45:33',
  },
  {
    id: '4',
    coupangOrderId: 'COU-2024011501237',
    productName: '노트북 거치대 알루미늄',
    optionName: '실버',
    quantity: 1,
    amount: 24900,
    buyerName: '최*지',
    status: 'SHIPPED',
    orderedAt: '2024-01-15 10:15:42',
  },
  {
    id: '5',
    coupangOrderId: 'COU-2024011501238',
    productName: '미니 가습기 USB',
    optionName: '핑크',
    quantity: 1,
    amount: 12900,
    buyerName: '정*아',
    status: 'DELIVERED',
    orderedAt: '2024-01-14 16:30:11',
  },
  {
    id: '6',
    coupangOrderId: 'COU-2024011501239',
    productName: '블루투스 스피커',
    optionName: '블랙',
    quantity: 1,
    amount: 35000,
    buyerName: '한*민',
    status: 'CANCELLED',
    orderedAt: '2024-01-14 14:20:55',
  },
];

const statusConfig: Record<string, { label: string; variant: 'pending' | 'processing' | 'completed' | 'error'; icon: React.ReactNode }> = {
  NEW: { label: '신규 주문', variant: 'pending', icon: <Clock size={14} /> },
  PENDING_ORDER: { label: '발주 대기', variant: 'pending', icon: <AlertTriangle size={14} /> },
  ORDERED: { label: '발주 완료', variant: 'processing', icon: <Package size={14} /> },
  SHIPPED: { label: '배송중', variant: 'processing', icon: <Truck size={14} /> },
  DELIVERED: { label: '배송 완료', variant: 'completed', icon: <CheckCircle size={14} /> },
  CANCELLED: { label: '취소', variant: 'error', icon: <XCircle size={14} /> },
};

const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'NEW', label: '신규 주문' },
  { value: 'PENDING_ORDER', label: '발주 대기' },
  { value: 'ORDERED', label: '발주 완료' },
  { value: 'SHIPPED', label: '배송중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'CANCELLED', label: '취소' },
];

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.coupangOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.includes(searchQuery);

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 상태별 카운트
  const statusCounts = mockOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const columns = [
    {
      key: 'checkbox',
      header: (
        <input
          type="checkbox"
          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
          onChange={(e) =>
            setSelectedOrders(e.target.checked ? filteredOrders.map((o) => o.id) : [])
          }
          className="rounded"
        />
      ),
      width: '40px',
      render: (item: typeof mockOrders[0]) => (
        <input
          type="checkbox"
          checked={selectedOrders.includes(item.id)}
          onChange={(e) =>
            setSelectedOrders((prev) =>
              e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
            )
          }
          className="rounded"
        />
      ),
    },
    {
      key: 'coupangOrderId',
      header: '주문번호',
      width: '160px',
      render: (item: typeof mockOrders[0]) => (
        <span className="font-mono text-sm">{item.coupangOrderId}</span>
      ),
    },
    {
      key: 'product',
      header: '상품정보',
      render: (item: typeof mockOrders[0]) => (
        <div>
          <p className="font-medium text-[var(--color-gray-900)]">{item.productName}</p>
          <p className="text-sm text-[var(--color-gray-500)]">옵션: {item.optionName}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: '수량',
      width: '80px',
      render: (item: typeof mockOrders[0]) => `${item.quantity}개`,
    },
    {
      key: 'amount',
      header: '결제금액',
      width: '100px',
      render: (item: typeof mockOrders[0]) => (
        <span className="font-medium">{item.amount.toLocaleString()}원</span>
      ),
    },
    {
      key: 'buyerName',
      header: '구매자',
      width: '80px',
    },
    {
      key: 'status',
      header: '상태',
      width: '120px',
      render: (item: typeof mockOrders[0]) => {
        const config = statusConfig[item.status];
        return (
          <Badge variant={config.variant} dot>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'orderedAt',
      header: '주문일시',
      width: '150px',
      render: (item: typeof mockOrders[0]) => (
        <span className="text-sm text-[var(--color-gray-600)]">{item.orderedAt}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (item: typeof mockOrders[0]) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <Eye size={16} />
          </Button>
          {(item.status === 'NEW' || item.status === 'PENDING_ORDER') && (
            <Button variant="ghost" size="sm">
              <Truck size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="주문 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '주문 관리' },
      ]}
    >
      {/* 상태별 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              statusFilter === status
                ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                : 'border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-300)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[var(--color-gray-500)]`}>{config.icon}</span>
              <span className="text-sm text-[var(--color-gray-600)]">{config.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-gray-900)]">
              {statusCounts[status] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]"
              />
              <input
                type="text"
                placeholder="주문번호, 상품명, 구매자명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Button variant="secondary" onClick={handleRefresh} loading={isRefreshing}>
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
            <Button variant="secondary">
              <Download size={16} className="mr-1" />
              내보내기
            </Button>
          </div>
        </div>
      </Card>

      {/* 선택된 항목 액션 */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-4 p-4 mb-4 bg-[var(--color-primary-50)] rounded-lg">
          <span className="text-sm font-medium text-[var(--color-primary-700)]">
            {selectedOrders.length}개 선택됨
          </span>
          <div className="flex gap-2">
            <Button size="sm">
              <Truck size={14} className="mr-1" />
              일괄 발주
            </Button>
            <Button size="sm" variant="secondary">
              송장 일괄 등록
            </Button>
          </div>
        </div>
      )}

      {/* 주문 목록 */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        emptyMessage="주문 내역이 없습니다."
      />
    </DashboardLayout>
  );
}
