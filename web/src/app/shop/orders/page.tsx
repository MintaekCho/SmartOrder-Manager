'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  ShoppingCart,
  CreditCard,
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: string;
  trackingNumber?: string;
  trackingCompany?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: '결제대기', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  PAID: { label: '결제완료', color: 'bg-blue-100 text-blue-700', icon: <CreditCard size={14} /> },
  PREPARING: { label: '상품준비중', color: 'bg-purple-100 text-purple-700', icon: <Package size={14} /> },
  SHIPPED: { label: '배송중', color: 'bg-orange-100 text-orange-700', icon: <Truck size={14} /> },
  DELIVERED: { label: '배송완료', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
};

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // 주문 목록 조회
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/shop/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('주문 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // 상태 변경
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(orders.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ));
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.includes(searchQuery) ||
      (order.customerPhone && order.customerPhone.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'PAID').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
  };

  return (
    <DashboardLayout
      title="자사몰 주문 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '설정', href: '/settings' },
        { name: '자사몰 주문 관리' },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">전체 주문</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">결제완료</p>
              <p className="text-xl font-bold text-blue-600">{stats.paid}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">상품준비중</p>
              <p className="text-xl font-bold text-purple-600">{stats.preparing}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">배송중</p>
              <p className="text-xl font-bold text-orange-600">{stats.shipped}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="주문번호, 고객명, 연락처로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="PENDING">결제대기</option>
            <option value="PAID">결제완료</option>
            <option value="PREPARING">상품준비중</option>
            <option value="SHIPPED">배송중</option>
            <option value="DELIVERED">배송완료</option>
            <option value="CANCELLED">취소</option>
          </select>
          <Button variant="secondary" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">주문이 없습니다</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} padding={false}>
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {statusConfig[order.status]?.icon}
                    {statusConfig[order.status]?.label || order.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {order.status === 'PAID' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'PREPARING')}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                    >
                      상품준비 시작
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'SHIPPED')}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                    >
                      배송 시작
                    </button>
                  )}
                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      배송 완료
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 flex gap-6">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">주문 상품</p>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-900">
                        {item.name} x {item.quantity}개
                        <span className="text-gray-500 ml-2">
                          ({formatPrice(item.price * item.quantity)}원)
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="w-48">
                  <p className="text-sm text-gray-600 mb-2">고객 정보</p>
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                  {order.customerPhone && (
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  )}
                  {order.customerEmail && (
                    <p className="text-sm text-gray-600">{order.customerEmail}</p>
                  )}
                </div>
                <div className="w-64">
                  <p className="text-sm text-gray-600 mb-2">배송지</p>
                  <p className="text-sm text-gray-900">{order.shippingAddress || '-'}</p>
                  {order.trackingNumber && (
                    <p className="text-xs text-blue-600 mt-1">
                      {order.trackingCompany}: {order.trackingNumber}
                    </p>
                  )}
                </div>
                <div className="w-32 text-right">
                  <p className="text-sm text-gray-600 mb-2">결제금액</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(order.totalAmount)}원
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
