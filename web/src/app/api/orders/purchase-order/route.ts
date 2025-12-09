import { NextRequest, NextResponse } from 'next/server';

// 발주서 데이터 타입
interface PurchaseOrderItem {
  productName: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderId: number;
  shipmentBoxId: number;
  receiverName: string;
  receiverPhone: string;
  address: string;
  memo?: string;
}

interface PurchaseOrderRequest {
  supplier: string;
  items: PurchaseOrderItem[];
  format: 'json' | 'csv' | 'excel';
}

// 발주서 생성 API
export async function POST(request: NextRequest) {
  try {
    const body: PurchaseOrderRequest = await request.json();
    const { supplier, items, format } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    const orderDate = new Date().toISOString().split('T')[0];
    const orderNumber = `PO-${Date.now()}`;

    // 총 합계 계산
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    if (format === 'csv') {
      // CSV 형식 생성
      const csvHeader = '번호,상품명,옵션,수량,단가,합계,주문번호,수령인,연락처,주소,메모';
      const csvRows = items.map((item, index) =>
        [
          index + 1,
          `"${item.productName}"`,
          `"${item.optionName}"`,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.orderId,
          `"${item.receiverName}"`,
          `"${item.receiverPhone}"`,
          `"${item.address}"`,
          `"${item.memo || ''}"`,
        ].join(',')
      );

      const csv = [
        `# 발주서`,
        `# 발주번호: ${orderNumber}`,
        `# 발주일자: ${orderDate}`,
        `# 공급처: ${supplier || '미지정'}`,
        `# 총 수량: ${totalQuantity}개`,
        `# 총 금액: ${totalAmount.toLocaleString()}원`,
        '',
        csvHeader,
        ...csvRows,
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="purchase-order-${orderNumber}.csv"`,
        },
      });
    }

    // JSON 형식 (기본)
    const purchaseOrder = {
      orderNumber,
      orderDate,
      supplier: supplier || '미지정',
      summary: {
        totalItems: items.length,
        totalQuantity,
        totalAmount,
      },
      items: items.map((item, index) => ({
        no: index + 1,
        ...item,
      })),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('[API] Purchase order generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate purchase order' },
      { status: 500 }
    );
  }
}

// 발주서 템플릿 조회
export async function GET() {
  return NextResponse.json({
    templates: [
      {
        id: 'default',
        name: '기본 발주서',
        description: '상품명, 수량, 가격, 배송지 정보가 포함된 기본 양식',
      },
      {
        id: 'simple',
        name: '간편 발주서',
        description: '상품명과 수량만 포함된 간단한 양식',
      },
      {
        id: 'detailed',
        name: '상세 발주서',
        description: '모든 정보가 포함된 상세 양식',
      },
    ],
  });
}
