'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, DataTable } from '@/components/ui';
import {
  Search,
  Plus,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Edit2,
  Trash2,
  Star,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Filter,
  MoreVertical,
} from 'lucide-react';

// 공급처 타입
type SupplierType = 'B2B' | 'PERSONAL' | 'MANUFACTURER';
type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  status: SupplierStatus;
  contactName: string;
  phone: string;
  email: string;
  website?: string;
  address?: string;
  categories: string[];
  rating: number;
  totalOrders: number;
  avgDeliveryDays: number;
  minOrderAmount?: number;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
  lastOrderAt?: string;
}

// Mock 공급처 데이터
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: '도매꾹',
    type: 'B2B',
    status: 'ACTIVE',
    contactName: '고객센터',
    phone: '1688-8720',
    email: 'help@domeggook.com',
    website: 'https://domeggook.com',
    address: '서울시 금천구 가산디지털1로',
    categories: ['생활용품', '주방용품', '문구', '잡화'],
    rating: 4.2,
    totalOrders: 156,
    avgDeliveryDays: 2,
    minOrderAmount: 30000,
    paymentTerms: '선결제',
    createdAt: '2024-01-01',
    lastOrderAt: '2024-01-15',
  },
  {
    id: '2',
    name: '1688 (알리바바)',
    type: 'B2B',
    status: 'ACTIVE',
    contactName: '-',
    phone: '-',
    email: '-',
    website: 'https://1688.com',
    categories: ['전자제품', '의류', '액세서리', '완구'],
    rating: 3.8,
    totalOrders: 89,
    avgDeliveryDays: 14,
    minOrderAmount: 100000,
    paymentTerms: '선결제 (알리페이)',
    notes: '배대지 이용 필수, 통관 주의',
    createdAt: '2024-01-05',
    lastOrderAt: '2024-01-10',
  },
  {
    id: '3',
    name: '오너클랜',
    type: 'B2B',
    status: 'ACTIVE',
    contactName: '고객센터',
    phone: '02-1234-5678',
    email: 'support@ownerclan.com',
    website: 'https://ownerclan.com',
    categories: ['패션', '잡화', '생활용품'],
    rating: 4.0,
    totalOrders: 45,
    avgDeliveryDays: 3,
    minOrderAmount: 50000,
    paymentTerms: '선결제',
    createdAt: '2024-01-10',
    lastOrderAt: '2024-01-14',
  },
  {
    id: '4',
    name: '김사장 (경동시장)',
    type: 'PERSONAL',
    status: 'ACTIVE',
    contactName: '김철수',
    phone: '010-1234-5678',
    email: 'kim@email.com',
    address: '서울시 동대문구 경동시장 가동 123호',
    categories: ['농산물', '과일', '채소'],
    rating: 4.8,
    totalOrders: 78,
    avgDeliveryDays: 1,
    minOrderAmount: 100000,
    paymentTerms: '현금/계좌이체',
    notes: '신선도 좋음, 새벽 배송 가능',
    createdAt: '2024-01-03',
    lastOrderAt: '2024-01-15',
  },
  {
    id: '5',
    name: '박과장 (가락시장)',
    type: 'PERSONAL',
    status: 'ACTIVE',
    contactName: '박영희',
    phone: '010-9876-5432',
    email: 'park@email.com',
    address: '서울시 송파구 가락동 농수산물시장',
    categories: ['수산물', '해산물'],
    rating: 4.5,
    totalOrders: 34,
    avgDeliveryDays: 1,
    minOrderAmount: 150000,
    paymentTerms: '월말 정산 가능',
    notes: '활어 전문, 전화 주문',
    createdAt: '2024-01-08',
    lastOrderAt: '2024-01-13',
  },
  {
    id: '6',
    name: '한우농장 (횡성)',
    type: 'MANUFACTURER',
    status: 'ACTIVE',
    contactName: '이농장주',
    phone: '033-123-4567',
    email: 'hanwoo@farm.com',
    address: '강원도 횡성군',
    categories: ['정육', '한우'],
    rating: 4.9,
    totalOrders: 23,
    avgDeliveryDays: 2,
    minOrderAmount: 300000,
    paymentTerms: '선결제',
    notes: '1++ 한우 전문, 도매가 제공',
    createdAt: '2024-01-12',
    lastOrderAt: '2024-01-14',
  },
  {
    id: '7',
    name: '(구)동대문 의류상가',
    type: 'PERSONAL',
    status: 'INACTIVE',
    contactName: '최사장',
    phone: '010-5555-6666',
    email: '-',
    address: '서울시 중구 동대문',
    categories: ['의류', '패션'],
    rating: 3.5,
    totalOrders: 12,
    avgDeliveryDays: 3,
    notes: '연락 두절',
    createdAt: '2024-01-02',
  },
];

const typeConfig: Record<SupplierType, { label: string; color: string }> = {
  B2B: { label: 'B2B 도매', color: 'bg-blue-100 text-blue-700' },
  PERSONAL: { label: '개인 공급처', color: 'bg-green-100 text-green-700' },
  MANUFACTURER: { label: '제조/생산', color: 'bg-purple-100 text-purple-700' },
};

