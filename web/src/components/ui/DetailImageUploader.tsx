'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Code, Loader2, Eye, EyeOff } from 'lucide-react';

interface DetailImageUploaderProps {
  value: string; // HTML string
  onChange: (html: string) => void;
}

export default function DetailImageUploader({
  value,
  onChange,
}: DetailImageUploaderProps) {
  const [mode, setMode] = useState<'image' | 'html'>('image');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'product-details');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        return result.data.url;
      } else {
        console.error('Upload failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const generateHtmlFromImages = useCallback((images: string[]) => {
    if (images.length === 0) return '';

    const imgTags = images.map(url =>
      `<img src="${url}" alt="상품 상세 이미지" style="width: 100%; max-width: 860px; display: block; margin: 0 auto;" />`
    ).join('\n');

    return `<div style="text-align: center;">\n${imgTags}\n</div>`;
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file =>
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 상세 이미지는 10MB까지
    );

    if (validFiles.length === 0) {
      alert('유효한 이미지 파일이 없습니다. (10MB 이하의 이미지만 허용)');
      return;
    }

    setIsUploading(true);

    const uploadPromises = validFiles.map(file => uploadFile(file));
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((url): url is string => url !== null);

    const newImages = [...detailImages, ...successfulUploads];
    setDetailImages(newImages);
    onChange(generateHtmlFromImages(newImages));

    setIsUploading(false);
  }, [detailImages, onChange, generateHtmlFromImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeImage = useCallback((index: number) => {
    const newImages = detailImages.filter((_, i) => i !== index);
    setDetailImages(newImages);
    onChange(generateHtmlFromImages(newImages));
  }, [detailImages, onChange, generateHtmlFromImages]);

  const moveImage = useCallback((index: number, direction: 'up' | 'down') => {
    const newImages = [...detailImages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;

    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setDetailImages(newImages);
    onChange(generateHtmlFromImages(newImages));
  }, [detailImages, onChange, generateHtmlFromImages]);

  return (
    <div className="space-y-4">
      {/* 모드 선택 탭 */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMode('image')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'image'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon size={16} />
          이미지 업로드
        </button>
        <button
          type="button"
          onClick={() => setMode('html')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'html'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Code size={16} />
          HTML 직접 입력
        </button>
      </div>

      {mode === 'image' ? (
        <div className="space-y-4">
          {/* 업로드된 이미지 목록 */}
          {detailImages.length > 0 && (
            <div className="space-y-2">
              <span className="block text-sm text-gray-600">업로드된 이미지 ({detailImages.length}개)</span>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {detailImages.map((url, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <img
                      src={url}
                      alt={`상세 이미지 ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 truncate">{url}</p>
                      <p className="text-xs text-gray-400">순서: {index + 1}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30"
                        title="위로"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        disabled={index === detailImages.length - 1}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30"
                        title="아래로"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 드래그 앤 드롭 영역 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 size={32} className="text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-600">업로드 중...</p>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  상세페이지 이미지를 드래그 앤 드롭하거나
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  파일 선택
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  PNG, JPG, WEBP (최대 10MB) - 여러 파일 선택 가능
                </p>
              </>
            )}
          </div>

          {/* 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            rows={12}
            placeholder="<div>상세 설명 HTML을 입력하세요...</div>"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}

      {/* HTML 미리보기 */}
      {value && (
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'HTML 미리보기 숨기기' : 'HTML 미리보기'}
          </button>
          {showPreview && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: value }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
