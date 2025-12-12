'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Badge, DataTable } from '@/components/ui';
import {
  Search,
  RefreshCw,
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  AlertCircle,
  ArrowRight,
  Calendar,
  Building2,
} from 'lucide-react';

// Mock 배송 데이터
const mockShipments = [
  {
    id: '1',
    coupangOrderId: 'COU-2024011501234',
    productName: '블루투스 이어폰 TWS-500',
    buyerName: '김*호',
    buyerAddress: '서울시 강남구 테헤란로 123',
    trackingInfo: {
      carrier: 'CJ대한통운',
      trackingNumber: '123456789012',
      status: 'IN_TRANSIT',
      estimatedDelivery: '2024-01-17',
      lastLocation: '서울 강남 영업소',
      lastUpdate: '2024-01-16 14:30:00',
    },
    timeline: [
      { status: '상품 인수', location: '도매처 발송', time: '2024-01-15 18:00:00' },
      { status: '집하', location: '서울 송파 허브', time: '2024-01-15 22:30:00' },
      { status: '이동중', location: '서울 강남 영업소', time: '2024-01-16 14:30:00' },
    ],
    orderedAt: '2024-01-15 14:30:22',
    shippedAt: '2024-01-15 17:00:00',
  },
  {
    id: '2',
    coupangOrderId: 'COU-2024011501235',
    productName: 'USB-C 고속 충전 케이블 1.5m (2개)',
    buyerName: '이*영',
    buyerAddress: '경기도 성남시 분당구 정자동 45-1',
    trackingInfo: {
      carrier: '롯데택배',
      trackingNumber: '987654321098',
      status: 'DELIVERED',
      estimatedDelivery: '2024-01-16',
      lastLocation: '배송완료',
      lastUpdate: '2024-01-16 11:20:00',
    },
    timeline: [
      { status: '상품 인수', location: '도매처 발송', time: '2024-01-14 16:00:00' },
      { status: '집하', location: '인천 허브', time: '2024-01-14 21:00:00' },
      { status: '이동중', location: '분당 영업소', time: '2024-01-15 09:00:00' },
      { status: '배송출발', location: '분당 영업소', time: '2024-01-16 08:30:00' },
      { status: '배송완료', location: '배송완료', time: '2024-01-16 11:20:00' },
    ],
    orderedAt: '2024-01-14 13:22:15',
    shippedAt: '2024-01-14 15:00:00',
  },
  {
    id: '3',
    coupangOrderId: 'COU-2024011501236',
    productName: '무선 마우스 M-200',
    buyerName: '박*수',
    buyerAddress: '부산시 해운대구 우동 123',
    trackingInfo: {
      carrier: '한진택배',
      trackingNumber: '456789123456',
      status: 'OUT_FOR_DELIVERY',
      estimatedDelivery: '2024-01-16',
      lastLocation: '해운대 영업소 배송출발',
      lastUpdate: '2024-01-16 09:00:00',
    },
    timeline: [
      { status: '상품 인수', location: '도매처 발송', time: '2024-01-14 14:00:00' },
      { status: '집하', location: '서울 강서 허브', time: '2024-01-14 19:00:00' },
      { status: '이동중', location: '부산 허브', time: '2024-01-15 06:00:00' },
      { status: '이동중', location: '해운대 영업소', time: '2024-01-15 14:00:00' },
      { status: '배송출발', location: '해운대 영업소', time: '2024-01-16 09:00:00' },
    ],
    orderedAt: '2024-01-14 11:45:33',
    shippedAt: '2024-01-14 13:30:00',
  },
  {
    id: '4',
    coupangOrderId: 'COU-2024011501237',
    productName: '노트북 거치대 알루미늄',
    buyerName: '최*지',
    buyerAddress: '대전시 유성구 봉명동 100',
    trackingInfo: {
      carrier: 'CJ대한통운',
      trackingNumber: '789123456789',
      status: 'PENDING',
      estimatedDelivery: '2024-01-18',
      lastLocation: '송장 등록',
      lastUpdate: '2024-01-16 10:00:00',
    },
    timeline: [
      { status: '송장 등록', location: '시스템', time: '2024-01-16 10:00:00' },
    ],
    orderedAt: '2024-01-15 10:15:42',
    shippedAt: '2024-01-16 10:00:00',
  },
  {
    id: '5',
    coupangOrderId: 'COU-2024011501238',
    productName: '미니 가습기 USB',
    buyerName: '정*아',
    buyerAddress: '인천시 남동구 간석동 200',
    trackingInfo: {
      carrier: '우체국택배',
      trackingNumber: '321654987321',
      status: 'EXCEPTION',
      estimatedDelivery: '2024-01-16',
      lastLocation: '배송 지연 - 수취인 부재',
      lastUpdate: '2024-01-16 15:30:00',
    },
    timeline: [
      { status: '상품 인수', location: '도매처 발송', time: '2024-01-14 10:00:00' },
      { status: '집하', location: '인천 우편집중국', time: '2024-01-14 16:00:00' },
      { status: '배송출발', location: '남동 우체국', time: '2024-01-15 09:00:00' },
      { status: '배송 시도', location: '수취인 부재', time: '2024-01-15 14:00:00' },
      { status: '재배송 예정', location: '남동 우체국', time: '2024-01-16 15:30:00' },
    ],
    orderedAt: '2024-01-13 16:30:11',
    shippedAt: '2024-01-14 09:30:00',
  },
];

