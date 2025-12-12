'use client';

import { useState } from 'react';
import Image from 'next/image';

interface UploadResult {
  path: string;
  url: string;
  bucket: string;
  fileName: string;
  size: number;
  type: string;
}

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bucket, setBucket] = useState<string>('products');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('업로드 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">Supabase Storage 업로드 테스트</h1>

        {/* 버킷 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            버킷 선택
          </label>
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="products">products (상품 썸네일)</option>
            <option value="product-details">product-details (상세 이미지)</option>
            <option value="reviews">reviews (리뷰 이미지)</option>
            <option value="profiles">profiles (프로필 이미지)</option>
          </select>
        </div>

        {/* 파일 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지 파일 선택
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              선택된 파일: {file.name} ({formatFileSize(file.size)})
            </p>
          )}
        </div>

        {/* 업로드 버튼 */}
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? '업로드 중...' : '업로드'}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 업로드 결과 */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h2 className="text-lg font-semibold text-green-800 mb-3">
              업로드 성공!
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">버킷:</span> {result.bucket}</p>
              <p><span className="font-medium">경로:</span> {result.path}</p>
              <p><span className="font-medium">파일명:</span> {result.fileName}</p>
              <p><span className="font-medium">크기:</span> {formatFileSize(result.size)}</p>
              <p><span className="font-medium">타입:</span> {result.type}</p>
              <p className="break-all">
                <span className="font-medium">URL:</span>{' '}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.url}
                </a>
              </p>
            </div>

            {/* 이미지 미리보기 */}
            <div className="mt-4">
              <p className="font-medium text-sm mb-2">미리보기:</p>
              <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden">
                <Image
                  src={result.url}
                  alt="Uploaded image"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
