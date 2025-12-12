'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, DataTable } from '@/components/ui';
import {
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Package,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Ban,
  Wifi,
  WifiOff,
  FileText,
  Download,
} from 'lucide-react';

// 취소/반품 상태 매핑
const statusConfig: Record<string, { label: string; variant: 'pending' | 'processing' | 'completed' | 'error'; icon: React.ReactNode }> = {
  REQUEST: { label: '요청', variant: 'pending', icon: <Clock size={14} /> },
  RELEASE: { label: '출고중지', variant: 'processing', icon: <Ban size={14} /> },
  COLLECT_DONE: { label: '수거완료', variant: 'processing', icon: <Package size={14} /> },
  APPROVED: { label: '승인완료', variant: 'completed', icon: <CheckCircle size={14} /> },
  REJECTED: { label: '거부', variant: 'error', icon: <XCircle size={14} /> },
};

// 취소 유형 매핑
const cancelTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CANCEL: { label: '주문취소', icon: <XCircle size={14} />, color: 'text-[var(--color-gray-600)] bg-[var(--color-gray-50)]' },
  RETURN: { label: '반품', icon: <RotateCcw size={14} />, color: 'text-amber-600 bg-amber-50' },
  EXCHANGE: { label: '교환', icon: <ArrowLeftRight size={14} />, color: 'text-[var(--color-gray-600)] bg-[var(--color-gray-50)]' },
};

// 취소 사유 매핑
const cancelReasonLabels: Record<string, string> = {
  '단순변심': '단순 변심',
  '고객변심': '고객 변심',
  '상품불량': '상품 불량/파손',
  '오배송': '오배송',
  '배송지연': '배송 지연',
  '기타': '기타 사유',
};

