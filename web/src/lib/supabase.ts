import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 클라이언트용 (브라우저에서 사용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버용 (API routes에서 사용 - RLS 우회)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Storage 버킷 이름
export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  PRODUCT_DETAILS: 'product-details',
  REVIEWS: 'reviews',
  PROFILES: 'profiles',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// 이미지 URL 생성 헬퍼
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
