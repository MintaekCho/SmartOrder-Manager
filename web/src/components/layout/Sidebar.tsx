'use client';

import { useState, useEffect } from 'react';
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
  ChevronDown,
  Search,
  TrendingUp,
  Tag,
  ClipboardList,
  Truck,
  Apple,
  Zap,
  Building2,
  Calculator,
  Wrench,
  Sparkles,
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
    name: '상품 소싱',
    href: '/sourcing',
    icon: <Search size={20} />,
    children: [
      { name: '트렌드 분석', href: '/sourcing/trends' },
      { name: '농수산물 시세', href: '/sourcing/fresh-price' },
      { name: '공급처 검색', href: '/sourcing/suppliers' },
    ],
  },
  {
    name: '상품 제작',
    href: '/products',
    icon: <Package size={20} />,
    children: [
      { name: '상세페이지 에디터', href: '/products/detail-editor' },
      { name: '상품 등록', href: '/products/register' },
      { name: '등록 상품 관리', href: '/products/manage' },
    ],
  },
  {
    name: '주문/배송',
    href: '/orders',
    icon: <ShoppingCart size={20} />,
    children: [
      { name: '주문 목록', href: '/orders' },
      { name: '발주 관리', href: '/orders/fulfillment' },
      { name: '배송 추적', href: '/orders/tracking' },
      { name: '반품/환불', href: '/orders/returns' },
    ],
  },
  {
    name: '공급처 관리',
    href: '/suppliers',
    icon: <Building2 size={20} />,
  },
  {
    name: '정산 관리',
    href: '/settlements',
    icon: <BarChart3 size={20} />,
  },
  {
    name: '도구',
    href: '/tools',
    icon: <Wrench size={20} />,
    children: [
      { name: '마진 계산기', href: '/tools/margin-calculator' },
      { name: 'AI 썸네일', href: '/tools/ai-thumbnail' },
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
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  // 현재 경로에 해당하는 메뉴를 자동으로 펼침
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => pathname === child.href || (child.href !== '/orders' && pathname.startsWith(child.href))
        );
        if (isChildActive) {
          setExpandedMenus((prev) => new Set(prev).add(item.name));
        }
      }
    });
  }, [pathname]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (menuName: string) => expandedMenus.has(menuName);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isChildActive = (href: string) => {
    // 정확한 경로 일치 확인
    if (href === '/orders') {
      return pathname === '/orders';
    }
    return pathname === href;
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
          <div key={item.name} className="mb-1">
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
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isMenuExpanded(item.name) ? 'rotate-180' : ''
                        }`}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isMenuExpanded(item.name) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          isChildActive(child.href)
                            ? 'text-[var(--color-primary-600)] bg-[var(--color-primary-50)] font-medium'
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
