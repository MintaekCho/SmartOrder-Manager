'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, DataTable } from '@/components/ui';
import {
  Search,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShoppingCart,
  Store,
  ArrowRight,
  FileText,
  Send,
} from 'lucide-react';

// 주문 타입 정의
interface OrderItem {
  id: string;
  coupangOrderId: string;
  productName: string;
  optionName: string;
  quantity: number;
  sellingPrice: number;
  wholesale: {
    supplier: string;
    productName: string;
    price: number;
    stock?: number;
    url?: string;
    orderNumber?: string;
  };
  margin: number;
  marginRate: number;
  orderedAt: string;
  processedAt?: string;
  status: string;
}

// Mock 발주 대기 주문 데이터
const mockPendingOrders: OrderItem[] = [
  {
    id: '1',
    coupangOrderId: 'COU-2024011501234',
    productName: '블루투스 이어폰 TWS-500',
    optionName: '블랙',
    quantity: 1,
    sellingPrice: 25900,
    wholesale: {
      supplier: '도매꾹',
      productName: '무선 이어폰 TWS-500 블랙',
      price: 12500,
      stock: 150,
      url: 'https://domeggook.com/product/123',
    },
    margin: 13400,
    marginRate: 51.7,
    orderedAt: '2024-01-15 14:30:22',
    status: 'PENDING',
  },
  {
    id: '2',
    coupangOrderId: 'COU-2024011501235',
    productName: 'USB-C 고속 충전 케이블 1.5m',
    optionName: '화이트',
    quantity: 2,
    sellingPrice: 17800,
    wholesale: {
      supplier: '도매꾹',
      productName: 'USB-C 케이블 1.5M 화이트',
      price: 4500,
      stock: 500,
      url: 'https://domeggook.com/product/456',
    },
    margin: 8800,
    marginRate: 49.4,
    orderedAt: '2024-01-15 13:22:15',
    status: 'PENDING',
  },
  {
    id: '3',
    coupangOrderId: 'COU-2024011501240',
    productName: '무선 마우스 M-200',
    optionName: '그레이',
    quantity: 1,
    sellingPrice: 15900,
    wholesale: {
      supplier: '1688',
      productName: '无线鼠标 M-200 灰色',
      price: 6200,
      stock: 0, // 품절
      url: 'https://1688.com/product/789',
    },
    margin: 9700,
    marginRate: 61.0,
    orderedAt: '2024-01-15 11:45:33',
    status: 'OUT_OF_STOCK',
  },
  {
    id: '4',
    coupangOrderId: 'COU-2024011501241',
    productName: '노트북 거치대 알루미늄',
    optionName: '실버',
    quantity: 1,
    sellingPrice: 24900,
    wholesale: {
      supplier: '도매꾹',
      productName: '알루미늄 노트북 거치대',
      price: 11000,
      stock: 45,
      url: 'https://domeggook.com/product/111',
    },
    margin: 13900,
    marginRate: 55.8,
    orderedAt: '2024-01-15 10:15:42',
    status: 'PENDING',
  },
];

// 완료된 발주 데이터
const mockCompletedOrders = [
  {
    id: '5',
    coupangOrderId: 'COU-2024011401230',
    productName: '미니 가습기 USB',
    optionName: '핑크',
    quantity: 1,
    sellingPrice: 12900,
    wholesale: {
      supplier: '도매꾹',
      productName: 'USB 미니가습기 핑크',
      price: 5500,
      orderNumber: 'DM-20240114-001',
    },
    margin: 7400,
    marginRate: 57.4,
    orderedAt: '2024-01-14 16:30:11',
    processedAt: '2024-01-14 17:15:00',
    status: 'ORDERED',
  },
  {
    id: '6',
    coupangOrderId: 'COU-2024011301225',
    productName: '블루투스 스피커 BS-100',
    optionName: '블랙',
    quantity: 2,
    sellingPrice: 35000,
    wholesale: {
      supplier: '1688',
      productName: '蓝牙音箱 BS-100',
      price: 15000,
      orderNumber: '1688-20240113-002',
    },
    margin: 5000,
    marginRate: 14.3,
    orderedAt: '2024-01-13 09:20:30',
    processedAt: '2024-01-13 10:00:00',
    status: 'ORDERED',
  },
];

const statusConfig: Record<string, { label: string; variant: 'pending' | 'processing' | 'completed' | 'error' }> = {
  PENDING: { label: '발주 대기', variant: 'pending' },
  OUT_OF_STOCK: { label: '품절', variant: 'error' },
  ORDERED: { label: '발주 완료', variant: 'completed' },
  PROCESSING: { label: '처리중', variant: 'processing' },
};