const statusConfig: Record<string, { label: string; variant: 'pending' | 'processing' | 'completed' | 'error'; icon: React.ReactNode }> = {
  PENDING: { label: '배송 준비', variant: 'pending', icon: <Clock size={14} /> },
  IN_TRANSIT: { label: '배송중', variant: 'processing', icon: <Truck size={14} /> },
  OUT_FOR_DELIVERY: { label: '배송출발', variant: 'processing', icon: <Truck size={14} /> },
  DELIVERED: { label: '배송완료', variant: 'completed', icon: <CheckCircle size={14} /> },
  EXCEPTION: { label: '배송이슈', variant: 'error', icon: <AlertCircle size={14} /> },
};

const carrierUrls: Record<string, string> = {
  'CJ대한통운': 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
  '롯데택배': 'https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=',
  '한진택배': 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession-open&wblnum=',
  '우체국택배': 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=',
};

export default function TrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedShipment, setSelectedShipment] = useState<typeof mockShipments[0] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const filteredShipments = mockShipments.filter((shipment) => {
    const matchesSearch =
      !searchQuery ||
      shipment.coupangOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.trackingInfo.trackingNumber.includes(searchQuery) ||
      shipment.buyerName.includes(searchQuery);

    const matchesStatus = !statusFilter || shipment.trackingInfo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openTrackingPage = (carrier: string, trackingNumber: string) => {
    const baseUrl = carrierUrls[carrier];
    if (baseUrl) {
      window.open(baseUrl + trackingNumber, '_blank');
    }
  };

  // 상태별 카운트
  const statusCounts = mockShipments.reduce((acc, s) => {
    acc[s.trackingInfo.status] = (acc[s.trackingInfo.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const columns = [
    {
      key: 'order',
      header: '주문 정보',
      render: (item: typeof mockShipments[0]) => (
        <div>
          <p className="font-mono text-sm text-[var(--color-primary-600)]">{item.coupangOrderId}</p>
          <p className="text-sm font-medium text-[var(--color-gray-900)]">{item.productName}</p>
        </div>
      ),
    },
    {
      key: 'buyer',
      header: '수취인',
      render: (item: typeof mockShipments[0]) => (
        <div>
          <p className="font-medium text-[var(--color-gray-900)]">{item.buyerName}</p>
          <p className="text-xs text-[var(--color-gray-500)] max-w-[200px] truncate">
            {item.buyerAddress}
          </p>
        </div>
      ),
    },
    {
      key: 'tracking',
      header: '배송 정보',
      render: (item: typeof mockShipments[0]) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-[var(--color-gray-400)]" />
          <div>
            <p className="text-sm font-medium text-[var(--color-gray-900)]">
              {item.trackingInfo.carrier}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-[var(--color-gray-600)]">
                {item.trackingInfo.trackingNumber}
              </span>
              <button
                onClick={() => copyToClipboard(item.trackingInfo.trackingNumber)}
                className="p-0.5 hover:bg-[var(--color-gray-100)] rounded"
              >
                <Copy size={12} className="text-[var(--color-gray-400)]" />
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: '현재 위치',
      render: (item: typeof mockShipments[0]) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-[var(--color-gray-400)]" />
          <div>
            <p className="text-sm text-[var(--color-gray-900)]">{item.trackingInfo.lastLocation}</p>
            <p className="text-xs text-[var(--color-gray-500)]">{item.trackingInfo.lastUpdate}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '120px',
      render: (item: typeof mockShipments[0]) => {
        const config = statusConfig[item.trackingInfo.status];
        return (
          <Badge variant={config.variant} dot>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (item: typeof mockShipments[0]) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedShipment(item)}
          >
            상세
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openTrackingPage(item.trackingInfo.carrier, item.trackingInfo.trackingNumber)}
          >
            <ExternalLink size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="배송 추적"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '주문 관리', href: '/orders' },
        { name: '배송 추적' },
      ]}
    >
      {/* 상태별 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              statusFilter === status
                ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                : 'border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-300)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--color-gray-500)]">{config.icon}</span>
              <span className="text-sm text-[var(--color-gray-600)]">{config.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-gray-900)]">
              {statusCounts[status] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]"
              />
              <input
                type="text"
                placeholder="주문번호, 상품명, 운송장번호, 수취인 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--color-gray-300)] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRefresh} loading={isRefreshing}>
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              배송정보 갱신
            </Button>
          </div>
        </div>
      </Card>

      {/* 배송 이슈 알림 */}
      {statusCounts['EXCEPTION'] > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">배송 이슈 알림</p>
              <p className="text-sm text-amber-700 mt-1">
                {statusCounts['EXCEPTION']}건의 배송에서 문제가 발생했습니다. 확인이 필요합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 배송 목록 */}
      <DataTable
        columns={columns}
        data={filteredShipments}
        emptyMessage="배송 정보가 없습니다."
      />

      {/* 배송 상세 모달 */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-[var(--color-gray-200)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">
                  배송 상세 정보
                </h2>
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 주문 정보 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--color-gray-500)] mb-3">주문 정보</h3>
                <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-gray-500)]">주문번호</p>
                      <p className="font-mono text-sm">{selectedShipment.coupangOrderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-gray-500)]">주문일시</p>
                      <p className="text-sm">{selectedShipment.orderedAt}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-[var(--color-gray-500)]">상품</p>
                      <p className="text-sm font-medium">{selectedShipment.productName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--color-gray-500)] mb-3">배송 정보</h3>
                <div className="bg-[var(--color-gray-50)] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-gray-500)]">택배사</p>
                      <p className="text-sm font-medium">{selectedShipment.trackingInfo.carrier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-gray-500)]">운송장번호</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono">{selectedShipment.trackingInfo.trackingNumber}</p>
                        <button
                          onClick={() => copyToClipboard(selectedShipment.trackingInfo.trackingNumber)}
                          className="p-1 hover:bg-[var(--color-gray-200)] rounded"
                        >
                          <Copy size={14} className="text-[var(--color-gray-500)]" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-gray-500)]">수취인</p>
                      <p className="text-sm">{selectedShipment.buyerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-gray-500)]">예상 배송일</p>
                      <p className="text-sm">{selectedShipment.trackingInfo.estimatedDelivery}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-[var(--color-gray-500)]">배송지</p>
                      <p className="text-sm">{selectedShipment.buyerAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 배송 추적 타임라인 */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-gray-500)] mb-3">배송 추적</h3>
                <div className="relative">
                  {selectedShipment.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${
                          index === selectedShipment.timeline.length - 1
                            ? 'bg-[var(--color-primary-500)]'
                            : 'bg-[var(--color-gray-300)]'
                        }`} />
                        {index < selectedShipment.timeline.length - 1 && (
                          <div className="absolute top-3 left-1.5 w-px h-full bg-[var(--color-gray-200)] -translate-x-1/2" />
                        )}
                      </div>
                      <div className="flex-1 -mt-1">
                        <p className="text-sm font-medium text-[var(--color-gray-900)]">
                          {event.status}
                        </p>
                        <p className="text-xs text-[var(--color-gray-500)]">{event.location}</p>
                        <p className="text-xs text-[var(--color-gray-400)]">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-6 pt-6 border-t border-[var(--color-gray-200)] flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => openTrackingPage(
                    selectedShipment.trackingInfo.carrier,
                    selectedShipment.trackingInfo.trackingNumber
                  )}
                >
                  <ExternalLink size={16} className="mr-1" />
                  택배사 조회
                </Button>
                <Button variant="secondary" className="flex-1">
                  쿠팡 송장 등록
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
