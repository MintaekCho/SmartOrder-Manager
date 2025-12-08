'use client';

import { Bell, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
  breadcrumb?: { name: string; href?: string }[];
}

export default function Header({ title = '대시보드', breadcrumb }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 임시 알림 데이터
  const notifications = [
    { id: 1, message: '새로운 주문이 3건 들어왔습니다.', time: '5분 전', isNew: true },
    { id: 2, message: '상품 가격이 변동되었습니다.', time: '1시간 전', isNew: true },
    { id: 3, message: '발주가 완료되었습니다.', time: '3시간 전', isNew: false },
  ];

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
                {notifications.map((notification) => (
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
                ))}
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
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
              <User size={16} className="text-[var(--color-primary-600)]" />
            </div>
            <span className="text-sm font-medium text-[var(--color-gray-800)]">
              판매자
            </span>
            <ChevronDown size={16} className="text-[var(--color-gray-500)]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--color-gray-300)] z-50">
              <div className="py-2">
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                >
                  설정
                </a>
                <a
                  href="/settings/api"
                  className="block px-4 py-2 text-sm text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]"
                >
                  API 설정
                </a>
                <hr className="my-2 border-[var(--color-gray-200)]" />
                <button className="w-full text-left px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-gray-100)]">
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
