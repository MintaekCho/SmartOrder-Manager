'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, Select } from '@/components/ui';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Truck,
  Snowflake,
  Star,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Package,
  Calculator,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { TrendChart } from '@/components/fresh';

// 카테고리 옵션
const categoryOptions = [
  { value: 'all', label: '전체' },
  { value: 'fruits', label: '과일' },
  { value: 'vegetables', label: '채소' },
  { value: 'seafood', label: '수산물' },
  { value: 'meat', label: '정육' },
];

// 정렬 옵션
const sortOptions = [
  { value: 'sales', label: '판매량순' },
  { value: 'margin', label: '마진순' },
  { value: 'rating', label: '평점순' },
  { value: 'review', label: '리뷰순' },
];

// 제철 과일 (12월)
const seasonalItems = ['귤', '사과', '딸기', '한라봉'];

// 상품 타입 정의
interface Product {
  id: string;
  name: string;
  category: string;
  coupangPrice: number;
  wholesalePrice: number;
  shippingCost: number;
  packagingCost: number;
  margin: number;
  profit: number;
  rating: number;
  reviewCount: number;
  isRocketFresh: boolean;
  seller: string;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  url?: string;
  thumbnailUrl?: string;
}

// Mock 베스트셀러 데이터 (크롤링 실패시 폴백)
const mockProducts: Product[] = [
  {
    id: '1',
    name: '성주 꿀참외 2kg (4-8과)',
    category: '과일',
    coupangPrice: 15900,
    wholesalePrice: 8500,
    shippingCost: 4500,
    packagingCost: 1500,
    margin: 18.2,
    profit: 1400,
    rating: 4.7,
    reviewCount: 12543,
    isRocketFresh: true,
    seller: '로켓프레시',
    rank: 1,
    trend: 'up',
    riskLevel: 'low',
  },
  {
    id: '2',
    name: '제주 감귤 3kg 소과',
    category: '과일',
    coupangPrice: 12900,
    wholesalePrice: 5500,
    shippingCost: 4000,
    packagingCost: 1200,
    margin: 25.3,
    profit: 2200,
    rating: 4.5,
    reviewCount: 8920,
    isRocketFresh: true,
    seller: '로켓프레시',
    rank: 2,
    trend: 'up',
    riskLevel: 'low',
  },
  {
    id: '3',
    name: '완도 활전복 1kg (중/10-12미)',
    category: '수산물',
    coupangPrice: 32000,
    wholesalePrice: 18000,
    shippingCost: 5500,
    packagingCost: 2000,
    margin: 20.3,
    profit: 6500,
    rating: 4.8,
    reviewCount: 5670,
    isRocketFresh: false,
    seller: '완도수산',
    rank: 5,
    trend: 'stable',
    riskLevel: 'medium',
  },
  {
    id: '4',
    name: '국내산 한우 1++ 등심 300g',
    category: '정육',
    coupangPrice: 45900,
    wholesalePrice: 32000,
    shippingCost: 4500,
    packagingCost: 2500,
    margin: 15.0,
    profit: 6900,
    rating: 4.9,
    reviewCount: 9870,
    isRocketFresh: true,
    seller: '로켓프레시',
    rank: 6,
    trend: 'up',
    riskLevel: 'high',
  },
  {
    id: '5',
    name: '무농약 방울토마토 1kg',
    category: '채소',
    coupangPrice: 8900,
    wholesalePrice: 4200,
    shippingCost: 3500,
    packagingCost: 800,
    margin: 15.7,
    profit: 400,
    rating: 4.3,
    reviewCount: 3240,
    isRocketFresh: true,
    seller: '로켓프레시',
    rank: 12,
    trend: 'down',
    riskLevel: 'medium',
  },
  {
    id: '6',
    name: '고흥 유자 5kg',
    category: '과일',
    coupangPrice: 25900,
    wholesalePrice: 12000,
    shippingCost: 5000,
    packagingCost: 1800,
    margin: 27.4,
    profit: 7100,
    rating: 4.6,
    reviewCount: 2150,
    isRocketFresh: false,
    seller: '고흥농장',
    rank: 8,
    trend: 'up',
    riskLevel: 'low',
  },
];

