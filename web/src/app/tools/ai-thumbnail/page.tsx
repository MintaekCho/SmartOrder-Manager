'use client';

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import {
  Sparkles,
  Upload,
  Download,
  RefreshCw,
  Image as ImageIcon,
  Wand2,
  Palette,
  Sun,
  Zap,
  Camera,
  X,
  Copy,
  Check,
} from 'lucide-react';

type Mode = 'generate' | 'edit' | 'enhance';
type Style = 'clean' | 'luxury' | 'cute' | 'natural' | 'modern';
type EnhanceType = 'background' | 'lighting' | 'quality' | 'style';

const styleOptions: { value: Style; label: string; description: string }[] = [
  { value: 'clean', label: '클린', description: '깔끔하고 미니멀한 스타일' },
  { value: 'luxury', label: '럭셔리', description: '고급스럽고 프리미엄한 느낌' },
  { value: 'cute', label: '큐트', description: '귀엽고 사랑스러운 파스텔톤' },
  { value: 'natural', label: '내추럴', description: '자연스럽고 따뜻한 느낌' },
  { value: 'modern', label: '모던', description: '현대적이고 세련된 스타일' },
];

const enhanceOptions: { value: EnhanceType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'background', label: '배경 제거', icon: <Palette size={20} />, description: '배경을 깔끔한 흰색으로' },
  { value: 'lighting', label: '조명 보정', icon: <Sun size={20} />, description: '밝고 균일한 조명으로' },
  { value: 'quality', label: '품질 향상', icon: <Zap size={20} />, description: '선명도와 품질 개선' },
  { value: 'style', label: '스튜디오 촬영', icon: <Camera size={20} />, description: '전문 촬영 느낌으로' },
];

const backgroundColors = [
  { value: 'white', label: '화이트', color: '#FFFFFF' },
  { value: 'light gray', label: '라이트 그레이', color: '#F5F5F5' },
  { value: 'beige', label: '베이지', color: '#F5F5DC' },
  { value: 'light blue', label: '라이트 블루', color: '#E3F2FD' },
  { value: 'light pink', label: '라이트 핑크', color: '#FCE4EC' },
  { value: 'transparent', label: '투명', color: 'transparent' },
];

