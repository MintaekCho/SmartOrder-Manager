'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Modal, Button } from '@/components/ui';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Check,
  Clock,
  X,
  Eye,
  Edit,
  TrendingUp,
  User,
  Trash2,
  Banknote,
} from 'lucide-react';

interface SalesItem {
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

interface Sale {
  id: string;
  date: string;
  customer: string;
  customerCode: string;
  items: SalesItem[];
  totalItems: number;
  totalQty: number;
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'refunded';
  paymentDate: string | null;
  paymentMethod: string | null;
  note: string;
}

// 임시 데이터
const mockSales: Sale[] = [
  {
    id: 'SAL-2024-001',
    date: '2024-01-20',
    customer: '(주)테크솔루션',
    customerCode: 'C-001',
    items: [
      { name: '프리미엄 무선 이어폰', qty: 20, unitPrice: 45000, amount: 900000 },
      { name: '블루투스 스피커', qty: 10, unitPrice: 75000, amount: 750000 },
    ],
    totalItems: 2,
    totalQty: 30,
    subtotal: 1650000,
    tax: 165000,
    totalAmount: 1815000,
    status: 'paid',
    paymentDate: '2024-01-20',
    paymentMethod: '계좌이체',
    note: '',
  },
  {
    id: 'SAL-2024-002',
    date: '2024-01-19',
    customer: '스마트스토어',
    customerCode: 'C-002',
    items: [
      { name: 'USB-C 충전 케이블', qty: 100, unitPrice: 8000, amount: 800000 },
      { name: '스마트워치 스트랩', qty: 50, unitPrice: 12000, amount: 600000 },
    ],
    totalItems: 2,
    totalQty: 150,
    subtotal: 1400000,
    tax: 140000,
    totalAmount: 1540000,
    status: 'pending',
    paymentDate: null,
    paymentMethod: null,
    note: '30일 후 결제',
  },
  {
    id: 'SAL-2024-003',
    date: '2024-01-18',
    customer: '이커머스몰',
    customerCode: 'C-003',
    items: [
      { name: '노트북 파우치 15인치', qty: 30, unitPrice: 25000, amount: 750000 },
    ],
    totalItems: 1,
    totalQty: 30,
    subtotal: 750000,
    tax: 75000,
    totalAmount: 825000,
    status: 'paid',
    paymentDate: '2024-01-18',
    paymentMethod: '카드결제',
    note: '',
  },
  {
    id: 'SAL-2024-004',
    date: '2024-01-15',
    customer: '개인구매자',
    customerCode: 'C-004',
    items: [
      { name: '무선 마우스', qty: 5, unitPrice: 28000, amount: 140000 },
      { name: '보조배터리', qty: 3, unitPrice: 18000, amount: 54000 },
    ],
    totalItems: 2,
    totalQty: 8,
    subtotal: 194000,
    tax: 19400,
    totalAmount: 213400,
    status: 'refunded',
    paymentDate: '2024-01-15',
    paymentMethod: '카드결제',
    note: '환불 처리 완료',
  },
];

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '미수금' },
  { value: 'paid', label: '입금완료' },
  { value: 'refunded', label: '환불' },
];

const customerOptions = [
  { code: 'C-001', name: '(주)테크솔루션' },
  { code: 'C-002', name: '스마트스토어' },
  { code: 'C-003', name: '이커머스몰' },
  { code: 'C-004', name: '개인구매자' },
  { code: 'C-005', name: '(주)디지털마켓' },
];

