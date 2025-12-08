'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Select, Card, Badge } from '@/components/ui';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Plus,
  BarChart3,
  Package,
  Star,
} from 'lucide-react';

// 도매처 옵션
const supplierOptions = [
  { value: 'DOMEGGOOK', label: '도매꾹' },
  { value: 'DOMEMAE', label: '도매매' },
  { value: 'OWNERCLAN', label: '오너클랜' },
];

// Mock 검색 결과 데이터
const mockSearchResults = [
  {
    id: 'prod-001',
    name: '블루투스 이어폰 TWS-500 무선 이어버드',
    thumbnailUrl: 'https://via.placeholder.com/120',
    supplierPrice: 12000,
    suggestedPrice: 25900,
    margin: 35.5,
    competition: 'MEDIUM',
    coupangAvgPrice: 24500,
    reviewCount: 1250,
    rating: 4.3,
    salesCount: 3200,
    score: 78,
  },
  {
    id: 'prod-002',
    name: 'USB-C 고속 충전 케이블 1.5m PD 지원',
    thumbnailUrl: 'https://via.placeholder.com/120',
    supplierPrice: 2500,
    suggestedPrice: 8900,
    margin: 52.8,
    competition: 'HIGH',
    coupangAvgPrice: 7900,
    reviewCount: 5680,
    rating: 4.5,
    salesCount: 12500,
    score: 65,
  },
  {
    id: 'prod-003',
    name: '무선 마우스 M-200 저소음 클릭',
    thumbnailUrl: 'https://via.placeholder.com/120',
    supplierPrice: 5500,
    suggestedPrice: 15900,
    margin: 48.2,
    competition: 'LOW',
    coupangAvgPrice: 18500,
    reviewCount: 890,
    rating: 4.1,
    salesCount: 2100,
    score: 85,
  },
  {
    id: 'prod-004',
    name: '노트북 거치대 알루미늄 접이식',
    thumbnailUrl: 'https://via.placeholder.com/120',
    supplierPrice: 8000,
    suggestedPrice: 24900,
    margin: 45.0,
    competition: 'MEDIUM',
    coupangAvgPrice: 26900,
    reviewCount: 2340,
    rating: 4.6,
    salesCount: 4500,
    score: 72,
  },
];

