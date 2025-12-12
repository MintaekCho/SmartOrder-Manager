import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 입고 처리
 * POST /api/purchase-orders/[id]/receive
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { itemId, receivedQty } = body;

    if (!itemId || typeof receivedQty !== 'number' || receivedQty < 0) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 입고 정보입니다.',
      }, { status: 400 });
    }

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: '발주를 찾을 수 없습니다.',
      }, { status: 404 });
    }

    // 입고 가능한 상태인지 확인
    if (!['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)) {
      return NextResponse.json({
        success: false,
        error: '확인됨 또는 부분입고 상태에서만 입고 처리가 가능합니다.',
      }, { status: 400 });
    }

    // 해당 항목 찾기
    const item = order.items.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json({
        success: false,
        error: '해당 품목을 찾을 수 없습니다.',
      }, { status: 404 });
    }

    // 입고 수량 검증
    const newReceivedQty = item.receivedQty + receivedQty;
    if (newReceivedQty > item.orderedQty) {
      return NextResponse.json({
        success: false,
        error: `입고 수량(${newReceivedQty})이 발주 수량(${item.orderedQty})을 초과할 수 없습니다.`,
      }, { status: 400 });
    }

    // 항목 입고 수량 업데이트
    await prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: {
        receivedQty: newReceivedQty,
      },
    });

    // 업데이트된 모든 항목 조회
    const updatedItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });

    // 전체 발주 상태 업데이트
    const allReceived = updatedItems.every(i => i.receivedQty >= i.orderedQty);
    const someReceived = updatedItems.some(i => i.receivedQty > 0);

    let newStatus = order.status;
    if (allReceived) {
      newStatus = 'RECEIVED';
    } else if (someReceived) {
      newStatus = 'PARTIALLY_RECEIVED';
    }

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `${receivedQty}개 입고 처리되었습니다.`,
    });
  } catch (error) {
    console.error('[Purchase Order Receive API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '입고 처리 실패',
    });
  }
}
