import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone', // Docker 배포용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google 프로필 이미지
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net', // Kakao 프로필 이미지
      },
      {
        protocol: 'https',
        hostname: 'ssl.pstatic.net', // Naver 프로필 이미지
      },
      {
        protocol: 'http',
        hostname: 'k.kakaocdn.net', // Kakao 프로필 이미지 (http)
      },
    ],
  },
};

export default nextConfig;
