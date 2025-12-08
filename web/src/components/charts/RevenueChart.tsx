'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RevenueChartProps {
  data: {
    date: string;
    revenue: number;
    profit: number;
  }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const formatTooltip = (value: number) => {
    return value.toLocaleString() + '원';
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-[var(--color-gray-900)]">매출 추이</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm rounded-lg bg-[var(--color-primary-500)] text-white">
            일
          </button>
          <button className="px-3 py-1 text-sm rounded-lg text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
            주
          </button>
          <button className="px-3 py-1 text-sm rounded-lg text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]">
            월
          </button>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#757575' }}
              tickLine={false}
              axisLine={{ stroke: '#E0E0E0' }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12, fill: '#757575' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span style={{ color: '#424242', fontSize: '12px' }}>
                  {value === 'revenue' ? '매출' : '순이익'}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#4AC1E0"
              strokeWidth={2}
              dot={{ fill: '#4AC1E0', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: '#4AC1E0', strokeWidth: 2, fill: 'white' }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="profit"
              stroke="#4CAF50"
              strokeWidth={2}
              dot={{ fill: '#4CAF50', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: '#4CAF50', strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