// 도매처 Mock 데이터
const wholesalerPrices = [
  { name: '농민마켓', product: '감귤 3kg', price: 5200, shipping: 3500 },
  { name: '농협몰', product: '감귤 3kg', price: 5800, shipping: 3000 },
  { name: '도매꾹', product: '감귤 3kg', price: 6100, shipping: 3500 },
];

// 크롤링 데이터를 Product 형식으로 변환
function convertCrawledToProduct(crawled: any, index: number): Product {
  const coupangPrice = crawled.price || 0;
  const estimatedWholesalePrice = Math.round(coupangPrice * 0.5); // 예상 도매가 (50%)
  const shippingCost = crawled.isRocketFresh ? 4500 : 3500;
  const packagingCost = 1500;
  const commission = coupangPrice * 0.1;
  const profit = coupangPrice - estimatedWholesalePrice - shippingCost - packagingCost - commission;
  const margin = coupangPrice > 0 ? (profit / coupangPrice) * 100 : 0;

  // 리스크 레벨 결정
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (margin < 10) riskLevel = 'high';
  else if (margin < 15) riskLevel = 'medium';

  // 카테고리 매핑
  let category = '과일';
  const name = crawled.name?.toLowerCase() || '';
  if (name.includes('채소') || name.includes('토마토') || name.includes('양파') || name.includes('감자')) {
    category = '채소';
  } else if (name.includes('수산') || name.includes('생선') || name.includes('전복') || name.includes('새우')) {
    category = '수산물';
  } else if (name.includes('고기') || name.includes('한우') || name.includes('돼지') || name.includes('닭')) {
    category = '정육';
  }

  return {
    id: crawled.id || `crawled-${index}`,
    name: crawled.name || '상품명 없음',
    category,
    coupangPrice,
    wholesalePrice: estimatedWholesalePrice,
    shippingCost,
    packagingCost,
    margin: parseFloat(margin.toFixed(1)),
    profit: Math.round(profit),
    rating: crawled.rating || 0,
    reviewCount: crawled.reviewCount || 0,
    isRocketFresh: crawled.isRocketFresh || crawled.isRocketDelivery || false,
    seller: crawled.seller || '',
    rank: crawled.salesRank || index + 1,
    trend: 'stable',
    riskLevel,
    url: crawled.url,
    thumbnailUrl: crawled.thumbnailUrl,
  };
}

