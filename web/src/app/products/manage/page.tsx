'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, DataTable } from '@/components/ui';
import {
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  Truck,
  Tag,
  DollarSign,
  Box,
} from 'lucide-react';

// 상품 목록 API 응답 구조 (seller-products)
interface Product {
  sellerProductId: number;
  sellerProductName: string;
  displayCategoryCode: number;
  categoryId?: number;
  productId?: number;
  vendorId?: string;
  mdId?: string;
  mdName?: string;
  saleStartedAt?: string;
  saleEndedAt?: string;
  displayProductName?: string;
  brand?: string;
  generalProductName?: string;
  productGroup?: string;
  statusName: string;
  deliveryMethod?: string;
  deliveryCompanyCode?: string;
  deliveryChargeType?: string;
  deliveryCharge?: number;
  returnCenterCode?: string;
  returnCharge?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 상품 상세 정보
interface ProductDetailItem {
  vendorItemId: number;
  vendorItemName: string;
  itemName: string;
  originalPrice: number;
  salePrice: number;
  maximumBuyCount?: number;
  maximumBuyForPerson?: number;
  outboundShippingTimeDay?: number;
  adultOnly?: string;
  taxType?: string;
  externalVendorSku?: string;
  barcode?: string;
  modelNo?: string;
  unitCount?: number;
}

interface ProductDetail extends Product {
  freeShipOverAmount?: number;
  returnChargeVendor?: string;
  afterServiceInformation?: string;
  afterServiceContactNumber?: string;
  outboundShippingPlaceCode?: number;
  manufacture?: string;
  items?: ProductDetailItem[];
}

// statusName 값에 따른 매핑 (한글 응답)
const statusConfig: Record<string, { label: string; variant: 'pending' | 'processing' | 'completed' | 'error' }> = {
  '승인완료': { label: '판매중', variant: 'completed' },
  '승인대기': { label: '승인대기', variant: 'pending' },
  '승인거부': { label: '승인거부', variant: 'error' },
  '판매중지': { label: '판매중지', variant: 'error' },
  '임시저장': { label: '임시저장', variant: 'pending' },
  APPROVED: { label: '판매중', variant: 'completed' },
  PENDING: { label: '승인대기', variant: 'pending' },
  REJECTED: { label: '승인거부', variant: 'error' },
  SUSPENDED: { label: '판매중지', variant: 'error' },
};

// 배송비 유형 매핑
const deliveryChargeTypeMap: Record<string, string> = {
  FREE: '무료배송',
  NOT_FREE: '유료배송',
  CHARGE_RECEIVED: '착불',
  CONDITIONAL_FREE: '조건부무료',
};

export default function ProductManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 상세 모달 상태
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 상품 목록 조회
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/coupang/products?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      setError(err instanceof Error ? err.message : '상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // 상품 상세 조회
  const fetchProductDetail = useCallback(async (sellerProductId: number) => {
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/coupang/products/${sellerProductId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product detail');
      }

      setProductDetail(data.data || null);
    } catch (err) {
      console.error('Failed to fetch product detail:', err);
      setDetailError(err instanceof Error ? err.message : '상품 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // 상품 클릭 시 상세 조회
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductDetail(null);
    fetchProductDetail(product.sellerProductId);
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedProduct(null);
    setProductDetail(null);
    setDetailError(null);
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.sellerProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(product.sellerProductId).includes(searchQuery) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  // 통계
  const stats = {
    total: products.length,
    selling: products.filter((p) => p.statusName === '승인완료' || p.statusName === 'APPROVED').length,
    pending: products.filter((p) => p.statusName === '승인대기' || p.statusName === 'PENDING' || p.statusName === '임시저장').length,
    suspended: products.filter((p) => p.statusName === '판매중지' || p.statusName === 'SUSPENDED' || p.statusName === '승인거부').length,
  };

  const columns = [
    {
      key: 'product',
      header: '상품정보',
      render: (item: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center">
            <Package size={20} className="text-[var(--color-gray-400)]" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-gray-900)] line-clamp-1">
              {item.displayProductName || item.sellerProductName || '상품명 없음'}
            </p>
            <p className="text-xs text-[var(--color-gray-500)]">
              ID: {item.sellerProductId}
              {item.brand && ` | ${item.brand}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: '카테고리',
      width: '120px',
      render: (item: Product) => (
        <span className="text-sm text-[var(--color-gray-600)] font-mono">
          {item.displayCategoryCode || '-'}
        </span>
      ),
    },
    {
      key: 'delivery',
      header: '배송정보',
      width: '140px',
      render: (item: Product) => (
        <div className="text-xs text-[var(--color-gray-600)]">
          <p>{item.deliveryMethod || '-'}</p>
          <p className="text-[var(--color-gray-400)]">
            {item.deliveryChargeType ? deliveryChargeTypeMap[item.deliveryChargeType] || item.deliveryChargeType : '-'}
            {item.deliveryCharge !== undefined && item.deliveryCharge > 0 && ` (${item.deliveryCharge.toLocaleString()}원)`}
          </p>
        </div>
      ),
    },
    {
      key: 'saleDate',
      header: '판매기간',
      width: '160px',
      render: (item: Product) => (
        <div className="text-xs text-[var(--color-gray-600)]">
          <p>{item.saleStartedAt ? item.saleStartedAt.split('T')[0] : '-'}</p>
          <p className="text-[var(--color-gray-400)]">~ {item.saleEndedAt ? item.saleEndedAt.split('T')[0] : '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (item: Product) => {
        const config = statusConfig[item.statusName] || { label: item.statusName || '-', variant: 'pending' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (item: Product) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleViewProduct(item)} title="상세 보기">
            <Eye size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="수정">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" title="삭제">
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="등록 상품 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 제작', href: '/products' },
        { name: '등록 상품 관리' },
      ]}
    >
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">전체 상품</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">판매중</p>
              <p className="text-xl font-bold text-green-600">{stats.selling}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">승인대기</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-gray-500)]">판매중지</p>
              <p className="text-xl font-bold text-red-600">{stats.suspended}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-700">API 오류</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]"
            />
            <input
              type="text"
              placeholder="상품명, 상품ID, 브랜드로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: '전체' },
              { value: '승인완료', label: '판매중' },
              { value: '승인대기', label: '승인대기' },
              { value: '판매중지', label: '판매중지' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  statusFilter === item.value
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button onClick={fetchProducts} loading={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </Button>
        </div>
      </Card>

      {/* 상품 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary-500)]" />
          <span className="ml-2 text-[var(--color-gray-600)]">상품 목록을 불러오는 중...</span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage="등록된 상품이 없습니다."
        />
      )}

      {/* 상품 상세 모달 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-200)]">
              <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">상품 상세 정보</h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-[var(--color-gray-100)] transition-colors"
              >
                <X size={20} className="text-[var(--color-gray-500)]" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={24} className="animate-spin text-[var(--color-primary-500)]" />
                  <span className="ml-2 text-[var(--color-gray-600)]">상세 정보를 불러오는 중...</span>
                </div>
              ) : detailError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-700">상세 정보 조회 실패</p>
                    <p className="text-sm text-red-600 mt-1">{detailError}</p>
                  </div>
                </div>
              ) : productDetail ? (
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3 flex items-center gap-2">
                      <Package size={16} /> 기본 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--color-gray-500)]">상품명</p>
                        <p className="font-medium">{productDetail.displayProductName || productDetail.sellerProductName}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">상품 ID</p>
                        <p className="font-medium font-mono">{productDetail.sellerProductId}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">브랜드</p>
                        <p className="font-medium">{productDetail.brand || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">제조사</p>
                        <p className="font-medium">{productDetail.manufacture || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">카테고리 코드</p>
                        <p className="font-medium font-mono">{productDetail.displayCategoryCode}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">상태</p>
                        <Badge variant={statusConfig[productDetail.statusName]?.variant || 'pending'}>
                          {statusConfig[productDetail.statusName]?.label || productDetail.statusName}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">판매 시작일</p>
                        <p className="font-medium">{productDetail.saleStartedAt?.split('T')[0] || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">판매 종료일</p>
                        <p className="font-medium">{productDetail.saleEndedAt?.split('T')[0] || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 배송 정보 */}
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3 flex items-center gap-2">
                      <Truck size={16} /> 배송 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--color-gray-500)]">배송 방법</p>
                        <p className="font-medium">{productDetail.deliveryMethod || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">배송비 유형</p>
                        <p className="font-medium">
                          {productDetail.deliveryChargeType
                            ? deliveryChargeTypeMap[productDetail.deliveryChargeType] || productDetail.deliveryChargeType
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">배송비</p>
                        <p className="font-medium">
                          {productDetail.deliveryCharge !== undefined ? `${productDetail.deliveryCharge.toLocaleString()}원` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">무료배송 기준금액</p>
                        <p className="font-medium">
                          {productDetail.freeShipOverAmount !== undefined ? `${productDetail.freeShipOverAmount.toLocaleString()}원` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">반품 배송비</p>
                        <p className="font-medium">
                          {productDetail.returnCharge !== undefined ? `${productDetail.returnCharge.toLocaleString()}원` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-gray-500)]">택배사</p>
                        <p className="font-medium">{productDetail.deliveryCompanyCode || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 옵션/아이템 정보 */}
                  {productDetail.items && productDetail.items.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3 flex items-center gap-2">
                        <Box size={16} /> 옵션/아이템 ({productDetail.items.length}개)
                      </h3>
                      <div className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-[var(--color-gray-50)]">
                            <tr>
                              <th className="px-4 py-2 text-left text-[var(--color-gray-600)] font-medium">옵션명</th>
                              <th className="px-4 py-2 text-right text-[var(--color-gray-600)] font-medium">정상가</th>
                              <th className="px-4 py-2 text-right text-[var(--color-gray-600)] font-medium">판매가</th>
                              <th className="px-4 py-2 text-center text-[var(--color-gray-600)] font-medium">vendorItemId</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-gray-200)]">
                            {productDetail.items.map((item) => (
                              <tr key={item.vendorItemId} className="hover:bg-[var(--color-gray-50)]">
                                <td className="px-4 py-3 text-[var(--color-gray-900)]">
                                  {item.itemName || item.vendorItemName}
                                </td>
                                <td className="px-4 py-3 text-right text-[var(--color-gray-500)] line-through">
                                  {item.originalPrice?.toLocaleString()}원
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-[var(--color-primary-600)]">
                                  {item.salePrice?.toLocaleString()}원
                                </td>
                                <td className="px-4 py-3 text-center font-mono text-xs text-[var(--color-gray-500)]">
                                  {item.vendorItemId}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 고객 서비스 정보 */}
                  {(productDetail.afterServiceInformation || productDetail.afterServiceContactNumber) && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-gray-900)] mb-3 flex items-center gap-2">
                        <Tag size={16} /> A/S 정보
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[var(--color-gray-500)]">A/S 안내</p>
                          <p className="font-medium">{productDetail.afterServiceInformation || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[var(--color-gray-500)]">A/S 연락처</p>
                          <p className="font-medium">{productDetail.afterServiceContactNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--color-gray-500)]">
                  상세 정보가 없습니다.
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--color-gray-200)]">
              <Button variant="outline" onClick={closeModal}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
