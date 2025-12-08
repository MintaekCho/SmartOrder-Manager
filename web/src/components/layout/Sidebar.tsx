'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Tag,
  ClipboardList,
  Truck,
  Apple,
  Zap,
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: { name: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    name: '대시보드',
    href: '/',
    icon: <LayoutDashboard size={20} />,
  },
  {
    name: '상품 관리',
    href: '/products',
    icon: <Package size={20} />,
    children: [
      { name: '상품 자동화', href: '/products/automation' },
      { name: '상품 분석', href: '/products/analysis' },
      { name: '농수산물 분석', href: '/products/fresh-analysis' },
      { name: '상품 등록', href: '/products/register' },
      { name: '가격 관리', href: '/products/pricing' },
    ],
  },
  {
    name: '주문 관리',
    href: '/orders',
    icon: <ShoppingCart size={20} />,
    children: [
      { name: '주문 목록', href: '/orders' },
      { name: '발주 관리', href: '/orders/fulfillment' },
      { name: '배송 추적', href: '/orders/tracking' },
    ],
  },
  {
    name: '리포트',
    href: '/reports',
    icon: <BarChart3 size={20} />,
  },
  {
    name: '설정',
    href: '/settings',
    icon: <Settings size={20} />,
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();

  const toggleMenu = (menuName: string) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-[var(--color-gray-300)] transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-gray-300)]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-500)] flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-[var(--color-gray-900)]">
              CoupangAuto
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-[var(--color-gray-100)] transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)]"
            />
            <input
              type="text"
              placeholder="검색..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-gray-100)] rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="px-2 py-4">
        {menuItems.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                      : 'text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]'
                  }`}
                >
                  {item.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">
                        {item.name}
                      </span>
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          expandedMenu === item.name ? 'rotate-90' : ''
                        }`}
                      />
                    </>
                  )}
                </button>
                {!collapsed && expandedMenu === item.name && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          pathname === child.href
                            ? 'text-[var(--color-primary-600)] bg-[var(--color-primary-50)]'
                            : 'text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]'
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                    : 'text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]'
                }`}
              >
                {item.icon}
                {!collapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
