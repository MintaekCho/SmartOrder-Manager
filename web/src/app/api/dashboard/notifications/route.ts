import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

interface Notification {
  id: number;
  message: string;
  time: string;
  isNew: boolean;
  type: 'order' | 'product' | 'system';
}

// 알림 목록 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    const client = getCoupangClient();
    const notifications: Notification[] = [];
    let notificationId = 1;

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // 새로운 주문 확인
      const newOrders = await client.getOrders({
        vendorId,
        createdAtFrom: today,
        createdAtTo: today,
        status: 'ACCEPT',
        maxPerPage: 10,
      });

      if (newOrders.data && newOrders.data.length > 0) {
        notifications.push({
          id: notificationId++,
          message: `새로운 주문이 ${newOrders.data.length}건 들어왔습니다.`,
          time: '오늘',
          isNew: true,
          type: 'order',
        });
      }
    } catch {
      // 주문 조회 실패 시 무시
    }

    try {
      // 미처리 주문 확인
      const pendingOrders = await client.getOrders({
        vendorId,
        createdAtFrom: yesterday,
        createdAtTo: today,
        status: 'ACCEPT',
        maxPerPage: 50,
      });

      if (pendingOrders.data && pendingOrders.data.length > 5) {
        notifications.push({
          id: notificationId++,
          message: `처리 대기 중인 주문이 ${pendingOrders.data.length}건 있습니다.`,
          time: '확인 필요',
          isNew: true,
          type: 'order',
        });
      }
    } catch {
      // 조회 실패 시 무시
    }

    try {
      // 상품 상태 확인
      const products = await client.getProducts({
        vendorId,
        maxPerPage: 50,
      });

      // 품절 또는 판매중지 상품 확인
      const inactiveProducts = (products.data || []).filter(
        (p) => p.statusName !== '승인완료' && p.statusName !== 'APPROVED'
      );

      if (inactiveProducts.length > 0) {
        notifications.push({
          id: notificationId++,
          message: `${inactiveProducts.length}개 상품의 상태를 확인해주세요.`,
          time: '상품 관리',
          isNew: false,
          type: 'product',
        });
      }
    } catch {
      // 상품 조회 실패 시 무시
    }

    // 알림이 없는 경우 기본 메시지
    if (notifications.length === 0) {
      notifications.push({
        id: notificationId++,
        message: '새로운 알림이 없습니다.',
        time: '방금',
        isNew: false,
        type: 'system',
      });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('[API] Notifications error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
