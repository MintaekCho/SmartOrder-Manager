import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { FeatureSettingsProvider } from "@/contexts/FeatureSettingsContext";
import PageLoadingProvider from "@/components/providers/PageLoadingProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartOrder Manager - 스마트 주문 관리 솔루션",
  description: "위탁판매, 재고관리를 지원하는 통합 주문 관리 솔루션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PageLoadingProvider />
        <SessionProvider>
          <FeatureSettingsProvider>
            {children}
          </FeatureSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