export default function FulfillmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentOrders = activeTab === 'pending' ? mockPendingOrders : mockCompletedOrders;

  const filteredOrders = currentOrders.filter((order) => {
    return (
      !searchQuery ||
      order.coupangOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleBulkOrder = async () => {
    if (selectedOrders.length === 0) return;
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setSelectedOrders([]);
    alert(`${selectedOrders.length}건의 발주가 처리되었습니다.`);
  };

  const pendingCount = mockPendingOrders.filter(o => o.status === 'PENDING').length;
  const outOfStockCount = mockPendingOrders.filter(o => o.status === 'OUT_OF_STOCK').length;

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
      render: (item: typeof mockPendingOrders[0]) => (
        <input
          type="checkbox"
          checked={selectedOrders.includes(item.id)}
          onChange={(e) =>
            setSelectedOrders((prev) =>
              e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
            )
          }
          className="rounded"
          disabled={item.status === 'OUT_OF_STOCK'}
        />
      ),
    },
    {
      key: 'coupangOrder',
      header: '쿠팡 주문',
      render: (item: typeof mockPendingOrders[0]) => (
        <div>
          <p className="font-mono text-sm text-[var(--color-primary-600)]">{item.coupangOrderId}</p>
          <p className="text-sm text-[var(--color-gray-500)]">{item.orderedAt}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: '주문 상품',
      render: (item: typeof mockPendingOrders[0]) => (
        <div>
          <p className="font-medium text-[var(--color-gray-900)]">{item.productName}</p>
          <p className="text-sm text-[var(--color-gray-500)]">
            옵션: {item.optionName} / 수량: {item.quantity}개
          </p>
        </div>
      ),
    },
    {
      key: 'wholesale',
      header: '도매처 매칭',
      render: (item: typeof mockPendingOrders[0]) => (
        <div className="flex items-center gap-2">
          <Store size={16} className="text-[var(--color-gray-400)]" />
          <div>
            <p className="text-sm font-medium text-[var(--color-gray-900)]">
              {item.wholesale.supplier}
            </p>
            <p className="text-xs text-[var(--color-gray-500)] max-w-[200px] truncate">
              {item.wholesale.productName}
            </p>
            {item.wholesale.stock !== undefined && (
              <p className={`text-xs ${item.wholesale.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                재고: {item.wholesale.stock > 0 ? `${item.wholesale.stock}개` : '품절'}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'prices',
      header: '가격/마진',
      render: (item: typeof mockPendingOrders[0]) => (
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-[var(--color-gray-500)]">{item.wholesale.price.toLocaleString()}원</span>
            <ArrowRight size={12} className="text-[var(--color-gray-400)]" />
            <span className="font-medium">{item.sellingPrice.toLocaleString()}원</span>
          </div>
          <p className={`text-sm font-medium ${item.marginRate > 30 ? 'text-green-600' : item.marginRate > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
            마진 {item.margin.toLocaleString()}원 ({item.marginRate}%)
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (item: typeof mockPendingOrders[0]) => {
        const config = statusConfig[item.status];
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (item: typeof mockPendingOrders[0]) => (
        <div className="flex items-center gap-1">
          {'url' in item.wholesale && item.wholesale.url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(item.wholesale.url, '_blank')}
            >
              <ExternalLink size={16} />
            </Button>
          )}
          {item.status === 'PENDING' && (
            <Button variant="primary" size="sm">
              발주
            </Button>
          )}
          {item.status === 'ORDERED' && 'orderNumber' in item.wholesale && (
            <span className="text-xs text-[var(--color-gray-500)] font-mono">
              {item.wholesale.orderNumber}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="발주 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '주문 관리', href: '/orders' },
        { name: '발주 관리' },
      ]}
    >
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">발주 대기</p>
              <p className="text-2xl font-bold text-[var(--color-gray-900)]">{pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">품절 상품</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">오늘 발주 완료</p>
              <p className="text-2xl font-bold text-[var(--color-gray-900)]">{mockCompletedOrders.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">예상 총 마진</p>
              <p className="text-2xl font-bold text-green-600">
                {mockPendingOrders.reduce((sum, o) => sum + o.margin, 0).toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-[var(--color-primary-500)] text-white'
              : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
          }`}
        >
          발주 대기 ({pendingCount + outOfStockCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'completed'
              ? 'bg-[var(--color-primary-500)] text-white'
              : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
          }`}
        >
          발주 완료 ({mockCompletedOrders.length})
        </button>
      </div>

      {/* 검색 및 액션 */}
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
                placeholder="주문번호, 상품명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <RefreshCw size={16} className="mr-1" />
              새로고침
            </Button>
            <Button variant="secondary">
              <FileText size={16} className="mr-1" />
              발주서 출력
            </Button>
          </div>
        </div>
      </Card>

      {/* 선택된 항목 액션 */}
      {selectedOrders.length > 0 && activeTab === 'pending' && (
        <div className="flex items-center gap-4 p-4 mb-4 bg-[var(--color-primary-50)] rounded-lg">
          <span className="text-sm font-medium text-[var(--color-primary-700)]">
            {selectedOrders.length}개 선택됨
          </span>
          <div className="flex gap-2">
            <Button onClick={handleBulkOrder} loading={isProcessing}>
              <Send size={14} className="mr-1" />
              일괄 발주 ({selectedOrders.length}건)
            </Button>
          </div>
        </div>
      )}

      {/* 발주 목록 */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        emptyMessage={activeTab === 'pending' ? '발주 대기 중인 주문이 없습니다.' : '완료된 발주가 없습니다.'}
      />

      {/* 안내 메시지 */}
      {activeTab === 'pending' && outOfStockCount > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">품절 상품 안내</p>
              <p className="text-sm text-yellow-700 mt-1">
                {outOfStockCount}건의 주문에서 도매처 상품이 품절되었습니다.
                대체 상품을 찾거나 고객에게 안내가 필요합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
