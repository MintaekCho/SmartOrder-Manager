'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Select, Card, Badge, DataTable } from '@/components/ui';
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { CoupangOrder, CoupangOrderItem } from '@/lib/coupang/client';

// 쿠팡 주문 상태 매핑
const statusConfig: Record<string, { label: string; variant: 'pending' | 'processing' | 'completed' | 'error'; icon: React.ReactNode }> = {
  ACCEPT: { label: '결제완료', variant: 'pending', icon: <Clock size={14} /> },
  INSTRUCT: { label: '상품준비', variant: 'pending', icon: <AlertTriangle size={14} /> },
  DEPARTURE: { label: '배송지시', variant: 'processing', icon: <Package size={14} /> },
  DELIVERING: { label: '배송중', variant: 'processing', icon: <Truck size={14} /> },
  FINAL_DELIVERY: { label: '배송완료', variant: 'completed', icon: <CheckCircle size={14} /> },
  CANCEL: { label: '취소', variant: 'error', icon: <XCircle size={14} /> },
};

const statusOptions = [
  { value: 'ACCEPT', label: '결제완료' },
  { value: 'INSTRUCT', label: '상품준비' },
  { value: 'DEPARTURE', label: '배송지시' },
  { value: 'DELIVERING', label: '배송중' },
  { value: 'FINAL_DELIVERY', label: '배송완료' },
];

// 주문 데이터 타입 (UI용)
interface OrderData {
  id: string;
  shipmentBoxId: number;
  orderId: number;
  coupangOrderId: string;
  productName: string;
  optionName: string;
  quantity: number;
  amount: number;
  buyerName: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  status: string;
  orderedAt: string;
  items: CoupangOrderItem[];
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACCEPT');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 날짜 필터
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // 주문 상세 모달
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderData | null>(null);

  // 초기 로드 여부 체크
  const isInitialMount = useRef(true);

