'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import {
  Search,
  Users,
  Mail,
  Phone,
  ShoppingBag,
  Eye,
  Ban,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  totalOrders: number;
  totalSpent: number;
  point: number;
  lastOrderAt?: string;
  createdAt: string;
}

export default function ShopCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // 고객 목록 조회
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/shop/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('고객 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.includes(searchQuery) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'ACTIVE').length,
    inactive: customers.filter(c => c.status === 'INACTIVE').length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };

  return (
    <DashboardLayout
      title="고객 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '설정', href: '/settings' },
        { name: '고객 관리' },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">전체 고객</p>
              <p className="text-xl font-bold">{stats.total}명</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">활성 고객</p>
              <p className="text-xl font-bold text-green-600">{stats.active}명</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <UserX size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">휴면 고객</p>
              <p className="text-xl font-bold text-yellow-600">{stats.inactive}명</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingBag size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">총 매출</p>
              <p className="text-xl font-bold">{formatPrice(stats.totalSpent)}원</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="고객명, 이메일, 연락처로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">휴면</option>
            <option value="WITHDRAWN">탈퇴</option>
          </select>
          <Button variant="secondary" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">고객</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">연락처</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">상태</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">주문 수</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">총 구매액</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">포인트</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">가입일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{customer.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : customer.status === 'INACTIVE'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {customer.status === 'ACTIVE' ? '활성' : customer.status === 'INACTIVE' ? '휴면' : '탈퇴'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {customer.totalOrders}건
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(customer.totalSpent)}원
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {formatPrice(customer.point)}P
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded" title="상세보기">
                          <Eye size={16} className="text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-red-100 rounded" title="정지">
                          <Ban size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">고객이 없습니다</p>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
