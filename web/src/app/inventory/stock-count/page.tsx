'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  ClipboardList,
  Plus,
  Search,
  Download,
  Check,
  Clock,
  X,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
} from 'lucide-react';

// 임시 데이터
const mockStockCountList = [
  {
    id: 'SC-2024-001',
    type: 'full',
    warehouse: '서울 본사 창고',
    plannedDate: '2024-01-20',
    completedDate: '2024-01-20',
    items: [
      { sku: 'SKU-001', name: '프리미엄 무선 이어폰', systemQty: 150, countedQty: 148, variance: -2 },
      { sku: 'SKU-002', name: '블루투스 스피커', systemQty: 25, countedQty: 25, variance: 0 },
      { sku: 'SKU-003', name: '스마트워치 스트랩', systemQty: 500, countedQty: 502, variance: 2 },
    ],
    totalItems: 45,
    countedItems: 45,
    varianceItems: 8,
    status: 'completed',
    assignee: '김실사',
    approver: '이관리',
    createdAt: '2024-01-15',
  },
  {
    id: 'SC-2024-002',
    type: 'cycle',
    warehouse: '부산 물류센터',
    plannedDate: '2024-01-22',
    completedDate: null,
    items: [
      { sku: 'SKU-004', name: 'USB-C 충전 케이블', systemQty: 200, countedQty: 195, variance: -5 },
      { sku: 'SKU-005', name: '노트북 파우치 15인치', systemQty: 80, countedQty: null, variance: null },
    ],
    totalItems: 12,
    countedItems: 8,
    varianceItems: 3,
    status: 'in_progress',
    assignee: '박실사',
    approver: null,
    createdAt: '2024-01-20',
  },
  {
    id: 'SC-2024-003',
    type: 'spot',
    warehouse: '서울 본사 창고',
    plannedDate: '2024-01-25',
    completedDate: null,
    items: [
      { sku: 'SKU-006', name: '무선 마우스', systemQty: 20, countedQty: null, variance: null },
    ],
    totalItems: 5,
    countedItems: 0,
    varianceItems: 0,
    status: 'pending',
    assignee: '최실사',
    approver: null,
    createdAt: '2024-01-22',
  },
  {
    id: 'SC-2024-004',
    type: 'full',
    warehouse: '인천 보관창고',
    plannedDate: '2024-01-15',
    completedDate: '2024-01-16',
    items: [
      { sku: 'SKU-007', name: '보조배터리', systemQty: 100, countedQty: 98, variance: -2 },
      { sku: 'SKU-008', name: '휴대폰 케이스', systemQty: 250, countedQty: 250, variance: 0 },
    ],
    totalItems: 30,
    countedItems: 30,
    varianceItems: 5,
    status: 'approved',
    assignee: '정실사',
    approver: '김관리',
    createdAt: '2024-01-10',
  },
];

const stockCountTypes = [
  { value: 'all', label: '전체' },
  { value: 'full', label: '전수실사' },
  { value: 'cycle', label: '순환실사' },
  { value: 'spot', label: '스팟실사' },
];

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '예정' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'approved', label: '승인완료' },
  { value: 'cancelled', label: '취소' },
];

