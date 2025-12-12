'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, Select } from '@/components/ui';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Building2,
  Calendar,
  Package,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  AlertCircle,
} from 'lucide-react';

// 발주 상태 정의
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  SUBMITTED: { label: '제출됨', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  CONFIRMED: { label: '확인됨', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  PARTIALLY_RECEIVED: { label: '부분입고', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  RECEIVED: { label: '입고완료', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  CANCELLED: { label: '취소됨', color: 'text-gray-500', bgColor: 'bg-gray-100' },
};

// 상태별 아이콘
const statusIcons: Record<string, React.ReactNode> = {
  DRAFT: <FileText size={14} />,
  SUBMITTED: <Clock size={14} />,
  CONFIRMED: <CheckCircle size={14} />,
  PARTIALLY_RECEIVED: <Truck size={14} />,
  RECEIVED: <CheckCircle size={14} />,
  CANCELLED: <XCircle size={14} />,
};

interface PurchaseOrderItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  supplierContact: string | null;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  note: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
}

interface ApiState {
  loading: boolean;
  error: string | null;
  data: PurchaseOrder[];
}

// 필터 옵션
const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'DRAFT', label: '작성중' },
  { value: 'SUBMITTED', label: '제출됨' },
  { value: 'CONFIRMED', label: '확인됨' },
  { value: 'PARTIALLY_RECEIVED', label: '부분입고' },
  { value: 'RECEIVED', label: '입고완료' },
  { value: 'CANCELLED', label: '취소됨' },
];

export default function PurchaseOrdersPage() {
  const [state, setState] = useState<ApiState>({
    loading: false,
    error: null,
    data: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchOrders = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`/api/purchase-orders?${params}`);
      const data = await response.json();

      if (!data.success) {
        setState({ loading: false, error: data.error, data: [] });
        return;
      }

      setState({ loading: false, error: null, data: data.data });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : '발주 목록 조회 실패',
        data: [],
      });
    }
  }, [searchQuery, statusFilter, dateFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 상태별 통계
  const stats = {
    total: state.data.length,
    draft: state.data.filter(o => o.status === 'DRAFT').length,
    pending: state.data.filter(o => ['SUBMITTED', 'CONFIRMED'].includes(o.status)).length,
    inProgress: state.data.filter(o => o.status === 'PARTIALLY_RECEIVED').length,
    completed: state.data.filter(o => o.status === 'RECEIVED').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 발주를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchOrders();
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <DashboardLayout
      title="발주 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '발주 관리' },
      ]}
    >
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">전체</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">작성중</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-amber-600 mb-1">대기중</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-blue-600 mb-1">진행중</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-emerald-600 mb-1">완료</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 relative min-w-[200px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="발주번호, 공급처 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
          <Button onClick={fetchOrders} variant="secondary" disabled={state.loading}>
            {state.loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            새로고침
          </Button>
          <Link href="/purchase-orders/new">
            <Button>
              <Plus size={16} />
              새 발주
            </Button>
          </Link>
        </div>
      </Card>

      {/* 에러 메시지 */}
      {state.error && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-700">오류 발생</p>
              <p className="text-sm text-amber-600 mt-1">{state.error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 로딩 */}
      {state.loading && (
        <Card>
          <div className="text-center py-12">
            <RefreshCw className="mx-auto text-gray-400 mb-4 animate-spin" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              발주 목록을 불러오는 중...
            </h3>
          </div>
        </Card>
      )}

      {/* 발주 목록 테이블 */}
      {!state.loading && (
        <Card>
          {state.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">발주번호</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">공급처</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">상태</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">발주일</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">입고예정일</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">품목수</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">총액</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.DRAFT;
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            href={`/purchase-orders/${order.id}`}
                            className="font-medium text-[var(--color-primary-600)] hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            <span className="text-gray-900">{order.supplierName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            {statusIcons[order.status]}
                            {config.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {formatDate(order.orderDate)}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {order.expectedDate ? formatDate(order.expectedDate) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <Package size={14} />
                            {order.items.length}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-gray-900">
                            {order.totalAmount.toLocaleString()}원
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/purchase-orders/${order.id}`}>
                              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="상세보기">
                                <Eye size={16} className="text-gray-500" />
                              </button>
                            </Link>
                            {order.status === 'DRAFT' && (
                              <>
                                <Link href={`/purchase-orders/${order.id}/edit`}>
                                  <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="수정">
                                    <Edit size={16} className="text-gray-500" />
                                  </button>
                                </Link>
                                <button
                                  onClick={() => handleDelete(order.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                등록된 발주가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                새 발주를 등록하여 재고 입고를 관리하세요.
              </p>
              <Link href="/purchase-orders/new">
                <Button>
                  <Plus size={16} />
                  새 발주 등록
                </Button>
              </Link>
            </div>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}
