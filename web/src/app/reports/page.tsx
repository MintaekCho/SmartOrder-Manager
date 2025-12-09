'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import {
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ShoppingCart,
  BarChart3,
  ArrowUp,
  ArrowDown,
  FileText,
} from 'lucide-react';

interface DailyStats {
  date: string;
  orders: number;
  sales: number;
  settlement: number;
  returns: number;
}

interface ProductStats {
  productId: string;
  productName: string;
  totalOrders: number;
  totalQuantity: number;
  totalSales: number;
  avgPrice: number;
}

interface ReportSummary {
  period: string;
  totalOrders: number;
  totalSales: number;
  totalSettlement: number;
  totalReturns: number;
  avgOrderValue: number;
  orderGrowth: number;
  salesGrowth: number;
  topProducts: ProductStats[];
  dailyStats: DailyStats[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  const isInitialMount = useRef(true);

  // 리포트 데이터 생성
  const generateReport = async () => {
    setIsLoading(true);

    // 실제로는 API에서 데이터를 조합해서 리포트 생성
    // 현재는 Mock 데이터 사용
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockReport = generateMockReport(reportType);
    setReport(mockReport);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      generateReport();
    }
  }, []);

  useEffect(() => {
    generateReport();
  }, [reportType]);

  // 리포트 다운로드
  const downloadReport = () => {
    if (!report) return;

    const content = `
====================================
${reportType === 'weekly' ? '주간' : '월간'} 판매 리포트
기간: ${report.period}
생성일: ${new Date().toLocaleDateString('ko-KR')}
====================================

[요약]
총 주문: ${report.totalOrders}건 (${report.orderGrowth >= 0 ? '+' : ''}${report.orderGrowth.toFixed(1)}%)
총 매출: ${report.totalSales.toLocaleString()}원 (${report.salesGrowth >= 0 ? '+' : ''}${report.salesGrowth.toFixed(1)}%)
총 정산: ${report.totalSettlement.toLocaleString()}원
반품/취소: ${report.totalReturns}건
평균 주문금액: ${report.avgOrderValue.toLocaleString()}원

[상위 판매 상품]
${report.topProducts.map((p, i) => `${i + 1}. ${p.productName} - ${p.totalQuantity}개 (${p.totalSales.toLocaleString()}원)`).join('\n')}

[일별 현황]
${report.dailyStats.map(d => `${d.date}: 주문 ${d.orders}건, 매출 ${d.sales.toLocaleString()}원`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // 성장률 표시
  const GrowthBadge = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-sm">
          <ArrowUp size={14} />
          +{value.toFixed(1)}%
        </span>
      );
    }
    if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 text-sm">
          <ArrowDown size={14} />
          {value.toFixed(1)}%
        </span>
      );
    }
    return <span className="text-[var(--color-gray-500)] text-sm">0%</span>;
  };

  return (
    <DashboardLayout
      title="통계 리포트"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '통계 리포트' },
      ]}
    >
      {/* 리포트 타입 선택 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-[var(--color-gray-500)]" />
            <div className="flex gap-2">
              <button
                onClick={() => setReportType('weekly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportType === 'weekly'
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
                }`}
              >
                주간 리포트
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
                }`}
              >
                월간 리포트
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={generateReport} loading={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              새로고침
            </Button>
            <Button onClick={downloadReport} disabled={!report}>
              <Download size={16} className="mr-1" />
              리포트 다운로드
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary-500)]" />
          <span className="ml-2 text-[var(--color-gray-600)]">리포트를 생성하는 중...</span>
        </div>
      ) : report ? (
        <>
          {/* 리포트 헤더 */}
          <div className="mb-6 p-4 bg-[var(--color-primary-50)] rounded-lg border border-[var(--color-primary-200)]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={20} className="text-[var(--color-primary-600)]" />
              <h2 className="text-lg font-semibold text-[var(--color-primary-800)]">
                {reportType === 'weekly' ? '주간' : '월간'} 판매 리포트
              </h2>
            </div>
            <p className="text-sm text-[var(--color-primary-600)]">
              기간: {report.period}
            </p>
          </div>

          {/* 핵심 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">총 주문</p>
                  <p className="text-2xl font-bold text-[var(--color-gray-900)]">
                    {report.totalOrders}건
                  </p>
                </div>
                <GrowthBadge value={report.orderGrowth} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ShoppingCart size={16} className="text-[var(--color-gray-400)]" />
                <span className="text-xs text-[var(--color-gray-500)]">전 기간 대비</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">총 매출</p>
                  <p className="text-2xl font-bold text-[var(--color-gray-900)]">
                    {report.totalSales.toLocaleString()}원
                  </p>
                </div>
                <GrowthBadge value={report.salesGrowth} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <DollarSign size={16} className="text-[var(--color-gray-400)]" />
                <span className="text-xs text-[var(--color-gray-500)]">전 기간 대비</span>
              </div>
            </Card>

            <Card className="p-4">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">정산 예정</p>
                <p className="text-2xl font-bold text-green-600">
                  {report.totalSettlement.toLocaleString()}원
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-xs text-[var(--color-gray-500)]">수수료 차감 후</span>
              </div>
            </Card>

            <Card className="p-4">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">평균 주문금액</p>
                <p className="text-2xl font-bold text-[var(--color-gray-900)]">
                  {report.avgOrderValue.toLocaleString()}원
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <BarChart3 size={16} className="text-[var(--color-gray-400)]" />
                <span className="text-xs text-[var(--color-gray-500)]">주문당 평균</span>
              </div>
            </Card>
          </div>

          {/* 일별 매출 차트 (텍스트 기반) */}
          <Card className="mb-6 p-4">
            <h3 className="font-medium mb-4">일별 매출 현황</h3>
            <div className="space-y-3">
              {report.dailyStats.map((day) => {
                const maxSales = Math.max(...report.dailyStats.map((d) => d.sales));
                const percentage = maxSales > 0 ? (day.sales / maxSales) * 100 : 0;

                return (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-[var(--color-gray-600)]">{day.date}</span>
                    <div className="flex-1 h-6 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary-500)] rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-32 text-right">
                      <span className="text-sm font-medium">{day.sales.toLocaleString()}원</span>
                      <span className="text-xs text-[var(--color-gray-500)] ml-2">
                        ({day.orders}건)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 상위 판매 상품 */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">상위 판매 상품</h3>
            <div className="space-y-3">
              {report.topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-4 p-3 bg-[var(--color-gray-50)] rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                        ? 'bg-gray-200 text-gray-700'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)]'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-gray-900)]">{product.productName}</p>
                    <p className="text-sm text-[var(--color-gray-500)]">
                      {product.totalQuantity}개 판매 · 평균 {product.avgPrice.toLocaleString()}원
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--color-primary-600)]">
                      {product.totalSales.toLocaleString()}원
                    </p>
                    <p className="text-xs text-[var(--color-gray-500)]">
                      {product.totalOrders}건
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </DashboardLayout>
  );
}

// Mock 리포트 생성
function generateMockReport(type: 'weekly' | 'monthly'): ReportSummary {
  const now = new Date();
  const days = type === 'weekly' ? 7 : 30;

  // 기간 문자열
  const endDate = now.toLocaleDateString('ko-KR');
  const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR');
  const period = `${startDate} ~ ${endDate}`;

  // 일별 통계
  const dailyStats: DailyStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 주말에는 주문이 더 많음
    const baseOrders = isWeekend ? 15 : 10;
    const orders = baseOrders + Math.floor(Math.random() * 10);
    const avgPrice = 35000 + Math.floor(Math.random() * 20000);
    const sales = orders * avgPrice;

    dailyStats.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      orders,
      sales,
      settlement: Math.round(sales * 0.9),
      returns: Math.floor(Math.random() * 2),
    });
  }

  // 총합 계산
  const totalOrders = dailyStats.reduce((sum, d) => sum + d.orders, 0);
  const totalSales = dailyStats.reduce((sum, d) => sum + d.sales, 0);
  const totalSettlement = dailyStats.reduce((sum, d) => sum + d.settlement, 0);
  const totalReturns = dailyStats.reduce((sum, d) => sum + d.returns, 0);

  // 상위 상품
  const topProducts: ProductStats[] = [
    {
      productId: 'P001',
      productName: '유기농 사과 3kg (부사)',
      totalOrders: Math.floor(totalOrders * 0.25),
      totalQuantity: Math.floor(totalOrders * 0.3),
      totalSales: Math.floor(totalSales * 0.28),
      avgPrice: 35000,
    },
    {
      productId: 'P002',
      productName: '제주 감귤 5kg',
      totalOrders: Math.floor(totalOrders * 0.2),
      totalQuantity: Math.floor(totalOrders * 0.25),
      totalSales: Math.floor(totalSales * 0.22),
      avgPrice: 28000,
    },
    {
      productId: 'P003',
      productName: '한우 등심 1kg (1++ 등급)',
      totalOrders: Math.floor(totalOrders * 0.15),
      totalQuantity: Math.floor(totalOrders * 0.12),
      totalSales: Math.floor(totalSales * 0.2),
      avgPrice: 89000,
    },
    {
      productId: 'P004',
      productName: '국내산 삼겹살 500g',
      totalOrders: Math.floor(totalOrders * 0.18),
      totalQuantity: Math.floor(totalOrders * 0.2),
      totalSales: Math.floor(totalSales * 0.15),
      avgPrice: 25000,
    },
    {
      productId: 'P005',
      productName: '자연산 광어회 500g',
      totalOrders: Math.floor(totalOrders * 0.12),
      totalQuantity: Math.floor(totalOrders * 0.1),
      totalSales: Math.floor(totalSales * 0.12),
      avgPrice: 55000,
    },
  ];

  return {
    period,
    totalOrders,
    totalSales,
    totalSettlement,
    totalReturns,
    avgOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
    orderGrowth: (Math.random() - 0.3) * 30, // -9% ~ +21%
    salesGrowth: (Math.random() - 0.3) * 35, // -10.5% ~ +24.5%
    topProducts,
    dailyStats: type === 'weekly' ? dailyStats : dailyStats.filter((_, i) => i % 3 === 0), // 월간은 3일마다
  };
}
