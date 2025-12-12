'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 프로필은 2MB로 제한

// 현재 사용자 프로필 조회
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('프로필 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '프로필 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 프로필 수정 (이미지 업로드 포함)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // FormData 처리 (이미지 업로드 포함)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const name = formData.get('name') as string | null;
      const file = formData.get('image') as File | null;

      const updateData: any = {};

      // 이름 업데이트
      if (name) {
        updateData.name = name;
      }

      // 이미지 업로드
      if (file && file.size > 0) {
        // 파일 타입 검증
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          return NextResponse.json(
            { success: false, error: '허용되지 않는 파일 형식입니다. (jpeg, png, webp, gif만 허용)' },
            { status: 400 }
          );
        }

        // 파일 크기 검증
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { success: false, error: '파일 크기가 2MB를 초과합니다.' },
            { status: 400 }
          );
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${session.user.id}-${uuidv4()}.${ext}`;
        const filePath = `${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKETS.PROFILES)
          .upload(filePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: true, // 기존 파일 덮어쓰기
          });

        if (error) {
          console.error('프로필 이미지 업로드 에러:', error);
          return NextResponse.json(
            { success: false, error: '이미지 업로드에 실패했습니다.' },
            { status: 500 }
          );
        }

        const publicUrl = getPublicUrl(STORAGE_BUCKETS.PROFILES, filePath);
        updateData.image = publicUrl;
      }

      // 업데이트할 데이터가 없으면 에러
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, error: '업데이트할 데이터가 없습니다.' },
          { status: 400 }
        );
      }

      // 프로필 업데이트
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: user,
      });
    }

    // JSON 처리 (이름만 변경)
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: '이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('프로필 수정 에러:', error);
    return NextResponse.json(
      { success: false, error: '프로필 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
