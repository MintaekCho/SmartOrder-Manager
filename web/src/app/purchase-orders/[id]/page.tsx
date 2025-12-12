'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Building2,
  Calendar,
  FileText,
  Clock,
  RefreshCw,
  AlertCircle,
  Printer,
  Download,
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

interface PurchaseOrderItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalPrice: number;
  note: string | null;
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
  updatedAt: string;
}

interface ApiState {
  loading: boolean;
  error: string | null;
  data: PurchaseOrder | null;
}

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [state, setState] = useState<ApiState>({
    loading: true,
    error: null,
    data: null,
  });
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`);
      const data = await response.json();

      if (!data.success) {
        setState({ loading: false, error: data.error, data: null });
        return;
      }

      setState({ loading: false, error: null, data: data.data });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : '발주 조회 실패',
        data: null,
      });
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 상태 변경
  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`상태를 "${statusConfig[newStatus]?.label}"(으)로 변경하시겠습니까?`)) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        fetchOrder();
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch {
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!confirm('이 발주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        router.push('/purchase-orders');
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 입고 처리
  const handleReceive = async (item: PurchaseOrderItem) => {
    const qty = prompt(`입고 수량을 입력하세요 (발주: ${item.orderedQty}, 기입고: ${item.receivedQty})`,
      String(item.orderedQty - item.receivedQty));

    if (!qty) return;
    const receivedQty = parseInt(qty);
    if (isNaN(receivedQty) || receivedQty < 0) {
      alert('유효한 수량을 입력하세요.');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/purchase-orders/${orderId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          receivedQty,
        }),
      });
      const data = await response.json();

      if (data.success) {
        fetchOrder();
      } else {
        alert(data.error || '입고 처리에 실패했습니다.');
      }
    } catch {
      alert('입고 처리 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const order = state.data;
  const config = order ? statusConfig[order.status] || statusConfig.DRAFT : null;

  // 로딩
  if (state.loading) {
    return (
      <DashboardLayout
        title="발주 상세"
        breadcrumb={[
          { name: '홈', href: '/' },
          { name: '발주 관리', href: '/purchase-orders' },
          { name: '상세' },
        ]}
      >
        <Card>
          <div className="text-center py-12">
            <RefreshCw className="mx-auto text-gray-400 mb-4 animate-spin" size={48} />
            <h3 className="text-xl font-semibold text-gray-700">불러오는 중...</h3>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  // 에러
  if (state.error || !order) {
    return (
      <DashboardLayout
        title="발주 상세"
        breadcrumb={[
          { name: '홈', href: '/' },
          { name: '발주 관리', href: '/purchase-orders' },
          { name: '상세' },
        ]}
      >
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-700">오류 발생</p>
              <p className="text-sm text-amber-600 mt-1">
                {state.error || '발주를 찾을 수 없습니다.'}
              </p>
            </div>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`발주 ${order.orderNumber}`}
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '발주 관리', href: '/purchase-orders' },
        { name: order.orderNumber },
      ]}
    >
      {/* 헤더 */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/purchase-orders">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h2>
                {config && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                생성: {formatDateTime(order.createdAt)} | 수정: {formatDateTime(order.updatedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.status === 'DRAFT' && (
              <>
                <Link href={`/purchase-orders/${order.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <Edit size={16} />
                    수정
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange('SUBMITTED')}>
                  <CheckCircle size={16} />
                  제출
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 size={16} />
                  삭제
                </Button>
              </>
            )}
            {order.status === 'SUBMITTED' && (
              <>
                <Button variant="secondary" size="sm" onClick={() => handleStatusChange('CONFIRMED')}>
                  <CheckCircle size={16} />
                  확인
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleStatusChange('CANCELLED')}>
                  <XCircle size={16} />
                  취소
                </Button>
              </>
            )}
            {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') && (
              <Button variant="danger" size="sm" onClick={() => handleStatusChange('CANCELLED')}>
                <XCircle size={16} />
                취소
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 공급처 정보 */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <Building2 size={16} />
            공급처 정보
          </h3>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">{order.supplierName}</p>
            {order.supplierContact && (
              <p className="text-sm text-gray-600">{order.supplierContact}</p>
            )}
          </div>
        </Card>

        {/* 발주 정보 */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <Calendar size={16} />
            발주 정보
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">발주일</span>
              <span className="text-sm font-medium">{formatDate(order.orderDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">입고예정일</span>
              <span className="text-sm font-medium">
                {order.expectedDate ? formatDate(order.expectedDate) : '-'}
              </span>
            </div>
          </div>
        </Card>

        {/* 금액 정보 */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <FileText size={16} />
            금액 정보
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">소계</span>
              <span className="text-sm">{order.subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">부가세</span>
              <span className="text-sm">{order.tax.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">배송비</span>
              <span className="text-sm">{order.shippingCost.toLocaleString()}원</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">총액</span>
              <span className="font-bold text-[var(--color-primary-600)]">
                {order.totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 비고 */}
      {order.note && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">비고</h3>
          <p className="text-gray-700">{order.note}</p>
        </Card>
      )}

      {/* 품목 목록 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package size={20} />
            발주 품목 ({order.items.length}개)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">품명</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">단위</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">발주수량</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">입고수량</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">단가</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">금액</th>
                {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') && (
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">입고</th>
                )}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const isFullyReceived = item.receivedQty >= item.orderedQty;
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{item.sku}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      {item.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">{item.unit}</td>
                    <td className="py-3 px-4 text-center font-medium">{item.orderedQty}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${
                        isFullyReceived ? 'text-emerald-600' :
                        item.receivedQty > 0 ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {item.receivedQty}
                      </span>
                      <span className="text-gray-400"> / {item.orderedQty}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {item.unitPrice.toLocaleString()}원
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {item.totalPrice.toLocaleString()}원
                    </td>
                    {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') && (
                      <td className="py-3 px-4 text-center">
                        {!isFullyReceived ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReceive(item)}
                            disabled={updating}
                          >
                            <Truck size={14} />
                            입고
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                            <CheckCircle size={14} />
                            완료
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED' ? 6 : 5} className="py-3 px-4 text-right font-semibold">
                  품목 소계
                </td>
                <td className="py-3 px-4 text-right font-bold text-lg">
                  {order.subtotal.toLocaleString()}원
                </td>
                {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') && (
                  <td></td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
