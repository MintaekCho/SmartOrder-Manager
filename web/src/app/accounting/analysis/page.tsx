'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface MonthlyData {
  month: string;
  sales: number;
  purchases: number;
  profit: number;
  profitRate: number;
}

interface CategoryProfit {
  category: string;
  sales: number;
  cost: number;
  profit: number;
  profitRate: number;
  color: string;
}

interface TopProduct {
  name: string;
  sales: number;
  profit: number;
  profitRate: number;
  trend: 'up' | 'down' | 'stable';
}

const mockMonthlyData: MonthlyData[] = [
  { month: '2024-07', sales: 45000000, purchases: 32000000, profit: 13000000, profitRate: 28.9 },
  { month: '2024-08', sales: 52000000, purchases: 36000000, profit: 16000000, profitRate: 30.8 },
  { month: '2024-09', sales: 48000000, purchases: 34000000, profit: 14000000, profitRate: 29.2 },
  { month: '2024-10', sales: 58000000, purchases: 40000000, profit: 18000000, profitRate: 31.0 },
  { month: '2024-11', sales: 62000000, purchases: 42000000, profit: 20000000, profitRate: 32.3 },
  { month: '2024-12', sales: 55000000, purchases: 38000000, profit: 17000000, profitRate: 30.9 },
];

const mockCategoryProfit: CategoryProfit[] = [
  { category: '전자제품', sales: 125000000, cost: 85000000, profit: 40000000, profitRate: 32.0, color: '#3B82F6' },
  { category: '생활용품', sales: 89000000, cost: 62000000, profit: 27000000, profitRate: 30.3, color: '#10B981' },
  { category: '식품', sales: 67000000, cost: 52000000, profit: 15000000, profitRate: 22.4, color: '#F59E0B' },
  { category: '의류', sales: 45000000, cost: 30000000, profit: 15000000, profitRate: 33.3, color: '#EC4899' },
  { category: '기타', sales: 24000000, cost: 18000000, profit: 6000000, profitRate: 25.0, color: '#8B5CF6' },
];

const mockTopProducts: TopProduct[] = [
  { name: '무선 블루투스 이어폰', sales: 15200000, profit: 5320000, profitRate: 35.0, trend: 'up' },
  { name: '스마트 공기청정기', sales: 12800000, profit: 4480000, profitRate: 35.0, trend: 'up' },
  { name: '프리미엄 샴푸 세트', sales: 9600000, profit: 2880000, profitRate: 30.0, trend: 'stable' },
  { name: '유기농 견과류 선물세트', sales: 8400000, profit: 1680000, profitRate: 20.0, trend: 'down' },
  { name: '캠핑용 폴딩 테이블', sales: 7200000, profit: 2520000, profitRate: 35.0, trend: 'up' },
];

