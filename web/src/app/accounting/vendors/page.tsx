'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Badge, Modal } from '@/components/ui';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  type: 'supplier' | 'customer' | 'both';
  businessNumber: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  totalPurchase: number;
  totalSales: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const mockVendors: Vendor[] = [
  {
    id: 'V001',
    name: '(주)대한물산',
    type: 'supplier',
    businessNumber: '123-45-67890',
    representative: '김대한',
    phone: '02-1234-5678',
    email: 'contact@daehan.co.kr',
    address: '서울시 강남구 테헤란로 123',
    totalPurchase: 45000000,
    totalSales: 0,
    balance: -2500000,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 'V002',
    name: '민국상사',
    type: 'customer',
    businessNumber: '234-56-78901',
    representative: '이민국',
    phone: '031-234-5678',
    email: 'minguk@company.com',
    address: '경기도 성남시 분당구 판교로 456',
    totalPurchase: 0,
    totalSales: 32000000,
    balance: 1500000,
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: 'V003',
    name: '만세무역',
    type: 'both',
    businessNumber: '345-67-89012',
    representative: '박만세',
    phone: '02-345-6789',
    email: 'manse@trade.co.kr',
    address: '서울시 영등포구 여의대로 789',
    totalPurchase: 28000000,
    totalSales: 15000000,
    balance: -800000,
    status: 'active',
    createdAt: '2024-03-10',
  },
  {
    id: 'V004',
    name: '행복유통',
    type: 'supplier',
    businessNumber: '456-78-90123',
    representative: '최행복',
    phone: '051-456-7890',
    email: 'happy@distribution.kr',
    address: '부산시 해운대구 마린시티로 100',
    totalPurchase: 18500000,
    totalSales: 0,
    balance: 0,
    status: 'active',
    createdAt: '2024-04-05',
  },
  {
    id: 'V005',
    name: '글로벌테크',
    type: 'customer',
    businessNumber: '567-89-01234',
    representative: '정글로벌',
    phone: '02-567-8901',
    email: 'global@tech.com',
    address: '서울시 서초구 서초대로 200',
    totalPurchase: 0,
    totalSales: 52000000,
    balance: 3200000,
    status: 'active',
    createdAt: '2024-05-15',
  },
  {
    id: 'V006',
    name: '(주)미래산업',
    type: 'supplier',
    businessNumber: '678-90-12345',
    representative: '한미래',
    phone: '032-678-9012',
    email: 'future@industry.co.kr',
    address: '인천시 남동구 논현동 300',
    totalPurchase: 12000000,
    totalSales: 0,
    balance: -500000,
    status: 'inactive',
    createdAt: '2023-12-01',
  },
];

