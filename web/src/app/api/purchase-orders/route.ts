import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PurchaseOrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * 발주 목록 조회
 * GET /api/purchase-orders?search=&status=&date=
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const date = searchParams.get('date') || '';

  try {
    const where: any = {};

    // 검색 조건
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 상태 필터
    if (status) {
      where.status = status as PurchaseOrderStatus;
    }

    // 날짜 필터
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.orderDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('[Purchase Orders API] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '발주 목록 조회 실패',
    });
  }
}

/**
 * 발주 생성
 * POST /api/purchase-orders
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      supplierName,
      supplierContact,
      orderDate,
      expectedDate,
      note,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      status,
      items,
    } = body;

    // 발주번호 자동 생성 (PO-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // 오늘 날짜의 마지막 발주번호 조회
    const todayOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderNumber: {
          startsWith: `PO-${dateStr}`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
      take: 1,
    });

    let seq = 1;
    if (todayOrders.length > 0) {
      const lastSeq = parseInt(todayOrders[0].orderNumber.split('-')[2]);
      seq = lastSeq + 1;
    }

    const orderNumber = `PO-${dateStr}-${String(seq).padStart(3, '0')}`;

    const newOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierName,
        supplierContact: supplierContact || null,
        status: (status as PurchaseOrderStatus) || 'DRAFT',
        orderDate: new Date(orderDate),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal: subtotal || 0,
        tax: tax || 0,
        shippingCost: shippingCost || 0,
        totalAmount: totalAmount || 0,
        note: note || null,
        items: {
          create: items.map((item: any) => ({
            sku: item.sku,
            name: item.name,
            unit: item.unit || 'EA',
            orderedQty: item.orderedQty,
            receivedQty: 0,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            note: item.note || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    console.error('[Purchase Orders API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '발주 생성 실패',
    });
  }
}
