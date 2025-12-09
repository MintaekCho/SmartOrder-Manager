'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import {
  Search,
  ExternalLink,
  Star,
  Package,
  Truck,
  Building2,
} from 'lucide-react';

// 도매 사이트 목록
const wholesaleSites = [
  {
    id: 'domeggook',
    name: '도매꾹',
    url: 'https://domeggook.com',
    description: '국내 최대 도매/위탁판매 플랫폼',
    categories: ['생활용품', '패션잡화', '뷰티', '식품'],
    features: ['위탁배송', '무재고판매', 'API연동'],
    rating: 4.5,
  },
  {
    id: 'domemate',
    name: '도매매',
    url: 'https://domemate.com',
    description: '패션/잡화 전문 도매몰',
    categories: ['의류', '잡화', '액세서리'],
    features: ['위탁배송', '사입가능'],
    rating: 4.2,
  },
  {
    id: 'oneroommaking',
    name: '원룸메이킹',
    url: 'https://oneroommaking.com',
    description: '인테리어/생활용품 도매',
    categories: ['인테리어', '생활용품', '주방용품'],
    features: ['위탁배송', '소량주문'],
    rating: 4.0,
  },
  {
    id: 'alibaba',
    name: '알리바바',
    url: 'https://alibaba.com',
    description: '중국 B2B 도매 플랫폼',
    categories: ['전자제품', '의류', '잡화', '전체'],
    features: ['대량구매', '해외배송', 'OEM가능'],
    rating: 4.3,
  },
  {
    id: '1688',
    name: '1688',
    url: 'https://1688.com',
    description: '중국 내수 도매 플랫폼 (최저가)',
    categories: ['전자제품', '의류', '잡화', '전체'],
    features: ['최저가', '대량구매', '배대지필요'],
    rating: 4.1,
  },
  {
    id: 'temu',
    name: 'Temu',
    url: 'https://temu.com',
    description: '중국 직구 플랫폼 (소량가능)',
    categories: ['생활용품', '패션', '전자제품'],
    features: ['소량구매', '직배송', '저렴한가격'],
    rating: 3.8,
  },
];

export default function SuppliersSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', '생활용품', '패션잡화', '식품', '전자제품', '인테리어'];

  const filteredSites = wholesaleSites.filter((site) => {
    const matchesSearch =
      !searchQuery ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.includes(searchQuery) ||
      site.categories.some((cat) => cat.includes(searchQuery));

    const matchesCategory =
      selectedCategory === 'all' ||
      site.categories.some((cat) => cat.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout
      title="공급처 검색"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 소싱', href: '/sourcing' },
        { name: '공급처 검색' },
      ]}
    >
      {/* 검색 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]"
            />
            <input
              type="text"
              placeholder="도매사이트 또는 카테고리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'bg-[var(--color-gray-100)] text-[var(--color-gray-700)] hover:bg-[var(--color-gray-200)]'
                }`}
              >
                {cat === 'all' ? '전체' : cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 사이트 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSites.map((site) => (
          <Card key={site.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center">
                  <Building2 size={20} className="text-[var(--color-primary-600)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-gray-900)]">{site.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-[var(--color-gray-500)]">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span>{site.rating}</span>
                  </div>
                </div>
              </div>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-[var(--color-gray-100)] transition-colors"
              >
                <ExternalLink size={16} className="text-[var(--color-gray-500)]" />
              </a>
            </div>

            <p className="text-sm text-[var(--color-gray-600)] mb-3">{site.description}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {site.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 text-xs bg-[var(--color-gray-100)] text-[var(--color-gray-600)] rounded"
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {site.features.map((feature) => (
                <span
                  key={feature}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--color-primary-50)] text-[var(--color-primary-700)] rounded-lg"
                >
                  {feature === '위탁배송' && <Truck size={12} />}
                  {feature === '무재고판매' && <Package size={12} />}
                  {feature}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="text-center py-12 text-[var(--color-gray-500)]">
          검색 결과가 없습니다.
        </div>
      )}
    </DashboardLayout>
  );
}
