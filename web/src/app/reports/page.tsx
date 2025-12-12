'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useSystemMode } from '@/contexts/SystemModeContext';
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
  Boxes,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  Warehouse,
} from 'lucide-react';

// 위탁판매 리포트 타입
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

interface SalesReportSummary {
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

// 재고관리 리포트 타입
interface InventoryDailyStats {
  date: string;
  stockIn: number;
  stockOut: number;
  stockInValue: number;
  stockOutValue: number;
}

interface InventoryProductStats {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  stockInCount: number;
  stockOutCount: number;
  turnoverRate: number;
}

interface WarehouseStats {
  warehouseId: string;
  warehouseName: string;
  totalItems: number;
  totalValue: number;
  utilizationRate: number;
}

interface InventoryReportSummary {
  period: string;
  totalStockIn: number;
  totalStockOut: number;
  totalStockInValue: number;
  totalStockOutValue: number;
  currentTotalStock: number;
  currentStockValue: number;
  lowStockItems: number;
  avgTurnoverRate: number;
  stockInGrowth: number;
  stockOutGrowth: number;
  topMovingProducts: InventoryProductStats[];
  lowStockProducts: InventoryProductStats[];
  warehouseStats: WarehouseStats[];
  dailyStats: InventoryDailyStats[];
}

// 위탁판매 리포트 컴포넌트
function SalesReport() {
  const [report, setReport] = useState<SalesReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  const isInitialMount = useRef(true);

  const generateReport = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockReport = generateSalesMockReport(reportType);
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
    a.download = `sales-report-${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const GrowthBadge = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-emerald-600 text-sm">
          <ArrowUp size={14} />
          +{value.toFixed(1)}%
        </span>
      );
    }
    if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-amber-600 text-sm">
          <ArrowDown size={14} />
          {value.toFixed(1)}%
        </span>
      );
    }
    return <span className="text-[var(--color-gray-500)] text-sm">0%</span>;
  };

  return (
    <>
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
                    ? 'bg-[var(--color-gray-900)] text-white'
                    : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
                }`}
              >
                주간 리포트
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-[var(--color-gray-900)] text-white'
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
                <p className="text-2xl font-bold text-emerald-600">
                  {report.totalSettlement.toLocaleString()}원
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
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

          {/* 일별 매출 차트 */}
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-[var(--color-gray-100)] text-[var(--color-gray-600)]">
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
    </>
  );
}

