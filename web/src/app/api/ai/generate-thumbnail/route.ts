import { NextRequest, NextResponse } from 'next/server';
import { getNanoBananaClient } from '@/lib/ai/nano-banana';

// AI 썸네일 생성 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode, // 'generate' | 'edit' | 'enhance'
      prompt,
      productName,
      style,
      backgroundColor,
      referenceImage,
      referenceImageMimeType,
      enhanceType,
    } = body;

    const client = getNanoBananaClient();

    let result;

    switch (mode) {
      case 'generate':
        // 텍스트 프롬프트로 이미지 생성
        if (productName) {
          result = await client.generateProductThumbnail(
            productName,
            style || 'clean',
            backgroundColor || 'white'
          );
        } else if (prompt) {
          result = await client.generateImage(prompt);
        } else {
          return NextResponse.json(
            { error: 'prompt or productName is required' },
            { status: 400 }
          );
        }
        break;

      case 'edit':
        // 기존 이미지 편집
        if (!referenceImage || !prompt) {
          return NextResponse.json(
            { error: 'referenceImage and prompt are required for edit mode' },
            { status: 400 }
          );
        }
        result = await client.editImage(
          prompt,
          referenceImage,
          referenceImageMimeType || 'image/png'
        );
        break;

      case 'enhance':
        // 이미지 보정
        if (!referenceImage) {
          return NextResponse.json(
            { error: 'referenceImage is required for enhance mode' },
            { status: 400 }
          );
        }
        result = await client.enhanceProductImage(
          referenceImage,
          referenceImageMimeType || 'image/png',
          enhanceType || 'background'
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid mode. Use: generate, edit, or enhance' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: result.image,
      mimeType: result.mimeType,
      text: result.text,
    });
  } catch (error) {
    console.error('[API] AI thumbnail generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
}
