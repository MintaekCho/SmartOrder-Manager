'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Loader2, Info } from 'lucide-react';

interface TrendData {
  period: string;
  [key: string]: string | number;
}

interface TrendResult {
  title: string;
  keywords: string[];
  data: { period: string; ratio: number }[];
}

const COLORS = ['#4AC1E0', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];

export default function TrendChart() {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'naver' | 'mock'>('mock');

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trends');
      const result = await response.json();

      if (result.success && result.data?.results) {
        setSource(result.source);

        // 데이터 변환
        const results: TrendResult[] = result.data.results;
        const keywordList = results.map(r => r.title);
        setKeywords(keywordList);

        // 날짜별 데이터 병합
        const dateMap = new Map<string, TrendData>();

        results.forEach((r, idx) => {
          r.data.forEach(d => {
            if (!dateMap.has(d.period)) {
              dateMap.set(d.period, { period: formatDate(d.period) });
            }
            const entry = dateMap.get(d.period)!;
            entry[r.title] = Math.round(d.ratio);
          });
        });

        const chartData = Array.from(dateMap.values()).sort(
          (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
        );

        setTrendData(chartData);
      }
    } catch (error) {
      console.error('트렌드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (isLoading) {
    return (
      <Card title="검색 트렌드" subtitle="제철 과일 검색량 추이">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[var(--color-primary-500)]" size={32} />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="검색 트렌드"
      subtitle="제철 과일 검색량 추이"
      actions={
        <div className="flex items-center gap-2 text-xs text-[var(--color-gray-500)]">
          <Info size={14} />
          {source === 'naver' ? '네이버 데이터랩' : 'Mock 데이터'}
        </div>
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: 'var(--color-gray-600)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--color-gray-600)' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid var(--color-gray-200)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            {keywords.map((keyword, index) => (
              <Line
                key={keyword}
                type="monotone"
                dataKey={keyword}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 인사이트 */}
      <div className="mt-4 p-3 bg-[var(--color-gray-50)] rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="text-[var(--color-success)]" />
          <span className="font-medium text-sm">트렌드 인사이트</span>
        </div>
        <p className="text-sm text-[var(--color-gray-600)]">
          12월 현재 <span className="font-bold text-[var(--color-primary-600)]">감귤</span>과{' '}
          <span className="font-bold text-[var(--color-primary-600)]">딸기</span>의 검색량이 증가 추세입니다.
          제철 과일 위주로 상품을 구성하면 판매 기회가 높아집니다.
        </p>
      </div>
    </Card>
  );
}
