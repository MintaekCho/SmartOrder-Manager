'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSystemMode } from '@/contexts/SystemModeContext';
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
  Building2,
  Wrench,
  Warehouse,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  FileText,
  Boxes,
  Receipt,
  CreditCard,
  Store,
  Users,
  ShoppingBag,
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: { name: string; href: string }[];
  featureKey?: string; // 기능 키 (활성화 여부 체크용)
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const { settings, isFeatureEnabled, getModeLabel } = useSystemMode();

  // 시스템 모드에 따른 메뉴 구성
  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        name: '대시보드',
        href: '/',
        icon: <LayoutDashboard size={20} />,
      },
    ];

    // 위탁판매 기능 메뉴 (소싱) - 위탁판매/통합 모드
    if (isFeatureEnabled('sourcing')) {
      items.push({
        name: '상품 소싱',
        href: '/sourcing',
        icon: <Search size={20} />,
        featureKey: 'sourcing',
        children: [
          { name: '트렌드 분석', href: '/sourcing/trends' },
          { name: '음식 트렌드', href: '/sourcing/food-trends' },
          { name: '농수산물 시세', href: '/sourcing/fresh-price' },
          { name: '공급처 검색', href: '/sourcing/suppliers' },
        ],
      });
    }

    // 상품 관리 - 위탁판매/통합 모드에서만 (쿠팡 상품 등록 관련)
    if (settings.mode === 'dropshipping' || settings.mode === 'hybrid') {
      items.push({
        name: '상품 관리',
        href: '/products',
        icon: <Package size={20} />,
        children: [
          { name: '상세페이지 에디터', href: '/products/detail-editor' },
          { name: '상품 등록', href: '/products/register' },
          { name: '등록 상품 관리', href: '/products/manage' },
        ],
      });
    }

    // 자사몰 관리 메뉴 (재고관리/통합 모드)
    if (isFeatureEnabled('inventory')) {
      const shopChildren: { name: string; href: string }[] = [
        { name: '상품 관리', href: '/shop/products' },
        { name: '카테고리 관리', href: '/shop/categories' },
        { name: '주문 관리', href: '/shop/orders' },
        { name: '고객 관리', href: '/shop/customers' },
      ];

      // 재고 관련 기능
      shopChildren.push({ name: '재고 현황', href: '/inventory' });

      if (isFeatureEnabled('stockIn')) {
        shopChildren.push({ name: '입고 관리', href: '/inventory/stock-in' });
      }
      if (isFeatureEnabled('stockOut')) {
        shopChildren.push({ name: '출고 관리', href: '/inventory/stock-out' });
      }
      if (isFeatureEnabled('stockCount')) {
        shopChildren.push({ name: '재고 실사', href: '/inventory/stock-count' });
      }

      items.push({
        name: '자사몰 관리',
        href: '/shop',
        icon: <Store size={20} />,
        featureKey: 'inventory',
        children: shopChildren,
      });
    }

    // 창고 관리
    if (isFeatureEnabled('warehouse')) {
      items.push({
        name: '창고 관리',
        href: '/warehouse',
        icon: <Warehouse size={20} />,
        featureKey: 'warehouse',
        children: [
          { name: '창고 목록', href: '/warehouse' },
          { name: '로케이션 관리', href: '/warehouse/locations' },
        ],
      });
    }

    // 발주 관리 (재고관리 모드 - 구매 발주)
    if (isFeatureEnabled('purchaseOrder')) {
      items.push({
        name: '발주 관리',
        href: '/purchase-orders',
        icon: <FileText size={20} />,
        featureKey: 'purchaseOrder',
        children: [
          { name: '발주 목록', href: '/purchase-orders' },
          { name: '발주 등록', href: '/purchase-orders/new' },
        ],
      });
    }

    // 주문/배송 - 위탁판매/통합 모드에서만 (쿠팡 주문 관련)
    if (settings.mode === 'dropshipping' || settings.mode === 'hybrid') {
      items.push({
        name: '주문/배송',
        href: '/orders',
        icon: <ShoppingCart size={20} />,
        children: [
          { name: '주문 목록', href: '/orders' },
          { name: '발주 처리', href: '/orders/fulfillment' },
          { name: '배송 추적', href: '/orders/tracking' },
          { name: '반품/환불', href: '/orders/returns' },
        ],
      });
    }

    // 공급처 관리 (위탁판매)
    if (isFeatureEnabled('sourcing') || isFeatureEnabled('autoOrder')) {
      items.push({
        name: '공급처 관리',
        href: '/suppliers',
        icon: <Building2 size={20} />,
      });
    }

    // 정산 관리 - 위탁판매/통합 모드에서만 (쿠팡 정산)
    if (settings.mode === 'dropshipping' || settings.mode === 'hybrid') {
      items.push({
        name: '정산 관리',
        href: '/settlements',
        icon: <BarChart3 size={20} />,
      });
    }

    // 매입/매출 관리 - 재고관리/통합 모드에서만
    if (settings.mode === 'inventory' || settings.mode === 'hybrid') {
      items.push({
        name: '매입/매출',
        href: '/accounting',
        icon: <Receipt size={20} />,
        children: [
          { name: '매입 관리', href: '/accounting/purchases' },
          { name: '매출 관리', href: '/accounting/sales' },
          { name: '거래처 관리', href: '/accounting/vendors' },
          { name: '수익 분석', href: '/accounting/analysis' },
        ],
      });
    }

    // 도구 - 위탁판매/통합 모드에서만
    if (settings.mode === 'dropshipping' || settings.mode === 'hybrid') {
      const toolChildren: { name: string; href: string }[] = [];
      if (isFeatureEnabled('marginCalc')) {
        toolChildren.push({ name: '마진 계산기', href: '/tools/margin-calculator' });
      }
      toolChildren.push({ name: 'AI 썸네일', href: '/tools/ai-thumbnail' });

      if (toolChildren.length > 0) {
        items.push({
          name: '도구',
          href: '/tools',
          icon: <Wrench size={20} />,
          children: toolChildren,
        });
      }
    }

    // 리포트
    items.push({
      name: '리포트',
      href: '/reports',
      icon: <BarChart3 size={20} />,
    });

    // 설정
    items.push({
      name: '설정',
      href: '/settings',
      icon: <Settings size={20} />,
    });

    return items;
  }, [settings.mode, settings.features, isFeatureEnabled]);

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
  }, [pathname, menuItems]);

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
    if (href === '/orders') {
      return pathname === '/orders';
    }
    return pathname === href;
  };

  // 모드별 색상
  const getModeColor = () => {
    switch (settings.mode) {
      case 'dropshipping':
        return 'bg-blue-500';
      case 'inventory':
        return 'bg-green-500';
      case 'hybrid':
        return 'bg-purple-500';
      default:
        return 'bg-[var(--color-primary-500)]';
    }
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
            <div className={`w-8 h-8 rounded-lg ${getModeColor()} flex items-center justify-center`}>
              <TrendingUp size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[var(--color-gray-900)]">
                SmartOrder
              </span>
              <span className="text-[10px] text-[var(--color-gray-500)]">
                {getModeLabel(settings.mode)} 모드
              </span>
            </div>
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
      <nav className="px-2 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
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
