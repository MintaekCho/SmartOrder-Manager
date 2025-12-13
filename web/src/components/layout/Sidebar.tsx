'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFeatureSettings } from '@/contexts/FeatureSettingsContext';
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
  Store,
  Users,
  ShoppingBag,
  Layers,
  Globe,
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
  const { features, isFeatureEnabled } = useFeatureSettings();

  // 기능 설정에 따른 메뉴 구성
  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        name: '대시보드',
        href: '/',
        icon: <LayoutDashboard size={20} />,
      },
    ];

    // 상품 소싱 기능
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

    // 통합 상품 관리 (멀티 플랫폼)
    if (isFeatureEnabled('multiPlatform')) {
      items.push({
        name: '통합 상품',
        href: '/products/multi',
        icon: <Globe size={20} />,
        featureKey: 'multiPlatform',
        children: [
          { name: '마스터 상품', href: '/products/multi' },
          { name: '일괄 등록', href: '/products/multi/upload' },
          { name: '플랫폼 현황', href: '/products/multi/status' },
          { name: '플랫폼 설정', href: '/products/multi/settings' },
        ],
      });
    }

    // 쿠팡 상품 관리 (레거시)
    if (isFeatureEnabled('coupangProducts')) {
      items.push({
        name: '쿠팡 상품',
        href: '/products',
        icon: <Package size={20} />,
        featureKey: 'coupangProducts',
        children: [
          { name: '상세페이지 에디터', href: '/products/detail-editor' },
          { name: '상품 등록', href: '/products/register' },
          { name: '등록 상품 관리', href: '/products/manage' },
        ],
      });
    }

    // 쿠팡 주문/배송
    if (isFeatureEnabled('coupangOrders')) {
      items.push({
        name: '쿠팡 주문',
        href: '/orders',
        icon: <ShoppingCart size={20} />,
        featureKey: 'coupangOrders',
        children: [
          { name: '주문 목록', href: '/orders' },
          { name: '발주 처리', href: '/orders/fulfillment' },
          { name: '배송 추적', href: '/orders/tracking' },
          { name: '반품/환불', href: '/orders/returns' },
        ],
      });
    }

    // 자사몰 상품 관리
    if (isFeatureEnabled('shopProducts') || isFeatureEnabled('shopCategories') || isFeatureEnabled('shopOrders') || isFeatureEnabled('shopCustomers')) {
      const shopChildren: { name: string; href: string }[] = [];

      if (isFeatureEnabled('shopProducts')) {
        shopChildren.push({ name: '상품 관리', href: '/shop/products' });
      }
      if (isFeatureEnabled('shopCategories')) {
        shopChildren.push({ name: '카테고리 관리', href: '/shop/categories' });
      }
      if (isFeatureEnabled('shopOrders')) {
        shopChildren.push({ name: '주문 관리', href: '/shop/orders' });
      }
      if (isFeatureEnabled('shopCustomers')) {
        shopChildren.push({ name: '고객 관리', href: '/shop/customers' });
      }

      if (shopChildren.length > 0) {
        items.push({
          name: '자사몰',
          href: '/shop',
          icon: <Store size={20} />,
          children: shopChildren,
        });
      }
    }

    // 재고 관리
    if (isFeatureEnabled('inventory')) {
      const inventoryChildren: { name: string; href: string }[] = [
        { name: '재고 현황', href: '/inventory' },
      ];

      if (isFeatureEnabled('stockIn')) {
        inventoryChildren.push({ name: '입고 관리', href: '/inventory/stock-in' });
      }
      if (isFeatureEnabled('stockOut')) {
        inventoryChildren.push({ name: '출고 관리', href: '/inventory/stock-out' });
      }
      if (isFeatureEnabled('stockCount')) {
        inventoryChildren.push({ name: '재고 실사', href: '/inventory/stock-count' });
      }

      items.push({
        name: '재고 관리',
        href: '/inventory',
        icon: <Boxes size={20} />,
        featureKey: 'inventory',
        children: inventoryChildren,
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

    // 발주 관리
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

    // 공급처 관리
    if (isFeatureEnabled('suppliers')) {
      items.push({
        name: '공급처 관리',
        href: '/suppliers',
        icon: <Building2 size={20} />,
        featureKey: 'suppliers',
      });
    }

    // 정산 관리
    if (isFeatureEnabled('settlements')) {
      items.push({
        name: '정산 관리',
        href: '/settlements',
        icon: <Receipt size={20} />,
        featureKey: 'settlements',
      });
    }

    // 도구
    if (isFeatureEnabled('tools') || isFeatureEnabled('marginCalc')) {
      const toolChildren: { name: string; href: string }[] = [];

      if (isFeatureEnabled('marginCalc')) {
        toolChildren.push({ name: '마진 계산기', href: '/tools/margin-calculator' });
      }
      if (isFeatureEnabled('tools')) {
        toolChildren.push({ name: 'AI 썸네일', href: '/tools/ai-thumbnail' });
      }

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
    if (isFeatureEnabled('reports')) {
      items.push({
        name: '리포트',
        href: '/reports',
        icon: <BarChart3 size={20} />,
        featureKey: 'reports',
      });
    }

    // 설정 (항상 표시)
    items.push({
      name: '설정',
      href: '/settings',
      icon: <Settings size={20} />,
    });

    return items;
  }, [features, isFeatureEnabled]);

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

  // 활성화된 기능 수에 따른 색상
  const getActiveColor = () => {
    const activeCount = Object.values(features).filter(Boolean).length;
    if (activeCount >= 15) return 'bg-purple-500';
    if (activeCount >= 10) return 'bg-blue-500';
    if (activeCount >= 5) return 'bg-green-500';
    return 'bg-gray-500';
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
            <div className={`w-8 h-8 rounded-lg ${getActiveColor()} flex items-center justify-center`}>
              <TrendingUp size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[var(--color-gray-900)]">
                SmartOrder
              </span>
              <span className="text-[10px] text-[var(--color-gray-500)]">
                {Object.values(features).filter(Boolean).length}개 기능 사용 중
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