export default function FreshAnalysisPage() {
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('sales');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCrawled, setLastCrawled] = useState<Date | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  // 크롤링 실행
  const handleCrawl = useCallback(async () => {
    setIsLoading(true);
    setCrawlError(null);

    try {
      const categoryParam = category === 'all' ? 'all' : category;
      const response = await fetch(`/api/crawl/coupang?category=${categoryParam}&maxItems=20`);
      const data = await response.json();

      if (data.success && data.items.length > 0) {
        const convertedProducts = data.items.map((item: any, index: number) =>
          convertCrawledToProduct(item, index)
        );
        setProducts(convertedProducts);
        setLastCrawled(new Date());
      } else {
        // 크롤링 실패시 Mock 데이터 사용
        setCrawlError(data.error || '크롤링 결과가 없습니다. Mock 데이터를 표시합니다.');
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('크롤링 오류:', error);
      setCrawlError('크롤링 중 오류가 발생했습니다. Mock 데이터를 표시합니다.');
      setProducts(mockProducts);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-[var(--color-success)]';
      case 'medium':
        return 'text-[var(--color-warning)]';
      case 'high':
        return 'text-[var(--color-danger)]';
      default:
        return 'text-[var(--color-gray-500)]';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge variant="completed">저위험</Badge>;
      case 'medium':
        return <Badge variant="pending">중위험</Badge>;
      case 'high':
        return <Badge variant="error">고위험</Badge>;
      default:
        return null;
    }
  };

  // 필터링 및 정렬
  const filteredProducts = products
    .filter((p) => category === 'all' || p.category === categoryOptions.find((c) => c.value === category)?.label)
    .sort((a, b) => {
      switch (sortBy) {
        case 'margin':
          return b.margin - a.margin;
        case 'rating':
          return b.rating - a.rating;
        case 'review':
          return b.reviewCount - a.reviewCount;
        default: // sales
          return a.rank - b.rank;
      }
    });

  return (
    <DashboardLayout
      title="농수산물 분석"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: '농수산물 분석' },
      ]}
    >
      {/* 제철 과일 배너 */}
      <Card className="mb-6 bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/80 rounded-xl">
            <Calendar size={24} className="text-[var(--color-success)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2E7D32]">12월 제철 과일</h3>
            <div className="flex gap-2 mt-1">
              {seasonalItems.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 bg-white/80 rounded-full text-sm font-medium text-[#2E7D32]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 트렌드 차트 */}
      <div className="mb-6">
        <TrendChart />
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-40"
          />
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-40"
          />
          <Button onClick={handleCrawl} disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Search size={16} className="mr-2" />
            )}
            {isLoading ? '크롤링 중...' : '실시간 분석'}
          </Button>
          {lastCrawled && (
            <span className="text-sm text-[var(--color-gray-500)]">
              마지막 크롤링: {lastCrawled.toLocaleTimeString()}
            </span>
          )}
        </div>
        {crawlError && (
          <div className="mt-3 p-2 bg-[#FFF3E0] rounded-lg text-sm text-[#E65100]">
            <AlertTriangle size={14} className="inline mr-1" />
            {crawlError}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 상품 리스트 */}
        <div className="lg:col-span-2">
          <Card
            title="쿠팡 베스트셀러"
            subtitle="농수산물 카테고리 인기 상품"
            actions={
              <Button variant="ghost" size="sm" onClick={handleCrawl} disabled={isLoading}>
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            }
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 size={48} className="mx-auto mb-4 animate-spin text-[var(--color-primary-500)]" />
                  <p className="text-[var(--color-gray-600)]">쿠팡에서 데이터를 수집하고 있습니다...</p>
                  <p className="text-sm text-[var(--color-gray-500)] mt-1">약 10-30초 소요됩니다</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                        : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* 순위 */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-gray-100)] flex items-center justify-center font-bold text-[var(--color-gray-700)]">
                        {product.rank}
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-[var(--color-gray-900)] line-clamp-1">
                            {product.name}
                          </h4>
                          {product.isRocketFresh && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-[#E3F2FD] text-[#1565C0] text-xs rounded font-medium">
                              로켓프레시
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="text-[var(--color-gray-500)]">
                            쿠팡가:{' '}
                            <span className="font-bold text-[var(--color-gray-900)]">
                              {product.coupangPrice.toLocaleString()}원
                            </span>
                          </span>
                          <span className="text-[var(--color-gray-500)]">
                            예상마진:{' '}
                            <span className={`font-bold ${product.margin >= 20 ? 'text-[var(--color-success)]' : product.margin >= 15 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>
                              {product.margin}%
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-sm text-[var(--color-gray-500)]">
                            <Star size={14} className="text-yellow-500" />
                            {product.rating}
                          </span>
                          <span className="text-sm text-[var(--color-gray-500)]">
                            리뷰 {product.reviewCount.toLocaleString()}
                          </span>
                          {getRiskBadge(product.riskLevel)}
                          {product.trend === 'up' && (
                            <TrendingUp size={16} className="text-[var(--color-success)]" />
                          )}
                          {product.trend === 'down' && (
                            <TrendingDown size={16} className="text-[var(--color-danger)]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 상세 분석 */}
        <div className="lg:col-span-1 space-y-6">
          {selectedProduct ? (
            <>
              {/* 마진 계산기 */}
              <Card title="마진 분석" subtitle="신선식품 비용 포함">
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--color-gray-50)] rounded-lg">
                    <h4 className="font-medium mb-3">{selectedProduct.name}</h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-gray-600)]">쿠팡 판매가</span>
                        <span className="font-medium">{selectedProduct.coupangPrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-[var(--color-danger)]">
                        <span>- 예상 도매가</span>
                        <span>{selectedProduct.wholesalePrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-[var(--color-danger)]">
                        <span>- 냉장/냉동 배송비</span>
                        <span>{selectedProduct.shippingCost.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-[var(--color-danger)]">
                        <span>- 포장비 (아이스팩 등)</span>
                        <span>{selectedProduct.packagingCost.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-[var(--color-danger)]">
                        <span>- 쿠팡 수수료 (10%)</span>
                        <span>{Math.round(selectedProduct.coupangPrice * 0.1).toLocaleString()}원</span>
                      </div>
                      <div className="pt-2 border-t border-[var(--color-gray-300)]">
                        <div className="flex justify-between font-bold">
                          <span>예상 순이익</span>
                          <span className={selectedProduct.profit > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                            {selectedProduct.profit.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between font-bold mt-1">
                          <span>마진율</span>
                          <span className={selectedProduct.margin >= 20 ? 'text-[var(--color-success)]' : selectedProduct.margin >= 15 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}>
                            {selectedProduct.margin}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 리스크 경고 */}
                  {selectedProduct.riskLevel !== 'low' && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${
                      selectedProduct.riskLevel === 'high' ? 'bg-[#FFEBEE]' : 'bg-[#FFF3E0]'
                    }`}>
                      <AlertTriangle size={18} className={
                        selectedProduct.riskLevel === 'high' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'
                      } />
                      <div className="text-sm">
                        <p className={`font-medium ${
                          selectedProduct.riskLevel === 'high' ? 'text-[#C62828]' : 'text-[#E65100]'
                        }`}>
                          {selectedProduct.riskLevel === 'high' ? '고위험 상품' : '주의 필요'}
                        </p>
                        <p className="text-[var(--color-gray-600)] mt-1">
                          {selectedProduct.riskLevel === 'high'
                            ? '손실률이 높고 반품 시 손해가 큽니다.'
                            : '신선도 관리에 주의가 필요합니다.'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 도매처 가격 비교 */}
              <Card title="도매처 가격 비교">
                <div className="space-y-3">
                  {wholesalerPrices.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[var(--color-gray-50)] rounded-lg">
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-sm text-[var(--color-gray-500)]">{w.product}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{w.price.toLocaleString()}원</p>
                        <p className="text-xs text-[var(--color-gray-500)]">배송비 {w.shipping.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Button className="flex-1">
                  <ShoppingCart size={16} className="mr-1" />
                  상품 등록
                </Button>
                <Button variant="secondary">
                  <Calculator size={16} />
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <div className="text-center py-12 text-[var(--color-gray-500)]">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>상품을 선택하면</p>
                <p>상세 마진 분석을 확인할 수 있습니다</p>
              </div>
            </Card>
          )}

          {/* 신선식품 유의사항 */}
          <Card title="신선식품 판매 TIP">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Snowflake size={16} className="text-[var(--color-info)] flex-shrink-0 mt-0.5" />
                <p className="text-[var(--color-gray-600)]">
                  냉장/냉동 배송비 별도 (4,000~6,000원)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Truck size={16} className="text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
                <p className="text-[var(--color-gray-600)]">
                  도서산간 배송 불가 지역 확인 필수
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
                <p className="text-[var(--color-gray-600)]">
                  손실률 5~10% 감안하여 마진 설정
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-[var(--color-success)] flex-shrink-0 mt-0.5" />
                <p className="text-[var(--color-gray-600)]">
                  부가세 면세 품목 (농수산물)
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