export default function AnalysisPage() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // 현재 월과 전월 데이터 비교
  const currentMonth = mockMonthlyData[mockMonthlyData.length - 1];
  const previousMonth = mockMonthlyData[mockMonthlyData.length - 2];

  const salesChange = ((currentMonth.sales - previousMonth.sales) / previousMonth.sales) * 100;
  const profitChange = ((currentMonth.profit - previousMonth.profit) / previousMonth.profit) * 100;
  const profitRateChange = currentMonth.profitRate - previousMonth.profitRate;

  // 총합 계산
  const totalSales = mockMonthlyData.reduce((sum, d) => sum + d.sales, 0);
  const totalPurchases = mockMonthlyData.reduce((sum, d) => sum + d.purchases, 0);
  const totalProfit = mockMonthlyData.reduce((sum, d) => sum + d.profit, 0);
  const avgProfitRate = totalProfit / totalSales * 100;

  // 카테고리별 총합
  const categoryTotalSales = mockCategoryProfit.reduce((sum, c) => sum + c.sales, 0);

  // 막대 그래프 최대값
  const maxMonthlyValue = Math.max(...mockMonthlyData.map((d) => Math.max(d.sales, d.purchases)));

  return (
    <DashboardLayout
      title="수익 분석"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '매입/매출', href: '/accounting' },
        { name: '수익 분석' },
      ]}
    >
      {/* Period Selector & Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 p-1 bg-[var(--color-gray-100)] rounded-lg">
          {[
            { value: 'monthly', label: '월별' },
            { value: 'quarterly', label: '분기별' },
            { value: 'yearly', label: '연도별' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value as typeof period)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                period === item.value
                  ? 'bg-white text-[var(--color-primary-600)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 border border-[var(--color-gray-300)] rounded-lg">
            <Calendar size={16} className="text-[var(--color-gray-400)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">2024년 7월 - 12월</span>
          </div>
          <Button variant="secondary">
            <Download size={16} className="mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <DollarSign size={20} className="text-[var(--color-gray-500)]" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${salesChange >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {salesChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(salesChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">총 매출</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {(totalSales / 100000000).toFixed(1)}억원
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            이번달: {(currentMonth.sales / 10000000).toFixed(0)}천만원
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <TrendingDown size={20} className="text-[var(--color-gray-500)]" />
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">총 매입</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {(totalPurchases / 100000000).toFixed(1)}억원
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            이번달: {(currentMonth.purchases / 10000000).toFixed(0)}천만원
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <TrendingUp size={20} className="text-[var(--color-gray-500)]" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${profitChange >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {profitChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(profitChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">순이익</p>
          <p className="text-2xl font-bold text-emerald-600">
            {(totalProfit / 100000000).toFixed(2)}억원
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            이번달: {(currentMonth.profit / 10000000).toFixed(0)}천만원
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <Percent size={20} className="text-[var(--color-gray-500)]" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${profitRateChange >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {profitRateChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(profitRateChange).toFixed(1)}%p
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">평균 이익률</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{avgProfitRate.toFixed(1)}%</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            이번달: {currentMonth.profitRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-[var(--color-gray-500)]" />
              <h3 className="font-semibold text-[var(--color-text-primary)]">월별 매출/매입 추이</h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[var(--color-gray-400)]"></div>
                <span className="text-[var(--color-text-secondary)]">매출</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[var(--color-gray-300)]"></div>
                <span className="text-[var(--color-text-secondary)]">매입</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span className="text-[var(--color-text-secondary)]">이익</span>
              </div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-4">
            {mockMonthlyData.map((data) => (
              <div key={data.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)] w-20">
                    {data.month.split('-')[1]}월
                  </span>
                  <span className="text-[var(--color-text-tertiary)]">
                    이익률: {data.profitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 bg-[var(--color-gray-400)] rounded transition-all"
                      style={{ width: `${(data.sales / maxMonthlyValue) * 100}%` }}
                    ></div>
                    <span className="text-xs text-[var(--color-text-tertiary)] w-20">
                      {(data.sales / 10000000).toFixed(0)}천만
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 bg-[var(--color-gray-300)] rounded transition-all"
                      style={{ width: `${(data.purchases / maxMonthlyValue) * 100}%` }}
                    ></div>
                    <span className="text-xs text-[var(--color-text-tertiary)] w-20">
                      {(data.purchases / 10000000).toFixed(0)}천만
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 bg-emerald-500 rounded transition-all"
                      style={{ width: `${(data.profit / maxMonthlyValue) * 100}%` }}
                    ></div>
                    <span className="text-xs text-[var(--color-text-tertiary)] w-20">
                      {(data.profit / 10000000).toFixed(0)}천만
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={20} className="text-[var(--color-gray-500)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">카테고리별 수익</h3>
          </div>

          {/* Category Donut Chart (Simple representation) */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {mockCategoryProfit.reduce(
                (acc, category, index) => {
                  const percentage = (category.sales / categoryTotalSales) * 100;
                  const dashArray = (percentage / 100) * 251.2; // circumference of circle with r=40
                  acc.elements.push(
                    <circle
                      key={category.category}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={category.color}
                      strokeWidth="20"
                      strokeDasharray={`${dashArray} 251.2`}
                      strokeDashoffset={-acc.offset}
                    />
                  );
                  acc.offset += dashArray;
                  return acc;
                },
                { elements: [] as React.ReactNode[], offset: 0 }
              ).elements}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                {avgProfitRate.toFixed(0)}%
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">평균 이익률</span>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {mockCategoryProfit.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                  <span className="text-sm text-[var(--color-text-secondary)]">{category.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {(category.profit / 10000000).toFixed(0)}천만
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{category.profitRate.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Category Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Profit */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">수익 상위 상품</h3>
          <div className="space-y-3">
            {mockTopProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center gap-4 p-3 bg-[var(--color-gray-50)] rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center">
                  <span className="text-sm font-bold text-[var(--color-primary-600)]">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)] truncate">{product.name}</p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    매출 {(product.sales / 10000).toLocaleString()}만원
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {product.trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                    {product.trend === 'down' && <TrendingDown size={14} className="text-amber-500" />}
                    <span className="font-semibold text-emerald-600">
                      {(product.profit / 10000).toLocaleString()}만원
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">이익률 {product.profitRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Detail Table */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">카테고리별 상세</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-gray-200)]">
                  <th className="text-left py-3 font-medium text-[var(--color-text-secondary)]">카테고리</th>
                  <th className="text-right py-3 font-medium text-[var(--color-text-secondary)]">매출</th>
                  <th className="text-right py-3 font-medium text-[var(--color-text-secondary)]">원가</th>
                  <th className="text-right py-3 font-medium text-[var(--color-text-secondary)]">이익</th>
                  <th className="text-right py-3 font-medium text-[var(--color-text-secondary)]">이익률</th>
                </tr>
              </thead>
              <tbody>
                {mockCategoryProfit.map((category) => (
                  <tr key={category.category} className="border-b border-[var(--color-gray-100)]">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
                        <span className="text-[var(--color-text-primary)]">{category.category}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-[var(--color-text-primary)]">
                      {(category.sales / 10000000).toFixed(0)}천만
                    </td>
                    <td className="text-right py-3 text-[var(--color-text-secondary)]">
                      {(category.cost / 10000000).toFixed(0)}천만
                    </td>
                    <td className="text-right py-3 font-medium text-emerald-600">
                      {(category.profit / 10000000).toFixed(0)}천만
                    </td>
                    <td className="text-right py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          category.profitRate >= 30
                            ? 'bg-emerald-100 text-emerald-700'
                            : category.profitRate >= 25
                            ? 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {category.profitRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--color-gray-50)]">
                  <td className="py-3 font-semibold text-[var(--color-text-primary)]">합계</td>
                  <td className="text-right py-3 font-semibold text-[var(--color-text-primary)]">
                    {(categoryTotalSales / 100000000).toFixed(1)}억
                  </td>
                  <td className="text-right py-3 font-semibold text-[var(--color-text-secondary)]">
                    {(mockCategoryProfit.reduce((s, c) => s + c.cost, 0) / 100000000).toFixed(1)}억
                  </td>
                  <td className="text-right py-3 font-semibold text-emerald-600">
                    {(mockCategoryProfit.reduce((s, c) => s + c.profit, 0) / 100000000).toFixed(2)}억
                  </td>
                  <td className="text-right py-3">
                    <span className="px-2 py-1 rounded bg-[var(--color-gray-100)] text-[var(--color-gray-700)] text-xs font-medium">
                      {avgProfitRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