export default function StockCountPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stockCountList, setStockCountList] = useState(mockStockCountList);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // 필터링
  const filteredList = stockCountList.filter((item) => {
    const matchSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || item.type === selectedType;
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchSearch && matchType && matchStatus;
  });

  // 통계
  const stats = {
    total: stockCountList.length,
    pending: stockCountList.filter((i) => i.status === 'pending').length,
    inProgress: stockCountList.filter((i) => i.status === 'in_progress').length,
    completed: stockCountList.filter((i) => i.status === 'completed' || i.status === 'approved').length,
    totalVariance: stockCountList.reduce((sum, i) => sum + i.varianceItems, 0),
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      full: '전수실사',
      cycle: '순환실사',
      spot: '스팟실사',
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
      in_progress: 'bg-blue-50 text-blue-700',
      completed: 'bg-emerald-50 text-emerald-700',
      approved: 'bg-emerald-50 text-emerald-700',
      cancelled: 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)]',
    };
    const labels: Record<string, string> = {
      pending: '예정',
      in_progress: '진행중',
      completed: '완료',
      approved: '승인완료',
      cancelled: '취소',
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock size={12} />,
      in_progress: <ClipboardList size={12} />,
      completed: <Check size={12} />,
      approved: <CheckCircle2 size={12} />,
      cancelled: <X size={12} />,
    };
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const getVarianceBadge = (variance: number | null) => {
    if (variance === null) return <span className="text-[var(--color-gray-400)]">-</span>;
    if (variance === 0) {
      return <span className="text-emerald-600">0</span>;
    }
    return (
      <span className={variance > 0 ? 'text-emerald-600' : 'text-amber-600'}>
        {variance > 0 ? `+${variance}` : variance}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-gray-900)]">재고 실사</h1>
            <p className="text-sm text-[var(--color-gray-500)] mt-1">
              재고 실사를 계획하고 결과를 관리하세요
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)]">
            <Plus size={16} />
            실사 등록
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
                <ClipboardList size={20} className="text-[var(--color-gray-500)]" />
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
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">예정</p>
                <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <ClipboardList size={20} className="text-blue-600" />
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
                <CheckCircle2 size={20} className="text-emerald-600" />
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
                <AlertTriangle size={20} className="text-[var(--color-gray-500)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-gray-500)]">차이 품목</p>
                <p className="text-xl font-bold text-[var(--color-gray-900)]">{stats.totalVariance}</p>
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
                placeholder="실사번호 또는 창고로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>

            {/* 유형 필터 */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              {stockCountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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

            <button className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-gray-700)] bg-white border border-[var(--color-gray-300)] rounded-lg hover:bg-[var(--color-gray-50)]">
              <Download size={16} />
              내보내기
            </button>
          </div>
        </div>

        {/* 실사 목록 테이블 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-gray-200)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    실사번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    창고
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    진행률
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    차이
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    예정일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
                    담당자
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
                        <span className="text-sm text-[var(--color-gray-900)]">{item.warehouse}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center">
                          <div className="w-full max-w-[100px] h-2 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-gray-400)] rounded-full"
                              style={{ width: `${(item.countedItems / item.totalItems) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-gray-500)] mt-1">
                            {item.countedItems}/{item.totalItems}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-medium ${item.varianceItems > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {item.varianceItems}건
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm text-[var(--color-gray-500)]">
                          {item.plannedDate}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[var(--color-gray-900)]">{item.assignee}</span>
                      </td>
                      <td className="px-4 py-4 text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye size={16} className="text-[var(--color-gray-500)]" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit size={16} className="text-[var(--color-gray-500)]" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-[var(--color-gray-100)] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <BarChart3 size={16} className="text-[var(--color-gray-500)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* 확장 행 - 상세 품목 */}
                    {expandedRow === item.id && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-[var(--color-gray-50)]">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[var(--color-gray-700)]">실사 품목 상세 (샘플)</p>
                              {item.approver && (
                                <p className="text-sm text-[var(--color-gray-500)]">
                                  승인자: <span className="text-[var(--color-gray-900)]">{item.approver}</span>
                                </p>
                              )}
                            </div>
                            <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-[var(--color-gray-100)]">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">SKU</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-gray-500)]">상품명</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">시스템수량</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">실사수량</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">차이</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-gray-500)]">상태</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-gray-100)]">
                                  {item.items.map((product, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 text-sm text-[var(--color-gray-600)]">{product.sku}</td>
                                      <td className="px-3 py-2 text-sm text-[var(--color-gray-900)]">{product.name}</td>
                                      <td className="px-3 py-2 text-sm text-center text-[var(--color-gray-600)]">{product.systemQty}</td>
                                      <td className="px-3 py-2 text-sm text-center">
                                        {product.countedQty !== null ? (
                                          <span className="text-[var(--color-gray-900)]">{product.countedQty}</span>
                                        ) : (
                                          <span className="text-[var(--color-gray-400)]">미실사</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-center font-medium">
                                        {getVarianceBadge(product.variance)}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        {product.countedQty !== null ? (
                                          product.variance === 0 ? (
                                            <CheckCircle2 size={16} className="inline text-emerald-500" />
                                          ) : (
                                            <AlertTriangle size={16} className="inline text-amber-500" />
                                          )
                                        ) : (
                                          <Clock size={16} className="inline text-[var(--color-gray-400)]" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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
              <ClipboardList size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
              <p className="text-[var(--color-gray-500)]">실사 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
