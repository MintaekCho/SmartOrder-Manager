'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Link2, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  thumbnail?: boolean;
  thumbnailUrl?: string;
  onThumbnailChange?: (url: string) => void;
}

export default function ImageUploader({
  images,
  onChange,
  maxImages = 9,
  label,
  thumbnail = false,
  thumbnailUrl,
  onThumbnailChange,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'products');

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

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file =>
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      alert('유효한 이미지 파일이 없습니다. (5MB 이하의 이미지만 허용)');
      return;
    }

    setIsUploading(true);

    const uploadPromises = validFiles.map(file => uploadFile(file));
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((url): url is string => url !== null);

    if (thumbnail && onThumbnailChange && !thumbnailUrl && successfulUploads.length > 0) {
      onThumbnailChange(successfulUploads[0]);
      onChange([...images, ...successfulUploads.slice(1)].slice(0, maxImages));
    } else {
      onChange([...images, ...successfulUploads].slice(0, maxImages));
    }

    setIsUploading(false);
  }, [images, maxImages, onChange, thumbnail, thumbnailUrl, onThumbnailChange]);

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

  const addUrlImage = useCallback(() => {
    if (!urlValue.trim()) return;

    if (thumbnail && onThumbnailChange && !thumbnailUrl) {
      onThumbnailChange(urlValue);
    } else if (images.length < maxImages) {
      onChange([...images, urlValue]);
    }

    setUrlValue('');
    setShowUrlInput(false);
  }, [urlValue, images, maxImages, onChange, thumbnail, thumbnailUrl, onThumbnailChange]);

  const removeImage = useCallback((index: number) => {
    onChange(images.filter((_, i) => i !== index));
  }, [images, onChange]);

  const removeThumbnail = useCallback(() => {
    if (onThumbnailChange) {
      onThumbnailChange('');
    }
  }, [onThumbnailChange]);

  const canAddMore = thumbnail
    ? (!thumbnailUrl || images.length < maxImages)
    : images.length < maxImages;

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* 대표 이미지 (thumbnail 모드일 때) */}
      {thumbnail && (
        <div className="mb-4">
          <span className="block text-sm text-gray-600 mb-2">대표 이미지</span>
          <div className="flex items-start gap-4">
            {thumbnailUrl ? (
              <div className="relative">
                <img
                  src={thumbnailUrl}
                  alt="대표 이미지"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className={`w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <Loader2 size={24} className="text-gray-400 animate-spin" />
                ) : (
                  <>
                    <ImageIcon size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">대표 이미지</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 이미지 목록 */}
      {(thumbnail ? thumbnailUrl : true) && (
        <>
          {thumbnail && <span className="block text-sm text-gray-600 mb-2">추가 이미지</span>}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {images.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`이미지 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* 추가 버튼 */}
            {canAddMore && !isUploading && (
              <div
                className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">업로드</span>
              </div>
            )}

            {/* 업로딩 중 표시 */}
            {isUploading && (
              <div className="aspect-square border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg flex items-center justify-center">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        </>
      )}

      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          이미지를 드래그 앤 드롭하거나
        </p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={isUploading}
          >
            파일 선택
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <Link2 size={14} />
            URL 입력
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          PNG, JPG, WEBP, GIF (최대 5MB)
        </p>
      </div>

      {/* URL 입력 필드 */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="이미지 URL을 입력하세요"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrlImage();
              }
            }}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addUrlImage}
            className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            추가
          </button>
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(false);
              setUrlValue('');
            }}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      )}

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
  );
}