const statusConfig: Record<SupplierStatus, { label: string; variant: 'completed' | 'pending' | 'error' }> = {
  ACTIVE: { label: '거래중', variant: 'completed' },
  INACTIVE: { label: '거래중단', variant: 'error' },
  PENDING: { label: '검토중', variant: 'pending' },
};

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SupplierType | ''>('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = mockSuppliers.filter((supplier) => {
    const matchesSearch =
      !searchQuery ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.categories.some(c => c.includes(searchQuery));

    const matchesType = !typeFilter || supplier.type === typeFilter;
    const matchesStatus = !statusFilter || supplier.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // 통계
  const stats = {
    total: mockSuppliers.length,
    active: mockSuppliers.filter(s => s.status === 'ACTIVE').length,
    b2b: mockSuppliers.filter(s => s.type === 'B2B').length,
    personal: mockSuppliers.filter(s => s.type === 'PERSONAL').length,
  };

  const columns = [
    {
      key: 'name',
      header: '공급처명',
      render: (item: Supplier) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            item.type === 'B2B' ? 'bg-blue-100' :
            item.type === 'PERSONAL' ? 'bg-green-100' : 'bg-purple-100'
          }`}>
            {item.type === 'B2B' ? (
              <Building2 size={20} className="text-blue-600" />
            ) : item.type === 'MANUFACTURER' ? (
              <Package size={20} className="text-purple-600" />
            ) : (
              <User size={20} className="text-green-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-[var(--color-gray-900)]">{item.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig[item.type].color}`}>
                {typeConfig[item.type].label}
              </span>
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-gray-400)] hover:text-[var(--color-primary-500)]"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: '연락처',
      render: (item: Supplier) => (
        <div className="text-sm">
          <p className="text-[var(--color-gray-900)]">{item.contactName}</p>
          <p className="text-[var(--color-gray-500)]">{item.phone}</p>
        </div>
      ),
    },
    {
      key: 'categories',
      header: '취급 품목',
      render: (item: Supplier) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {item.categories.slice(0, 3).map((cat, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-[var(--color-gray-100)] text-[var(--color-gray-600)] rounded"
            >
              {cat}
            </span>
          ))}
          {item.categories.length > 3 && (
            <span className="text-xs text-[var(--color-gray-400)]">
              +{item.categories.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      header: '평점/실적',
      render: (item: Supplier) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{item.rating}</span>
          </div>
          <p className="text-[var(--color-gray-500)]">
            주문 {item.totalOrders}건 · 배송 {item.avgDeliveryDays}일
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (item: Supplier) => {
        const config = statusConfig[item.status];
        return (
          <Badge variant={config.variant} dot>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (item: Supplier) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSupplier(item)}
          >
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="공급처 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '공급처 관리' },
      ]}
    >
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-gray-100)] rounded-lg">
              <Building2 size={20} className="text-[var(--color-gray-600)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">전체 공급처</p>
              <p className="text-2xl font-bold text-[var(--color-gray-900)]">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">거래중</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">B2B 도매</p>
              <p className="text-2xl font-bold text-blue-600">{stats.b2b}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">개인 공급처</p>
              <p className="text-2xl font-bold text-green-600">{stats.personal}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]"
              />
              <input
                type="text"
                placeholder="공급처명, 담당자, 품목 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as SupplierType | '')}
              className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="">전체 유형</option>
              <option value="B2B">B2B 도매</option>
              <option value="PERSONAL">개인 공급처</option>
              <option value="MANUFACTURER">제조/생산</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SupplierStatus | '')}
              className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="">전체 상태</option>
              <option value="ACTIVE">거래중</option>
              <option value="INACTIVE">거래중단</option>
              <option value="PENDING">검토중</option>
            </select>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-1" />
              공급처 추가
            </Button>
          </div>
        </div>
      </Card>

      {/* 공급처 목록 */}
      <DataTable
        columns={columns}
        data={filteredSuppliers}
        emptyMessage="등록된 공급처가 없습니다."
      />

      {/* 공급처 추가/수정 모달 */}
      {(showAddModal || selectedSupplier) && (
        <SupplierModal
          supplier={selectedSupplier}
          onClose={() => {
            setShowAddModal(false);
            setSelectedSupplier(null);
          }}
          onSave={(data) => {
            console.log('Save:', data);
            setShowAddModal(false);
            setSelectedSupplier(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

// 공급처 추가/수정 모달
function SupplierModal({
  supplier,
  onClose,
  onSave,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (data: Partial<Supplier>) => void;
}) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    type: supplier?.type || 'PERSONAL',
    status: supplier?.status || 'ACTIVE',
    contactName: supplier?.contactName || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    website: supplier?.website || '',
    address: supplier?.address || '',
    categories: supplier?.categories.join(', ') || '',
    minOrderAmount: supplier?.minOrderAmount?.toString() || '',
    paymentTerms: supplier?.paymentTerms || '',
    notes: supplier?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      categories: formData.categories.split(',').map(c => c.trim()).filter(Boolean),
      minOrderAmount: formData.minOrderAmount ? parseInt(formData.minOrderAmount) : undefined,
    } as Partial<Supplier>);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-[var(--color-gray-200)]">
          <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">
            {supplier ? '공급처 수정' : '새 공급처 추가'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                공급처명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                유형 *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as SupplierType })}
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="B2B">B2B 도매</option>
                <option value="PERSONAL">개인 공급처</option>
                <option value="MANUFACTURER">제조/생산</option>
              </select>
            </div>
          </div>

          {/* 연락처 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                담당자명
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                전화번호
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                웹사이트
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://"
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
              주소
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          {/* 거래 정보 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
              취급 품목 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={formData.categories}
              onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
              placeholder="예: 과일, 채소, 농산물"
              className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                최소 주문금액
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="원"
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                결제 조건
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="예: 선결제, 월말정산"
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
              메모
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
              상태
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
              className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="ACTIVE">거래중</option>
              <option value="PENDING">검토중</option>
              <option value="INACTIVE">거래중단</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              {supplier ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
