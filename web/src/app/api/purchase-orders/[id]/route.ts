import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PurchaseOrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 발주 상세 조회
 * GET /api/purchase-orders/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
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

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Purchase Order API] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '발주 조회 실패',
    });
  }
}

/**
 * 발주 수정 (상태 변경 포함)
 * PATCH /api/purchase-orders/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, ...updateData } = body;

    const currentOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!currentOrder) {
      return NextResponse.json({
        success: false,
        error: '발주를 찾을 수 없습니다.',
      }, { status: 404 });
    }

    // 상태 변경 시 유효성 검사
    if (status) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['SUBMITTED', 'CANCELLED'],
        SUBMITTED: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
        PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
        RECEIVED: [],
        CANCELLED: [],
      };

      const allowedStatuses = validTransitions[currentOrder.status] || [];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({
          success: false,
          error: `현재 상태(${currentOrder.status})에서 ${status}로 변경할 수 없습니다.`,
        }, { status: 400 });
      }
    }

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(status && { status: status as PurchaseOrderStatus }),
        ...updateData,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[Purchase Order API] PATCH Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '발주 수정 실패',
    });
  }
}

/**
 * 발주 삭제
 * DELETE /api/purchase-orders/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: '발주를 찾을 수 없습니다.',
      }, { status: 404 });
    }

    // DRAFT 상태만 삭제 가능
    if (order.status !== 'DRAFT') {
      return NextResponse.json({
        success: false,
        error: '작성 중 상태의 발주만 삭제할 수 있습니다.',
      }, { status: 400 });
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '발주가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('[Purchase Order API] DELETE Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '발주 삭제 실패',
    });
  }
}