interface ReturnData {
  receiptId: number;
  orderId: number;
  shipmentBoxId?: number;
  cancelType: string;
  cancelReason: string;
  cancelReasonDetail: string;
  status: string;
  createdAt: string;
  productName?: string;
  optionName?: string;
  quantity?: number;
  orderPrice?: number;
  buyerName?: string;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDetail, setSelectedDetail] = useState<ReturnData | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 날짜 필터
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const isInitialMount = useRef(true);

  // 데이터 조회
  const fetchReturns = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        createdAtFrom: dateFrom,
        createdAtTo: dateTo,
      });

      if (selectedType !== 'ALL') {
        params.append('cancelType', selectedType);
      }

      const response = await fetch(`/api/coupang/returns?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch returns');
      }

      setReturns(data.data || []);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch returns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch returns');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchReturns();
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReturns();
    setIsRefreshing(false);
  };

  // 승인 처리
  const handleApprove = async (receiptId: number) => {
    setProcessingId(receiptId);
    try {
      const response = await fetch('/api/coupang/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId, action: 'approve' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve');
      }

      // 목록 새로고침
      await fetchReturns();
      setSelectedDetail(null);
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  // 필터링된 데이터
  const filteredReturns = returns.filter((item) => {
    if (selectedType === 'ALL') return true;
    return item.cancelType === selectedType;
  });

  // 유형별 카운트
  const typeCounts = returns.reduce((acc, item) => {
    acc[item.cancelType] = (acc[item.cancelType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 상태별 카운트
  const statusCounts = returns.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const columns = [
    {
      key: 'cancelType',
      header: '유형',
      width: '100px',
      render: (item: ReturnData) => {
        const config = cancelTypeConfig[item.cancelType] || { label: item.cancelType, color: 'text-gray-600 bg-gray-50' };
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'orderId',
      header: '주문번호',
      width: '140px',
      render: (item: ReturnData) => (
        <div>
          <span className="font-mono text-sm">{item.orderId}</span>
          <p className="text-xs text-[var(--color-gray-500)]">접수: {item.receiptId}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: '상품정보',
      render: (item: ReturnData) => (
        <div>
          <p className="font-medium text-[var(--color-gray-900)] line-clamp-1">
            {item.productName || '상품정보 없음'}
          </p>
          <p className="text-sm text-[var(--color-gray-500)]">
            {item.optionName && `옵션: ${item.optionName}`}
            {item.quantity && ` / ${item.quantity}개`}
          </p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: '사유',
      width: '150px',
      render: (item: ReturnData) => (
        <div>
          <p className="text-sm font-medium">{cancelReasonLabels[item.cancelReason] || item.cancelReason}</p>
          <p className="text-xs text-[var(--color-gray-500)] line-clamp-1">{item.cancelReasonDetail}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '금액',
      width: '100px',
      render: (item: ReturnData) => (
        <span className="font-medium text-[var(--color-gray-900)]">
          {item.orderPrice?.toLocaleString() || '-'}원
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (item: ReturnData) => {
        const config = statusConfig[item.status] || { label: item.status, variant: 'pending' as const };
        return (
          <Badge variant={config.variant} dot>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: '요청일',
      width: '120px',
      render: (item: ReturnData) => (
        <span className="text-sm text-[var(--color-gray-600)]">
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (item: ReturnData) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDetail(item)}>
            <Eye size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="반품/환불 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '주문/배송', href: '/orders' },
        { name: '반품/환불 관리' },
      ]}
    >
      {/* 연결 상태 */}
      <div className="flex items-center mb-4">
        {isConnected ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <Wifi size={16} />
            <span className="text-sm">쿠팡 API 연결됨</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--color-gray-500)]">
            <WifiOff size={16} />
            <span className="text-sm">Mock 데이터 사용 중</span>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
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

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* 전체 */}
        <div
          onClick={() => setSelectedType('ALL')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            selectedType === 'ALL'
              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
              : 'border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-300)]'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-[var(--color-gray-500)]" />
            <span className="text-sm text-[var(--color-gray-600)]">전체</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-gray-900)]">{returns.length}</div>
        </div>

        {/* 유형별 */}
        {Object.entries(cancelTypeConfig).map(([type, config]) => (
          <div
            key={type}
            onClick={() => setSelectedType(type)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedType === type
                ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                : 'border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-300)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={config.color.split(' ')[0]}>{config.icon}</span>
              <span className="text-sm text-[var(--color-gray-600)]">{config.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-gray-900)]">
              {typeCounts[type] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* 상태별 요약 */}
      <Card className="mb-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-[var(--color-gray-700)]">상태별:</span>
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <Badge variant={config.variant} dot>
                {config.label}
              </Badge>
              <span className="text-sm font-medium">{statusCounts[status] || 0}건</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary-500)]" />
          <span className="ml-2 text-[var(--color-gray-600)]">데이터를 불러오는 중...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredReturns}
          emptyMessage="반품/환불 요청이 없습니다."
        />
      )}

      {/* 상세 모달 */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--color-gray-200)] flex items-center justify-between">
              <h2 className="text-lg font-semibold">반품/환불 상세</h2>
              <button onClick={() => setSelectedDetail(null)} className="text-[var(--color-gray-500)]">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* 유형 및 상태 */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${cancelTypeConfig[selectedDetail.cancelType]?.color || 'bg-gray-50'}`}>
                  {cancelTypeConfig[selectedDetail.cancelType]?.icon}
                  {cancelTypeConfig[selectedDetail.cancelType]?.label || selectedDetail.cancelType}
                </span>
                <Badge variant={statusConfig[selectedDetail.status]?.variant || 'pending'} dot>
                  {statusConfig[selectedDetail.status]?.label || selectedDetail.status}
                </Badge>
              </div>

              {/* 주문 정보 */}
              <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
                <h3 className="font-medium mb-3">주문 정보</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--color-gray-500)]">주문번호</span>
                    <p className="font-medium">{selectedDetail.orderId}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">접수번호</span>
                    <p className="font-medium">{selectedDetail.receiptId}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">요청일시</span>
                    <p>{new Date(selectedDetail.createdAt).toLocaleString('ko-KR')}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">구매자</span>
                    <p>{selectedDetail.buyerName || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 상품 정보 */}
              <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
                <h3 className="font-medium mb-3">상품 정보</h3>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-[var(--color-gray-500)]">상품명</span>
                    <p className="font-medium">{selectedDetail.productName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gray-500)]">옵션</span>
                    <p>{selectedDetail.optionName || '-'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[var(--color-gray-500)]">수량</span>
                      <p>{selectedDetail.quantity || 1}개</p>
                    </div>
                    <div>
                      <span className="text-[var(--color-gray-500)]">금액</span>
                      <p className="font-medium">{selectedDetail.orderPrice?.toLocaleString() || '-'}원</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 사유 */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-medium mb-3 text-amber-800">취소/반품 사유</h3>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-amber-600">사유 유형</span>
                    <p className="font-medium text-amber-900">
                      {cancelReasonLabels[selectedDetail.cancelReason] || selectedDetail.cancelReason}
                    </p>
                  </div>
                  <div>
                    <span className="text-amber-600">상세 내용</span>
                    <p className="text-amber-900">{selectedDetail.cancelReasonDetail || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-gray-200)] flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedDetail(null)}>
                닫기
              </Button>
              {(selectedDetail.status === 'REQUEST' || selectedDetail.status === 'RELEASE') && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleApprove(selectedDetail.receiptId)}
                    loading={processingId === selectedDetail.receiptId}
                  >
                    <XCircle size={16} className="mr-1" />
                    거부
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedDetail.receiptId)}
                    loading={processingId === selectedDetail.receiptId}
                  >
                    <CheckCircle size={16} className="mr-1" />
                    승인
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
