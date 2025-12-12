'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ExternalLink,
  Package,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  unit: string;
  status: string;
  isShopVisible: boolean;
}

export default function ShopProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all');
  const [syncing, setSyncing] = useState(false);

  // 상품 목록 조회
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shop/products?limit=100');
      const data = await response.json();
      if (data.success) {
        // API 응답 데이터를 페이지 형식에 맞게 변환
        const mappedProducts = data.data.products.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          image: p.imageUrl,
          price: p.sellingPrice,
          originalPrice: p.costPrice,
          stock: p.quantity,
          unit: p.unit,
          status: p.status,
          isShopVisible: p.isShopVisible,
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('상품 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVisibility = filterVisible === 'all' ||
      (filterVisible === 'visible' && product.isShopVisible) ||
      (filterVisible === 'hidden' && !product.isShopVisible);
    return matchesSearch && matchesVisibility;
  });

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/shop/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShopVisible: !currentStatus }),
      });

      if (response.ok) {
        setProducts(products.map(p =>
          p.id === id ? { ...p, isShopVisible: !currentStatus } : p
        ));
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  // 동기화 실행
  const handleSync = async () => {
    setSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await fetchProducts();
    setSyncing(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const stats = {
    total: products.length,
    visible: products.filter(p => p.isShopVisible).length,
    hidden: products.filter(p => !p.isShopVisible).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  };

  return (
    <DashboardLayout
      title="자사몰 상품 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '설정', href: '/settings' },
        { name: '자사몰 상품 관리' },
      ]}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
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
              <Eye size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">노출중</p>
              <p className="text-xl font-bold">{stats.visible}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <EyeOff size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">비노출</p>
              <p className="text-xl font-bold">{stats.hidden}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">품절</p>
              <p className="text-xl font-bold">{stats.outOfStock}</p>
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
              placeholder="상품명 또는 상품코드로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterVisible('all')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterVisible === 'all'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterVisible('visible')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterVisible === 'visible'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              노출중
            </button>
            <button
              onClick={() => setFilterVisible('hidden')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterVisible === 'hidden'
                  ? 'bg-gray-500 text-white border-gray-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              비노출
            </button>
            <Button variant="secondary" onClick={handleSync} loading={syncing}>
              <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
              동기화
            </Button>
            <Link href="/shop/products/new">
              <Button>
                <Plus size={16} className="mr-2" />
                상품 등록
              </Button>
            </Link>
          </div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">상품</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">카테고리</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">판매가</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">재고</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">자사몰 노출</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.category && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {product.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium">{formatPrice(product.price)}원</p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(product.originalPrice)}원
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${
                        product.stock === 0 ? 'text-red-500' : product.stock <= 10 ? 'text-orange-500' : 'text-gray-900'
                      }`}>
                        {product.stock}
                        <span className="text-xs text-gray-500 ml-1">{product.unit}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.status === 'ACTIVE' ? (
                        <Badge variant="success" size="sm">판매중</Badge>
                      ) : product.status === 'INACTIVE' ? (
                        <Badge variant="secondary" size="sm">비활성</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">품절</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleVisibility(product.id, product.isShopVisible)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          product.isShopVisible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {product.isShopVisible ? (
                          <>
                            <Eye size={14} />
                            노출중
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            비노출
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/shop/products/${product.id}/edit`}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="수정"
                        >
                          <Pencil size={16} className="text-gray-600" />
                        </Link>
                        <a
                          href={`http://localhost:3005/products/${product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-100 rounded"
                          title="자사몰에서 보기"
                        >
                          <ExternalLink size={16} className="text-gray-600" />
                        </a>
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
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">검색 결과가 없습니다</p>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