export default function AIThumbnailPage() {
  const [mode, setMode] = useState<Mode>('generate');
  const [productName, setProductName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [style, setStyle] = useState<Style>('clean');
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [enhanceType, setEnhanceType] = useState<EnhanceType>('background');

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageMimeType, setReferenceImageMimeType] = useState<string>('image/png');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedMimeType, setGeneratedMimeType] = useState<string>('image/png');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // data:image/png;base64, 부분 제거
      const base64 = result.split(',')[1];
      setReferenceImage(base64);
      setReferenceImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 제거
  const clearReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // AI 이미지 생성
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const requestBody: Record<string, unknown> = { mode };

      if (mode === 'generate') {
        if (customPrompt) {
          requestBody.prompt = customPrompt;
        } else {
          requestBody.productName = productName;
          requestBody.style = style;
          requestBody.backgroundColor = backgroundColor;
        }
      } else if (mode === 'edit') {
        requestBody.prompt = customPrompt;
        requestBody.referenceImage = referenceImage;
        requestBody.referenceImageMimeType = referenceImageMimeType;
      } else if (mode === 'enhance') {
        requestBody.referenceImage = referenceImage;
        requestBody.referenceImageMimeType = referenceImageMimeType;
        requestBody.enhanceType = enhanceType;
      }

      const response = await fetch('/api/ai/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.image);
      setGeneratedMimeType(data.mimeType || 'image/png');
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : '이미지 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 다운로드
  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = `data:${generatedMimeType};base64,${generatedImage}`;
    link.download = `ai-thumbnail-${Date.now()}.${generatedMimeType.split('/')[1] || 'png'}`;
    link.click();
  };

  // Base64 복사
  const handleCopyBase64 = async () => {
    if (!generatedImage) return;

    try {
      await navigator.clipboard.writeText(generatedImage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  // 생성된 이미지를 참조 이미지로 사용
  const useAsReference = () => {
    if (!generatedImage) return;
    setReferenceImage(generatedImage);
    setReferenceImageMimeType(generatedMimeType);
    setMode('edit');
  };

  const canGenerate = () => {
    if (mode === 'generate') {
      return productName.trim() || customPrompt.trim();
    }
    if (mode === 'edit') {
      return referenceImage && customPrompt.trim();
    }
    if (mode === 'enhance') {
      return referenceImage;
    }
    return false;
  };

  return (
    <DashboardLayout
      title="AI 썸네일 생성"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '도구', href: '/tools' },
        { name: 'AI 썸네일 생성' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 설정 패널 */}
        <div className="space-y-6">
          {/* 모드 선택 */}
          <Card>
            <h3 className="font-semibold text-[var(--color-gray-900)] mb-4">생성 모드</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('generate')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  mode === 'generate'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}
              >
                <Sparkles size={24} className="mx-auto mb-1" />
                <span className="text-sm font-medium">새로 생성</span>
              </button>
              <button
                onClick={() => setMode('edit')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  mode === 'edit'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}
              >
                <Wand2 size={24} className="mx-auto mb-1" />
                <span className="text-sm font-medium">이미지 편집</span>
              </button>
              <button
                onClick={() => setMode('enhance')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  mode === 'enhance'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                    : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                }`}
              >
                <Zap size={24} className="mx-auto mb-1" />
                <span className="text-sm font-medium">이미지 보정</span>
              </button>
            </div>
          </Card>

          {/* 이미지 업로드 (편집/보정 모드) */}
          {(mode === 'edit' || mode === 'enhance') && (
            <Card>
              <h3 className="font-semibold text-[var(--color-gray-900)] mb-4">참조 이미지</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {referenceImage ? (
                <div className="relative">
                  <img
                    src={`data:${referenceImageMimeType};base64,${referenceImage}`}
                    alt="Reference"
                    className="w-full h-48 object-contain bg-[var(--color-gray-100)] rounded-lg"
                  />
                  <button
                    onClick={clearReferenceImage}
                    className="absolute top-2 right-2 p-1 bg-[var(--color-gray-500)] text-white rounded-full hover:bg-[var(--color-gray-600)]"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-[var(--color-gray-300)] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-colors"
                >
                  <Upload size={32} className="text-[var(--color-gray-400)]" />
                  <span className="text-sm text-[var(--color-gray-500)]">이미지를 업로드하세요</span>
                  <span className="text-xs text-[var(--color-gray-400)]">PNG, JPG (최대 4MB)</span>
                </button>
              )}
            </Card>
          )}

          {/* 생성 모드 옵션 */}
          {mode === 'generate' && (
            <>
              <Card>
                <h3 className="font-semibold text-[var(--color-gray-900)] mb-4">상품 정보</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                      상품명
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="예: 블루투스 무선 이어폰"
                      className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                      스타일
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {styleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setStyle(option.value)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            style === option.value
                              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                              : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                          }`}
                          title={option.description}
                        >
                          <span className="text-xs font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-2">
                      배경색
                    </label>
                    <div className="flex gap-2">
                      {backgroundColors.map((bg) => (
                        <button
                          key={bg.value}
                          onClick={() => setBackgroundColor(bg.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            backgroundColor === bg.value
                              ? 'border-[var(--color-primary-500)] ring-2 ring-[var(--color-primary-200)]'
                              : 'border-[var(--color-gray-300)]'
                          }`}
                          style={{
                            backgroundColor: bg.color,
                            backgroundImage: bg.value === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : undefined,
                            backgroundSize: bg.value === 'transparent' ? '8px 8px' : undefined,
                            backgroundPosition: bg.value === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
                          }}
                          title={bg.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-[var(--color-gray-900)] mb-4">또는 직접 프롬프트 입력</h3>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="원하는 이미지를 자세히 설명해주세요..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
                <p className="text-xs text-[var(--color-gray-500)] mt-2">
                  * 직접 프롬프트 입력 시 상품 정보와 스타일 설정은 무시됩니다.
                </p>
              </Card>
            </>
          )}

          {/* 편집 모드 옵션 */}
          {mode === 'edit' && (
            <Card>
              <h3 className="font-semibold text-[var(--color-gray-900)] mb-4">편집 지시사항</h3>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="예: 배경을 흰색으로 바꿔주세요, 상품에 그림자를 추가해주세요..."
                rows={4}
                className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
              />
            </Card>
          )}

          {/* 보정 모드 옵션 */}
          {mode === 'enhance' && (
            <Card>
              <h3 className="font-semibold text-[var(--color-gray-900)] mb-4">보정 유형</h3>
              <div className="grid grid-cols-2 gap-3">
                {enhanceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEnhanceType(option.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      enhanceType === option.value
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                        : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-[var(--color-gray-500)]">{option.description}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* 생성 버튼 */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate() || isLoading}
            loading={isLoading}
            className="w-full"
          >
            <Sparkles size={20} className="mr-2" />
            {isLoading ? 'AI가 이미지를 생성하는 중...' : 'AI 이미지 생성'}
          </Button>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* 오른쪽: 결과 패널 */}
        <div>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-gray-900)]">생성 결과</h3>
              {generatedImage && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyBase64}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? '복사됨' : 'Base64'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={useAsReference}>
                    <RefreshCw size={16} />
                    재편집
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleDownload}>
                    <Download size={16} />
                    다운로드
                  </Button>
                </div>
              )}
            </div>

            <div className="aspect-square bg-[var(--color-gray-100)] rounded-lg flex items-center justify-center overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Sparkles size={48} className="text-[var(--color-primary-500)] animate-pulse" />
                  </div>
                  <p className="text-[var(--color-gray-500)]">AI가 이미지를 생성하고 있습니다...</p>
                  <p className="text-xs text-[var(--color-gray-400)]">약 10-30초 소요</p>
                </div>
              ) : generatedImage ? (
                <img
                  src={`data:${generatedMimeType};base64,${generatedImage}`}
                  alt="Generated"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--color-gray-400)]">
                  <ImageIcon size={48} />
                  <p className="text-sm">생성된 이미지가 여기에 표시됩니다</p>
                </div>
              )}
            </div>

            {/* 안내 */}
            <div className="mt-4 p-4 bg-[var(--color-gray-50)] rounded-lg">
              <h4 className="font-medium text-[var(--color-gray-800)] mb-2">사용 팁</h4>
              <ul className="text-sm text-[var(--color-gray-600)] space-y-1">
                <li>• 상품명을 구체적으로 입력하면 더 정확한 결과를 얻을 수 있습니다</li>
                <li>• 생성된 이미지가 마음에 들지 않으면 "재편집" 버튼을 눌러 수정하세요</li>
                <li>• 기존 상품 사진이 있다면 "이미지 보정" 모드를 사용해보세요</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
