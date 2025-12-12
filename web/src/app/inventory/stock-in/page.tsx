'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Modal, Button } from '@/components/ui';
import {
  PackagePlus,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Check,
  Clock,
  X,
  Eye,
  Edit,
  Truck,
  Package,
  Save,
  Trash2,
} from 'lucide-react';

interface StockInItem {
  sku: string;
  name: string;
  expectedQty: number;
  receivedQty: number;
}

interface StockIn {
  id: string;
  type: 'purchase' | 'return' | 'transfer';
  supplier: string;
  warehouse: string;
  expectedDate: string;
  receivedDate: string | null;
  items: StockInItem[];
  totalItems: number;
  totalQty: number;
  receivedQty: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  note: string;
  createdBy: string;
  createdAt: string;
}

// 임시 데이터
const initialStockInList: StockIn[] = [
  {
    id: 'SI-2024-001',
    type: 'purchase',
    supplier: '삼성전자',
    warehouse: '서울 본사 창고',
    expectedDate: '2024-01-20',
    receivedDate: '2024-01-20',
    items: [
      { sku: 'SKU-001', name: '프리미엄 무선 이어폰', expectedQty: 100, receivedQty: 100 },
      { sku: 'SKU-002', name: '블루투스 스피커', expectedQty: 50, receivedQty: 48 },
    ],
    totalItems: 2,
    totalQty: 150,
    receivedQty: 148,
    status: 'completed',
    note: '정상 입고 완료',
    createdBy: '김담당',
    createdAt: '2024-01-18',
  },
  {
    id: 'SI-2024-002',
    type: 'return',
    supplier: '고객반품',
    warehouse: '서울 본사 창고',
    expectedDate: '2024-01-22',
    receivedDate: null,
    items: [
      { sku: 'SKU-003', name: '스마트워치 스트랩', expectedQty: 5, receivedQty: 0 },
    ],
    totalItems: 1,
    totalQty: 5,
    receivedQty: 0,
    status: 'pending',
    note: '불량 반품',
    createdBy: '이담당',
    createdAt: '2024-01-21',
  },
  {
    id: 'SI-2024-003',
    type: 'purchase',
    supplier: 'LG전자',
    warehouse: '부산 물류센터',
    expectedDate: '2024-01-19',
    receivedDate: '2024-01-19',
    items: [
      { sku: 'SKU-004', name: 'USB-C 충전 케이블', expectedQty: 200, receivedQty: 200 },
      { sku: 'SKU-005', name: '노트북 파우치 15인치', expectedQty: 80, receivedQty: 80 },
      { sku: 'SKU-006', name: '무선 마우스', expectedQty: 100, receivedQty: 95 },
    ],
    totalItems: 3,
    totalQty: 380,
    receivedQty: 375,
    status: 'completed',
    note: '무선마우스 5개 파손',
    createdBy: '박담당',
    createdAt: '2024-01-17',
  },
  {
    id: 'SI-2024-004',
    type: 'transfer',
    supplier: '서울 본사 창고',
    warehouse: '부산 물류센터',
    expectedDate: '2024-01-23',
    receivedDate: null,
    items: [
      { sku: 'SKU-001', name: '프리미엄 무선 이어폰', expectedQty: 30, receivedQty: 0 },
    ],
    totalItems: 1,
    totalQty: 30,
    receivedQty: 0,
    status: 'in_transit',
    note: '물류 이동 중',
    createdBy: '최담당',
    createdAt: '2024-01-22',
  },
];

const stockInTypes = [
  { value: 'all', label: '전체' },
  { value: 'purchase', label: '구매입고' },
  { value: 'return', label: '반품입고' },
  { value: 'transfer', label: '창고이동' },
];

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기' },
  { value: 'in_transit', label: '운송중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
];

const warehouses = ['서울 본사 창고', '부산 물류센터'];
const suppliers = ['삼성전자', 'LG전자', '애플코리아', '기타'];

