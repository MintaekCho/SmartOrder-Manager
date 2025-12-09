'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  ratio: number;
}

interface NaverTrendResult {
  keyword: string;
  period: {
    startDate: string;
    endDate: string;
  };
  trendData: TrendDataPoint[];
  summary: {
    avgRatio: number;
    maxRatio: number;
    minRatio: number;
    currentRatio: number;
    trendDirection: 'rising' | 'falling' | 'stable';
    changeRate: number;
  };
  relatedKeywords?: string[];
}

interface AnalysisState {
  loading: boolean;
  error: string | null;
  naverTrend: NaverTrendResult | null;
  source: string | null;
}

export default function TrendsPage() {
  const [keyword, setKeyword] = useState('');
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [periodDays, setPeriodDays] = useState(30);
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    naverTrend: null,
    source: null,
  });

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setState({ loading: true, error: null, naverTrend: null, source: null });
    setSearchedKeyword(keyword);

    try {
      const response = await fetch(
        `/api/research/naver-trend?keyword=${encodeURIComponent(keyword)}&period=${periodDays}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '트렌드 조회에 실패했습니다.');
      }

      if (!data.success) {
        throw new Error(data.error || '트렌드 데이터를 가져올 수 없습니다.');
      }

      // Mock 데이터인 경우 경고 표시
      const isMockData = data.source === 'mock' || data.source === 'mock-fallback';

      setState({
        loading: false,
        error: isMockData ? (data.info || data.warning || '네이버 API 키가 설정되지 않아 실제 데이터를 조회할 수 없습니다.') : null,
        naverTrend: data.data,
        source: data.source,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.',
        naverTrend: null,
        source: null,
      });
    }
  };

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'rising':
        return <TrendingUp className="text-green-500" size={24} />;
      case 'falling':
        return <TrendingDown className="text-red-500" size={24} />;
      default:
        return <Minus className="text-gray-500" size={24} />;
    }
  };

  const getTrendLabel = (direction?: string) => {
    switch (direction) {
      case 'rising':
        return { text: '상승 추세', color: 'text-green-600' };
      case 'falling':
        return { text: '하락 추세', color: 'text-red-600' };
      default:
        return { text: '안정', color: 'text-gray-600' };
    }
  };

  return (
    <DashboardLayout
      title="트렌드 분석"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 소싱', href: '/sourcing' },
        { name: '트렌드 분석' },
      ]}
    >
      {/* 검색 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="분석할 키워드를 입력하세요 (예: 사과, 귤, 한우)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodDays === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days}일
              </button>
            ))}
          </div>
          <Button
            onClick={handleSearch}
            disabled={state.loading || !keyword.trim()}
            className="flex items-center gap-2"
          >
            {state.loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <BarChart3 size={20} />
            )}
            분석하기
          </Button>
        </div>
      </Card>

      {/* 에러/경고 메시지 */}
      {state.error && (
        <div className={`p-4 mb-6 rounded-lg flex items-start gap-3 ${
          state.source === 'mock' || state.source === 'mock-fallback'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {state.source === 'mock' || state.source === 'mock-fallback' ? (
            <Info className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          )}
          <div>
            <p className={`font-medium ${
              state.source === 'mock' || state.source === 'mock-fallback'
                ? 'text-yellow-700'
                : 'text-red-700'
            }`}>
              {state.source === 'mock' || state.source === 'mock-fallback'
                ? '네이버 API 미설정'
                : '분석 실패'}
            </p>
            <p className={`text-sm mt-1 ${
              state.source === 'mock' || state.source === 'mock-fallback'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {state.error}
            </p>
            {(state.source === 'mock' || state.source === 'mock-fallback') && (
              <p className="text-xs text-yellow-500 mt-2">
                .env 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정하면 실제 트렌드 데이터를 조회할 수 있습니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 분석 결과 */}
      {state.naverTrend && (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 현재 검색량 */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">현재 검색량</span>
                <BarChart3 className="text-gray-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {state.naverTrend.summary.currentRatio}
                <span className="text-lg font-normal text-gray-500">/100</span>
              </div>
              <div className="text-sm text-gray-500">상대 검색량 지수</div>
            </Card>

            {/* 평균 검색량 */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">평균 검색량</span>
                <BarChart3 className="text-gray-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {state.naverTrend.summary.avgRatio}
                <span className="text-lg font-normal text-gray-500">/100</span>
              </div>
              <div className="text-sm text-gray-500">
                기간: {periodDays}일
              </div>
            </Card>

            {/* 트렌드 방향 */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">트렌드</span>
                {getTrendIcon(state.naverTrend.summary.trendDirection)}
              </div>
              <div className={`text-3xl font-bold mb-1 ${getTrendLabel(state.naverTrend.summary.trendDirection).color}`}>
                {state.naverTrend.summary.changeRate > 0 ? '+' : ''}
                {state.naverTrend.summary.changeRate}%
              </div>
              <div className="text-sm text-gray-500">
                {getTrendLabel(state.naverTrend.summary.trendDirection).text}
              </div>
            </Card>

            {/* 최고/최저 */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">검색량 범위</span>
                <TrendingUp className="text-gray-400" size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {state.naverTrend.summary.minRatio} ~ {state.naverTrend.summary.maxRatio}
              </div>
              <div className="text-sm text-gray-500">
                최저 ~ 최고
              </div>
            </Card>
          </div>

          {/* 트렌드 차트 */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              네이버 검색 트렌드 - "{searchedKeyword}"
            </h3>
            <div className="text-xs text-gray-500 mb-4">
              기간: {state.naverTrend.period.startDate} ~ {state.naverTrend.period.endDate}
            </div>
            {state.naverTrend.trendData && state.naverTrend.trendData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={state.naverTrend.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: number) => [`${value}`, '검색지수']}
                      labelFormatter={(label) => `날짜: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="ratio"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                트렌드 데이터가 없습니다.
              </div>
            )}
          </Card>

          {/* 관련 키워드 */}
          {state.naverTrend.relatedKeywords && state.naverTrend.relatedKeywords.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">관련 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {state.naverTrend.relatedKeywords.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setKeyword(kw);
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 검색 전 안내 */}
      {!searchedKeyword && !state.loading && (
        <Card>
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              키워드를 입력하여 트렌드를 분석하세요
            </h3>
            <p className="text-gray-500 mb-6">
              네이버 데이터랩 API를 통해 검색어 트렌드를 분석합니다
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['사과', '귤', '딸기', '한우', '삼겹살'].map((kw) => (
                <button
                  key={kw}
                  onClick={() => {
                    setKeyword(kw);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 text-sm"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 로딩 */}
      {state.loading && (
        <Card>
          <div className="text-center py-12">
            <RefreshCw className="mx-auto text-blue-500 mb-4 animate-spin" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              "{keyword}" 트렌드 분석 중...
            </h3>
            <p className="text-gray-500">네이버 데이터랩에서 데이터를 조회하고 있습니다</p>
          </div>
        </Card>
      )}

      {/* API 설정 안내 */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-blue-700">네이버 데이터랩 API 설정</p>
            <p className="text-sm text-blue-600 mt-1">
              실제 검색 트렌드 데이터를 조회하려면 네이버 개발자센터에서 API 키를 발급받아 .env 파일에 설정하세요.
            </p>
            <div className="mt-2 p-2 bg-blue-100 rounded text-xs font-mono text-blue-700">
              NAVER_CLIENT_ID=your_client_id<br/>
              NAVER_CLIENT_SECRET=your_client_secret
            </div>
            <a
              href="https://developers.naver.com/apps/#/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              네이버 개발자센터 바로가기
            </a>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
