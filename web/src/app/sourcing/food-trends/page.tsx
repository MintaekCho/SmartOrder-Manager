'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Select } from '@/components/ui';
import {
  Youtube,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  Utensils,
  BarChart3,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

interface FoodKeyword {
  keyword: string;
  count: number;
  videos: YouTubeVideo[];
}

interface TrendData {
  videos: YouTubeVideo[];
  foodTrends: FoodKeyword[];
  totalVideos: number;
  period: number;
  message?: string;
}

// 추천 검색어 목록
const SUGGESTED_QUERIES = [
  { label: '먹방', value: '먹방' },
  { label: '편의점 신상', value: '편의점 신상' },
  { label: '건강식품 추천', value: '건강식품 추천' },
  { label: '다이어트 식품', value: '다이어트 식품' },
  { label: '간식 추천', value: '간식 추천' },
  { label: '야식 추천', value: '야식 추천' },
  { label: '마트 추천', value: '마트 추천 식품' },
  { label: '홈쿡 레시피', value: '집밥 레시피' },
];

export default function FoodTrendsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendData | null>(null);
  const [period, setPeriod] = useState('7');
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  const fetchTrends = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/youtube/mukbang-trends?period=${period}&query=${encodeURIComponent(q)}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '데이터 조회 실패');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (inputValue.trim()) {
      setQuery(inputValue.trim());
      fetchTrends(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestedClick = (suggestedQuery: string) => {
    setInputValue(suggestedQuery);
    setQuery(suggestedQuery);
    fetchTrends(suggestedQuery);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  return (
    <DashboardLayout
      title="음식 트렌드 분석"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 소싱', href: '/sourcing' },
        { name: '음식 트렌드' },
      ]}
    >
      {/* 검색 영역 */}
      <Card className="mb-6">
        <div className="space-y-4">
          {/* 검색 입력 */}
          <div className="flex items-center gap-2">
            <Youtube className="text-red-500 flex-shrink-0" size={24} />
            <span className="font-semibold text-gray-900 flex-shrink-0">YouTube 트렌드 검색</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 검색어 입력 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="검색어를 입력하세요 (예: 편의점 신상, 건강식품, 다이어트)"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* 기간 선택 */}
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-32"
              options={[
                { value: '1', label: '오늘' },
                { value: '7', label: '최근 7일' },
                { value: '30', label: '최근 30일' },
                { value: '90', label: '최근 3개월' },
              ]}
            />

            {/* 검색 버튼 */}
            <Button
              onClick={handleSearch}
              variant="primary"
              disabled={loading || !inputValue.trim()}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              검색
            </Button>
          </div>

          {/* 추천 검색어 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">추천:</span>
            {SUGGESTED_QUERIES.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSuggestedClick(item.value)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  query === item.value
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 현재 검색어 표시 */}
          {query && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">현재 검색어:</span>
              <span className="font-medium text-red-600">"{query}"</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">최근 {period}일</span>
            </div>
          )}
        </div>
      </Card>

      {/* 안내 메시지 */}
      {data?.message && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5\" size={20} />
            <div>
              <p className="font-medium text-amber-700">안내</p>
              <p className="text-sm text-amber-600 mt-1">{data.message}</p>
              <p className="text-xs text-amber-500 mt-2">
                YouTube API 키를 .env 파일에 YOUTUBE_API_KEY로 설정하면 실제 데이터를 조회할 수 있습니다.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-700">오류 발생</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-gray-400 mr-3" size={24} />
          <span className="text-gray-500">"{query}" 관련 트렌드를 분석하고 있습니다...</span>
        </div>
      )}

      {/* 검색 전 안내 */}
      {!loading && !data && !error && (
        <Card className="py-16">
          <div className="text-center">
            <Search className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-700 mb-2">검색어를 입력해주세요</h3>
            <p className="text-sm text-gray-500 mb-4">
              YouTube에서 인기 있는 음식/식품 트렌드를 분석합니다.
            </p>
            <p className="text-xs text-gray-400">
              예시: "편의점 신상", "건강식품 추천", "다이어트 간식", "마트 추천" 등
            </p>
          </div>
        </Card>
      )}

      {/* 데이터 표시 */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 인기 음식 키워드 */}
          <div className="lg:col-span-1">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-emerald-500" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">인기 음식 TOP 10</h3>
              </div>

              <div className="space-y-3">
                {data.foodTrends.slice(0, 10).map((food, index) => (
                  <a
                    key={food.keyword}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(food.keyword + ' 먹방')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors cursor-pointer group"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">{food.keyword}</p>
                      <p className="text-xs text-gray-500">
                        {food.count}개 영상에서 언급
                      </p>
                    </div>
                    <ExternalLink
                      size={16}
                      className={`${
                        index < 3 ? 'text-amber-500' : 'text-gray-400'
                      } group-hover:text-red-500 transition-colors`}
                    />
                  </a>
                ))}
              </div>

              {data.foodTrends.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="mx-auto mb-2 text-gray-300" size={32} />
                  <p>분석된 음식 키워드가 없습니다.</p>
                </div>
              )}
            </Card>

            {/* 통계 카드 */}
            <Card className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-blue-500" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">분석 통계</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">검색어</span>
                  <span className="font-medium text-gray-900">{query}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">분석 기간</span>
                  <span className="font-medium text-gray-900">최근 {data.period}일</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">분석 영상 수</span>
                  <span className="font-medium text-gray-900">{data.totalVideos}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">추출 키워드</span>
                  <span className="font-medium text-gray-900">{data.foodTrends.length}개</span>
                </div>
              </div>
            </Card>
          </div>

          {/* 오른쪽: 인기 영상 */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="text-red-500" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  "{query}" 인기 영상
                </h3>
              </div>

              <div className="space-y-4">
                {data.videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    {/* 순위 */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        index < 3
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* 썸네일 */}
                    <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Youtube className="text-gray-400" size={32} />
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                        {video.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {video.channelTitle}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {formatNumber(video.viewCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={14} />
                          {formatNumber(video.likeCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          {formatNumber(video.commentCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(video.publishedAt)}
                        </span>
                      </div>
                    </div>

                    {/* 링크 */}
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                ))}
              </div>

              {data.videos.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Youtube className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-lg font-medium">영상을 찾을 수 없습니다.</p>
                  <p className="text-sm mt-1">검색 조건을 변경해 보세요.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