const competitionColors = {
  LOW: { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: '낮음' },
  MEDIUM: { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', label: '보통' },
  HIGH: { bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]', label: '높음' },
};

export default function ProductAnalysisPage() {
  const [supplier, setSupplier] = useState('DOMEGGOOK');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof mockSearchResults>([]);
  const [selectedProduct, setSelectedProduct] = useState<typeof mockSearchResults[0] | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // 실제 구현에서는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setResults(mockSearchResults);
    setIsSearching(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[var(--color-success)]';
    if (score >= 60) return 'text-[var(--color-warning)]';
    return 'text-[var(--color-danger)]';
  };

  return (
    <DashboardLayout
      title="상품 분석"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: '상품 분석' },
      ]}
    >
      {/* 검색 섹션 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48">
            <Select
              label="도매처"
              options={supplierOptions}
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              label="상품 검색"
              placeholder="검색할 상품명을 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} loading={isSearching}>
              <Search size={18} className="mr-2" />
              분석하기
            </Button>
          </div>
        </div>
      </Card>

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 상품 목록 */}
          <div className="lg:col-span-2">
            <Card title="검색 결과" subtitle={`${results.length}개의 상품을 찾았습니다`}>
              <div className="space-y-4">
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`flex gap-4 p-4 rounded-lg border cursor-pointer transition-all
                      ${selectedProduct?.id === product.id
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                        : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]'
                      }`}
                  >
                    {/* 썸네일 */}
                    <div className="w-20 h-20 bg-[var(--color-gray-100)] rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[var(--color-gray-900)] truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-[var(--color-gray-500)]">
                          도매가:{' '}
                          <span className="font-medium text-[var(--color-gray-800)]">
                            {product.supplierPrice.toLocaleString()}원
                          </span>
                        </span>
                        <span className="text-[var(--color-gray-500)]">
                          추천가:{' '}
                          <span className="font-medium text-[var(--color-primary-600)]">
                            {product.suggestedPrice.toLocaleString()}원
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            competitionColors[product.competition as keyof typeof competitionColors].bg
                          } ${competitionColors[product.competition as keyof typeof competitionColors].text}`}
                        >
                          경쟁 {competitionColors[product.competition as keyof typeof competitionColors].label}
                        </span>
                        <span className="text-sm text-[var(--color-gray-500)]">
                          마진 {product.margin}%
                        </span>
                      </div>
                    </div>

                    {/* 점수 */}
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`text-2xl font-bold ${getScoreColor(product.score)}`}
                      >
                        {product.score}
                      </div>
                      <div className="text-xs text-[var(--color-gray-500)]">추천점수</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 상세 분석 */}
          <div className="lg:col-span-1">
            {selectedProduct ? (
              <Card title="상세 분석">
                <div className="space-y-6">
                  {/* 상품 기본 정보 */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-gray-500)] mb-2">
                      상품 정보
                    </h4>
                    <p className="font-medium text-[var(--color-gray-900)]">
                      {selectedProduct.name}
                    </p>
                  </div>

                  {/* 가격 분석 */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-gray-500)] mb-3">
                      가격 분석
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--color-gray-600)]">도매가</span>
                        <span className="font-medium">
                          {selectedProduct.supplierPrice.toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--color-gray-600)]">쿠팡 평균가</span>
                        <span className="font-medium">
                          {selectedProduct.coupangAvgPrice.toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--color-gray-600)]">추천 판매가</span>
                        <span className="font-medium text-[var(--color-primary-600)]">
                          {selectedProduct.suggestedPrice.toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[var(--color-gray-200)]">
                        <span className="text-sm text-[var(--color-gray-600)]">예상 마진</span>
                        <span className="font-bold text-[var(--color-success)]">
                          {selectedProduct.margin}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 쿠팡 경쟁 현황 */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--color-gray-500)] mb-3">
                      쿠팡 경쟁 현황
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[var(--color-gray-50)] rounded-lg">
                        <div className="flex items-center gap-1.5 text-[var(--color-gray-500)] mb-1">
                          <Star size={14} />
                          <span className="text-xs">평점</span>
                        </div>
                        <div className="font-bold text-[var(--color-gray-900)]">
                          {selectedProduct.rating}
                        </div>
                      </div>
                      <div className="p-3 bg-[var(--color-gray-50)] rounded-lg">
                        <div className="flex items-center gap-1.5 text-[var(--color-gray-500)] mb-1">
                          <BarChart3 size={14} />
                          <span className="text-xs">리뷰수</span>
                        </div>
                        <div className="font-bold text-[var(--color-gray-900)]">
                          {selectedProduct.reviewCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-[var(--color-gray-50)] rounded-lg">
                        <div className="flex items-center gap-1.5 text-[var(--color-gray-500)] mb-1">
                          <Package size={14} />
                          <span className="text-xs">판매량</span>
                        </div>
                        <div className="font-bold text-[var(--color-gray-900)]">
                          {selectedProduct.salesCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-[var(--color-gray-50)] rounded-lg">
                        <div className="flex items-center gap-1.5 text-[var(--color-gray-500)] mb-1">
                          <TrendingUp size={14} />
                          <span className="text-xs">경쟁도</span>
                        </div>
                        <div
                          className={`font-bold ${
                            competitionColors[selectedProduct.competition as keyof typeof competitionColors].text
                          }`}
                        >
                          {competitionColors[selectedProduct.competition as keyof typeof competitionColors].label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 pt-4 border-t border-[var(--color-gray-200)]">
                    <Button className="flex-1">
                      <Plus size={16} className="mr-1" />
                      상품 등록
                    </Button>
                    <Button variant="secondary">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12 text-[var(--color-gray-500)]">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>상품을 선택하면</p>
                  <p>상세 분석을 확인할 수 있습니다</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {results.length === 0 && !isSearching && (
        <Card>
          <div className="text-center py-16">
            <Search size={64} className="mx-auto mb-4 text-[var(--color-gray-300)]" />
            <h3 className="text-lg font-medium text-[var(--color-gray-700)] mb-2">
              상품을 검색해보세요
            </h3>
            <p className="text-[var(--color-gray-500)]">
              도매처에서 상품을 검색하고 쿠팡 판매 가능성을 분석합니다
            </p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
