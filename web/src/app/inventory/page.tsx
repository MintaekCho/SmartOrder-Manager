'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Modal, Button } from '@/components/ui';
import {
  Package,
  Search,
  Filter,
  Download,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Boxes,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  History,
  X,
  Save,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  location: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  safetyStock: number;
  reorderPoint: number;
  unitCost: number;
  totalValue: number;
  status: string;
  lastUpdated: string;
}

interface InventoryHistory {
  id: string;
  date: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  beforeQty: number;
  afterQty: number;
  reason: string;
  user: string;
}

// 임시 데이터
const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    sku: 'SKU-001',
    name: '프리미엄 무선 이어폰',
    category: '전자기기',
    warehouse: '서울 본사 창고',
    location: 'A-01-01',
    quantity: 150,
    reservedQty: 20,
    availableQty: 130,
    safetyStock: 50,
    reorderPoint: 30,
    unitCost: 25000,
    totalValue: 3750000,
    status: 'normal',
    lastUpdated: '2024-01-15',
  },
  {
    id: '2',
    sku: 'SKU-002',
    name: '블루투스 스피커',
    category: '전자기기',
    warehouse: '서울 본사 창고',
    location: 'A-01-02',
    quantity: 25,
    reservedQty: 10,
    availableQty: 15,
    safetyStock: 30,
    reorderPoint: 20,
    unitCost: 45000,
    totalValue: 1125000,
    status: 'low',
    lastUpdated: '2024-01-14',
  },
  {
    id: '3',
    sku: 'SKU-003',
    name: '스마트워치 스트랩',
    category: '액세서리',
    warehouse: '부산 물류센터',
    location: 'B-02-03',
    quantity: 500,
    reservedQty: 50,
    availableQty: 450,
    safetyStock: 100,
    reorderPoint: 80,
    unitCost: 8000,
    totalValue: 4000000,
    status: 'normal',
    lastUpdated: '2024-01-15',
  },
  {
    id: '4',
    sku: 'SKU-004',
    name: 'USB-C 충전 케이블',
    category: '액세서리',
    warehouse: '서울 본사 창고',
    location: 'A-02-01',
    quantity: 8,
    reservedQty: 5,
    availableQty: 3,
    safetyStock: 50,
    reorderPoint: 30,
    unitCost: 5000,
    totalValue: 40000,
    status: 'critical',
    lastUpdated: '2024-01-13',
  },
  {
    id: '5',
    sku: 'SKU-005',
    name: '노트북 파우치 15인치',
    category: '케이스',
    warehouse: '부산 물류센터',
    location: 'B-01-05',
    quantity: 200,
    reservedQty: 30,
    availableQty: 170,
    safetyStock: 40,
    reorderPoint: 25,
    unitCost: 15000,
    totalValue: 3000000,
    status: 'normal',
    lastUpdated: '2024-01-15',
  },
  {
    id: '6',
    sku: 'SKU-006',
    name: '무선 마우스',
    category: '전자기기',
    warehouse: '서울 본사 창고',
    location: 'A-03-02',
    quantity: 0,
    reservedQty: 0,
    availableQty: 0,
    safetyStock: 20,
    reorderPoint: 15,
    unitCost: 18000,
    totalValue: 0,
    status: 'outOfStock',
    lastUpdated: '2024-01-10',
  },
];

const mockHistory: InventoryHistory[] = [
  { id: '1', date: '2024-01-15 14:30', type: 'in', quantity: 50, beforeQty: 100, afterQty: 150, reason: '구매입고', user: '김담당' },
  { id: '2', date: '2024-01-14 10:15', type: 'out', quantity: 20, beforeQty: 120, afterQty: 100, reason: '판매출고', user: '이담당' },
  { id: '3', date: '2024-01-12 16:45', type: 'adjust', quantity: -5, beforeQty: 125, afterQty: 120, reason: '재고실사 조정', user: '박담당' },
  { id: '4', date: '2024-01-10 09:00', type: 'in', quantity: 100, beforeQty: 25, afterQty: 125, reason: '구매입고', user: '김담당' },
];

