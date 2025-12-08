'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title?: string;
}

export default function CategoryChart({ data, title = '카테고리별 판매' }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const formatTooltip = (value: number) => {
    const percentage = ((value / total) * 100).toFixed(1);
    return [`${value.toLocaleString()}원 (${percentage}%)`, '매출'];
  };

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-[var(--color-gray-900)] mb-6">{title}</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span style={{ color: '#424242', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with values */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[var(--color-gray-700)]">{item.name}</span>
            </div>
            <span className="font-medium text-[var(--color-gray-900)]">
              {item.value.toLocaleString()}원
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
