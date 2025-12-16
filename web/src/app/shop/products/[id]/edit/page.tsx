'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  ImageIcon,
  Loader2,
  Trash2,
  AlertCircle,
  Check,
  FileImage,
  Eye,
  Smartphone,
  Monitor,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';

// 타입 정의
interface ImageWithPreview {
  file?: File;
  preview: string;
  isExisting?: boolean; // 기존 이미지인지 여부
}

interface Category {
  id: string;
  name: string;
  slug: string;
  code: string;
  parentId: string | null;
}

interface ImageValidation {
  valid: boolean;
  message: string;
  width?: number;
  height?: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  comparePrice: number | null;
  quantity: number;
  imageUrl: string | null;
  shopImages: string[];
  isShopVisible: boolean;
  shopDescription: string | null;
}

// 상세페이지 이미지 밸리데이션
const validateDetailImage = (file: File): Promise<ImageValidation> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const minWidth = 500;
      const recommendedWidth = 860;
      const maxFileSize = 10 * 1024 * 1024;

      if (file.size > maxFileSize) {
        resolve({
          valid: false,
          message: `파일 크기가 너무 큽니다. (최대 10MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
          width: img.width,
          height: img.height,
        });
        return;
      }

      if (img.width < minWidth) {
        resolve({
          valid: false,
          message: `이미지 가로 크기가 너무 작습니다. (최소 ${minWidth}px, 현재 ${img.width}px)`,
          width: img.width,
          height: img.height,
        });
        return;
      }

      const isRecommended = img.width >= recommendedWidth;
      resolve({
        valid: true,
        message: isRecommended
          ? `적합한 이미지입니다. (${img.width} x ${img.height}px)`
          : `사용 가능하지만 ${recommendedWidth}px 이상 권장 (현재 ${img.width}px)`,
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        message: '이미지를 로드할 수 없습니다.',
      });
    };

    img.src = url;
  });
};

export default function EditShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 기본 정보
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // 가격/재고
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [comparePrice, setComparePrice] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(0);

  // 이미지 관리
  const [productImages, setProductImages] = useState<ImageWithPreview[]>([]);

  // 상세페이지 관리
  const [shopDescription, setShopDescription] = useState('');
  const [detailImages, setDetailImages] = useState<{ file?: File; url: string; validation?: ImageValidation; isExisting?: boolean }[]>([]);

  // 노출 설정
  const [isShopVisible, setIsShopVisible] = useState(true);

  // 미리보기 모달 상태
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // 드래그앤드롭 상태
  const [draggedDetailIndex, setDraggedDetailIndex] = useState<number | null>(null);
  const [dragOverDetailIndex, setDragOverDetailIndex] = useState<number | null>(null);

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/shop/products/${id}`);
        const data = await res.json();

        if (data.success && data.data) {
          const product: Product = data.data;

          setProductName(product.name);
          setDescription(product.description || '');
          setCostPrice(product.costPrice);
          setSellingPrice(product.sellingPrice);
          setComparePrice(product.comparePrice || undefined);
          setQuantity(product.quantity);
          setIsShopVisible(product.isShopVisible);
          setShopDescription(product.shopDescription || '');

          // 기존 이미지들 로드
          const existingImages: ImageWithPreview[] = [];
          if (product.imageUrl) {
            existingImages.push({ preview: product.imageUrl, isExisting: true });
          }
          if (product.shopImages && product.shopImages.length > 0) {
            product.shopImages.forEach((url: string) => {
              if (url !== product.imageUrl) {
                existingImages.push({ preview: url, isExisting: true });
              }
            });
          }
          setProductImages(existingImages);

          // 카테고리 매칭
          if (product.category) {
            const matchedCategory = categories.find(c => c.name === product.category);
            if (matchedCategory) {
              setCategoryId(matchedCategory.id);
            }
          }
        }
      } catch (error) {
        console.error('상품 로드 실패:', error);
        alert('상품을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!loadingCategories) {
      fetchProduct();
    }
  }, [id, loadingCategories, categories]);

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/shop/categories?flat=true');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // 이미지 업로드 (상품 이미지)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));
    setProductImages([...productImages, ...newImages]);
  };

  // 이미지 삭제
  const removeImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  // 상세페이지 이미지 업로드
  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const validation = await validateDetailImage(file);
      const url = URL.createObjectURL(file);
      setDetailImages(prev => [...prev, { file, url, validation, isExisting: false }]);
    }
  };

  // 상세페이지 이미지 삭제
  const removeDetailImage = (index: number) => {
    setDetailImages(detailImages.filter((_, i) => i !== index));
  };

  // 상세페이지 이미지 순서 변경
  const moveDetailImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= detailImages.length) return;
    const newImages = [...detailImages];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    setDetailImages(newImages);
  };

  // 드래그 시작
  const handleDetailDragStart = (index: number) => {
    setDraggedDetailIndex(index);
  };

  // 드래그 오버
  const handleDetailDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedDetailIndex !== null && draggedDetailIndex !== index) {
      setDragOverDetailIndex(index);
    }
  };

  // 드래그 종료
  const handleDetailDragEnd = () => {
    if (draggedDetailIndex !== null && dragOverDetailIndex !== null) {
      moveDetailImage(draggedDetailIndex, dragOverDetailIndex);
    }
    setDraggedDetailIndex(null);
    setDragOverDetailIndex(null);
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 할인율 계산
  const calculateDiscountRate = () => {
    if (!comparePrice || comparePrice <= sellingPrice) return 0;
    return Math.round(((comparePrice - sellingPrice) / comparePrice) * 100);
  };

  // 마진 계산
  const calculateMargin = () => {
    const margin = sellingPrice - costPrice;
    const marginRate = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
    return { margin, marginRate };
  };

  // 제출
  const handleSubmit = async () => {
    if (!productName || !sellingPrice) {
      alert('상품명과 판매가는 필수입니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // 기본 정보
      formData.append('name', productName);
      if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          formData.append('category', category.name);
        }
      }
      if (description) formData.append('description', description);
      formData.append('isShopVisible', String(isShopVisible));

      // 가격/재고 정보
      formData.append('costPrice', String(costPrice || 0));
      formData.append('sellingPrice', String(sellingPrice));
      if (comparePrice) {
        formData.append('comparePrice', String(comparePrice));
      }
      formData.append('quantity', String(quantity || 0));

      // 상세 설명
      if (shopDescription) {
        formData.append('shopDescription', shopDescription);
      }

      // 기존 이미지 URL들
      const existingImageUrls = productImages
        .filter(img => img.isExisting)
        .map(img => img.preview);
      formData.append('existingImages', JSON.stringify(existingImageUrls));

      // 기존 썸네일
      if (existingImageUrls.length > 0) {
        formData.append('existingThumbnail', existingImageUrls[0]);
      }

      // 새 이미지 업로드
      const newImages = productImages.filter(img => !img.isExisting && img.file);

      // 첫 번째 새 이미지를 썸네일로 (기존 이미지가 없는 경우)
      if (newImages.length > 0 && existingImageUrls.length === 0) {
        formData.append('thumbnail', newImages[0].file!);
      }

      // 나머지 새 이미지들
      newImages.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        }
      });

      // 상세페이지 이미지
      detailImages.forEach((img) => {
        if (img.file && !img.isExisting) {
          formData.append('detailImages', img.file);
        }
      });

      console.log('Submitting FormData for update...');

      const response = await fetch(`/api/shop/products/with-images/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '상품 수정에 실패했습니다.');
      }

      alert('상품이 수정되었습니다.');
      router.push('/shop/products');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : '상품 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingCategories) {
    return (
      <div className="min-h-screen bg-[var(--color-gray-50)] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--color-gray-200)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/shop/products"
                className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-[var(--color-gray-600)]" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-gray-900)]">
                  자사몰 상품 수정
                </h1>
                <p className="text-sm text-[var(--color-gray-500)]">
                  상품 정보를 수정합니다
                </p>
              </div>
            </div>

            {/* 노출 설정 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-[var(--color-gray-600)]">자사몰 노출</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isShopVisible}
                  onChange={(e) => setIsShopVisible(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  isShopVisible ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-gray-300)]'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    isShopVisible ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">기본 정보</h2>

          {/* 상품명 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
              상품명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="예: 성주 꿀참외"
              className="w-full px-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-lg"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
              카테고리
            </label>
            <Dropdown
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
                description: cat.code ? `코드: ${cat.code}` : undefined,
              }))}
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
              placeholder="카테고리 선택"
              searchable
              clearable
              size="lg"
            />
          </div>

          {/* 간단 설명 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
              간단 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="상품에 대한 간단한 설명을 입력하세요"
              className="w-full px-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
            />
          </div>
        </div>

        {/* 가격/재고 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">가격/재고</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 원가 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">원가</label>
              <div className="relative">
                <input
                  type="number"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-10 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]">원</span>
              </div>
            </div>

            {/* 정상가 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                정상가 <span className="text-[var(--color-gray-400)] text-xs">(선택)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={comparePrice || ''}
                  onChange={(e) => setComparePrice(parseInt(e.target.value) || undefined)}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-10 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]">원</span>
              </div>
            </div>

            {/* 판매가 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                판매가 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-10 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]">원</span>
              </div>
            </div>

            {/* 재고 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">재고</label>
              <div className="relative">
                <input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-10 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]">개</span>
              </div>
            </div>
          </div>

          {/* 할인율 & 마진 정보 */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--color-gray-200)]">
            {comparePrice && comparePrice > sellingPrice && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                  -{calculateDiscountRate()}%
                </span>
                <span className="text-sm text-[var(--color-gray-500)]">
                  <span className="line-through">{formatPrice(comparePrice)}원</span>
                  {' → '}
                  <span className="text-red-600 font-medium">{formatPrice(sellingPrice)}원</span>
                </span>
              </div>
            )}

            {costPrice > 0 && sellingPrice > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--color-gray-500)]">예상 마진:</span>
                {(() => {
                  const { margin, marginRate } = calculateMargin();
                  return (
                    <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPrice(margin)}원 ({marginRate.toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 이미지 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-gray-900)] mb-4">대표 이미지</h2>

          <div className="grid grid-cols-5 gap-4">
            {productImages.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-gray-200)]">
                <img src={image.preview} alt={`상품 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-[var(--color-primary-500)] text-white text-[10px] rounded">
                    대표
                  </span>
                )}
                {image.isExisting && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] rounded">
                    기존
                  </span>
                )}
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-gray-300)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-colors">
              <ImageIcon size={24} className="text-[var(--color-gray-400)] mb-2" />
              <span className="text-xs text-[var(--color-gray-500)]">이미지 추가</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 상세페이지 */}
        <div className="bg-white rounded-xl border border-[var(--color-gray-200)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">상세페이지</h2>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gray-100)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-200)] transition-colors"
            >
              <Eye size={18} />
              미리보기
            </button>
          </div>

          {/* 상세페이지 이미지 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)]">
                  상세페이지 이미지
                </label>
                <p className="text-xs text-[var(--color-gray-400)] mt-0.5">
                  드래그하거나 ▲▼ 버튼으로 순서를 변경할 수 있습니다
                </p>
              </div>
              <div className="text-xs text-[var(--color-gray-500)]">
                권장: 가로 860px 이상 | 최소: 가로 500px | 최대: 10MB
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {detailImages.map((img, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDetailDragStart(index)}
                  onDragOver={(e) => handleDetailDragOver(e, index)}
                  onDragEnd={handleDetailDragEnd}
                  className={`flex items-start gap-4 p-3 rounded-lg border transition-all ${
                    img.validation?.valid !== false ? 'border-[var(--color-gray-200)]' : 'border-red-300 bg-red-50'
                  } ${draggedDetailIndex === index ? 'opacity-50 scale-[0.98]' : ''} ${
                    dragOverDetailIndex === index ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]' : ''
                  }`}
                >
                  {/* 드래그 핸들 */}
                  <div className="flex items-center cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} className="text-[var(--color-gray-400)]" />
                  </div>

                  {/* 순서 번호 */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-gray-100)] text-[var(--color-gray-600)] text-xs font-medium rounded">
                      {index + 1}
                    </span>
                    {/* 순서 변경 버튼 */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveDetailImage(index, index - 1)}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-[var(--color-gray-100)] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="위로 이동"
                      >
                        <ChevronUp size={14} className="text-[var(--color-gray-500)]" />
                      </button>
                      <button
                        onClick={() => moveDetailImage(index, index + 1)}
                        disabled={index === detailImages.length - 1}
                        className="p-0.5 hover:bg-[var(--color-gray-100)] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="아래로 이동"
                      >
                        <ChevronDown size={14} className="text-[var(--color-gray-500)]" />
                      </button>
                    </div>
                  </div>

                  <img src={img.url} alt={`상세 이미지 ${index + 1}`} className="w-32 h-20 object-cover rounded" />
                  <div className="flex-1">
                    {img.validation && (
                      <div className="flex items-center gap-2 mb-1">
                        {img.validation.valid ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                        <span className={`text-sm ${img.validation.valid ? 'text-green-600' : 'text-red-500'}`}>
                          {img.validation.message}
                        </span>
                      </div>
                    )}
                    {img.isExisting && (
                      <span className="text-xs text-blue-500">기존 이미지</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeDetailImage(index)}
                    className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg"
                  >
                    <Trash2 size={16} className="text-[var(--color-gray-500)]" />
                  </button>
                </div>
              ))}
            </div>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--color-gray-300)] rounded-lg cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-colors">
              <FileImage size={32} className="text-[var(--color-gray-400)] mb-2" />
              <span className="text-sm text-[var(--color-gray-600)]">상세페이지 이미지 추가</span>
              <span className="text-xs text-[var(--color-gray-400)] mt-1">여러 장 선택 가능</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleDetailImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* HTML 입력 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
              HTML 직접 입력 <span className="text-[var(--color-gray-400)] text-xs font-normal">(선택)</span>
            </label>
            <textarea
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              rows={8}
              placeholder="<div>상품 상세 설명 HTML...</div>"
              className="w-full px-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] font-mono text-sm resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/shop/products"
            className="px-6 py-3 border border-[var(--color-gray-300)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors"
          >
            취소
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !productName || !sellingPrice}
            className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save size={18} />
                저장
              </>
            )}
          </button>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-gray-200)]">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-[var(--color-gray-900)]">상세페이지 미리보기</h3>
                <div className="flex items-center gap-1 bg-[var(--color-gray-100)] rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      previewDevice === 'mobile'
                        ? 'bg-white text-[var(--color-gray-900)] shadow-sm'
                        : 'text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]'
                    }`}
                  >
                    <Smartphone size={16} />
                    모바일
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      previewDevice === 'desktop'
                        ? 'bg-white text-[var(--color-gray-900)] shadow-sm'
                        : 'text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]'
                    }`}
                  >
                    <Monitor size={16} />
                    데스크톱
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
              >
                <X size={20} className="text-[var(--color-gray-600)]" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-[var(--color-gray-100)] p-4 flex justify-center">
              <div
                className={`bg-white shadow-lg transition-all ${
                  previewDevice === 'mobile'
                    ? 'w-[375px] rounded-2xl'
                    : 'w-full max-w-[860px] rounded-lg'
                }`}
              >
                <div className={`${previewDevice === 'mobile' ? 'p-3' : 'p-4'}`}>
                  {detailImages.length > 0 && (
                    <div className="space-y-1">
                      {detailImages.map((img, index) => (
                        <img
                          key={index}
                          src={img.url}
                          alt={`상세 이미지 ${index + 1}`}
                          className="w-full"
                        />
                      ))}
                    </div>
                  )}

                  {shopDescription && (
                    <div
                      className={`prose max-w-none ${previewDevice === 'mobile' ? 'prose-sm' : ''} ${detailImages.length > 0 ? 'mt-4' : ''}`}
                      dangerouslySetInnerHTML={{ __html: shopDescription }}
                    />
                  )}

                  {detailImages.length === 0 && !shopDescription && (
                    <div className="py-16 text-center">
                      <FileImage size={48} className="mx-auto text-[var(--color-gray-300)] mb-3" />
                      <p className="text-[var(--color-gray-500)]">
                        상세페이지 이미지나 HTML을 추가하면<br />
                        여기에 미리보기가 표시됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-gray-200)] flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-[var(--color-gray-100)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-200)] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
