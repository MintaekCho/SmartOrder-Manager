'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DetailPageEditor from '@/components/DetailPageEditor';
import { ArrowLeft, Image, Check } from 'lucide-react';

export default function DetailEditorPage() {
  const router = useRouter();
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleExport = (imageDataUrl: string) => {
    setExportedImage(imageDataUrl);
    setShowPreview(true);
  };

  const handleDownload = () => {
    if (!exportedImage) return;

    const link = document.createElement('a');
    link.download = `coupang-detail-${Date.now()}.png`;
    link.href = exportedImage;
    link.click();
  };

  const handleConfirm = () => {
    // TODO: 상품 등록 페이지로 이미지 전달
    alert('상세페이지 이미지가 저장되었습니다.\n상품 등록 시 이 이미지가 사용됩니다.');
    setShowPreview(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[var(--color-gray-300)] flex-shrink-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[var(--color-gray-700)]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-gray-900)]">상세페이지 에디터</h1>
              <p className="text-xs text-[var(--color-gray-500)]">쿠팡 상품 상세페이지 이미지를 만들어보세요</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-gray-500)]">
            <Image size={16} />
            쿠팡 권장: 780px 너비
          </div>
        </div>
      </header>

      {/* 에디터 - 전체 높이 사용 */}
      <main className="flex-1 overflow-hidden">
        <DetailPageEditor onExport={handleExport} />
      </main>

      {/* 미리보기 모달 */}
      {showPreview && exportedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="p-4 border-b border-[var(--color-gray-300)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-gray-900)]">상세페이지 미리보기</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-[var(--color-gray-500)] hover:text-[var(--color-gray-700)] transition-colors"
              >
                닫기
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[var(--color-gray-100)]">
              <div className="flex justify-center">
                <img
                  src={exportedImage}
                  alt="상세페이지 미리보기"
                  className="max-w-full border border-[var(--color-gray-300)] shadow-lg rounded-lg"
                  style={{ width: '780px' }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-gray-300)] flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
              >
                계속 편집
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
              >
                이미지 다운로드
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 flex items-center gap-2 transition-colors"
              >
                <Check size={18} />
                완료 및 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