const warehouses = ['전체', '서울 본사 창고', '부산 물류센터'];
const categories = ['전체', '전자기기', '액세서리', '케이스'];
const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'normal', label: '정상' },
  { value: 'low', label: '부족' },
  { value: 'critical', label: '긴급' },
  { value: 'outOfStock', label: '품절' },
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [inventoryItems, setInventoryItems] = useState(mockInventoryItems);
  const [isLoading, setIsLoading] = useState(false);

  // 모달 상태
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    safetyStock: 0,
    reorderPoint: 0,
    location: '',
  });

  // 통계 계산
  const stats = {
    totalItems: inventoryItems.length,
    totalQuantity: inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventoryItems.reduce((sum, item) => sum + item.totalValue, 0),
    lowStockItems: inventoryItems.filter((item) => item.status === 'low' || item.status === 'critical').length,
    outOfStockItems: inventoryItems.filter((item) => item.status === 'outOfStock').length,
  };

  // 필터링
  const filteredItems = inventoryItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWarehouse = selectedWarehouse === '전체' || item.warehouse === selectedWarehouse;
    const matchCategory = selectedCategory === '전체' || item.category === selectedCategory;
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchSearch && matchWarehouse && matchCategory && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      normal: 'bg-emerald-50 text-emerald-700',
      low: 'bg-amber-50 text-amber-700',
      critical: 'bg-amber-50 text-amber-700',
      outOfStock: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
    };
    const labels: Record<string, string> = {
      normal: '정상',
      low: '부족',
      critical: '긴급',
      outOfStock: '품절',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleViewDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditForm({
      safetyStock: item.safetyStock,
      reorderPoint: item.reorderPoint,
      location: item.location,
    });
    setEditModalOpen(true);
  };

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setHistoryModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;

    setInventoryItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              safetyStock: editForm.safetyStock,
              reorderPoint: editForm.reorderPoint,
              location: editForm.location,
            }
          : item
      )
    );
    setEditModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">재고 현황</h1>
            <p className="text-sm text-[var(--color-gray-500)] mt-1">
              전체 재고 현황을 확인하고 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-gray-700)] bg-white border border-[var(--color-gray-300)] rounded-lg hover:bg-[var(--color-gray-50)]"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              새로고침
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-gray-700)] bg-white border border-[var(--color-gray-300)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Download size={16} />
              내보내기
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <Boxes size={20} className="text-[var(--color-gray-500)]" />
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
                <Package size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">총 재고수량</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {stats.totalQuantity.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">재고 가치</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  ₩{(stats.totalValue / 10000).toFixed(0)}만
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <TrendingDown size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">재고 부족</p>
                <p className="text-xl font-bold text-amber-600">
                  {stats.lowStockItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <AlertTriangle size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">품절</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {stats.outOfStockItems}
                </p>
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
                placeholder="상품명 또는 SKU로 검색..."
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
              {warehouses.map((warehouse) => (
                <option key={warehouse} value={warehouse}>
                  {warehouse === '전체' ? '전체 창고' : warehouse}
                </option>
              ))}
            </select>

            {/* 카테고리 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === '전체' ? '전체 카테고리' : category}
                </option>
              ))}
            </select>

            {/* 상태 필터 */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {statusFilters.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 재고 테이블 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-gray-200)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    상품정보
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    창고/위치
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    재고수량
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    가용수량
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    안전재고
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    재고가치
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-200)]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-gray-50)]">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-gray-900)]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[var(--color-gray-500)]">
                          {item.sku} · {item.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-[var(--color-gray-900)]">{item.warehouse}</p>
                        <p className="text-xs text-[var(--color-gray-500)]">{item.location}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium text-[var(--color-gray-900)]">
                        {item.quantity.toLocaleString()}
                      </span>
                      {item.reservedQty > 0 && (
                        <span className="text-xs text-[var(--color-gray-500)] block">
                          (예약: {item.reservedQty})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`text-sm font-medium ${
                          item.availableQty <= item.reorderPoint
                            ? 'text-amber-600'
                            : 'text-[var(--color-gray-900)]'
                        }`}
                      >
                        {item.availableQty.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-[var(--color-gray-500)]">
                        {item.safetyStock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-[var(--color-gray-900)]">
                        ₩{item.totalValue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                          title="상세보기"
                        >
                          <Eye size={16} className="text-[var(--color-gray-500)]" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                          title="수정"
                        >
                          <Edit size={16} className="text-[var(--color-gray-500)]" />
                        </button>
                        <button
                          onClick={() => handleViewHistory(item)}
                          className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                          title="이력보기"
                        >
                          <History size={16} className="text-[var(--color-gray-500)]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
              <p className="text-[var(--color-gray-500)]">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 상세보기 모달 */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="재고 상세정보"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  상품명
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedItem.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  SKU
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedItem.sku}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  카테고리
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedItem.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  상태
                </label>
                {getStatusBadge(selectedItem.status)}
              </div>
            </div>

            {/* 위치 정보 */}
            <div className="border-t border-[var(--color-gray-200)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3">위치 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                    창고
                  </label>
                  <p className="text-[var(--color-gray-900)]">{selectedItem.warehouse}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                    로케이션
                  </label>
                  <p className="text-[var(--color-gray-900)]">{selectedItem.location}</p>
                </div>
              </div>
            </div>

            {/* 재고 정보 */}
            <div className="border-t border-[var(--color-gray-200)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3">재고 정보</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--color-gray-50)] rounded-lg p-4 text-center">
                  <p className="text-sm text-[var(--color-gray-600)] mb-1">총 재고</p>
                  <p className="text-2xl font-bold text-[var(--color-gray-900)]">{selectedItem.quantity}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-emerald-600 mb-1">가용 재고</p>
                  <p className="text-2xl font-bold text-emerald-700">{selectedItem.availableQty}</p>
                </div>
                <div className="bg-[var(--color-gray-50)] rounded-lg p-4 text-center">
                  <p className="text-sm text-[var(--color-gray-600)] mb-1">예약 수량</p>
                  <p className="text-2xl font-bold text-[var(--color-gray-900)]">{selectedItem.reservedQty}</p>
                </div>
              </div>
            </div>

            {/* 재고 설정 */}
            <div className="border-t border-[var(--color-gray-200)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3">재고 설정</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                    안전재고
                  </label>
                  <p className="text-[var(--color-gray-900)]">{selectedItem.safetyStock}개</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                    재주문점
                  </label>
                  <p className="text-[var(--color-gray-900)]">{selectedItem.reorderPoint}개</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                    단가
                  </label>
                  <p className="text-[var(--color-gray-900)]">₩{selectedItem.unitCost.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* 가치 정보 */}
            <div className="border-t border-[var(--color-gray-200)] pt-4">
              <div className="flex items-center justify-between bg-[var(--color-gray-50)] rounded-lg p-4">
                <span className="text-sm font-medium text-[var(--color-gray-600)]">총 재고가치</span>
                <span className="text-xl font-bold text-[var(--color-gray-900)]">
                  ₩{selectedItem.totalValue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                닫기
              </Button>
              <Button onClick={() => { setDetailModalOpen(false); handleEdit(selectedItem); }}>
                <Edit size={16} className="mr-2" />
                수정
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 수정 모달 */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="재고 설정 수정"
        size="md"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
              <p className="font-medium text-[var(--color-gray-900)]">{selectedItem.name}</p>
              <p className="text-sm text-[var(--color-gray-500)]">{selectedItem.sku}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                  로케이션
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                  안전재고
                </label>
                <input
                  type="number"
                  value={editForm.safetyStock}
                  onChange={(e) => setEditForm({ ...editForm, safetyStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                <p className="text-xs text-[var(--color-gray-500)] mt-1">
                  재고가 이 수량 이하가 되면 경고가 표시됩니다
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                  재주문점
                </label>
                <input
                  type="number"
                  value={editForm.reorderPoint}
                  onChange={(e) => setEditForm({ ...editForm, reorderPoint: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                <p className="text-xs text-[var(--color-gray-500)] mt-1">
                  가용재고가 이 수량 이하가 되면 발주가 필요합니다
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save size={16} className="mr-2" />
                저장
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 이력 모달 */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="재고 변동 이력"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
              <p className="font-medium text-[var(--color-gray-900)]">{selectedItem.name}</p>
              <p className="text-sm text-[var(--color-gray-500)]">{selectedItem.sku}</p>
            </div>

            <div className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--color-gray-50)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)]">
                      일시
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)]">
                      유형
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)]">
                      변동
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)]">
                      이전→이후
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)]">
                      사유
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)]">
                      담당자
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-gray-200)]">
                  {mockHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-4 py-3 text-sm text-[var(--color-gray-600)]">
                        {history.date}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {history.type === 'in' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <ArrowUpCircle size={12} />
                            입고
                          </span>
                        )}
                        {history.type === 'out' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-gray-100)] text-[var(--color-gray-700)]">
                            <ArrowDownCircle size={12} />
                            출고
                          </span>
                        )}
                        {history.type === 'adjust' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-gray-100)] text-[var(--color-gray-700)]">
                            <Edit size={12} />
                            조정
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-medium ${
                            history.quantity > 0 ? 'text-emerald-600' : 'text-[var(--color-gray-600)]'
                          }`}
                        >
                          {history.quantity > 0 ? '+' : ''}
                          {history.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-[var(--color-gray-600)]">
                        {history.beforeQty} → {history.afterQty}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-gray-900)]">
                        {history.reason}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-gray-600)]">
                        {history.user}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setHistoryModalOpen(false)}>
                닫기
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
