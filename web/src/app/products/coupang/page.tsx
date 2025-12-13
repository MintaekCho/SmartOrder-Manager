'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import {
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Filter,
} from 'lucide-react';

// 상품 상태 매핑
const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  '승인완료': { label: '판매중', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  '판매중': { label: '판매중', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  '승인대기': { label: '승인대기', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  '임시저장': { label: '임시저장', color: 'bg-gray-100 text-gray-800', icon: Clock },
  '판매중지': { label: '판매중지', color: 'bg-red-100 text-red-800', icon: XCircle },
  '판매금지': { label: '판매금지', color: 'bg-red-100 text-red-800', icon: XCircle },
};

interface CoupangProduct {
  sellerProductId: number;
  sellerProductName: string;
  displayCategoryCode?: number;
  displayProductName?: string;
  brand?: string;
  statusName: string;
  deliveryChargeType?: string;
  deliveryCharge?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function CoupangProductsPage() {
  const [products, setProducts] = useState<CoupangProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // 상품 목록 로드
  const loadProducts = async (reset = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('maxPerPage', '50');
      if (!reset && nextToken) {
        params.append('nextToken', nextToken);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/coupang/products?${params.toString()}`);
      const result = await response.json();

      if (result.data) {
        if (reset) {
          setProducts(result.data);
        } else {
          setProducts(prev => [...prev, ...result.data]);
        }
        setNextToken(result.nextToken || null);
        setHasMore(!!result.nextToken);
      }
    } catch (error) {
      console.error('상품 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(true);
  }, [statusFilter]);

  // 검색 필터링
  const filteredProducts = products.filter(product =>
    searchKeyword
      ? product.sellerProductName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.displayProductName?.toLowerCase().includes(searchKeyword.toLowerCase())
      : true
  );

  // 상태별 통계
  const statusStats = products.reduce((acc, p) => {
    const status = p.statusName || '기타';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout
      title="쿠팡 상품 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: '쿠팡 상품' },
      ]}
    >
      {/* 상단 액션 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="상품명 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">전체 상태</option>
            <option value="APPROVED">승인완료</option>
            <option value="PENDING">승인대기</option>
            <option value="TEMP_SAVED">임시저장</option>
            <option value="STOPPED">판매중지</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => loadProducts(true)}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Link href="/products/coupang/register">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus size={16} className="mr-2" />
              상품 등록
            </Button>
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Package size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 상품</p>
              <p className="text-xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">판매중</p>
              <p className="text-xl font-bold">{statusStats['승인완료'] || statusStats['판매중'] || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">승인대기</p>
              <p className="text-xl font-bold">{statusStats['승인대기'] || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">판매중지</p>
              <p className="text-xl font-bold">{statusStats['판매중지'] || statusStats['판매금지'] || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 상품 목록 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">상품ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">상품명</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">브랜드</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">상태</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">배송비</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">작업</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 size={32} className="animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">상품을 불러오는 중...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
                    <Link href="/products/coupang/register">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus size={16} className="mr-2" />
                        첫 상품 등록하기
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = STATUS_MAP[product.statusName] || {
                    label: product.statusName,
                    color: 'bg-gray-100 text-gray-800',
                    icon: Clock,
                  };
                  const StatusIcon = status.icon;

                  return (
                    <tr key={product.sellerProductId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{product.sellerProductId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {product.sellerProductName}
                          </p>
                          {product.displayProductName && product.displayProductName !== product.sellerProductName && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              노출명: {product.displayProductName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{product.brand || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {product.deliveryChargeType === 'FREE'
                            ? '무료'
                            : product.deliveryCharge
                            ? `${product.deliveryCharge.toLocaleString()}원`
                            : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`https://wing.coupang.com/vendor-inventory/product/${product.sellerProductId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                        >
                          쿠팡 Wing
                          <ExternalLink size={14} />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="p-4 text-center border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => loadProducts(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  로딩 중...
                </>
              ) : (
                '더 보기'
              )}
            </Button>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