const paymentMethods = ['계좌이체', '카드결제', '현금결제'];

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // 등록 폼
  const [createForm, setCreateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    customer: '',
    customerCode: '',
    items: [] as { name: string; qty: number; unitPrice: number }[],
    note: '',
  });

  // 입금 폼
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
  });

  // 필터링
  const filteredList = sales.filter((item) => {
    const matchSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // 통계
  const stats = {
    total: sales.length,
    pending: sales.filter((s) => s.status === 'pending').length,
    paid: sales.filter((s) => s.status === 'paid').length,
    totalAmount: sales.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.totalAmount, 0),
    pendingAmount: sales.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.totalAmount, 0),
  };

  // 상세보기
  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailModalOpen(true);
  };

  // 등록 모달 열기
  const handleOpenCreate = () => {
    setCreateForm({
      date: new Date().toISOString().split('T')[0],
      customer: '',
      customerCode: '',
      items: [],
      note: '',
    });
    setCreateModalOpen(true);
  };

  // 품목 추가
  const addItemToForm = () => {
    setCreateForm({
      ...createForm,
      items: [...createForm.items, { name: '', qty: 1, unitPrice: 0 }],
    });
  };

  // 품목 삭제
  const removeItemFromForm = (index: number) => {
    setCreateForm({
      ...createForm,
      items: createForm.items.filter((_, i) => i !== index),
    });
  };

  // 고객 선택
  const handleCustomerSelect = (customerCode: string) => {
    const customer = customerOptions.find((c) => c.code === customerCode);
    if (customer) {
      setCreateForm({
        ...createForm,
        customerCode: customer.code,
        customer: customer.name,
      });
    }
  };

  // 매출 등록
  const handleCreate = () => {
    const newId = `SAL-2024-${String(sales.length + 1).padStart(3, '0')}`;
    const items = createForm.items.map((item) => ({
      ...item,
      amount: item.qty * item.unitPrice,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = Math.round(subtotal * 0.1);

    const newSale: Sale = {
      id: newId,
      date: createForm.date,
      customer: createForm.customer,
      customerCode: createForm.customerCode,
      items,
      totalItems: items.length,
      totalQty: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      tax,
      totalAmount: subtotal + tax,
      status: 'pending',
      paymentDate: null,
      paymentMethod: null,
      note: createForm.note,
    };

    setSales([newSale, ...sales]);
    setCreateModalOpen(false);
  };

  // 입금 모달 열기
  const handleOpenPayment = (sale: Sale) => {
    setSelectedSale(sale);
    setPaymentForm({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
    });
    setPaymentModalOpen(true);
  };

  // 입금 처리
  const handlePayment = () => {
    if (!selectedSale) return;

    setSales(
      sales.map((s) =>
        s.id === selectedSale.id
          ? {
              ...s,
              status: 'paid' as const,
              paymentDate: paymentForm.paymentDate,
              paymentMethod: paymentForm.paymentMethod,
            }
          : s
      )
    );
    setPaymentModalOpen(false);
    setSelectedSale(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600',
      paid: 'bg-emerald-50 text-emerald-600',
      refunded: 'bg-[var(--color-gray-100)] text-[var(--color-gray-500)]',
    };
    const labels: Record<string, string> = {
      pending: '미수금',
      paid: '입금완료',
      refunded: '환불',
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock size={12} />,
      paid: <Check size={12} />,
      refunded: <X size={12} />,
    };
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">매출 관리</h1>
            <p className="text-sm text-[var(--color-gray-500)] mt-1">
              고객에 대한 매출 내역을 관리하세요
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus size={16} className="mr-2" />
            매출 등록
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">전체 매출</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">{stats.total}건</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">미수금</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">{stats.pending}건</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">입금 완료</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  ₩{(stats.totalAmount / 10000).toLocaleString()}만
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">미수금 금액</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">
                  ₩{(stats.pendingAmount / 10000).toLocaleString()}만
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]" />
              <input
                type="text"
                placeholder="매출번호 또는 고객으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>

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

        {/* 매출 목록 테이블 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-gray-200)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">매출번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">일자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase">고객</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">품목/수량</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-gray-500)] uppercase">공급가</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-gray-500)] uppercase">합계</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase">작업</th>
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
                        <span className="text-sm font-medium text-[var(--color-primary-600)]">{item.id}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--color-gray-600)]">{item.date}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[var(--color-gray-100)] rounded-full flex items-center justify-center">
                            <User size={14} className="text-[var(--color-gray-500)]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-gray-900)]">{item.customer}</p>
                            <p className="text-xs text-[var(--color-gray-500)]">{item.customerCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-[var(--color-gray-600)]">
                        {item.totalItems}품목 / {item.totalQty}개
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-[var(--color-gray-600)]">
                        ₩{item.subtotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-[var(--color-gray-900)]">
                        ₩{item.totalAmount.toLocaleString()}
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
                          {item.status === 'pending' && (
                            <button
                              className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPayment(item);
                              }}
                              title="입금처리"
                            >
                              <Banknote size={16} className="text-[var(--color-gray-500)]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === item.id && (
                      <tr key={`${item.id}-expanded`}>
                        <td colSpan={8} className="px-4 py-4 bg-[var(--color-gray-50)]">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[var(--color-gray-700)]">매출 품목 상세</p>
                              {item.paymentDate && (
                                <p className="text-sm text-[var(--color-gray-500)]">
                                  입금일: {item.paymentDate} ({item.paymentMethod})
                                </p>
                              )}
                            </div>
                            <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-[var(--color-gray-100)]">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">품목명</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">수량</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-gray-500)]">단가</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-gray-500)]">금액</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-gray-100)]">
                                  {item.items.map((product, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 text-sm text-[var(--color-gray-900)]">{product.name}</td>
                                      <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{product.qty}</td>
                                      <td className="px-3 py-2 text-sm text-right text-[var(--color-gray-600)]">₩{product.unitPrice.toLocaleString()}</td>
                                      <td className="px-3 py-2 text-sm text-right font-medium text-[var(--color-gray-900)]">₩{product.amount.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-[var(--color-gray-50)]">
                                    <td colSpan={3} className="px-3 py-2 text-sm text-right text-[var(--color-gray-500)]">공급가액</td>
                                    <td className="px-3 py-2 text-sm text-right font-medium">₩{item.subtotal.toLocaleString()}</td>
                                  </tr>
                                  <tr className="bg-[var(--color-gray-50)]">
                                    <td colSpan={3} className="px-3 py-2 text-sm text-right text-[var(--color-gray-500)]">부가세</td>
                                    <td className="px-3 py-2 text-sm text-right font-medium">₩{item.tax.toLocaleString()}</td>
                                  </tr>
                                  <tr className="bg-[var(--color-gray-100)]">
                                    <td colSpan={3} className="px-3 py-2 text-sm text-right font-medium text-[var(--color-gray-700)]">합계</td>
                                    <td className="px-3 py-2 text-sm text-right font-bold text-[var(--color-primary-600)]">₩{item.totalAmount.toLocaleString()}</td>
                                  </tr>
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
              <CreditCard size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
              <p className="text-[var(--color-gray-500)]">매출 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 매출 등록 모달 */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="매출 등록" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                매출일자 *
              </label>
              <input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                고객 *
              </label>
              <select
                value={createForm.customerCode}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="">선택하세요</option>
                {customerOptions.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 품목 목록 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--color-gray-700)]">
                매출 품목
              </label>
              <button
                onClick={addItemToForm}
                className="text-sm text-[var(--color-primary-600)] hover:underline"
              >
                + 품목 추가
              </button>
            </div>
            {createForm.items.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--color-gray-300)] rounded-lg">
                <p className="text-sm text-[var(--color-gray-500)]">품목을 추가해주세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {createForm.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-[var(--color-gray-50)] rounded-lg">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...createForm.items];
                        newItems[index].name = e.target.value;
                        setCreateForm({ ...createForm, items: newItems });
                      }}
                      placeholder="품목명"
                      className="flex-1 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const newItems = [...createForm.items];
                        newItems[index].qty = parseInt(e.target.value) || 0;
                        setCreateForm({ ...createForm, items: newItems });
                      }}
                      placeholder="수량"
                      className="w-20 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newItems = [...createForm.items];
                        newItems[index].unitPrice = parseInt(e.target.value) || 0;
                        setCreateForm({ ...createForm, items: newItems });
                      }}
                      placeholder="단가"
                      className="w-28 px-2 py-1.5 text-sm border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                    <span className="text-sm text-[var(--color-gray-600)] w-28 text-right">
                      ₩{(item.qty * item.unitPrice).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeItemFromForm(index)}
                      className="p-1.5 text-[var(--color-gray-400)] hover:bg-[var(--color-gray-100)] rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t border-[var(--color-gray-200)]">
                  <div className="text-right">
                    <p className="text-sm text-[var(--color-gray-500)]">
                      공급가액: ₩{createForm.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--color-gray-500)]">
                      부가세: ₩{Math.round(createForm.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) * 0.1).toLocaleString()}
                    </p>
                    <p className="text-base font-bold text-[var(--color-gray-900)]">
                      합계: ₩{Math.round(createForm.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) * 1.1).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
              비고
            </label>
            <textarea
              value={createForm.note}
              onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
              placeholder="메모 입력"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createForm.items.length === 0 || !createForm.customerCode}
            >
              등록
            </Button>
          </div>
        </div>
      </Modal>

      {/* 상세보기 모달 */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="매출 상세" size="lg">
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">매출번호</p>
                <p className="font-medium text-[var(--color-gray-900)]">{selectedSale.id}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">상태</p>
                <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">매출일자</p>
                <p className="font-medium text-[var(--color-gray-900)]">{selectedSale.date}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">고객</p>
                <p className="font-medium text-[var(--color-gray-900)]">{selectedSale.customer}</p>
              </div>
            </div>

            {selectedSale.paymentDate && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">입금일</p>
                  <p className="font-medium text-[var(--color-gray-900)]">{selectedSale.paymentDate}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-gray-500)]">결제방법</p>
                  <p className="font-medium text-[var(--color-gray-900)]">{selectedSale.paymentMethod}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-[var(--color-gray-700)] mb-2">매출 품목</p>
              <div className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--color-gray-50)]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">품목명</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">수량</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-gray-500)]">단가</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-[var(--color-gray-500)]">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-gray-100)]">
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm">{item.name}</td>
                        <td className="px-3 py-2 text-sm text-center">{item.qty}</td>
                        <td className="px-3 py-2 text-sm text-right">₩{item.unitPrice.toLocaleString()}</td>
                        <td className="px-3 py-2 text-sm text-right font-medium">₩{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--color-gray-50)]">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-sm text-right">공급가액</td>
                      <td className="px-3 py-2 text-sm text-right font-medium">₩{selectedSale.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-sm text-right">부가세</td>
                      <td className="px-3 py-2 text-sm text-right font-medium">₩{selectedSale.tax.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-[var(--color-gray-100)]">
                      <td colSpan={3} className="px-3 py-2 text-sm text-right font-bold">합계</td>
                      <td className="px-3 py-2 text-sm text-right font-bold text-[var(--color-primary-600)]">₩{selectedSale.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedSale.note && (
              <div>
                <p className="text-sm text-[var(--color-gray-500)]">비고</p>
                <p className="font-medium text-[var(--color-gray-900)]">{selectedSale.note}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                닫기
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 입금 처리 모달 */}
      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="입금 처리" size="md">
        {selectedSale && (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-gray-50)] rounded-lg border border-[var(--color-gray-200)]">
              <p className="text-sm text-[var(--color-gray-700)]">
                <strong>{selectedSale.id}</strong> 매출 건의 입금을 처리합니다.
              </p>
              <p className="text-lg font-bold text-[var(--color-gray-900)] mt-1">
                입금 금액: ₩{selectedSale.totalAmount.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  입금일 *
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  결제방법 *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="">선택하세요</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
              <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!paymentForm.paymentMethod}
              >
                <Banknote size={16} className="mr-2" />
                입금 완료
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