export default function StockInPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [stockInList, setStockInList] = useState<StockIn[]>(initialStockInList);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedStockIn, setSelectedStockIn] = useState<StockIn | null>(null);

  // 새 입고 폼
  const [newStockIn, setNewStockIn] = useState({
    type: 'purchase' as 'purchase' | 'return' | 'transfer',
    supplier: '',
    warehouse: '',
    expectedDate: '',
    note: '',
    items: [{ sku: '', name: '', expectedQty: 0 }],
  });

  // 입고 처리 폼
  const [receiveForm, setReceiveForm] = useState<StockInItem[]>([]);

  // 필터링
  const filteredList = stockInList.filter((item) => {
    const matchSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || item.type === selectedType;
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchSearch && matchType && matchStatus;
  });

  // 통계
  const stats = {
    total: stockInList.length,
    pending: stockInList.filter((i) => i.status === 'pending').length,
    inTransit: stockInList.filter((i) => i.status === 'in_transit').length,
    completed: stockInList.filter((i) => i.status === 'completed').length,
    totalQty: stockInList.reduce((sum, i) => sum + i.totalQty, 0),
    receivedQty: stockInList.reduce((sum, i) => sum + i.receivedQty, 0),
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      purchase: '구매입고',
      return: '반품입고',
      transfer: '창고이동',
    };
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-gray-100)] text-[var(--color-gray-700)]">
        {labels[type]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700',
      in_transit: 'bg-blue-50 text-blue-700',
      completed: 'bg-emerald-50 text-emerald-700',
      cancelled: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
    };
    const labels: Record<string, string> = {
      pending: '대기',
      in_transit: '운송중',
      completed: '완료',
      cancelled: '취소',
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock size={12} />,
      in_transit: <Truck size={12} />,
      completed: <Check size={12} />,
      cancelled: <X size={12} />,
    };
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const handleViewDetail = (item: StockIn) => {
    setSelectedStockIn(item);
    setDetailModalOpen(true);
  };

  const handleReceive = (item: StockIn) => {
    setSelectedStockIn(item);
    setReceiveForm(item.items.map((i) => ({ ...i })));
    setReceiveModalOpen(true);
  };

  const handleCreateStockIn = () => {
    const newId = `SI-2024-${String(stockInList.length + 1).padStart(3, '0')}`;
    const totalQty = newStockIn.items.reduce((sum, item) => sum + item.expectedQty, 0);

    const newItem: StockIn = {
      id: newId,
      type: newStockIn.type,
      supplier: newStockIn.supplier,
      warehouse: newStockIn.warehouse,
      expectedDate: newStockIn.expectedDate,
      receivedDate: null,
      items: newStockIn.items.map((item) => ({
        ...item,
        receivedQty: 0,
      })),
      totalItems: newStockIn.items.length,
      totalQty,
      receivedQty: 0,
      status: 'pending',
      note: newStockIn.note,
      createdBy: '현재 사용자',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setStockInList([newItem, ...stockInList]);
    setCreateModalOpen(false);
    setNewStockIn({
      type: 'purchase',
      supplier: '',
      warehouse: '',
      expectedDate: '',
      note: '',
      items: [{ sku: '', name: '', expectedQty: 0 }],
    });
  };

  const handleCompleteReceive = () => {
    if (!selectedStockIn) return;

    const receivedQty = receiveForm.reduce((sum, item) => sum + item.receivedQty, 0);

    setStockInList((prev) =>
      prev.map((item) =>
        item.id === selectedStockIn.id
          ? {
              ...item,
              items: receiveForm,
              receivedQty,
              receivedDate: new Date().toISOString().split('T')[0],
              status: 'completed' as const,
            }
          : item
      )
    );

    setReceiveModalOpen(false);
    setSelectedStockIn(null);
  };

  const addItemToForm = () => {
    setNewStockIn({
      ...newStockIn,
      items: [...newStockIn.items, { sku: '', name: '', expectedQty: 0 }],
    });
  };

  const removeItemFromForm = (index: number) => {
    setNewStockIn({
      ...newStockIn,
      items: newStockIn.items.filter((_, i) => i !== index),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">입고 관리</h1>
            <p className="text-sm text-[var(--color-gray-500)] mt-1">
              입고 예정 및 완료된 입고 내역을 관리하세요
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)]"
          >
            <Plus size={16} />
            입고 등록
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <PackagePlus size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">전체</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">대기</p>
                <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Truck size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">운송중</p>
                <p className="text-xl font-bold text-blue-600">{stats.inTransit}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Check size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">완료</p>
                <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <Package size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">예정수량</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  {stats.totalQty.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <PackagePlus size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">입고완료</p>
                <p className="text-xl font-bold text-emerald-600">
                  {stats.receivedQty.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]"
              />
              <input
                type="text"
                placeholder="입고번호 또는 공급처로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {stockInTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

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

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
              <span className="text-[var(--color-gray-400)]">~</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>

            <button className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-gray-700)] bg-white border border-[var(--color-gray-300)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Download size={16} />
              내보내기
            </button>
          </div>
        </div>

        {/* 입고 목록 테이블 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-gray-200)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    입고번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    공급처/출발지
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    입고 창고
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    품목/수량
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    예정일
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
                {filteredList.map((item) => (
                  <>
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--color-gray-50)] cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                    >
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-[var(--color-primary-600)]">
                          {item.id}
                        </span>
                      </td>
                      <td className="px-4 py-4">{getTypeBadge(item.type)}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--color-gray-900)]">{item.supplier}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--color-gray-900)]">{item.warehouse}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-[var(--color-gray-900)]">{item.totalItems}품목</span>
                          <span className="text-[var(--color-gray-400)] mx-1">/</span>
                          <span className={item.receivedQty < item.totalQty ? 'text-amber-600' : 'text-emerald-600'}>
                            {item.receivedQty}/{item.totalQty}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm text-[var(--color-gray-500)]">
                          {item.expectedDate}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(item);
                            }}
                            title="상세보기"
                          >
                            <Eye size={16} className="text-[var(--color-gray-500)]" />
                          </button>
                          {item.status !== 'completed' && item.status !== 'cancelled' && (
                            <button
                              className="p-1.5 hover:bg-emerald-50 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReceive(item);
                              }}
                              title="입고처리"
                            >
                              <Check size={16} className="text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === item.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-[var(--color-gray-50)]">
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-[var(--color-gray-700)]">입고 품목 상세</p>
                            <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-[var(--color-gray-100)]">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">SKU</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">상품명</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">예정수량</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">입고수량</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">차이</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-gray-100)]">
                                  {item.items.map((product, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 text-sm text-[var(--color-gray-600)]">{product.sku}</td>
                                      <td className="px-3 py-2 text-sm text-[var(--color-gray-900)]">{product.name}</td>
                                      <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{product.expectedQty}</td>
                                      <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-900)]">{product.receivedQty}</td>
                                      <td className="px-3 py-2 text-sm text-center">
                                        <span className={product.receivedQty - product.expectedQty !== 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                          {product.receivedQty - product.expectedQty}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {item.note && (
                              <p className="text-sm text-[var(--color-gray-500)]">
                                <span className="font-medium">비고:</span> {item.note}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {filteredList.length === 0 && (
            <div className="text-center py-12">
              <PackagePlus size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
              <p className="text-[var(--color-gray-500)]">입고 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 입고 등록 모달 */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="입고 등록"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                입고 유형
              </label>
              <select
                value={newStockIn.type}
                onChange={(e) => setNewStockIn({ ...newStockIn, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="purchase">구매입고</option>
                <option value="return">반품입고</option>
                <option value="transfer">창고이동</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                입고 예정일
              </label>
              <input
                type="date"
                value={newStockIn.expectedDate}
                onChange={(e) => setNewStockIn({ ...newStockIn, expectedDate: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                공급처
              </label>
              <select
                value={newStockIn.supplier}
                onChange={(e) => setNewStockIn({ ...newStockIn, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="">선택하세요</option>
                {suppliers.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                입고 창고
              </label>
              <select
                value={newStockIn.warehouse}
                onChange={(e) => setNewStockIn({ ...newStockIn, warehouse: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="">선택하세요</option>
                {warehouses.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--color-gray-700)]">
                입고 품목
              </label>
              <button
                onClick={addItemToForm}
                className="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
              >
                + 품목 추가
              </button>
            </div>
            <div className="space-y-3">
              {newStockIn.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-[var(--color-gray-50)] rounded-lg">
                  <input
                    type="text"
                    placeholder="SKU"
                    value={item.sku}
                    onChange={(e) => {
                      const newItems = [...newStockIn.items];
                      newItems[index].sku = e.target.value;
                      setNewStockIn({ ...newStockIn, items: newItems });
                    }}
                    className="w-32 px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  <input
                    type="text"
                    placeholder="상품명"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...newStockIn.items];
                      newItems[index].name = e.target.value;
                      setNewStockIn({ ...newStockIn, items: newItems });
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  <input
                    type="number"
                    placeholder="수량"
                    value={item.expectedQty || ''}
                    onChange={(e) => {
                      const newItems = [...newStockIn.items];
                      newItems[index].expectedQty = parseInt(e.target.value) || 0;
                      setNewStockIn({ ...newStockIn, items: newItems });
                    }}
                    className="w-24 px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {newStockIn.items.length > 1 && (
                    <button
                      onClick={() => removeItemFromForm(index)}
                      className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg"
                    >
                      <Trash2 size={16} className="text-[var(--color-gray-400)]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
              비고
            </label>
            <textarea
              value={newStockIn.note}
              onChange={(e) => setNewStockIn({ ...newStockIn, note: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              placeholder="특이사항을 입력하세요"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-gray-200)]">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateStockIn}>
              <Save size={16} className="mr-2" />
              등록
            </Button>
          </div>
        </div>
      </Modal>

      {/* 상세보기 모달 */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="입고 상세정보"
        size="lg"
      >
        {selectedStockIn && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  입고번호
                </label>
                <p className="text-[var(--color-gray-900)] font-medium">{selectedStockIn.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  상태
                </label>
                {getStatusBadge(selectedStockIn.status)}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  유형
                </label>
                {getTypeBadge(selectedStockIn.type)}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  공급처
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedStockIn.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  입고 창고
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedStockIn.warehouse}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  예정일
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedStockIn.expectedDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  입고일
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedStockIn.receivedDate || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-500)] mb-1">
                  등록자
                </label>
                <p className="text-[var(--color-gray-900)]">{selectedStockIn.createdBy}</p>
              </div>
            </div>

            <div className="border-t border-[var(--color-gray-200)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3">입고 품목</h3>
              <div className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--color-gray-50)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)]">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)]">상품명</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)]">예정수량</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)]">입고수량</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-gray-200)]">
                    {selectedStockIn.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-[var(--color-gray-600)]">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-[var(--color-gray-900)]">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-[var(--color-gray-600)]">{item.expectedQty}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-[var(--color-gray-900)]">{item.receivedQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedStockIn.note && (
              <div className="border-t border-[var(--color-gray-200)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-2">비고</h3>
                <p className="text-sm text-[var(--color-gray-600)]">{selectedStockIn.note}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                닫기
              </Button>
              {selectedStockIn.status !== 'completed' && selectedStockIn.status !== 'cancelled' && (
                <Button onClick={() => { setDetailModalOpen(false); handleReceive(selectedStockIn); }}>
                  <Check size={16} className="mr-2" />
                  입고처리
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 입고 처리 모달 */}
      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title="입고 처리"
        size="lg"
      >
        {selectedStockIn && (
          <div className="space-y-6">
            <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--color-gray-900)]">{selectedStockIn.id}</p>
                  <p className="text-sm text-[var(--color-gray-500)]">{selectedStockIn.supplier} → {selectedStockIn.warehouse}</p>
                </div>
                {getTypeBadge(selectedStockIn.type)}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3">입고 수량 입력</h3>
              <div className="space-y-3">
                {receiveForm.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-[var(--color-gray-50)] rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-[var(--color-gray-900)]">{item.name}</p>
                      <p className="text-sm text-[var(--color-gray-500)]">{item.sku}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[var(--color-gray-500)] mb-1">예정</p>
                      <p className="font-medium text-[var(--color-gray-900)]">{item.expectedQty}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[var(--color-gray-500)] mb-1">입고수량</p>
                      <input
                        type="number"
                        value={item.receivedQty}
                        onChange={(e) => {
                          const newForm = [...receiveForm];
                          newForm[index].receivedQty = parseInt(e.target.value) || 0;
                          setReceiveForm(newForm);
                        }}
                        className="w-24 px-3 py-2 text-center text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-gray-600)]">총 입고 예정</span>
                <span className="font-medium text-[var(--color-gray-900)]">{selectedStockIn.totalQty}개</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-[var(--color-gray-600)]">실제 입고</span>
                <span className="font-medium text-[var(--color-gray-900)]">
                  {receiveForm.reduce((sum, item) => sum + item.receivedQty, 0)}개
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setReceiveModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCompleteReceive}>
                <Check size={16} className="mr-2" />
                입고 완료
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
