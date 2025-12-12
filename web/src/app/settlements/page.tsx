'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, DataTable } from '@/components/ui';
import {
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  PieChart,
  BarChart3,
  Wallet,
  CreditCard,
  Package,
  Percent,
} from 'lucide-react';

interface SettlementItem {
  settleDate: string;
  orderId: number;
  productTitle: string;
  optionTitle: string;
  quantity: number;
  salePrice: number;
  couponDiscount: number;
  deliveryCharge: number;
  commission: number;
  settlementAmount: number;
}

interface SettlementSummary {
  totalSales: number;
  totalSettlement: number;
  totalCommission: number;
  totalDelivery: number;
  totalDiscount: number;
  totalOrders: number;
  totalQuantity: number;
  avgCommissionRate: number;
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);

  // 날짜 필터 (기본: 이번 달)
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1); // 이번 달 1일
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const isInitialMount = useRef(true);

  // 정산 데이터 조회
  const fetchSettlements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        settleDateFrom: dateFrom,
        settleDateTo: dateTo,
        maxPerPage: '100',
      });

      const response = await fetch(`/api/coupang/settlements?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settlements');
      }

      const items: SettlementItem[] = data.data || [];
      setSettlements(items);

      // 요약 계산
      if (items.length > 0) {
        const totalSales = items.reduce((sum, item) => sum + item.salePrice, 0);
        const totalSettlement = items.reduce((sum, item) => sum + item.settlementAmount, 0);
        const totalCommission = items.reduce((sum, item) => sum + item.commission, 0);
        const totalDelivery = items.reduce((sum, item) => sum + item.deliveryCharge, 0);
        const totalDiscount = items.reduce((sum, item) => sum + item.couponDiscount, 0);
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        setSummary({
          totalSales,
          totalSettlement,
          totalCommission,
          totalDelivery,
          totalDiscount,
          totalOrders: items.length,
          totalQuantity,
          avgCommissionRate: totalSales > 0 ? (totalCommission / totalSales) * 100 : 0,
        });
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error('Failed to fetch settlements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settlements');

      // Mock 데이터로 대체
      const mockData = getMockSettlements();
      setSettlements(mockData);
      calculateSummary(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock 요약 계산
  const calculateSummary = (items: SettlementItem[]) => {
    const totalSales = items.reduce((sum, item) => sum + item.salePrice, 0);
    const totalSettlement = items.reduce((sum, item) => sum + item.settlementAmount, 0);
    const totalCommission = items.reduce((sum, item) => sum + item.commission, 0);
    const totalDelivery = items.reduce((sum, item) => sum + item.deliveryCharge, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.couponDiscount, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    setSummary({
      totalSales,
      totalSettlement,
      totalCommission,
      totalDelivery,
      totalDiscount,
      totalOrders: items.length,
      totalQuantity,
      avgCommissionRate: totalSales > 0 ? (totalCommission / totalSales) * 100 : 0,
    });
  };

  // 초기 로드
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchSettlements();
    }
  }, []);

  // 빠른 날짜 선택
  const setQuickDate = (type: 'thisMonth' | 'lastMonth' | 'last3Months') => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (type) {
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  // CSV 다운로드
  const downloadCSV = () => {
    if (settlements.length === 0) return;

    const header = '정산일,주문번호,상품명,옵션,수량,판매가,할인,배송비,수수료,정산금액';
    const rows = settlements.map(item =>
      [
        item.settleDate,
        item.orderId,
        `"${item.productTitle}"`,
        `"${item.optionTitle}"`,
        item.quantity,
        item.salePrice,
        item.couponDiscount,
        item.deliveryCharge,
        item.commission,
        item.settlementAmount,
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement-${dateFrom}-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'settleDate',
      header: '정산일',
      width: '100px',
      render: (item: SettlementItem) => (
        <span className="text-sm">{item.settleDate}</span>
      ),
    },
    {
      key: 'orderId',
      header: '주문번호',
      width: '120px',
      render: (item: SettlementItem) => (
        <span className="font-mono text-sm">{item.orderId}</span>
      ),
    },
    {
      key: 'product',
      header: '상품정보',
      render: (item: SettlementItem) => (
        <div>
          <p className="font-medium text-[var(--color-gray-900)] line-clamp-1">
            {item.productTitle}
          </p>
          <p className="text-xs text-[var(--color-gray-500)]">{item.optionTitle}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: '수량',
      width: '70px',
      render: (item: SettlementItem) => (
        <span className="text-center">{item.quantity}</span>
      ),
    },
    {
      key: 'salePrice',
      header: '판매가',
      width: '100px',
      render: (item: SettlementItem) => (
        <span className="text-right">{item.salePrice.toLocaleString()}원</span>
      ),
    },
    {
      key: 'commission',
      header: '수수료',
      width: '100px',
      render: (item: SettlementItem) => (
        <span className="text-right text-[var(--color-gray-600)]">-{item.commission.toLocaleString()}원</span>
      ),
    },
    {
      key: 'settlementAmount',
      header: '정산금액',
      width: '110px',
      render: (item: SettlementItem) => (
        <span className="text-right font-medium text-[var(--color-primary-600)]">
          {item.settlementAmount.toLocaleString()}원
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="정산 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '정산 관리' },
      ]}
    >
      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          {error} (Mock 데이터로 표시 중)
        </div>
      )}

      {/* 날짜 필터 */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[var(--color-gray-500)]" />
            <span className="text-sm text-[var(--color-gray-600)]">정산기간</span>
          </div>
          <div className="flex items-center gap-2">
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
          <div className="flex gap-2">
            <button
              onClick={() => setQuickDate('thisMonth')}
              className="px-3 py-1.5 text-sm bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors"
            >
              이번 달
            </button>
            <button
              onClick={() => setQuickDate('lastMonth')}
              className="px-3 py-1.5 text-sm bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors"
            >
              지난 달
            </button>
            <button
              onClick={() => setQuickDate('last3Months')}
              className="px-3 py-1.5 text-sm bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)] rounded-lg transition-colors"
            >
              최근 3개월
            </button>
          </div>
          <Button onClick={fetchSettlements} loading={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            조회
          </Button>
        </div>
      </Card>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-gray-100)] rounded-lg">
                <DollarSign size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 판매금액</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {summary.totalSales.toLocaleString()}원
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Wallet size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">정산금액</p>
                <p className="text-xl font-bold text-emerald-600">
                  {summary.totalSettlement.toLocaleString()}원
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-gray-100)] rounded-lg">
                <CreditCard size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 수수료</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  -{summary.totalCommission.toLocaleString()}원
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-gray-100)] rounded-lg">
                <Percent size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">평균 수수료율</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {summary.avgCommissionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 추가 통계 */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 주문건수</p>
                <p className="text-2xl font-bold">{summary.totalOrders}건</p>
              </div>
              <Package size={24} className="text-[var(--color-gray-400)]" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 판매수량</p>
                <p className="text-2xl font-bold">{summary.totalQuantity}개</p>
              </div>
              <BarChart3 size={24} className="text-[var(--color-gray-400)]" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">건당 평균 정산</p>
                <p className="text-2xl font-bold">
                  {summary.totalOrders > 0
                    ? Math.round(summary.totalSettlement / summary.totalOrders).toLocaleString()
                    : 0}원
                </p>
              </div>
              <PieChart size={24} className="text-[var(--color-gray-400)]" />
            </div>
          </Card>
        </div>
      )}

      {/* 정산 내역 테이블 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-200)]">
          <h3 className="font-medium">정산 내역</h3>
          <Button variant="secondary" size="sm" onClick={downloadCSV} disabled={settlements.length === 0}>
            <Download size={16} className="mr-1" />
            CSV 다운로드
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary-500)]" />
          <span className="ml-2 text-[var(--color-gray-600)]">정산 데이터를 불러오는 중...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={settlements}
          emptyMessage="정산 내역이 없습니다."
        />
      )}
    </DashboardLayout>
  );
}

// Mock 데이터
function getMockSettlements(): SettlementItem[] {
  const now = new Date();
  const mockProducts = [
    { title: '유기농 사과 3kg', option: '부사 / 대과', price: 35000 },
    { title: '제주 감귤 5kg', option: '소과', price: 28000 },
    { title: '한우 등심 1kg', option: '1++ 등급', price: 89000 },
    { title: '국내산 삼겹살 500g', option: '냉장', price: 25000 },
    { title: '자연산 광어회 500g', option: '500g', price: 55000 },
  ];

  return Array.from({ length: 20 }, (_, i) => {
    const product = mockProducts[i % mockProducts.length];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const salePrice = product.price * quantity;
    const commission = Math.round(salePrice * 0.1); // 10% 수수료
    const couponDiscount = Math.random() > 0.7 ? Math.round(salePrice * 0.05) : 0;
    const deliveryCharge = salePrice >= 50000 ? 0 : 3000;

    return {
      settleDate: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      orderId: 1001234560 + i,
      productTitle: product.title,
      optionTitle: product.option,
      quantity,
      salePrice,
      couponDiscount,
      deliveryCharge,
      commission,
      settlementAmount: salePrice - commission - couponDiscount + deliveryCharge,
    };
  });
}
