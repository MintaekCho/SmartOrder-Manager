'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, DataTable } from '@/components/ui';
import {
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Store,
  ArrowRight,
  FileText,
  Send,
  Wifi,
  WifiOff,
  Loader2,
  Download,
  X,
  Printer,
  Copy,
  Mail,
} from 'lucide-react';
import { CoupangOrder, CoupangOrderItem } from '@/lib/coupang/client';

// 발주 아이템 타입 정의
interface FulfillmentItem {
  id: string;
  shipmentBoxId: number;
  orderId: number;
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
  status: 'PENDING' | 'OUT_OF_STOCK' | 'ORDERED' | 'PROCESSING';
  originalOrder: CoupangOrder;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [purchaseOrderData, setPurchaseOrderData] = useState<any>(null);
  const [isGeneratingOrder, setIsGeneratingOrder] = useState(false);

  // 발주 데이터
  const [pendingOrders, setPendingOrders] = useState<FulfillmentItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<FulfillmentItem[]>([]);

  // 날짜 필터
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // 쿠팡 주문을 발주 아이템으로 변환
  const convertToFulfillmentItem = (order: CoupangOrder, index: number): FulfillmentItem => {
    const firstItem = order.orderItems?.[0];
    const totalQuantity = order.orderItems?.reduce((sum: number, item: CoupangOrderItem) => sum + item.shippingCount, 0) || 0;
    const totalPrice = order.orderItems?.reduce((sum: number, item: CoupangOrderItem) => sum + item.orderPrice, 0) || 0;

    // 예상 도매가 (판매가의 50% 가정 - 실제로는 도매처 연동 필요)
    const estimatedWholesalePrice = Math.round(totalPrice * 0.5);
    const margin = totalPrice - estimatedWholesalePrice;
    const marginRate = totalPrice > 0 ? Math.round((margin / totalPrice) * 100 * 10) / 10 : 0;

    return {
      id: String(order.shipmentBoxId || index + 1),
      shipmentBoxId: order.shipmentBoxId,
      orderId: order.orderId,
      coupangOrderId: `COU-${order.orderId}`,
      productName: firstItem?.sellerProductName || firstItem?.vendorItemName || '상품명 없음',
      optionName: firstItem?.firstOptionValue || '-',
      quantity: totalQuantity,
      sellingPrice: totalPrice,
      wholesale: {
        supplier: '도매처 미연동',
        productName: firstItem?.sellerProductName || '상품명 없음',
        price: estimatedWholesalePrice,
        stock: undefined,
      },
      margin,
      marginRate,
      orderedAt: order.orderedAt || '-',
      status: 'PENDING',
      originalOrder: order,
    };
  };

  // 초기 로드 여부 체크
  const isInitialMount = useRef(true);

