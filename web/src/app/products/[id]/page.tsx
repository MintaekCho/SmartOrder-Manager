'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import {
  Edit,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Package,
  DollarSign,
  Truck,
  Image as ImageIcon,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PlatformProduct {
  id: string;
  platform: string;
  platformProductId: string | null;
  status: string;
  lastSyncedAt: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  thumbnailUrl: string | null;
  images: string[];
  costPrice: number;
  basePrice: number;
  shippingFee: number;
  freeShipOver: number | null;
  options: { name: string; values: string[] }[];
  detailHtml: string | null;
  notices: Record<string, string>;
  status: string;
  platformProducts: PlatformProduct[];
  platformSettings: Record<string, unknown>;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/master/${id}`);
        const result = await response.json();

        if (result.success && result.data) {
          setProduct(result.data);
        } else {
          alert('상품을 찾을 수 없습니다.');
          router.push('/products');
        }
      } catch (error) {
        console.error('상품 로드 오류:', error);
        alert('상품을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, router]);

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      COUPANG: '쿠팡',
      NAVER: '네이버',
      SHOP: '자사몰',
    };
    return labels[platform] || platform;
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      COUPANG: 'bg-orange-500',
      NAVER: 'bg-green-500',
      SHOP: 'bg-blue-500',
    };
    return colors[platform] || 'bg-gray-500';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
      DRAFT: { label: '작성중', variant: 'default' },
      READY: { label: '등록대기', variant: 'warning' },
      ACTIVE: { label: '판매중', variant: 'success' },
      PAUSED: { label: '일시중지', variant: 'warning' },
      DELETED: { label: '삭제됨', variant: 'error' },
    };
    const info = statusMap[status] || { label: status, variant: 'default' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const calculateMargin = () => {
    if (!product) return { margin: '0', profit: 0 };
    const cost = product.costPrice || 0;
    const price = product.basePrice || 0;
    const delivery = product.shippingFee || 0;

    if (price === 0) return { margin: '0', profit: 0 };

    const avgFeeRate = 0.1;
    const profit = price - cost - delivery - (price * avgFeeRate);
    const margin = (profit / price) * 100;

    return {
      margin: margin.toFixed(1),
      profit: Math.round(profit),
    };
  };

  if (loading) {
    return (
      <DashboardLayout title="상품 상세">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return null;
  }

  const { margin, profit } = calculateMargin();

  return (
    <DashboardLayout
      title="상품 상세"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '상품 관리', href: '/products' },
        { name: product.name },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package size={24} className="text-gray-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                  {product.brand && (
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(product.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">카테고리</p>
                <p className="font-medium">{product.category?.name || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">등록일</p>
                <p className="font-medium">
                  {new Date(product.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {product.description && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">상품 설명</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </Card>

          {/* 이미지 */}
          <Card title="상품 이미지" icon={<ImageIcon size={18} />}>
            <div className="grid grid-cols-5 gap-3">
              {product.thumbnailUrl && (
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-500">
                  <Image
                    src={product.thumbnailUrl}
                    alt="대표 이미지"
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">
                    대표
                  </span>
                </div>
              )}
              {product.images?.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={img}
                    alt={`상품 이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
              {!product.thumbnailUrl && (!product.images || product.images.length === 0) && (
                <div className="col-span-5 py-8 text-center text-gray-400">
                  등록된 이미지가 없습니다.
                </div>
              )}
            </div>
          </Card>

          {/* 옵션 */}
          {product.options && product.options.length > 0 && (
            <Card title="상품 옵션" icon={<Tag size={18} />}>
              <div className="space-y-3">
                {product.options.map((option, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">{option.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value, vIndex) => (
                        <span
                          key={vIndex}
                          className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 상세 설명 */}
          {product.detailHtml && (
            <Card title="상세 설명">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.detailHtml }}
              />
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 가격 정보 */}
          <Card title="가격 정보" icon={<DollarSign size={18} />}>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">원가</span>
                <span className="font-medium">{product.costPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">판매가</span>
                <span className="font-bold text-lg text-blue-600">
                  {product.basePrice.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">예상 순이익</span>
                <span className={`font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">마진율</span>
                <span className={`font-bold ${parseFloat(margin) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {margin}%
                </span>
              </div>
            </div>
          </Card>

          {/* 배송 정보 */}
          <Card title="배송 정보" icon={<Truck size={18} />}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">배송비</span>
                <span className="font-medium">
                  {product.shippingFee === 0 ? '무료배송' : `${product.shippingFee.toLocaleString()}원`}
                </span>
              </div>
              {product.freeShipOver && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">무료배송 기준</span>
                  <span className="font-medium">{product.freeShipOver.toLocaleString()}원 이상</span>
                </div>
              )}
            </div>
          </Card>

          {/* 플랫폼 등록 현황 */}
          <Card title="플랫폼 등록 현황">
            <div className="space-y-3">
              {product.platformProducts && product.platformProducts.length > 0 ? (
                product.platformProducts.map((pp) => (
                  <div
                    key={pp.platform}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getPlatformColor(pp.platform)}`} />
                      <span className="text-sm font-medium">{getPlatformLabel(pp.platform)}</span>
                      {pp.platformProductId ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <AlertCircle size={14} className="text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pp.lastSyncedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(pp.lastSyncedAt).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                      {pp.platformProductId && pp.platform === 'COUPANG' && (
                        <a
                          href={`https://wing.coupang.com/product/manage/${pp.platformProductId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="쿠팡 Wing에서 보기"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-400">
                  등록된 플랫폼이 없습니다.
                </div>
              )}
            </div>
          </Card>

          {/* 시간 정보 */}
          <Card title="등록 정보" icon={<Clock size={18} />}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">생성일</span>
                <span>{new Date(product.createdAt).toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">수정일</span>
                <span>{new Date(product.updatedAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </Card>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Link href={`/products/${id}/edit`} className="block">
              <Button className="w-full">
                <Edit size={16} className="mr-2" />
                수정하기
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push('/products')}
            >
              <ArrowLeft size={16} className="mr-2" />
              목록으로
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