// 재고관리 리포트 컴포넌트
function InventoryReport() {
  const [report, setReport] = useState<InventoryReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  const isInitialMount = useRef(true);

  const generateReport = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockReport = generateInventoryMockReport(reportType);
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

  const downloadReport = () => {
    if (!report) return;

    const content = `
====================================
${reportType === 'weekly' ? '주간' : '월간'} 재고 리포트
기간: ${report.period}
생성일: ${new Date().toLocaleDateString('ko-KR')}
====================================

[요약]
총 입고: ${report.totalStockIn}건 (${report.totalStockInValue.toLocaleString()}원)
총 출고: ${report.totalStockOut}건 (${report.totalStockOutValue.toLocaleString()}원)
현재 총 재고: ${report.currentTotalStock}개 (${report.currentStockValue.toLocaleString()}원)
재고 부족 상품: ${report.lowStockItems}개
평균 회전율: ${report.avgTurnoverRate.toFixed(1)}회

[창고별 현황]
${report.warehouseStats.map((w) => `${w.warehouseName}: ${w.totalItems}개 품목, ${w.totalValue.toLocaleString()}원, 가동률 ${w.utilizationRate}%`).join('\n')}

[입출고 상위 상품]
${report.topMovingProducts.map((p, i) => `${i + 1}. ${p.productName} - 입고 ${p.stockInCount}개, 출고 ${p.stockOutCount}개`).join('\n')}

[재고 부족 상품]
${report.lowStockProducts.map((p) => `- ${p.productName}: 현재 ${p.currentStock}개 (최소 ${p.minStock}개)`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const GrowthBadge = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-emerald-600 text-sm">
          <ArrowUp size={14} />
          +{value.toFixed(1)}%
        </span>
      );
    }
    if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-amber-600 text-sm">
          <ArrowDown size={14} />
          {value.toFixed(1)}%
        </span>
      );
    }
    return <span className="text-[var(--color-gray-500)] text-sm">0%</span>;
  };

  return (
    <>
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
                    ? 'bg-[var(--color-gray-900)] text-white'
                    : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
                }`}
              >
                주간 리포트
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-[var(--color-gray-900)] text-white'
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
          <RefreshCw size={24} className="animate-spin text-[var(--color-gray-500)]" />
          <span className="ml-2 text-[var(--color-gray-600)]">리포트를 생성하는 중...</span>
        </div>
      ) : report ? (
        <>
          {/* 리포트 헤더 */}
          <div className="mb-6 p-4 bg-[var(--color-gray-50)] rounded-lg border border-[var(--color-gray-200)]">
            <div className="flex items-center gap-2 mb-2">
              <Boxes size={20} className="text-[var(--color-gray-600)]" />
              <h2 className="text-lg font-semibold text-[var(--color-gray-800)]">
                {reportType === 'weekly' ? '주간' : '월간'} 재고 리포트
              </h2>
            </div>
            <p className="text-sm text-[var(--color-gray-600)]">
              기간: {report.period}
            </p>
          </div>

          {/* 핵심 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">총 입고</p>
                  <p className="text-2xl font-bold text-[var(--color-gray-900)]">
                    {report.totalStockIn}건
                  </p>
                </div>
                <GrowthBadge value={report.stockInGrowth} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <PackagePlus size={16} className="text-[var(--color-gray-400)]" />
                <span className="text-xs text-[var(--color-gray-500)]">
                  {report.totalStockInValue.toLocaleString()}원
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">총 출고</p>
                  <p className="text-2xl font-bold text-[var(--color-gray-900)]">
                    {report.totalStockOut}건
                  </p>
                </div>
                <GrowthBadge value={report.stockOutGrowth} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <PackageMinus size={16} className="text-[var(--color-gray-400)]" />
                <span className="text-xs text-[var(--color-gray-500)]">
                  {report.totalStockOutValue.toLocaleString()}원
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">현재 재고 가치</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {(report.currentStockValue / 10000000).toFixed(1)}천만원
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Boxes size={16} className="text-emerald-400" />
                <span className="text-xs text-[var(--color-gray-500)]">
                  {report.currentTotalStock.toLocaleString()}개
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">재고 부족</p>
                <p className={`text-2xl font-bold ${report.lowStockItems > 0 ? 'text-amber-600' : 'text-[var(--color-gray-900)]'}`}>
                  {report.lowStockItems}개 품목
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <AlertTriangle size={16} className={report.lowStockItems > 0 ? 'text-amber-400' : 'text-[var(--color-gray-400)]'} />
                <span className="text-xs text-[var(--color-gray-500)]">발주 필요</span>
              </div>
            </Card>
          </div>

          {/* 일별 입출고 현황 */}
          <Card className="mb-6 p-4">
            <h3 className="font-medium mb-4">일별 입출고 현황</h3>
            <div className="space-y-3">
              {report.dailyStats.map((day) => {
                const maxValue = Math.max(...report.dailyStats.map((d) => Math.max(d.stockIn, d.stockOut)));
                const stockInPercent = maxValue > 0 ? (day.stockIn / maxValue) * 100 : 0;
                const stockOutPercent = maxValue > 0 ? (day.stockOut / maxValue) * 100 : 0;

                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="w-24 text-sm text-[var(--color-gray-600)]">{day.date}</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-4 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-gray-400)] rounded-full transition-all"
                              style={{ width: `${stockInPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-gray-600)] w-16">입고 {day.stockIn}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-4 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-gray-300)] rounded-full transition-all"
                              style={{ width: `${stockOutPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-gray-600)] w-16">출고 {day.stockOut}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 창고별 현황 */}
            <Card className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Warehouse size={18} className="text-[var(--color-gray-500)]" />
                창고별 현황
              </h3>
              <div className="space-y-3">
                {report.warehouseStats.map((warehouse) => (
                  <div
                    key={warehouse.warehouseId}
                    className="p-3 bg-[var(--color-gray-50)] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--color-gray-900)]">{warehouse.warehouseName}</span>
                      <span className="text-sm text-[var(--color-gray-500)]">{warehouse.totalItems}개 품목</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--color-gray-600)]">재고 가치</span>
                      <span className="text-sm font-medium">{warehouse.totalValue.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            warehouse.utilizationRate > 80 ? 'bg-amber-500' : 'bg-[var(--color-gray-400)]'
                          }`}
                          style={{ width: `${warehouse.utilizationRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--color-gray-500)]">{warehouse.utilizationRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 재고 부족 상품 */}
            <Card className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                재고 부족 상품
              </h3>
              {report.lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {report.lowStockProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                    >
                      <div>
                        <p className="font-medium text-[var(--color-gray-900)]">{product.productName}</p>
                        <p className="text-sm text-amber-600">
                          현재 {product.currentStock}개 / 최소 {product.minStock}개
                        </p>
                      </div>
                      <Button size="sm" variant="secondary">
                        발주
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-gray-500)]">
                  재고 부족 상품이 없습니다.
                </div>
              )}
            </Card>
          </div>

          {/* 입출고 상위 상품 */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">입출고 상위 상품</h3>
            <div className="space-y-3">
              {report.topMovingProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-4 p-3 bg-[var(--color-gray-50)] rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-[var(--color-gray-100)] text-[var(--color-gray-600)]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-gray-900)]">{product.productName}</p>
                    <p className="text-sm text-[var(--color-gray-500)]">
                      현재 재고: {product.currentStock}개 · 회전율: {product.turnoverRate.toFixed(1)}회
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-bold text-[var(--color-gray-700)]">{product.stockInCount}</p>
                        <p className="text-xs text-[var(--color-gray-500)]">입고</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-[var(--color-gray-700)]">{product.stockOutCount}</p>
                        <p className="text-xs text-[var(--color-gray-500)]">출고</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </>
  );
}