const typeMap = {
  supplier: { label: '매입처', color: 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)]' },
  customer: { label: '매출처', color: 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)]' },
  both: { label: '매입/매출', color: 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)]' },
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'supplier' | 'customer' | 'both'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    type: 'supplier' as Vendor['type'],
    businessNumber: '',
    representative: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as Vendor['status'],
  });

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.businessNumber.includes(searchTerm) ||
      vendor.representative.includes(searchTerm);
    const matchesType = typeFilter === 'all' || vendor.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: vendors.length,
    suppliers: vendors.filter((v) => v.type === 'supplier' || v.type === 'both').length,
    customers: vendors.filter((v) => v.type === 'customer' || v.type === 'both').length,
    totalReceivable: vendors.reduce((sum, v) => sum + (v.balance > 0 ? v.balance : 0), 0),
    totalPayable: vendors.reduce((sum, v) => sum + (v.balance < 0 ? Math.abs(v.balance) : 0), 0),
  };

  // 등록 모달 열기
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: 'supplier',
      businessNumber: '',
      representative: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    });
    setCreateModalOpen(true);
  };

  // 수정 모달 열기
  const handleOpenEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      type: vendor.type,
      businessNumber: vendor.businessNumber,
      representative: vendor.representative,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      status: vendor.status,
    });
    setEditModalOpen(true);
  };

  // 삭제 모달 열기
  const handleOpenDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDeleteModalOpen(true);
  };

  // 거래처 등록
  const handleCreate = () => {
    const newId = `V${String(vendors.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newVendor: Vendor = {
      id: newId,
      name: formData.name,
      type: formData.type,
      businessNumber: formData.businessNumber,
      representative: formData.representative,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      totalPurchase: 0,
      totalSales: 0,
      balance: 0,
      status: formData.status,
      createdAt: today,
    };

    setVendors([newVendor, ...vendors]);
    setCreateModalOpen(false);
  };

  // 거래처 수정
  const handleEdit = () => {
    if (!selectedVendor) return;

    setVendors(
      vendors.map((v) =>
        v.id === selectedVendor.id
          ? {
              ...v,
              name: formData.name,
              type: formData.type,
              businessNumber: formData.businessNumber,
              representative: formData.representative,
              phone: formData.phone,
              email: formData.email,
              address: formData.address,
              status: formData.status,
            }
          : v
      )
    );
    setEditModalOpen(false);
    setSelectedVendor(null);
  };

  // 거래처 삭제
  const handleDelete = () => {
    if (!selectedVendor) return;
    setVendors(vendors.filter((v) => v.id !== selectedVendor.id));
    setDeleteModalOpen(false);
    setSelectedVendor(null);
  };

  return (
    <DashboardLayout
      title="거래처 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '매입/매출', href: '/accounting' },
        { name: '거래처 관리' },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <Building2 size={20} className="text-[var(--color-gray-600)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">전체 거래처</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.total}개</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <Users size={20} className="text-[var(--color-gray-500)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">매입처 / 매출처</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {stats.suppliers} / {stats.customers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <TrendingUp size={20} className="text-[var(--color-gray-500)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">미수금</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {stats.totalReceivable.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gray-100)] flex items-center justify-center">
              <TrendingDown size={20} className="text-[var(--color-gray-500)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">미지급금</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {stats.totalPayable.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]"
              />
              <input
                type="text"
                placeholder="거래처명, 사업자번호, 대표자 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-72 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="all">전체 유형</option>
              <option value="supplier">매입처</option>
              <option value="customer">매출처</option>
              <option value="both">매입/매출</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          <Button onClick={handleOpenCreate}>
            <Plus size={16} className="mr-2" />
            거래처 등록
          </Button>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-xl border border-[var(--color-gray-200)] p-5 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-gray-100)] flex items-center justify-center">
                  <Building2 size={24} className="text-[var(--color-gray-500)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{vendor.name}</h3>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{vendor.businessNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeMap[vendor.type].color}`}>
                  {typeMap[vendor.type].label}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Phone size={14} />
                <span>{vendor.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Mail size={14} />
                <span className="truncate">{vendor.email}</span>
              </div>
              <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
                <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{vendor.address}</span>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--color-gray-50)] rounded-lg mb-4">
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">총 매입</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {vendor.totalPurchase.toLocaleString()}원
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">총 매출</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {vendor.totalSales.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between p-3 border border-[var(--color-gray-200)] rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-[var(--color-gray-400)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">잔액</span>
              </div>
              <span
                className={`font-semibold ${
                  vendor.balance > 0
                    ? 'text-emerald-600'
                    : vendor.balance < 0
                    ? 'text-amber-600'
                    : 'text-[var(--color-text-primary)]'
                }`}
              >
                {vendor.balance > 0 ? '+' : ''}
                {vendor.balance.toLocaleString()}원
              </span>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center justify-between">
              <Badge variant={vendor.status === 'active' ? 'completed' : 'pending'} dot>
                {vendor.status === 'active' ? '활성' : '비활성'}
              </Badge>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(vendor)}
                  className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                >
                  <Edit2 size={16} className="text-[var(--color-gray-500)]" />
                </button>
                <button
                  onClick={() => handleOpenDelete(vendor)}
                  className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-[var(--color-gray-400)]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-12 text-center">
          <Building2 size={48} className="mx-auto text-[var(--color-gray-300)] mb-4" />
          <p className="text-[var(--color-text-secondary)]">검색 결과가 없습니다.</p>
        </div>
      )}

      {/* 거래처 등록 모달 */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="거래처 등록" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                거래처명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="거래처명 입력"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                거래처 유형 *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Vendor['type'] })}
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="supplier">매입처</option>
                <option value="customer">매출처</option>
                <option value="both">매입/매출</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                사업자번호
              </label>
              <input
                type="text"
                value={formData.businessNumber}
                onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                placeholder="123-45-67890"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                대표자명
              </label>
              <input
                type="text"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                placeholder="대표자명 입력"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                연락처
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="02-1234-5678"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
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
              placeholder="주소 입력"
              className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
              상태
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Vendor['status'] })}
              className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name}>
              등록
            </Button>
          </div>
        </div>
      </Modal>

      {/* 거래처 수정 모달 */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="거래처 수정" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                거래처명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="거래처명 입력"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                거래처 유형 *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Vendor['type'] })}
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="supplier">매입처</option>
                <option value="customer">매출처</option>
                <option value="both">매입/매출</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                사업자번호
              </label>
              <input
                type="text"
                value={formData.businessNumber}
                onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                placeholder="123-45-67890"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                대표자명
              </label>
              <input
                type="text"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                placeholder="대표자명 입력"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                연락처
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="02-1234-5678"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
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
              placeholder="주소 입력"
              className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
              상태
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Vendor['status'] })}
              className="w-full px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name}>
              저장
            </Button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="거래처 삭제" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-gray-50)] rounded-lg border border-[var(--color-gray-200)]">
            <p className="text-sm text-[var(--color-gray-700)]">
              <strong>{selectedVendor?.name}</strong> 거래처를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-[var(--color-gray-500)] mt-1">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-gray-200)]">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" />
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
