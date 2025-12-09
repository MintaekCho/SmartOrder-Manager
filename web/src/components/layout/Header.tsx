'use client';

import { Bell, ChevronDown, User, Loader2, Crown, LogOut, Settings, Key } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
  breadcrumb?: { name: string; href?: string }[];
}

interface Notification {
  id: number;
  message: string;
  time: string;
  isNew: boolean;
  type: 'order' | 'product' | 'system';
}

export default function Header({ title = '대시보드', breadcrumb }: HeaderProps) {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // 초기 로드 여부 체크
  const isInitialMount = useRef(true);

  const subscription = (session?.user as any)?.subscription;
  const isPremium = subscription?.plan === 'PREMIUM';

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchNotifications();
    }

    // 5분마다 알림 새로고침
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.isNew).length;

  return (
    <header className="h-16 bg-white border-b border-[var(--color-gray-300)] flex items-center justify-between px-6">
      {/* Left: Title & Breadcrumb */}
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-2 text-sm text-[var(--color-gray-500)] mb-1">
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-[var(--color-primary-500)]"
                  >
                    {item.name}
                  </a>
                ) : (
                  <span>{item.name}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-[var(--color-gray-900)]">{title}</h1>
      </div>

      {/* Right: Notifications & User */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-[var(--color-gray-100)] transition-colors"
          >
            <Bell size={20} className="text-[var(--color-gray-600)]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-danger)] text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-[var(--color-gray-300)] z-50">
              <div className="p-4 border-b border-[var(--color-gray-200)]">
                <h3 className="font-semibold text-[var(--color-gray-900)]">알림</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-gray-400)]" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-[var(--color-gray-500)] text-sm">
                    알림이 없습니다.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-[var(--color-gray-100)] hover:bg-[var(--color-gray-50)] cursor-pointer ${
                        notification.isNew ? 'bg-[var(--color-primary-50)]' : ''
                      }`}
                    >
                      <p className="text-sm text-[var(--color-gray-800)]">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[var(--color-gray-500)] mt-1">
                        {notification.time}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 text-center">
                <a
                  href="/notifications"
                  className="text-sm text-[var(--color-primary-500)] hover:underline"
                >
                  모든 알림 보기
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-gray-100)] transition-colors"
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || '사용자'}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                <User size={16} className="text-[var(--color-primary-600)]" />
              </div>
            )}
            <span className="text-sm font-medium text-[var(--color-gray-800)]">
              {session?.user?.name || '판매자'}
            </span>
            {isPremium && (
              <Crown size={14} className="text-yellow-500" />
            )}
            <ChevronDown size={16} className="text-[var(--color-gray-500)]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-[var(--color-gray-300)] z-50">
              {/* User Info */}
              <div className="p-4 border-b border-[var(--color-gray-200)]">
                <p className="font-medium text-[var(--color-gray-900)]">
                  {session?.user?.name || '판매자'}
                </p>
                <p className="text-sm text-[var(--color-gray-500)] truncate">
                  {session?.user?.email}
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    isPremium
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isPremium && <Crown size={12} />}
                    {isPremium ? 'Premium' : 'Free'}
                  </span>
                </div>
              </div>

              <div className="py-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  설정
                </Link>
                <Link
                  href="/settings/billing"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Crown size={16} />
                  구독 관리
                </Link>
                <Link
                  href="/settings/api"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Key size={16} />
                  API 설정
                </Link>
                <hr className="my-2 border-[var(--color-gray-200)]" />
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-gray-100)]"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