  // 주문 목록 조회
  const fetchOrders = async (status: string, from: string, to: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status,
        createdAtFrom: from,
        createdAtTo: to,
      });

      const response = await fetch(`/api/coupang/orders?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      // 응답 데이터를 UI 형식으로 변환
      const formattedOrders: OrderData[] = (data.data || []).map((order: CoupangOrder) => ({
        id: String(order.shipmentBoxId),
        shipmentBoxId: order.shipmentBoxId,
        orderId: order.orderId,
        coupangOrderId: String(order.orderId),
        productName: order.orderItems?.[0]?.sellerProductName || '상품명 없음',
        optionName: order.orderItems?.[0]?.firstOptionValue || '-',
        quantity: order.orderItems?.reduce((sum: number, item: CoupangOrderItem) => sum + item.shippingCount, 0) || 0,
        amount: order.orderItems?.reduce((sum: number, item: CoupangOrderItem) => sum + item.orderPrice, 0) || 0,
        buyerName: order.ordererName?.replace(/(.)(.)(.*)/, '$1*$3') || '-',
        receiverName: order.receiverName || '-',
        receiverPhone: order.receiverPhone || '-',
        address: `${order.address || ''} ${order.addressDetail || ''}`.trim(),
        status: order.status,
        orderedAt: order.orderedAt || '-',
        items: order.orderItems || [],
      }));

      setOrders(formattedOrders);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 로드 시 자동 조회 (한 번만)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchOrders(statusFilter, dateFrom, dateTo);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders(statusFilter, dateFrom, dateTo);
    setIsRefreshing(false);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.coupangOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.includes(searchQuery);

    return matchesSearch;
  });

  // 상태별 카운트
  const statusCounts = orders.reduce((acc, order) => {
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
      render: (item: OrderData) => (
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
      width: '140px',
      render: (item: OrderData) => (
        <div>
          <span className="font-mono text-sm">{item.orderId}</span>
          <p className="text-xs text-[var(--color-gray-500)]">Box: {item.shipmentBoxId}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: '상품정보',
      render: (item: OrderData) => (
        <div>
          <p className="font-medium text-[var(--color-gray-900)] line-clamp-1">{item.productName}</p>
          <p className="text-sm text-[var(--color-gray-500)]">
            옵션: {item.optionName}
            {item.items.length > 1 && ` 외 ${item.items.length - 1}건`}
          </p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: '수량',
      width: '80px',
      render: (item: OrderData) => `${item.quantity}개`,
    },
    {
      key: 'amount',
      header: '결제금액',
      width: '120px',
      render: (item: OrderData) => (
        <span className="font-medium">{item.amount.toLocaleString()}원</span>
      ),
    },
    {
      key: 'receiver',
      header: '수령인',
      width: '120px',
      render: (item: OrderData) => (
        <div>
          <p className="text-sm">{item.receiverName}</p>
          <p className="text-xs text-[var(--color-gray-500)]">{item.receiverPhone}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (item: OrderData) => {
        const config = statusConfig[item.status] || { label: item.status, variant: 'pending' as const };
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
      render: (item: OrderData) => (
        <span className="text-sm text-[var(--color-gray-600)]">
          {new Date(item.orderedAt).toLocaleString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (item: OrderData) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrderDetail(item)}>
            <Eye size={16} />
          </Button>
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
      {/* 연결 상태 */}
      <div className="flex items-center mb-4">
        {isConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <Wifi size={16} />
            <span className="text-sm">쿠팡 API 연결됨</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--color-gray-500)]">
            <WifiOff size={16} />
            <span className="text-sm">연결 안됨</span>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 날짜 필터 */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-gray-600)]">조회기간</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
            <span className="text-[var(--color-gray-500)]">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <Button onClick={handleRefresh} loading={isRefreshing || isLoading}>
            <RefreshCw size={16} className={isRefreshing || isLoading ? 'animate-spin' : ''} />
            조회
          </Button>
        </div>
      </Card>

      {/* 상태별 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statusOptions.map(({ value, label }) => {
          const config = statusConfig[value];
          return (
            <div
              key={value}
              onClick={() => {
                setStatusFilter(value);
                fetchOrders(value, dateFrom, dateTo);
              }}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                statusFilter === value
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-300)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--color-gray-500)]">{config?.icon}</span>
                <span className="text-sm text-[var(--color-gray-600)]">{label}</span>
              </div>
              <div className="text-2xl font-bold text-[var(--color-gray-900)]">
                {statusCounts[value] || 0}
              </div>
            </div>
          );
        })}
      </div>

      {/* 검색 */}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary-500)]" />
          <span className="ml-2 text-[var(--color-gray-600)]">주문 목록을 불러오는 중...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          emptyMessage="주문 내역이 없습니다."
        />
      )}

      {/* 주문 상세 모달 */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--color-gray-200)] flex items-center justify-between">
              <h2 className="text-lg font-semibold">주문 상세</h2>
              <button onClick={() => setSelectedOrderDetail(null)} className="text-[var(--color-gray-500)]">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* 주문 정보 */}
              <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
                <h3 className="font-medium mb-3">주문 정보</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--color-gray-500)]">주문번호</span>
                    <p className="font-medium">{selectedOrderDetail.orderId}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">배송번호</span>
                    <p className="font-medium">{selectedOrderDetail.shipmentBoxId}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">주문일시</span>
                    <p>{new Date(selectedOrderDetail.orderedAt).toLocaleString('ko-KR')}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">상태</span>
                    <Badge variant={statusConfig[selectedOrderDetail.status]?.variant || 'pending'}>
                      {statusConfig[selectedOrderDetail.status]?.label || selectedOrderDetail.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 배송지 정보 */}
              <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
                <h3 className="font-medium mb-3">배송지 정보</h3>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-[var(--color-gray-500)]">수령인</span>
                    <p className="font-medium">{selectedOrderDetail.receiverName}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">연락처</span>
                    <p>{selectedOrderDetail.receiverPhone}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">주소</span>
                    <p>{selectedOrderDetail.address}</p>
                  </div>
                </div>
              </div>

              {/* 상품 목록 */}
              <div>
                <h3 className="font-medium mb-3">상품 목록</h3>
                <div className="space-y-2">
                  {selectedOrderDetail.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border border-[var(--color-gray-200)] rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.sellerProductName}</p>
                        <p className="text-xs text-[var(--color-gray-500)]">
                          {item.firstOptionValue && `${item.firstOptionName}: ${item.firstOptionValue}`}
                          {item.secondOptionValue && ` / ${item.secondOptionName}: ${item.secondOptionValue}`}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{item.shippingCount}개</p>
                        <p className="font-medium">{item.orderPrice.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 결제 금액 */}
              <div className="bg-[var(--color-primary-50)] rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">총 결제금액</span>
                  <span className="text-xl font-bold text-[var(--color-primary-600)]">
                    {selectedOrderDetail.amount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--color-gray-200)] flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedOrderDetail(null)}>
                닫기
              </Button>
              {selectedOrderDetail.status === 'ACCEPT' && (
                <Button>
                  <Truck size={16} className="mr-1" />
                  발송처리
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
