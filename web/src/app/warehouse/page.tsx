'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Warehouse,
  Plus,
  Search,
  MapPin,
  Package,
  Edit,
  Trash2,
  MoreVertical,
  Building2,
  Check,
  X,
} from 'lucide-react';

// 임시 데이터
const mockWarehouses = [
  {
    id: '1',
    name: '서울 본사 창고',
    code: 'WH-SEOUL-01',
    type: 'main',
    address: '서울시 강남구 테헤란로 123',
    manager: '김창고',
    phone: '02-1234-5678',
    totalLocations: 150,
    usedLocations: 98,
    totalItems: 2500,
    totalValue: 125000000,
    isActive: true,
    createdAt: '2023-06-15',
  },
  {
    id: '2',
    name: '부산 물류센터',
    code: 'WH-BUSAN-01',
    type: 'distribution',
    address: '부산시 해운대구 센텀로 456',
    manager: '이물류',
    phone: '051-9876-5432',
    totalLocations: 200,
    usedLocations: 145,
    totalItems: 3800,
    totalValue: 98000000,
    isActive: true,
    createdAt: '2023-08-20',
  },
  {
    id: '3',
    name: '인천 보관창고',
    code: 'WH-INCHEON-01',
    type: 'storage',
    address: '인천시 남동구 논현로 789',
    manager: '박보관',
    phone: '032-5555-1234',
    totalLocations: 80,
    usedLocations: 35,
    totalItems: 950,
    totalValue: 45000000,
    isActive: false,
    createdAt: '2024-01-10',
  },
];

const warehouseTypes = [
  { value: 'main', label: '본사 창고' },
  { value: 'distribution', label: '물류센터' },
  { value: 'storage', label: '보관창고' },
  { value: 'temp', label: '임시창고' },
];

export default function WarehousePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<typeof mockWarehouses[0] | null>(null);

  // 필터링
  const filteredWarehouses = warehouses.filter((wh) =>
    wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wh.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 통계
  const stats = {
    totalWarehouses: warehouses.length,
    activeWarehouses: warehouses.filter((wh) => wh.isActive).length,
    totalLocations: warehouses.reduce((sum, wh) => sum + wh.totalLocations, 0),
    totalItems: warehouses.reduce((sum, wh) => sum + wh.totalItems, 0),
    totalValue: warehouses.reduce((sum, wh) => sum + wh.totalValue, 0),
  };

  const getTypeBadge = (type: string) => {
    const typeInfo = warehouseTypes.find((t) => t.value === type);
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-gray-100)] text-[var(--color-gray-700)]">
        {typeInfo?.label || type}
      </span>
    );
  };

  const getUsagePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">창고 관리</h1>
            <p className="text-sm text-[var(--color-gray-500)] mt-1">
              창고를 등록하고 관리하세요
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)]"
          >
            <Plus size={16} />
            창고 추가
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <Warehouse size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">전체 창고</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {stats.totalWarehouses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Check size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">운영 중</p>
                <p className="text-xl font-bold text-emerald-600">
                  {stats.activeWarehouses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 로케이션</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {stats.totalLocations.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <Package size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 품목</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {stats.totalItems.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 재고가치</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  ₩{(stats.totalValue / 100000000).toFixed(1)}억
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]"
            />
            <input
              type="text"
              placeholder="창고명 또는 코드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
        </div>

        {/* 창고 카드 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className={`bg-white rounded-xl border ${
                warehouse.isActive
                  ? 'border-[var(--color-gray-200)]'
                  : 'border-[var(--color-gray-200)] opacity-60'
              } overflow-hidden hover:shadow-md transition-shadow`}
            >
              {/* 카드 헤더 */}
              <div className="p-4 border-b border-[var(--color-gray-200)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--color-gray-100)]">
                      <Warehouse size={20} className="text-[var(--color-gray-500)]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--color-gray-900)]">{warehouse.name}</h3>
                      <p className="text-xs text-[var(--color-gray-500)]">{warehouse.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(warehouse.type)}
                    <button className="p-1 hover:bg-[var(--color-gray-100)] rounded">
                      <MoreVertical size={16} className="text-[var(--color-gray-400)]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 카드 내용 */}
              <div className="p-4 space-y-4">
                {/* 주소 */}
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-[var(--color-gray-400)] mt-0.5" />
                  <p className="text-sm text-[var(--color-gray-600)]">{warehouse.address}</p>
                </div>

                {/* 담당자 정보 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-gray-500)]">담당자</span>
                  <span className="text-[var(--color-gray-900)]">{warehouse.manager} ({warehouse.phone})</span>
                </div>

                {/* 로케이션 사용률 */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--color-gray-500)]">로케이션 사용률</span>
                    <span className="text-[var(--color-gray-900)]">
                      {warehouse.usedLocations} / {warehouse.totalLocations}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        getUsagePercentage(warehouse.usedLocations, warehouse.totalLocations) > 80
                          ? 'bg-amber-500'
                          : 'bg-[var(--color-gray-400)]'
                      }`}
                      style={{
                        width: `${getUsagePercentage(warehouse.usedLocations, warehouse.totalLocations)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-gray-500)] mt-1 text-right">
                    {getUsagePercentage(warehouse.usedLocations, warehouse.totalLocations)}% 사용
                  </p>
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-gray-100)]">
                  <div>
                    <p className="text-xs text-[var(--color-gray-500)]">보관 품목</p>
                    <p className="text-lg font-semibold text-[var(--color-gray-900)]">
                      {warehouse.totalItems.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-gray-500)]">재고 가치</p>
                    <p className="text-lg font-semibold text-[var(--color-gray-900)]">
                      ₩{(warehouse.totalValue / 10000000).toFixed(0)}천만
                    </p>
                  </div>
                </div>
              </div>

              {/* 카드 푸터 */}
              <div className="px-4 py-3 bg-[var(--color-gray-50)] border-t border-[var(--color-gray-200)] flex items-center justify-between">
                <span className={`flex items-center gap-1 text-xs ${
                  warehouse.isActive ? 'text-emerald-600' : 'text-[var(--color-gray-500)]'
                }`}>
                  {warehouse.isActive ? (
                    <>
                      <Check size={12} />
                      운영 중
                    </>
                  ) : (
                    <>
                      <X size={12} />
                      운영 중지
                    </>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-white rounded-lg">
                    <Edit size={14} className="text-[var(--color-gray-500)]" />
                  </button>
                  <button className="p-1.5 hover:bg-white rounded-lg">
                    <Trash2 size={14} className="text-[var(--color-gray-400)]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredWarehouses.length === 0 && (
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-12 text-center">
            <Warehouse size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
            <p className="text-[var(--color-gray-500)]">등록된 창고가 없습니다</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-sm text-[var(--color-primary-500)] hover:underline"
            >
              창고 추가하기
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
