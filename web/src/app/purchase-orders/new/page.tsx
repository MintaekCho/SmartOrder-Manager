'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Input, Select } from '@/components/ui';
import {
  Plus,
  Trash2,
  Save,
  X,
  Building2,
  Calendar,
  Package,
  AlertCircle,
  Search,
} from 'lucide-react';

interface OrderItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  orderedQty: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 발주 기본 정보
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [note, setNote] = useState('');
  const [tax, setTax] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);

  // 발주 항목
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', sku: '', name: '', unit: 'EA', orderedQty: 1, unitPrice: 0, totalPrice: 0, note: '' },
  ]);

  // 신규 항목 추가
  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        sku: '',
        name: '',
        unit: 'EA',
        orderedQty: 1,
        unitPrice: 0,
        totalPrice: 0,
        note: '',
      },
    ]);
  };

  // 항목 삭제
  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  // 항목 수정
  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // 수량 또는 단가 변경 시 총액 재계산
        if (field === 'orderedQty' || field === 'unitPrice') {
          updated.totalPrice = updated.orderedQty * updated.unitPrice;
        }

        return updated;
      })
    );
  };

  // 소계 계산
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAmount = subtotal + tax + shippingCost;

  // 저장
  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    // 유효성 검사
    if (!supplierName.trim()) {
      setError('공급처명을 입력해주세요.');
      return;
    }

    const validItems = items.filter((item) => item.sku.trim() && item.name.trim());
    if (validItems.length === 0) {
      setError('최소 1개 이상의 품목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName,
          supplierContact: supplierContact || null,
          orderDate,
          expectedDate: expectedDate || null,
          note: note || null,
          subtotal,
          tax,
          shippingCost,
          totalAmount,
          status,
          items: validItems.map((item) => ({
            sku: item.sku,
            name: item.name,
            unit: item.unit,
            orderedQty: item.orderedQty,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            note: item.note || null,
          })),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || '저장에 실패했습니다.');
        setSaving(false);
        return;
      }

      // 성공 시 목록 또는 상세 페이지로 이동
      router.push(`/purchase-orders/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="새 발주 등록"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '발주 관리', href: '/purchase-orders' },
        { name: '새 발주' },
      ]}
    >
      {/* 에러 메시지 */}
      {error && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-700">입력 오류</p>
              <p className="text-sm text-amber-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 기본 정보 */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={20} />
          공급처 정보
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              공급처명 <span className="text-red-500">*</span>
            </label>
            <Input
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="공급처명을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처
            </label>
            <Input
              value={supplierContact}
              onChange={(e) => setSupplierContact(e.target.value)}
              placeholder="연락처 (선택)"
            />
          </div>
        </div>
      </Card>

      {/* 발주 정보 */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={20} />
          발주 정보
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              발주일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              입고 예정일
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비고
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="메모 (선택)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
            />
          </div>
        </div>
      </Card>

      {/* 발주 품목 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package size={20} />
            발주 품목
          </h3>
          <Button onClick={addItem} variant="secondary" size="sm">
            <Plus size={16} />
            품목 추가
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500 w-[120px]">SKU</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">품명</th>
                <th className="text-center py-2 px-2 text-sm font-medium text-gray-500 w-[80px]">단위</th>
                <th className="text-center py-2 px-2 text-sm font-medium text-gray-500 w-[100px]">수량</th>
                <th className="text-right py-2 px-2 text-sm font-medium text-gray-500 w-[120px]">단가</th>
                <th className="text-right py-2 px-2 text-sm font-medium text-gray-500 w-[120px]">금액</th>
                <th className="text-center py-2 px-2 text-sm font-medium text-gray-500 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="품명을 입력하세요"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    >
                      <option value="EA">EA</option>
                      <option value="BOX">BOX</option>
                      <option value="SET">SET</option>
                      <option value="KG">KG</option>
                      <option value="L">L</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={item.orderedQty}
                      onChange={(e) => updateItem(item.id, 'orderedQty', parseInt(e.target.value) || 0)}
                      min={1}
                      className="w-full px-2 py-1.5 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-2 py-1.5 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {item.totalPrice.toLocaleString()}원
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 금액 정보 */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">금액 정보</h3>
        <div className="max-w-md ml-auto space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">소계</span>
            <span className="font-medium text-gray-900">{subtotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">부가세</span>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(parseInt(e.target.value) || 0)}
              min={0}
              className="w-32 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">배송비</span>
            <input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseInt(e.target.value) || 0)}
              min={0}
              className="w-32 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">총액</span>
            <span className="text-xl font-bold text-[var(--color-primary-600)]">
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push('/purchase-orders')}
          disabled={saving}
        >
          <X size={16} />
          취소
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSave('DRAFT')}
          disabled={saving}
        >
          <Save size={16} />
          임시저장
        </Button>
        <Button
          onClick={() => handleSave('SUBMITTED')}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? '저장 중...' : '발주 제출'}
        </Button>
      </div>
    </DashboardLayout>
  );
}
