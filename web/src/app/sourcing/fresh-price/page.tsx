'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, Select } from '@/components/ui';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  RefreshCw,
  AlertCircle,
  Info,
  Apple,
  Carrot,
  Fish,
  Beef,
} from 'lucide-react';

// KAMIS 카테고리
const categoryOptions = [
  { value: '400', label: '과일류', icon: Apple },
  { value: '200', label: '채소류', icon: Carrot },
  { value: '500', label: '축산물', icon: Beef },
  { value: '600', label: '수산물', icon: Fish },
  { value: '100', label: '식량작물' },
];

// 가격 유형
const priceTypeOptions = [
  { value: '01', label: '소매가격' },
  { value: '02', label: '도매가격' },
];

// 제철 과일 (12월)
const seasonalItems = ['귤', '사과', '딸기', '한라봉'];

interface PriceItem {
  itemName: string;
  kindName: string;
  unit: string;
  price: string;
  direction: string;
  value: string;
}

interface PriceData {
  date: string;
  category: string;
  productClass: string;
  items: PriceItem[];
}

interface ApiState {
  loading: boolean;
  error: string | null;
  data: PriceData | null;
  apiNotConfigured: boolean;
}

export default function FreshPricePage() {
  const [category, setCategory] = useState('400');
  const [priceType, setPriceType] = useState('01');
  const [searchQuery, setSearchQuery] = useState('');
  const [state, setState] = useState<ApiState>({
    loading: false,
    error: null,
    data: null,
    apiNotConfigured: false,
  });

  const fetchPrices = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/kamis/price?category=${category}&productClass=${priceType}`
      );
      const data = await response.json();

      if (!data.success) {
        setState({
          loading: false,
          error: data.error || '시세 조회에 실패했습니다.',
          data: null,
          apiNotConfigured: !!(data.info && data.info.includes('API 키')),
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        data: data.data,
        apiNotConfigured: false,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : '시세 조회 중 오류가 발생했습니다.',
        data: null,
        apiNotConfigured: false,
      });
    }
  }, [category, priceType]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const getDirectionIcon = (direction: string) => {
    if (direction === '1') {
      return <TrendingUp size={16} className="text-red-500" />;
    } else if (direction === '-1') {
      return <TrendingDown size={16} className="text-blue-500" />;
    }
    return <Minus size={16} className="text-gray-400" />;
  };

  const getDirectionColor = (direction: string) => {
    if (direction === '1') return 'text-red-600';
    if (direction === '-1') return 'text-blue-600';
    return 'text-gray-600';
  };

  const filteredItems = state.data?.items.filter(item =>
    !searchQuery ||
    item.itemName.includes(searchQuery) ||
    item.kindName.includes(searchQuery)
  ) || [];

  return (
    <DashboardLayout
      title="농수산물 시세"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 소싱', href: '/sourcing' },
        { name: '농수산물 시세' },
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

      {/* 필터 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {categoryOptions.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <Select
            options={priceTypeOptions}
            value={priceType}
            onChange={(e) => setPriceType(e.target.value)}
            className="w-32"
          />
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="품목 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <Button onClick={fetchPrices} disabled={state.loading}>
            {state.loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            새로고침
          </Button>
        </div>
      </Card>

      {/* API 미설정 안내 */}
      {state.apiNotConfigured && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Info className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-700">KAMIS API 미설정</p>
              <p className="text-sm text-yellow-600 mt-1">
                농수산물 시세 데이터를 조회하려면 KAMIS API 키를 설정해야 합니다.
              </p>
              <div className="mt-2 p-2 bg-yellow-100 rounded text-xs font-mono text-yellow-700">
                KAMIS_API_KEY=your_api_key<br/>
                KAMIS_CERT_ID=your_cert_id
              </div>
              <a
                href="https://www.kamis.or.kr/customer/reference/openapi_list.do"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                KAMIS Open API 신청하기
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* 에러 메시지 */}
      {state.error && !state.apiNotConfigured && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-700">시세 조회 실패</p>
              <p className="text-sm text-red-600 mt-1">{state.error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 로딩 */}
      {state.loading && (
        <Card>
          <div className="text-center py-12">
            <RefreshCw className="mx-auto text-green-500 mb-4 animate-spin" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              시세 정보를 불러오는 중...
            </h3>
            <p className="text-gray-500">KAMIS에서 데이터를 조회하고 있습니다</p>
          </div>
        </Card>
      )}

      {/* 시세 테이블 */}
      {!state.loading && state.data && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                {state.data.category} {state.data.productClass} 시세
              </h3>
              <p className="text-sm text-gray-500">기준일: {state.data.date}</p>
            </div>
            <Badge variant="completed">
              {filteredItems.length}개 품목
            </Badge>
          </div>

          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">품목</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">품종</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">단위</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">가격</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">등락</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{item.itemName}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.kindName || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-500">
                        {item.unit || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-gray-900">
                          {item.price && item.price !== '-'
                            ? `${parseInt(item.price).toLocaleString()}원`
                            : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getDirectionIcon(item.direction)}
                          <span className={`text-sm font-medium ${getDirectionColor(item.direction)}`}>
                            {item.value && item.value !== '0' ? `${item.value}%` : '-'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>해당 카테고리의 시세 정보가 없습니다.</p>
            </div>
          )}
        </Card>
      )}

      {/* API 설정 안내 */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-blue-700">KAMIS 농산물유통정보 API</p>
            <p className="text-sm text-blue-600 mt-1">
              한국농수산식품유통공사(aT)에서 제공하는 공식 농수산물 도소매 가격정보 API입니다.
              정확한 시세 정보를 위해 API 키를 발급받아 사용하세요.
            </p>
            <ul className="mt-2 text-sm text-blue-600 space-y-1">
              <li>- 도매가격 65품목, 소매가격 82품목 제공</li>
              <li>- 일일 거래 동향 및 등락률 정보</li>
              <li>- 무료 이용 가능</li>
            </ul>
            <a
              href="https://www.kamis.or.kr/customer/reference/openapi_list.do"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              KAMIS Open API 바로가기
            </a>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