// 메인 페이지 컴포넌트
export default function ReportsPage() {
  const { settings, getModeLabel } = useSystemMode();

  const getReportTitle = () => {
    switch (settings.mode) {
      case 'dropshipping':
        return '판매 통계 리포트';
      case 'inventory':
        return '재고 통계 리포트';
      case 'hybrid':
        return '통합 통계 리포트';
      default:
        return '통계 리포트';
    }
  };

  return (
    <DashboardLayout
      title={getReportTitle()}
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '통계 리포트' },
      ]}
    >
      {settings.mode === 'inventory' ? (
        <InventoryReport />
      ) : (
        <SalesReport />
      )}
    </DashboardLayout>
  );
}

// Mock 리포트 생성 함수들
function generateSalesMockReport(type: 'weekly' | 'monthly'): SalesReportSummary {
  const now = new Date();
  const days = type === 'weekly' ? 7 : 30;

  const endDate = now.toLocaleDateString('ko-KR');
  const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR');
  const period = `${startDate} ~ ${endDate}`;

  const dailyStats: DailyStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

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

  const totalOrders = dailyStats.reduce((sum, d) => sum + d.orders, 0);
  const totalSales = dailyStats.reduce((sum, d) => sum + d.sales, 0);
  const totalSettlement = dailyStats.reduce((sum, d) => sum + d.settlement, 0);
  const totalReturns = dailyStats.reduce((sum, d) => sum + d.returns, 0);

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
    orderGrowth: (Math.random() - 0.3) * 30,
    salesGrowth: (Math.random() - 0.3) * 35,
    topProducts,
    dailyStats: type === 'weekly' ? dailyStats : dailyStats.filter((_, i) => i % 3 === 0),
  };
}

