// 나노바나나 (Gemini 2.5 Flash Image) API 클라이언트
// Google AI Studio API를 사용한 이미지 생성/편집

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_NAME = 'gemini-2.5-flash-image'; // 이미지 생성 지원 모델

interface GenerateImageRequest {
  prompt: string;
  referenceImage?: string; // Base64 인코딩된 이미지 (선택)
  referenceImageMimeType?: string;
}

interface GenerateImageResponse {
  success: boolean;
  image?: string; // Base64 인코딩된 이미지
  mimeType?: string;
  text?: string;
  error?: string;
}

export class NanoBananaClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || '';

    if (!this.apiKey) {
      console.warn('Google AI API key not configured');
    }
  }

  // 이미지 생성 (텍스트 프롬프트만)
  async generateImage(prompt: string): Promise<GenerateImageResponse> {
    return this.generate({ prompt });
  }

  // 이미지 편집 (기존 이미지 + 프롬프트)
  async editImage(
    prompt: string,
    referenceImage: string,
    mimeType: string = 'image/png'
  ): Promise<GenerateImageResponse> {
    return this.generate({
      prompt,
      referenceImage,
      referenceImageMimeType: mimeType,
    });
  }

  // 상품 썸네일 생성 전용 메서드
  async generateProductThumbnail(
    productName: string,
    style: 'clean' | 'luxury' | 'cute' | 'natural' | 'modern' = 'clean',
    backgroundColor: string = 'white'
  ): Promise<GenerateImageResponse> {
    const stylePrompts: Record<string, string> = {
      clean: '깔끔하고 미니멀한 스타일, 밝은 조명, 그림자 최소화',
      luxury: '고급스러운 느낌, 어두운 배경에 스포트라이트, 프리미엄 느낌',
      cute: '귀엽고 사랑스러운 느낌, 파스텔 톤, 부드러운 분위기',
      natural: '자연스러운 느낌, 따뜻한 조명, 식물이나 나무 소품',
      modern: '현대적이고 세련된 느낌, 기하학적 패턴, 대비가 강한 색상',
    };

    const prompt = `상품 썸네일 이미지를 생성해주세요.
상품명: ${productName}
스타일: ${stylePrompts[style]}
배경색: ${backgroundColor}
요구사항:
- 상품이 중앙에 크게 배치
- 전문 상품 사진처럼 깔끔하게
- 쿠팡/온라인 쇼핑몰에 적합한 정사각형 비율
- 고해상도, 선명한 이미지
- 텍스트나 워터마크 없이 상품만`;

    return this.generate({ prompt });
  }

  // 기존 상품 이미지 보정
  async enhanceProductImage(
    imageBase64: string,
    mimeType: string = 'image/png',
    enhanceType: 'background' | 'lighting' | 'quality' | 'style' = 'background'
  ): Promise<GenerateImageResponse> {
    const enhancePrompts: Record<string, string> = {
      background: '배경을 깔끔한 흰색으로 변경하고, 상품만 선명하게 유지해주세요. 상품의 형태와 색상은 그대로 유지.',
      lighting: '조명을 더 밝고 균일하게 조정해주세요. 그림자를 부드럽게 하고 상품이 더 돋보이게.',
      quality: '이미지 품질을 향상시켜주세요. 더 선명하고 깨끗하게, 노이즈 제거.',
      style: '상품 사진을 더 전문적인 스튜디오 촬영 느낌으로 변경해주세요.',
    };

    return this.generate({
      prompt: enhancePrompts[enhanceType],
      referenceImage: imageBase64,
      referenceImageMimeType: mimeType,
    });
  }

  // 핵심 API 호출
  private async generate(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Google AI API key not configured. Set GOOGLE_AI_API_KEY in .env',
      };
    }

    try {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      // 참조 이미지가 있으면 먼저 추가
      if (request.referenceImage) {
        parts.push({
          inlineData: {
            mimeType: request.referenceImageMimeType || 'image/png',
            data: request.referenceImage,
          },
        });
      }

      // 프롬프트 추가
      parts.push({ text: request.prompt });

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      };

      const response = await fetch(
        `${GEMINI_API_URL}/${MODEL_NAME}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NanoBanana API Error]', response.status, errorText);
        return {
          success: false,
          error: `API Error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // 응답에서 이미지와 텍스트 추출
      const candidates = data.candidates || [];
      if (candidates.length === 0) {
        return {
          success: false,
          error: 'No response generated',
        };
      }

      const parts_response = candidates[0].content?.parts || [];
      let imageData: string | undefined;
      let imageMimeType: string | undefined;
      let textResponse: string | undefined;

      for (const part of parts_response) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          imageMimeType = part.inlineData.mimeType;
        }
        if (part.text) {
          textResponse = part.text;
        }
      }

      if (!imageData) {
        return {
          success: false,
          text: textResponse,
          error: textResponse || 'No image generated',
        };
      }

      return {
        success: true,
        image: imageData,
        mimeType: imageMimeType,
        text: textResponse,
      };
    } catch (error) {
      console.error('[NanoBanana Error]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// 싱글톤 인스턴스
let clientInstance: NanoBananaClient | null = null;

export function getNanoBananaClient(): NanoBananaClient {
  if (!clientInstance) {
    clientInstance = new NanoBananaClient();
  }
  return clientInstance;
}
