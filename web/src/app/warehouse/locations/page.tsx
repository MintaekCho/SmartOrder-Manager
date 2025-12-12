'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';

// 임시 데이터
const mockLocations = [
  {
    id: '1',
    warehouseId: '1',
    warehouseName: '서울 본사 창고',
    zone: 'A',
    aisle: '01',
    rack: '01',
    shelf: '1',
    fullCode: 'A-01-01-1',
    type: 'picking',
    capacity: 100,
    currentQty: 75,
    itemCount: 3,
    items: [
      { sku: 'SKU-001', name: '프리미엄 무선 이어폰', qty: 50 },
      { sku: 'SKU-002', name: '블루투스 스피커', qty: 15 },
      { sku: 'SKU-003', name: '스마트워치 스트랩', qty: 10 },
    ],
    isActive: true,
  },
  {
    id: '2',
    warehouseId: '1',
    warehouseName: '서울 본사 창고',
    zone: 'A',
    aisle: '01',
    rack: '02',
    shelf: '1',
    fullCode: 'A-01-02-1',
    type: 'storage',
    capacity: 200,
    currentQty: 180,
    itemCount: 2,
    items: [
      { sku: 'SKU-004', name: 'USB-C 충전 케이블', qty: 100 },
      { sku: 'SKU-005', name: '노트북 파우치 15인치', qty: 80 },
    ],
    isActive: true,
  },
  {
    id: '3',
    warehouseId: '1',
    warehouseName: '서울 본사 창고',
    zone: 'B',
    aisle: '02',
    rack: '01',
    shelf: '1',
    fullCode: 'B-02-01-1',
    type: 'bulk',
    capacity: 500,
    currentQty: 0,
    itemCount: 0,
    items: [],
    isActive: true,
  },
  {
    id: '4',
    warehouseId: '2',
    warehouseName: '부산 물류센터',
    zone: 'A',
    aisle: '01',
    rack: '01',
    shelf: '1',
    fullCode: 'A-01-01-1',
    type: 'picking',
    capacity: 150,
    currentQty: 120,
    itemCount: 4,
    items: [
      { sku: 'SKU-006', name: '무선 마우스', qty: 50 },
      { sku: 'SKU-007', name: '키보드 커버', qty: 30 },
      { sku: 'SKU-008', name: '모니터 암', qty: 25 },
      { sku: 'SKU-009', name: '노트북 스탠드', qty: 15 },
    ],
    isActive: true,
  },
  {
    id: '5',
    warehouseId: '2',
    warehouseName: '부산 물류센터',
    zone: 'C',
    aisle: '03',
    rack: '02',
    shelf: '2',
    fullCode: 'C-03-02-2',
    type: 'staging',
    capacity: 100,
    currentQty: 45,
    itemCount: 1,
    items: [{ sku: 'SKU-010', name: '휴대폰 케이스', qty: 45 }],
    isActive: false,
  },
];

const warehouses = [
  { value: 'all', label: '전체 창고' },
  { value: '1', label: '서울 본사 창고' },
  { value: '2', label: '부산 물류센터' },
];

const locationTypes = [
  { value: 'all', label: '전체' },
  { value: 'picking', label: '피킹 구역' },
  { value: 'storage', label: '보관 구역' },
  { value: 'bulk', label: '벌크 구역' },
  { value: 'staging', label: '스테이징' },
];

