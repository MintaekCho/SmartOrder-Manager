'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Modal, Button } from '@/components/ui';
import {
  PackageMinus,
  Plus,
  Search,
  Download,
  Check,
  Clock,
  X,
  Eye,
  Truck,
  Package,
  ArrowRight,
  Trash2,
} from 'lucide-react';

interface StockOutItem {
  sku: string;
  name: string;
  requestedQty: number;
  pickedQty: number;
  location: string;
}

interface StockOut {
  id: string;
  type: 'sales' | 'transfer' | 'disposal' | 'return_supplier';
  orderId: string | null;
  destination: string;
  warehouse: string;
  requestDate: string;
  shippedDate: string | null;
  items: StockOutItem[];
  totalItems: number;
  totalQty: number;
  pickedQty: number;
  status: 'pending' | 'picking' | 'picked' | 'shipped' | 'delivered' | 'cancelled';
  carrier: string | null;
  trackingNo: string | null;
  createdBy: string;
  createdAt: string;
}

const mockStockOutList: StockOut[] = [
  {
    id: 'SO-2024-001',
    type: 'sales',
    orderId: 'ORD-2024-1234',
    destination: '김철수 (서울시 강남구)',
    warehouse: '서울 본사 창고',
    requestDate: '2024-01-20',
    shippedDate: '2024-01-20',
    items: [
      { sku: 'SKU-001', name: '프리미엄 무선 이어폰', requestedQty: 1, pickedQty: 1, location: 'A-01-01' },
    ],
    totalItems: 1,
    totalQty: 1,
    pickedQty: 1,
    status: 'shipped',
    carrier: 'CJ대한통운',
    trackingNo: '123456789012',
    createdBy: '김담당',
    createdAt: '2024-01-20',
  },
  {
    id: 'SO-2024-002',
    type: 'sales',
    orderId: 'ORD-2024-1235',
    destination: '이영희 (부산시 해운대구)',
    warehouse: '부산 물류센터',
    requestDate: '2024-01-21',
    shippedDate: null,
    items: [
      { sku: 'SKU-002', name: '블루투스 스피커', requestedQty: 2, pickedQty: 2, location: 'B-02-01' },
      { sku: 'SKU-003', name: '스마트워치 스트랩', requestedQty: 1, pickedQty: 1, location: 'B-02-03' },
    ],
    totalItems: 2,
    totalQty: 3,
    pickedQty: 3,
    status: 'picked',
    carrier: null,
    trackingNo: null,
    createdBy: '이담당',
    createdAt: '2024-01-21',
  },
  {
    id: 'SO-2024-003',
    type: 'transfer',
    orderId: null,
    destination: '부산 물류센터',
    warehouse: '서울 본사 창고',
    requestDate: '2024-01-22',
    shippedDate: null,
    items: [
      { sku: 'SKU-001', name: '프리미엄 무선 이어폰', requestedQty: 50, pickedQty: 0, location: 'A-01-01' },
      { sku: 'SKU-004', name: 'USB-C 충전 케이블', requestedQty: 100, pickedQty: 0, location: 'A-02-01' },
    ],
    totalItems: 2,
    totalQty: 150,
    pickedQty: 0,
    status: 'pending',
    carrier: null,
    trackingNo: null,
    createdBy: '박담당',
    createdAt: '2024-01-22',
  },
  {
    id: 'SO-2024-004',
    type: 'sales',
    orderId: 'ORD-2024-1236',
    destination: '박민수 (대전시 유성구)',
    warehouse: '서울 본사 창고',
    requestDate: '2024-01-19',
    shippedDate: '2024-01-19',
    items: [
      { sku: 'SKU-005', name: '노트북 파우치 15인치', requestedQty: 1, pickedQty: 1, location: 'A-03-01' },
      { sku: 'SKU-006', name: '무선 마우스', requestedQty: 1, pickedQty: 1, location: 'A-03-02' },
    ],
    totalItems: 2,
    totalQty: 2,
    pickedQty: 2,
    status: 'delivered',
    carrier: '한진택배',
    trackingNo: '987654321098',
    createdBy: '최담당',
    createdAt: '2024-01-19',
  },
];

const stockOutTypes = [
  { value: 'all', label: '전체' },
  { value: 'sales', label: '판매출고' },
  { value: 'transfer', label: '창고이동' },
  { value: 'disposal', label: '폐기' },
  { value: 'return_supplier', label: '반품(공급처)' },
];

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기' },
  { value: 'picking', label: '피킹중' },
  { value: 'picked', label: '피킹완료' },
  { value: 'shipped', label: '출고완료' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '취소' },
];

