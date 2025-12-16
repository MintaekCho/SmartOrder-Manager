import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClientWithVendorId } from '@/lib/coupang/client';

// 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nextToken = searchParams.get('nextToken');
    const maxPerPage = searchParams.get('maxPerPage');
    const status = searchParams.get('status');

    const { client, vendorId } = await getCoupangClientWithVendorId();
    const response = await client.getProducts({
      vendorId,
      nextToken: nextToken || undefined,
      maxPerPage: maxPerPage ? parseInt(maxPerPage) : 50,
      status: status || undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang products error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// 상품 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { client, vendorId } = await getCoupangClientWithVendorId();
    const response = await client.createProduct(vendorId, body);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang create product error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

// 상품 가격/재고 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { client, vendorId } = await getCoupangClientWithVendorId();
    const response = await client.updateProductPrice(vendorId, body);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang update product price error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product price' },
      { status: 500 }
    );
  }
}

// 상품 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerProductId = searchParams.get('sellerProductId');

    if (!sellerProductId) {
      return NextResponse.json({ error: 'sellerProductId is required' }, { status: 400 });
    }

    const { client, vendorId } = await getCoupangClientWithVendorId();
    const response = await client.deleteProduct(vendorId, parseInt(sellerProductId));

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang delete product error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}