function generateInventoryMockReport(type: 'weekly' | 'monthly'): InventoryReportSummary {
  const now = new Date();
  const days = type === 'weekly' ? 7 : 30;

  const endDate = now.toLocaleDateString('ko-KR');
  const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR');
  const period = `${startDate} ~ ${endDate}`;

  const dailyStats: InventoryDailyStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const stockIn = 50 + Math.floor(Math.random() * 100);
    const stockOut = 40 + Math.floor(Math.random() * 80);

    dailyStats.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      stockIn,
      stockOut,
      stockInValue: stockIn * 25000,
      stockOutValue: stockOut * 30000,
    });
  }

  const totalStockIn = dailyStats.reduce((sum, d) => sum + d.stockIn, 0);
  const totalStockOut = dailyStats.reduce((sum, d) => sum + d.stockOut, 0);
  const totalStockInValue = dailyStats.reduce((sum, d) => sum + d.stockInValue, 0);
  const totalStockOutValue = dailyStats.reduce((sum, d) => sum + d.stockOutValue, 0);

  const topMovingProducts: InventoryProductStats[] = [
    { productId: 'P001', productName: '무선 블루투스 이어폰', currentStock: 245, minStock: 50, stockInCount: 180, stockOutCount: 165, turnoverRate: 2.8 },
    { productId: 'P002', productName: '스마트 공기청정기', currentStock: 89, minStock: 30, stockInCount: 120, stockOutCount: 105, turnoverRate: 2.2 },
    { productId: 'P003', productName: '프리미엄 샴푸 세트', currentStock: 312, minStock: 100, stockInCount: 200, stockOutCount: 180, turnoverRate: 1.9 },
    { productId: 'P004', productName: '유기농 견과류 선물세트', currentStock: 156, minStock: 80, stockInCount: 90, stockOutCount: 85, turnoverRate: 1.5 },
    { productId: 'P005', productName: '캠핑용 폴딩 테이블', currentStock: 67, minStock: 40, stockInCount: 75, stockOutCount: 68, turnoverRate: 1.8 },
  ];

  const lowStockProducts: InventoryProductStats[] = [
    { productId: 'P006', productName: 'LED 스탠드 조명', currentStock: 12, minStock: 30, stockInCount: 20, stockOutCount: 35, turnoverRate: 3.2 },
    { productId: 'P007', productName: '휴대용 선풍기', currentStock: 8, minStock: 25, stockInCount: 15, stockOutCount: 42, turnoverRate: 4.1 },
    { productId: 'P008', productName: '보조배터리 20000mAh', currentStock: 5, minStock: 50, stockInCount: 30, stockOutCount: 55, turnoverRate: 3.8 },
  ];

  const warehouseStats: WarehouseStats[] = [
    { warehouseId: 'W001', warehouseName: '서울 물류센터', totalItems: 1250, totalValue: 125000000, utilizationRate: 78 },
    { warehouseId: 'W002', warehouseName: '부산 물류센터', totalItems: 890, totalValue: 89000000, utilizationRate: 62 },
    { warehouseId: 'W003', warehouseName: '대전 물류센터', totalItems: 450, totalValue: 45000000, utilizationRate: 45 },
  ];

  return {
    period,
    totalStockIn,
    totalStockOut,
    totalStockInValue,
    totalStockOutValue,
    currentTotalStock: 2590,
    currentStockValue: 259000000,
    lowStockItems: lowStockProducts.length,
    avgTurnoverRate: 2.3,
    stockInGrowth: (Math.random() - 0.3) * 25,
    stockOutGrowth: (Math.random() - 0.3) * 30,
    topMovingProducts,
    lowStockProducts,
    warehouseStats,
    dailyStats: type === 'weekly' ? dailyStats : dailyStats.filter((_, i) => i % 3 === 0),
  };
}
