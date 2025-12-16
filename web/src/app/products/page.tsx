'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import {
  Plus,
  Search,
  Filter,
  Globe,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Upload,
} from 'lucide-react';

// 플랫폼 아이콘/라벨
const platformInfo: Record<string, { label: string; color: string }> = {
  COUPANG: { label: '쿠팡', color: 'bg-orange-500' },
  NAVER: { label: '네이버', color: 'bg-green-500' },
  SHOP: { label: '자사몰', color: 'bg-blue-500' },
};

// 상태 뱃지
const statusBadge: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' }> = {
  DRAFT: { label: '작성중', variant: 'secondary' },
  READY: { label: '등록대기', variant: 'warning' },
  ACTIVE: { label: '판매중', variant: 'success' },
  PAUSED: { label: '중지', variant: 'danger' },
};

interface MasterProduct {
  id: string;
  name: string;
  thumbnailUrl?: string;
  basePrice: number;
  status: string;
  createdAt: string;
  platformProducts: {
    platform: string;
    status: string;
    platformProductId?: string;
    platformUrl?: string;
  }[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 상품 삭제
  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`"${productName}" 상품을 삭제하시겠습니까?\n\n플랫폼에 등록된 상품이 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    setDeletingId(productId);
    try {
      const response = await fetch(`/api/products/master/${productId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        alert('상품이 삭제되었습니다.');
      } else {
        alert(result.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 실제 API에서 데이터 로드
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const response = await fetch(`/api/products/master?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          setProducts(result.data.map((p: {
            id: string;
            name: string;
            thumbnailUrl?: string;
            basePrice: number;
            status: string;
            createdAt: string;
            platformProducts: {
              platform: string;
              status: string;
              platformProductId?: string;
              platformUrl?: string;
            }[];
          }) => ({
            id: p.id,
            name: p.name,
            thumbnailUrl: p.thumbnailUrl,
            basePrice: p.basePrice,
            status: p.status,
            createdAt: new Date(p.createdAt).toLocaleDateString('ko-KR'),
            platformProducts: p.platformProducts || [],
          })));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('상품 목록 로드 오류:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchQuery, statusFilter]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'ACTIVE').length,
    ready: products.filter(p => p.status === 'READY').length,
    draft: products.filter(p => p.status === 'DRAFT').length,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const getPlatformStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'PENDING':
      case 'UPLOADING':
        return <Clock size={14} className="text-yellow-500" />;
      case 'ERROR':
      case 'REJECTED':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <AlertTriangle size={14} className="text-gray-400" />;
    }
  };

  return (
    <DashboardLayout
      title="상품 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리' },
      ]}
    >
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">전체 상품</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">판매중</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">등록대기</p>
              <p className="text-xl font-bold">{stats.ready}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Edit size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">작성중</p>
              <p className="text-xl font-bold">{stats.draft}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 필터 및 액션 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="상품명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="ACTIVE">판매중</option>
              <option value="READY">등록대기</option>
              <option value="DRAFT">작성중</option>
              <option value="PAUSED">중지</option>
            </select>
            <Link href="/products/new">
              <Button>
                <Plus size={16} className="mr-2" />
                상품 등록
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 상품 목록 */}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">상품</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">기본가</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">플랫폼</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">등록일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium">{formatPrice(product.basePrice)}원</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={statusBadge[product.status]?.variant || 'secondary'}
                        size="sm"
                      >
                        {statusBadge[product.status]?.label || product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {product.platformProducts.length === 0 ? (
                          <span className="text-xs text-gray-400">미등록</span>
                        ) : (
                          product.platformProducts.map((pp) => (
                            <div
                              key={pp.platform}
                              className="flex items-center gap-1"
                              title={`${platformInfo[pp.platform]?.label}: ${pp.status}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${platformInfo[pp.platform]?.color || 'bg-gray-400'}`}
                              />
                              {getPlatformStatusIcon(pp.status)}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{product.createdAt}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="상세보기"
                        >
                          <Eye size={16} className="text-gray-600" />
                        </Link>
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="수정"
                        >
                          <Edit size={16} className="text-gray-600" />
                        </Link>
                        {product.status === 'READY' && (
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="플랫폼 등록"
                          >
                            <Upload size={16} className="text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deletingId === product.id}
                          className="p-1 hover:bg-red-50 rounded disabled:opacity-50"
                          title="삭제"
                        >
                          {deletingId === product.id ? (
                            <RefreshCw size={16} className="text-red-500 animate-spin" />
                          ) : (
                            <Trash2 size={16} className="text-red-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Globe size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">등록된 상품이 없습니다</p>
            <Link href="/products/new">
              <Button>
                <Plus size={16} className="mr-2" />
                첫 상품 등록하기
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