  // 발주 대기 주문 조회 (결제완료 상태)
  const fetchPendingOrders = async (from: string, to: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: 'ACCEPT',
        createdAtFrom: from,
        createdAtTo: to,
        maxPerPage: '50',
      });

      const response = await fetch(`/api/coupang/orders?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      const items: FulfillmentItem[] = (data.data || []).map((order: CoupangOrder, index: number) =>
        convertToFulfillmentItem(order, index)
      );

      setPendingOrders(items);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch pending orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 발주 완료 주문 조회 (배송지시 이후 상태)
  const fetchCompletedOrders = async (from: string, to: string) => {
    try {
      const params = new URLSearchParams({
        status: 'DEPARTURE',
        createdAtFrom: from,
        createdAtTo: to,
        maxPerPage: '50',
      });

      const response = await fetch(`/api/coupang/orders?${params}`);
      const data = await response.json();

      if (response.ok) {
        const items: FulfillmentItem[] = (data.data || []).map((order: CoupangOrder, index: number) => ({
          ...convertToFulfillmentItem(order, index),
          status: 'ORDERED' as const,
          processedAt: order.orderedAt,
        }));

        setCompletedOrders(items);
      }
    } catch (err) {
      console.error('Failed to fetch completed orders:', err);
    }
  };

  // 페이지 로드 시 데이터 조회 (한 번만 실행)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchPendingOrders(dateFrom, dateTo);
      fetchCompletedOrders(dateFrom, dateTo);
    }
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      fetchPendingOrders(dateFrom, dateTo),
      fetchCompletedOrders(dateFrom, dateTo),
    ]);
  };

  const currentOrders = activeTab === 'pending' ? pendingOrders : completedOrders;

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
    // TODO: 실제 발주 처리 API 연동
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setSelectedOrders([]);
    alert(`${selectedOrders.length}건의 발주가 처리되었습니다.`);
    handleRefresh();
  };

  // 발주서 생성
  const generatePurchaseOrder = async (targetOrders?: FulfillmentItem[]) => {
    const ordersToProcess = targetOrders || pendingOrders.filter(o => selectedOrders.includes(o.id));

    if (ordersToProcess.length === 0) {
      alert('발주서를 생성할 주문을 선택해주세요.');
      return;
    }

    setIsGeneratingOrder(true);

    try {
      const items = ordersToProcess.map(order => ({
        productName: order.productName,
        optionName: order.optionName,
        quantity: order.quantity,
        unitPrice: order.wholesale.price,
        totalPrice: order.wholesale.price * order.quantity,
        orderId: order.orderId,
        shipmentBoxId: order.shipmentBoxId,
        receiverName: order.originalOrder.receiverName || '-',
        receiverPhone: order.originalOrder.receiverPhone || '-',
        address: `${order.originalOrder.address || ''} ${order.originalOrder.addressDetail || ''}`.trim(),
        memo: order.originalOrder.deliveryMessage || '',
      }));

      const response = await fetch('/api/orders/purchase-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: '도매처',
          items,
          format: 'json',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate purchase order');
      }

      setPurchaseOrderData(data.data);
      setShowPurchaseOrderModal(true);
    } catch (err) {
      console.error('Failed to generate purchase order:', err);
      alert('발주서 생성에 실패했습니다.');
    } finally {
      setIsGeneratingOrder(false);
    }
  };

  // CSV 다운로드
  const downloadCSV = async () => {
    const ordersToProcess = pendingOrders.filter(o => selectedOrders.includes(o.id));

    if (ordersToProcess.length === 0) {
      alert('발주서를 생성할 주문을 선택해주세요.');
      return;
    }

    try {
      const items = ordersToProcess.map(order => ({
        productName: order.productName,
        optionName: order.optionName,
        quantity: order.quantity,
        unitPrice: order.wholesale.price,
        totalPrice: order.wholesale.price * order.quantity,
        orderId: order.orderId,
        shipmentBoxId: order.shipmentBoxId,
        receiverName: order.originalOrder.receiverName || '-',
        receiverPhone: order.originalOrder.receiverPhone || '-',
        address: `${order.originalOrder.address || ''} ${order.originalOrder.addressDetail || ''}`.trim(),
        memo: order.originalOrder.deliveryMessage || '',
      }));

      const response = await fetch('/api/orders/purchase-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: '도매처',
          items,
          format: 'csv',
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-order-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      alert('CSV 다운로드에 실패했습니다.');
    }
  };

  // 클립보드 복사
  const copyToClipboard = () => {
    if (!purchaseOrderData) return;

    const text = purchaseOrderData.items.map((item: any, index: number) =>
      `${index + 1}. ${item.productName} (${item.optionName}) x ${item.quantity}개 - ${item.receiverName} / ${item.receiverPhone} / ${item.address}`
    ).join('\n');

    const header = `[발주서 - ${purchaseOrderData.orderNumber}]\n발주일: ${purchaseOrderData.orderDate}\n총 ${purchaseOrderData.summary.totalItems}건, ${purchaseOrderData.summary.totalQuantity}개\n총 금액: ${purchaseOrderData.summary.totalAmount.toLocaleString()}원\n\n`;

    navigator.clipboard.writeText(header + text);
    alert('클립보드에 복사되었습니다.');
  };

  const pendingCount = pendingOrders.filter(o => o.status === 'PENDING').length;
  const outOfStockCount = pendingOrders.filter(o => o.status === 'OUT_OF_STOCK').length;
  const totalMargin = pendingOrders.reduce((sum, o) => sum + o.margin, 0);

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
      render: (item: FulfillmentItem) => (
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
      render: (item: FulfillmentItem) => (
        <div>
          <p className="font-mono text-sm text-[var(--color-primary-600)]">{item.coupangOrderId}</p>
          <p className="text-xs text-[var(--color-gray-500)]">Box: {item.shipmentBoxId}</p>
          <p className="text-sm text-[var(--color-gray-500)]">
            {new Date(item.orderedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      ),
    },
    {
      key: 'product',
      header: '주문 상품',
      render: (item: FulfillmentItem) => (
        <div>
          <p className="font-medium text-[var(--color-gray-900)] line-clamp-1">{item.productName}</p>
          <p className="text-sm text-[var(--color-gray-500)]">
            옵션: {item.optionName} / 수량: {item.quantity}개
          </p>
        </div>
      ),
    },
    {
      key: 'wholesale',
      header: '도매처 매칭',
      render: (item: FulfillmentItem) => (
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
      render: (item: FulfillmentItem) => (
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
      render: (item: FulfillmentItem) => {
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
      render: (item: FulfillmentItem) => (
        <div className="flex items-center gap-1">
          {item.status === 'PENDING' && (
            <Button variant="primary" size="sm">
              발주
            </Button>
          )}
          {item.status === 'ORDERED' && item.wholesale.orderNumber && (
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
      {/* 연결 상태 */}
      <div className="flex items-center justify-between mb-4">
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
          <Button onClick={handleRefresh} loading={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            조회
          </Button>
        </div>
      </Card>

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
              <p className="text-sm text-[var(--color-gray-500)]">발주 완료</p>
              <p className="text-2xl font-bold text-[var(--color-gray-900)]">{completedOrders.length}</p>
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
                {totalMargin.toLocaleString()}원
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
          발주 완료 ({completedOrders.length})
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
            <Button variant="secondary" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button
              variant="secondary"
              onClick={() => generatePurchaseOrder(pendingOrders)}
              loading={isGeneratingOrder}
            >
              <FileText size={16} className="mr-1" />
              전체 발주서
            </Button>
            <Button variant="secondary" onClick={downloadCSV}>
              <Download size={16} className="mr-1" />
              CSV 다운로드
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
            <Button
              variant="secondary"
              onClick={() => generatePurchaseOrder()}
              loading={isGeneratingOrder}
            >
              <FileText size={14} className="mr-1" />
              선택 발주서
            </Button>
            <Button onClick={handleBulkOrder} loading={isProcessing}>
              <Send size={14} className="mr-1" />
              일괄 발주 ({selectedOrders.length}건)
            </Button>
          </div>
        </div>
      )}

      {/* 발주 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--color-primary-500)]" />
          <span className="ml-2 text-[var(--color-gray-600)]">발주 목록을 불러오는 중...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          emptyMessage={activeTab === 'pending' ? '발주 대기 중인 주문이 없습니다.' : '완료된 발주가 없습니다.'}
        />
      )}

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

      {/* 도매처 미연동 안내 */}
      {pendingOrders.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Store size={20} className="text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">도매처 연동 안내</p>
              <p className="text-sm text-blue-700 mt-1">
                현재 도매처 정보가 연동되지 않았습니다. 마진율은 예상치(50%)로 계산됩니다.
                실제 도매처 연동 시 정확한 마진 계산이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 발주서 모달 */}
      {showPurchaseOrderModal && purchaseOrderData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--color-gray-200)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">발주서</h2>
                <p className="text-sm text-[var(--color-gray-500)]">{purchaseOrderData.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowPurchaseOrderModal(false)}
                className="text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* 발주서 헤더 */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">발 주 서</h1>
                <p className="text-[var(--color-gray-500)] mt-1">{purchaseOrderData.orderDate}</p>
              </div>

              {/* 발주 정보 */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-[var(--color-gray-50)] rounded-lg">
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">발주번호</p>
                  <p className="font-medium">{purchaseOrderData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">공급처</p>
                  <p className="font-medium">{purchaseOrderData.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">총 품목 수</p>
                  <p className="font-medium">{purchaseOrderData.summary.totalItems}건</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">총 수량</p>
                  <p className="font-medium">{purchaseOrderData.summary.totalQuantity}개</p>
                </div>
              </div>

              {/* 상품 목록 */}
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--color-gray-100)]">
                    <th className="border border-[var(--color-gray-300)] px-3 py-2 text-left">No</th>
                    <th className="border border-[var(--color-gray-300)] px-3 py-2 text-left">상품명</th>
                    <th className="border border-[var(--color-gray-300)] px-3 py-2 text-left">옵션</th>
                    <th className="border border-[var(--color-gray-300)] px-3 py-2 text-center">수량</th>
                    <th className="border border-[var(--color-gray-300)] px-3 py-2 text-right">단가</th>
                    <th className="border border-[var(--color-gray-300)] px-3 py-2 text-right">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrderData.items.map((item: any) => (
                    <tr key={item.no} className="hover:bg-[var(--color-gray-50)]">
                      <td className="border border-[var(--color-gray-300)] px-3 py-2">{item.no}</td>
                      <td className="border border-[var(--color-gray-300)] px-3 py-2 max-w-[200px] truncate">
                        {item.productName}
                      </td>
                      <td className="border border-[var(--color-gray-300)] px-3 py-2">{item.optionName}</td>
                      <td className="border border-[var(--color-gray-300)] px-3 py-2 text-center">{item.quantity}</td>
                      <td className="border border-[var(--color-gray-300)] px-3 py-2 text-right">
                        {item.unitPrice.toLocaleString()}원
                      </td>
                      <td className="border border-[var(--color-gray-300)] px-3 py-2 text-right font-medium">
                        {item.totalPrice.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--color-primary-50)] font-medium">
                    <td colSpan={3} className="border border-[var(--color-gray-300)] px-3 py-2 text-right">
                      합계
                    </td>
                    <td className="border border-[var(--color-gray-300)] px-3 py-2 text-center">
                      {purchaseOrderData.summary.totalQuantity}
                    </td>
                    <td className="border border-[var(--color-gray-300)] px-3 py-2"></td>
                    <td className="border border-[var(--color-gray-300)] px-3 py-2 text-right text-[var(--color-primary-600)]">
                      {purchaseOrderData.summary.totalAmount.toLocaleString()}원
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* 배송지 정보 */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">배송지 정보</h3>
                <div className="space-y-2 max-h-[200px] overflow-auto">
                  {purchaseOrderData.items.map((item: any) => (
                    <div
                      key={item.no}
                      className="p-3 bg-[var(--color-gray-50)] rounded-lg text-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.no}. {item.productName}</p>
                          <p className="text-[var(--color-gray-600)] mt-1">
                            {item.receiverName} / {item.receiverPhone}
                          </p>
                          <p className="text-[var(--color-gray-500)]">{item.address}</p>
                          {item.memo && (
                            <p className="text-[var(--color-gray-400)] text-xs mt-1">메모: {item.memo}</p>
                          )}
                        </div>
                        <span className="text-[var(--color-gray-500)]">{item.quantity}개</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-gray-200)] flex justify-between">
              <div className="flex gap-2">
                <Button variant="secondary" onClick={copyToClipboard}>
                  <Copy size={16} className="mr-1" />
                  복사
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer size={16} className="mr-1" />
                  인쇄
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowPurchaseOrderModal(false)}>
                  닫기
                </Button>
                <Button onClick={downloadCSV}>
                  <Download size={16} className="mr-1" />
                  CSV 다운로드
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