export default function WarehouseLocationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [locations, setLocations] = useState(mockLocations);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  // 필터링
  const filteredLocations = locations.filter((loc) => {
    const matchSearch =
      loc.fullCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.warehouseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWarehouse = selectedWarehouse === 'all' || loc.warehouseId === selectedWarehouse;
    const matchType = selectedType === 'all' || loc.type === selectedType;
    return matchSearch && matchWarehouse && matchType;
  });

  // 창고별 그룹핑
  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.warehouseName]) {
      acc[loc.warehouseName] = [];
    }
    acc[loc.warehouseName].push(loc);
    return acc;
  }, {} as Record<string, typeof mockLocations>);

  // 통계
  const stats = {
    totalLocations: locations.length,
    activeLocations: locations.filter((l) => l.isActive).length,
    totalCapacity: locations.reduce((sum, l) => sum + l.capacity, 0),
    totalUsed: locations.reduce((sum, l) => sum + l.currentQty, 0),
    emptyLocations: locations.filter((l) => l.currentQty === 0).length,
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      picking: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
      storage: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
      bulk: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
      staging: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
    };
    const labels: Record<string, string> = {
      picking: '피킹',
      storage: '보관',
      bulk: '벌크',
      staging: '스테이징',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const getUsageColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return 'bg-amber-500';
    if (percentage >= 70) return 'bg-[var(--color-gray-400)]';
    return 'bg-emerald-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">로케이션 관리</h1>
            <p className="text-sm text-[var(--color-gray-500)] mt-1">
              창고 내 로케이션을 관리하고 재고 위치를 확인하세요
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)]">
            <Plus size={16} />
            로케이션 추가
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">전체 로케이션</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">{stats.totalLocations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Check size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">활성</p>
                <p className="text-xl font-bold text-emerald-600">{stats.activeLocations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <Package size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">총 용량</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {stats.totalCapacity.toLocaleString()}
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
                <p className="text-xs text-[var(--color-gray-500)]">사용량</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {Math.round((stats.totalUsed / stats.totalCapacity) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">빈 로케이션</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">{stats.emptyLocations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]"
              />
              <input
                type="text"
                placeholder="로케이션 코드로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>

            {/* 창고 필터 */}
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {warehouses.map((wh) => (
                <option key={wh.value} value={wh.value}>
                  {wh.label}
                </option>
              ))}
            </select>

            {/* 유형 필터 */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {locationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 로케이션 목록 */}
        <div className="space-y-6">
          {Object.entries(groupedLocations).map(([warehouseName, locs]) => (
            <div key={warehouseName} className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
              <div className="px-4 py-3 bg-[var(--color-gray-50)] border-b border-[var(--color-gray-200)]">
                <h3 className="font-medium text-[var(--color-gray-900)]">{warehouseName}</h3>
              </div>
              <div className="divide-y divide-[var(--color-gray-100)]">
                {locs.map((location) => (
                  <div key={location.id}>
                    <div
                      className="px-4 py-3 flex items-center justify-between hover:bg-[var(--color-gray-50)] cursor-pointer"
                      onClick={() =>
                        setExpandedLocation(expandedLocation === location.id ? null : location.id)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${location.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium text-[var(--color-gray-900)]">
                              {location.fullCode}
                            </span>
                            {getTypeBadge(location.type)}
                          </div>
                          <p className="text-xs text-[var(--color-gray-500)] mt-0.5">
                            Zone {location.zone} / Aisle {location.aisle} / Rack {location.rack} / Shelf {location.shelf}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* 용량 게이지 */}
                        <div className="flex items-center gap-3">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[var(--color-gray-500)]">
                                {location.currentQty}/{location.capacity}
                              </span>
                              <span className="text-[var(--color-gray-500)]">
                                {Math.round((location.currentQty / location.capacity) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getUsageColor(location.currentQty, location.capacity)}`}
                                style={{ width: `${(location.currentQty / location.capacity) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <span className="text-sm text-[var(--color-gray-500)]">
                          {location.itemCount}품목
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit size={14} className="text-[var(--color-gray-500)]" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 size={14} className="text-[var(--color-gray-400)]" />
                          </button>
                          <ChevronRight
                            size={16}
                            className={`text-[var(--color-gray-400)] transition-transform ${
                              expandedLocation === location.id ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 확장 - 품목 목록 */}
                    {expandedLocation === location.id && location.items.length > 0 && (
                      <div className="px-4 py-3 bg-[var(--color-gray-50)] border-t border-[var(--color-gray-100)]">
                        <p className="text-xs font-medium text-[var(--color-gray-500)] mb-2">보관 품목</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {location.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[var(--color-gray-200)]"
                            >
                              <div>
                                <p className="text-sm text-[var(--color-gray-900)]">{item.name}</p>
                                <p className="text-xs text-[var(--color-gray-500)]">{item.sku}</p>
                              </div>
                              <span className="text-sm font-medium text-[var(--color-gray-900)]">
                                {item.qty}개
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedLocation === location.id && location.items.length === 0 && (
                      <div className="px-4 py-6 bg-[var(--color-gray-50)] border-t border-[var(--color-gray-100)] text-center">
                        <p className="text-sm text-[var(--color-gray-400)]">빈 로케이션입니다</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-12 text-center">
            <MapPin size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
            <p className="text-[var(--color-gray-500)]">로케이션이 없습니다</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
