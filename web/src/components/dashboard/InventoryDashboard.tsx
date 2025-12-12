'use client';

import { useState } from 'react';
import {
  Boxes,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  PackagePlus,
  PackageMinus,
  Warehouse,
  ClipboardList,
  ArrowRight,
  Package,
} from 'lucide-react';
import Link from 'next/link';

// 임시 데이터
const mockStats = {
  totalItems: 156,
  totalQuantity: 8542,
  totalValue: 125000000,
  lowStockItems: 12,
  outOfStockItems: 3,
  pendingStockIn: 5,
  pendingStockOut: 8,
  warehouseCount: 3,
};

const mockLowStockItems = [
  { id: '1', sku: 'SKU-001', name: '프리미엄 무선 이어폰', quantity: 15, safetyStock: 50, warehouse: '서울 본사' },
  { id: '2', sku: 'SKU-002', name: '블루투스 스피커', quantity: 8, safetyStock: 30, warehouse: '서울 본사' },
  { id: '3', sku: 'SKU-003', name: 'USB-C 충전 케이블', quantity: 25, safetyStock: 100, warehouse: '부산 물류센터' },
  { id: '4', sku: 'SKU-004', name: '무선 마우스', quantity: 5, safetyStock: 20, warehouse: '서울 본사' },
  { id: '5', sku: 'SKU-005', name: '노트북 파우치', quantity: 12, safetyStock: 40, warehouse: '인천 보관창고' },
];

const mockRecentMovements = [
  { id: '1', type: 'in', code: 'SI-2024-001', items: 3, quantity: 150, warehouse: '서울 본사', date: '2024-01-20', status: 'completed' },
  { id: '2', type: 'out', code: 'SO-2024-001', items: 1, quantity: 25, warehouse: '부산 물류센터', date: '2024-01-20', status: 'shipped' },
  { id: '3', type: 'in', code: 'SI-2024-002', items: 2, quantity: 80, warehouse: '서울 본사', date: '2024-01-19', status: 'pending' },
  { id: '4', type: 'out', code: 'SO-2024-002', items: 4, quantity: 45, warehouse: '서울 본사', date: '2024-01-19', status: 'picked' },
  { id: '5', type: 'in', code: 'SI-2024-003', items: 1, quantity: 200, warehouse: '인천 보관창고', date: '2024-01-18', status: 'completed' },
];

const mockWarehouseUsage = [
  { name: '서울 본사 창고', used: 78, capacity: 100, items: 89 },
  { name: '부산 물류센터', used: 145, capacity: 200, items: 52 },
  { name: '인천 보관창고', used: 35, capacity: 80, items: 15 },
];

export default function InventoryDashboard() {
  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">총 재고 품목</p>
              <p className="text-2xl font-bold text-[var(--color-gray-900)] mt-1">
                {mockStats.totalItems.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">
                총 {mockStats.totalQuantity.toLocaleString()}개
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Boxes size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">재고 가치</p>
              <p className="text-2xl font-bold text-[var(--color-gray-900)] mt-1">
                ₩{(mockStats.totalValue / 100000000).toFixed(1)}억
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp size={12} />
                전월 대비 +5.2%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">재고 부족</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {mockStats.lowStockItems}
              </p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">
                품절 {mockStats.outOfStockItems}건
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">입출고 대기</p>
              <p className="text-2xl font-bold text-[var(--color-gray-900)] mt-1">
                {mockStats.pendingStockIn + mockStats.pendingStockOut}
              </p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">
                입고 {mockStats.pendingStockIn} / 출고 {mockStats.pendingStockOut}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 재고 부족 알림 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-gray-200)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-600" />
              <h3 className="font-semibold text-[var(--color-gray-900)]">재고 부족 알림</h3>
            </div>
            <Link
              href="/inventory"
              className="text-sm text-[var(--color-primary-600)] hover:underline flex items-center gap-1"
            >
              전체 보기
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-gray-50)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">상품명</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">현재고</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">안전재고</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">창고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-100)]">
                {mockLowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-gray-50)]">
                    <td className="px-4 py-3 text-sm text-[var(--color-gray-600)]">{item.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-gray-900)]">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${item.quantity <= 10 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-gray-500)]">{item.safetyStock}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-gray-600)]">{item.warehouse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 창고 사용률 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-gray-200)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse size={18} className="text-blue-600" />
              <h3 className="font-semibold text-[var(--color-gray-900)]">창고 사용률</h3>
            </div>
            <Link
              href="/warehouse"
              className="text-sm text-[var(--color-primary-600)] hover:underline flex items-center gap-1"
            >
              관리
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {mockWarehouseUsage.map((wh, idx) => {
              const percentage = Math.round((wh.used / wh.capacity) * 100);
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-gray-900)]">{wh.name}</span>
                    <span className="text-xs text-[var(--color-gray-500)]">{wh.items}품목</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-gray-500)]">
                    <span>{wh.used} / {wh.capacity}</span>
                    <span>{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 최근 입출고 내역 */}
      <div className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-gray-200)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-purple-600" />
            <h3 className="font-semibold text-[var(--color-gray-900)]">최근 입출고</h3>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/inventory/stock-in"
              className="text-sm text-[var(--color-primary-600)] hover:underline"
            >
              입고 관리
            </Link>
            <span className="text-[var(--color-gray-300)]">|</span>
            <Link
              href="/inventory/stock-out"
              className="text-sm text-[var(--color-primary-600)] hover:underline"
            >
              출고 관리
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-gray-50)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">유형</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">번호</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">품목/수량</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">창고</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">일자</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-gray-100)]">
              {mockRecentMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-[var(--color-gray-50)]">
                  <td className="px-4 py-3">
                    {movement.type === 'in' ? (
                      <span className="flex items-center gap-1.5 text-sm text-green-600">
                        <PackagePlus size={16} />
                        입고
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-blue-600">
                        <PackageMinus size={16} />
                        출고
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-primary-600)]">
                    {movement.code}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-[var(--color-gray-600)]">
                    {movement.items}품목 / {movement.quantity}개
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-gray-600)]">{movement.warehouse}</td>
                  <td className="px-4 py-3 text-center text-sm text-[var(--color-gray-500)]">{movement.date}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movement.status === 'completed' || movement.status === 'shipped'
                        ? 'bg-green-100 text-green-700'
                        : movement.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {movement.status === 'completed' ? '완료' :
                       movement.status === 'shipped' ? '출고완료' :
                       movement.status === 'pending' ? '대기' : '피킹완료'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/inventory/stock-in"
          className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4 hover:border-green-300 hover:bg-green-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
              <PackagePlus size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-gray-900)]">입고 등록</p>
              <p className="text-xs text-[var(--color-gray-500)]">새 입고 등록하기</p>
            </div>
          </div>
        </Link>

        <Link
          href="/inventory/stock-out"
          className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
              <PackageMinus size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-gray-900)]">출고 등록</p>
              <p className="text-xs text-[var(--color-gray-500)]">새 출고 등록하기</p>
            </div>
          </div>
        </Link>

        <Link
          href="/inventory/stock-count"
          className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
              <ClipboardList size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-gray-900)]">재고 실사</p>
              <p className="text-xs text-[var(--color-gray-500)]">실사 등록하기</p>
            </div>
          </div>
        </Link>

        <Link
          href="/purchase-orders/new"
          className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200">
              <TrendingDown size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-gray-900)]">발주 등록</p>
              <p className="text-xs text-[var(--color-gray-500)]">구매 발주하기</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