const warehouseOptions = ['서울 본사 창고', '부산 물류센터', '대전 물류센터', '광주 물류센터'];
const carrierOptions = ['CJ대한통운', '한진택배', '롯데택배', '로젠택배', '우체국택배'];

export default function StockOutPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [stockOutList, setStockOutList] = useState<StockOut[]>(mockStockOutList);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [selectedStockOut, setSelectedStockOut] = useState<StockOut | null>(null);

  const [createForm, setCreateForm] = useState({
    type: 'sales' as StockOut['type'],
    orderId: '',
    destination: '',
    warehouse: '서울 본사 창고',
    items: [] as { sku: string; name: string; requestedQty: number; location: string }[],
  });

  const [shipForm, setShipForm] = useState({
    carrier: '',
    trackingNo: '',
    pickedItems: [] as { sku: string; pickedQty: number }[],
  });

  const filteredList = stockOutList.filter((item) => {
    const matchSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.orderId && item.orderId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = selectedType === 'all' || item.type === selectedType;
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: stockOutList.length,
    pending: stockOutList.filter((i) => i.status === 'pending').length,
    inProgress: stockOutList.filter((i) => i.status === 'picking' || i.status === 'picked').length,
    completed: stockOutList.filter((i) => i.status === 'shipped' || i.status === 'delivered').length,
  };

  const handleViewDetail = (stockOut: StockOut) => {
    setSelectedStockOut(stockOut);
    setDetailModalOpen(true);
  };

  const handleOpenCreate = () => {
    setCreateForm({ type: 'sales', orderId: '', destination: '', warehouse: '서울 본사 창고', items: [] });
    setCreateModalOpen(true);
  };

  const addItemToForm = () => {
    setCreateForm({ ...createForm, items: [...createForm.items, { sku: '', name: '', requestedQty: 1, location: '' }] });
  };

  const removeItemFromForm = (index: number) => {
    setCreateForm({ ...createForm, items: createForm.items.filter((_, i) => i !== index) });
  };

  const handleCreateStockOut = () => {
    const newId = `SO-2024-${String(stockOutList.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const totalQty = createForm.items.reduce((sum, item) => sum + item.requestedQty, 0);

    const newStockOut: StockOut = {
      id: newId,
      type: createForm.type,
      orderId: createForm.orderId || null,
      destination: createForm.destination,
      warehouse: createForm.warehouse,
      requestDate: today,
      shippedDate: null,
      items: createForm.items.map((item) => ({ ...item, pickedQty: 0 })),
      totalItems: createForm.items.length,
      totalQty,
      pickedQty: 0,
      status: 'pending',
      carrier: null,
      trackingNo: null,
      createdBy: '현재사용자',
      createdAt: today,
    };

    setStockOutList([newStockOut, ...stockOutList]);
    setCreateModalOpen(false);
  };

  const handleOpenShip = (stockOut: StockOut) => {
    setSelectedStockOut(stockOut);
    setShipForm({
      carrier: stockOut.carrier || '',
      trackingNo: stockOut.trackingNo || '',
      pickedItems: stockOut.items.map((item) => ({ sku: item.sku, pickedQty: item.pickedQty || item.requestedQty })),
    });
    setShipModalOpen(true);
  };

  const handleCompleteShip = () => {
    if (!selectedStockOut) return;
    const totalPicked = shipForm.pickedItems.reduce((sum, item) => sum + item.pickedQty, 0);

    setStockOutList(
      stockOutList.map((item) =>
        item.id === selectedStockOut.id
          ? {
              ...item,
              status: 'shipped' as const,
              carrier: shipForm.carrier,
              trackingNo: shipForm.trackingNo,
              shippedDate: new Date().toISOString().split('T')[0],
              pickedQty: totalPicked,
              items: item.items.map((i) => {
                const pickedItem = shipForm.pickedItems.find((p) => p.sku === i.sku);
                return { ...i, pickedQty: pickedItem?.pickedQty || i.requestedQty };
              }),
            }
          : item
      )
    );
    setShipModalOpen(false);
    setSelectedStockOut(null);
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = { sales: '판매', transfer: '이동', disposal: '폐기', return_supplier: '반품' };
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-gray-100)] text-[var(--color-gray-600)]">
        {labels[type]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { style: string; label: string }> = {
      pending: { style: 'bg-amber-50 text-amber-700', label: '대기' },
      picking: { style: 'bg-blue-50 text-blue-700', label: '피킹중' },
      picked: { style: 'bg-blue-50 text-blue-700', label: '피킹완료' },
      shipped: { style: 'bg-emerald-50 text-emerald-700', label: '출고완료' },
      delivered: { style: 'bg-emerald-50 text-emerald-700', label: '배송완료' },
      cancelled: { style: 'bg-[var(--color-gray-100)] text-[var(--color-gray-400)]', label: '취소' },
    };
    const { style, label } = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>{label}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">출고 관리</h1>
            <p className="text-sm text-[var(--color-gray-500)] mt-1">출고 요청 및 처리 내역을 관리하세요</p>
          </div>
          <Button onClick={handleOpenCreate}><Plus size={16} className="mr-2" />출고 등록</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <PackageMinus size={20} className="text-[var(--color-gray-500)]" />
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
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">진행중</p>
                <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
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
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]" />
              <input type="text" placeholder="출고번호, 주문번호, 배송지로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
            </div>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg">
              {stockOutTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg">
              {statusFilters.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg" />
              <span className="text-[var(--color-gray-400)]">~</span>
              <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-gray-600)] bg-white border border-[var(--color-gray-300)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Download size={16} />내보내기
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-gray-200)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">출고번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">출고창고 → 목적지</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">품목/수량</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">요청일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-200)]">
                {filteredList.map((item) => (
                  <>
                    <tr key={item.id} className="hover:bg-[var(--color-gray-50)] cursor-pointer" onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}>
                      <td className="px-4 py-4"><span className="text-sm font-medium text-[var(--color-gray-900)]">{item.id}</span></td>
                      <td className="px-4 py-4">{getTypeBadge(item.type)}</td>
                      <td className="px-4 py-4"><span className="text-sm text-[var(--color-gray-600)]">{item.orderId || '-'}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--color-gray-500)]">{item.warehouse}</span>
                          <ArrowRight size={14} className="text-[var(--color-gray-400)]" />
                          <span className="text-[var(--color-gray-900)]">{item.destination}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center"><span className="text-sm text-[var(--color-gray-600)]">{item.totalItems}품목 / {item.pickedQty}/{item.totalQty}</span></td>
                      <td className="px-4 py-4 text-center"><span className="text-sm text-[var(--color-gray-500)]">{item.requestDate}</span></td>
                      <td className="px-4 py-4 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg" onClick={(e) => { e.stopPropagation(); handleViewDetail(item); }}><Eye size={16} className="text-[var(--color-gray-500)]" /></button>
                          {(item.status === 'pending' || item.status === 'picked') && (
                            <button className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg" onClick={(e) => { e.stopPropagation(); handleOpenShip(item); }}><Truck size={16} className="text-[var(--color-gray-500)]" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === item.id && (
                      <tr key={`${item.id}-expanded`}>
                        <td colSpan={8} className="px-4 py-4 bg-[var(--color-gray-50)]">
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-[var(--color-gray-700)]">출고 품목 상세</p>
                            <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-[var(--color-gray-50)]">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">SKU</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">상품명</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">위치</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">요청</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">피킹</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-gray-100)]">
                                  {item.items.map((product, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 text-sm text-[var(--color-gray-600)]">{product.sku}</td>
                                      <td className="px-3 py-2 text-sm text-[var(--color-gray-900)]">{product.name}</td>
                                      <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{product.location}</td>
                                      <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{product.requestedQty}</td>
                                      <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{product.pickedQty}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {item.carrier && <p className="text-sm text-[var(--color-gray-500)]">배송정보: {item.carrier} | {item.trackingNo}</p>}
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
              <PackageMinus size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
              <p className="text-[var(--color-gray-500)]">출고 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="출고 등록" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">출고 유형</label>
              <select value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as StockOut['type'] })} className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg">
                <option value="sales">판매출고</option>
                <option value="transfer">창고이동</option>
                <option value="disposal">폐기</option>
                <option value="return_supplier">반품(공급처)</option>
              </select>
            </div>
            {createForm.type === 'sales' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">주문번호</label>
                <input type="text" value={createForm.orderId} onChange={(e) => setCreateForm({ ...createForm, orderId: e.target.value })} placeholder="ORD-2024-XXXX" className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">출고창고</label>
              <select value={createForm.warehouse} onChange={(e) => setCreateForm({ ...createForm, warehouse: e.target.value })} className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg">
                {warehouseOptions.map((wh) => <option key={wh} value={wh}>{wh}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">목적지</label>
              <input type="text" value={createForm.destination} onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })} placeholder="배송지 또는 이동 창고" className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--color-gray-700)]">출고 품목</label>
              <button onClick={addItemToForm} className="text-sm text-[var(--color-primary-600)] hover:underline">+ 품목 추가</button>
            </div>
            {createForm.items.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--color-gray-300)] rounded-lg">
                <p className="text-sm text-[var(--color-gray-500)]">품목을 추가해주세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {createForm.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-[var(--color-gray-50)] rounded-lg">
                    <input type="text" value={item.sku} onChange={(e) => { const newItems = [...createForm.items]; newItems[index].sku = e.target.value; setCreateForm({ ...createForm, items: newItems }); }} placeholder="SKU" className="w-28 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded" />
                    <input type="text" value={item.name} onChange={(e) => { const newItems = [...createForm.items]; newItems[index].name = e.target.value; setCreateForm({ ...createForm, items: newItems }); }} placeholder="상품명" className="flex-1 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded" />
                    <input type="number" value={item.requestedQty} onChange={(e) => { const newItems = [...createForm.items]; newItems[index].requestedQty = parseInt(e.target.value) || 0; setCreateForm({ ...createForm, items: newItems }); }} placeholder="수량" className="w-20 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded" />
                    <input type="text" value={item.location} onChange={(e) => { const newItems = [...createForm.items]; newItems[index].location = e.target.value; setCreateForm({ ...createForm, items: newItems }); }} placeholder="위치" className="w-24 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded" />
                    <button onClick={() => removeItemFromForm(index)} className="p-1.5 text-[var(--color-gray-400)] hover:text-[var(--color-gray-600)]"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>취소</Button>
            <Button onClick={handleCreateStockOut} disabled={createForm.items.length === 0 || !createForm.destination}>등록</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="출고 상세" size="lg">
        {selectedStockOut && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-[var(--color-gray-500)]">출고번호</p><p className="font-medium text-[var(--color-gray-900)]">{selectedStockOut.id}</p></div>
              <div><p className="text-sm text-[var(--color-gray-500)]">상태</p><div className="mt-1">{getStatusBadge(selectedStockOut.status)}</div></div>
              <div><p className="text-sm text-[var(--color-gray-500)]">출고창고</p><p className="font-medium text-[var(--color-gray-900)]">{selectedStockOut.warehouse}</p></div>
              <div><p className="text-sm text-[var(--color-gray-500)]">목적지</p><p className="font-medium text-[var(--color-gray-900)]">{selectedStockOut.destination}</p></div>
            </div>
            {selectedStockOut.carrier && (
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-[var(--color-gray-500)]">택배사</p><p className="font-medium text-[var(--color-gray-900)]">{selectedStockOut.carrier}</p></div>
                <div><p className="text-sm text-[var(--color-gray-500)]">운송장번호</p><p className="font-medium text-[var(--color-gray-900)]">{selectedStockOut.trackingNo}</p></div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[var(--color-gray-700)] mb-2">출고 품목</p>
              <div className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--color-gray-50)]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">상품명</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">요청</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">피킹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-gray-100)]">
                    {selectedStockOut.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm text-[var(--color-gray-600)]">{item.sku}</td>
                        <td className="px-3 py-2 text-sm text-[var(--color-gray-900)]">{item.name}</td>
                        <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{item.requestedQty}</td>
                        <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{item.pickedQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>닫기</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={shipModalOpen} onClose={() => setShipModalOpen(false)} title="출고 처리" size="lg">
        {selectedStockOut && (
          <div className="space-y-4">
            <div className="p-3 bg-[var(--color-gray-50)] rounded-lg">
              <p className="text-sm text-[var(--color-gray-700)]"><strong>{selectedStockOut.id}</strong> 출고를 처리합니다.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">택배사</label>
                <select value={shipForm.carrier} onChange={(e) => setShipForm({ ...shipForm, carrier: e.target.value })} className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg">
                  <option value="">선택하세요</option>
                  {carrierOptions.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">운송장번호</label>
                <input type="text" value={shipForm.trackingNo} onChange={(e) => setShipForm({ ...shipForm, trackingNo: e.target.value })} placeholder="운송장 번호 입력" className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-gray-700)] mb-2">피킹 수량 확인</p>
              <div className="space-y-2">
                {selectedStockOut.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-[var(--color-gray-50)] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-gray-900)]">{item.name}</p>
                      <p className="text-xs text-[var(--color-gray-500)]">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--color-gray-500)]">요청: {item.requestedQty}</span>
                      <input type="number" value={shipForm.pickedItems[index]?.pickedQty || 0} onChange={(e) => { const newPickedItems = [...shipForm.pickedItems]; newPickedItems[index] = { ...newPickedItems[index], pickedQty: parseInt(e.target.value) || 0 }; setShipForm({ ...shipForm, pickedItems: newPickedItems }); }} className="w-20 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setShipModalOpen(false)}>취소</Button>
              <Button onClick={handleCompleteShip} disabled={!shipForm.carrier || !shipForm.trackingNo}>출고 완료</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
