import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl, StorageBucket } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as StorageBucket | null;

    // 유효성 검사
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 버킷입니다.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '허용되지 않는 파일 형식입니다. (jpeg, png, webp, gif만 허용)' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 5MB를 초과합니다.' },
        { status: 400 }
      );
    }

    // 파일 확장자 추출
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${ext}`;

    // 날짜 기반 폴더 구조 (년/월)
    const now = new Date();
    const folderPath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filePath = `${folderPath}/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { success: false, error: `업로드 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // Public URL 생성
    const publicUrl = getPublicUrl(bucket, filePath);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        url: publicUrl,
        bucket,
        fileName,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 여러 파일 업로드
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const bucket = formData.get('bucket') as StorageBucket | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 버킷입니다.' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push({ file: file.name, error: '허용되지 않는 파일 형식' });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push({ file: file.name, error: '파일 크기 초과 (5MB)' });
        continue;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${ext}`;
      const now = new Date();
      const folderPath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
      const filePath = `${folderPath}/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        errors.push({ file: file.name, error: error.message });
      } else {
        results.push({
          originalName: file.name,
          path: data.path,
          url: getPublicUrl(bucket, filePath),
          size: file.size,
          type: file.type,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        uploaded: results,
        errors,
        total: files.length,
        successCount: results.length,
        errorCount: errors.length,
      },
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
