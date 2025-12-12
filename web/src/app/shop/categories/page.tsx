'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Apple,
  Carrot,
  Wheat,
  Fish,
  Package,
  Leaf,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';

interface Category {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  isVisible: boolean;
  icon: string | null;
  productSeq: number;
  children?: Category[];
}

// 아이콘 맵핑
const iconMap: Record<string, any> = {
  apple: Apple,
  carrot: Carrot,
  wheat: Wheat,
  fish: Fish,
  package: Package,
  leaf: Leaf,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    code: '',
    description: '',
    icon: '',
    parentId: '',
    displayOrder: 0,
    isActive: true,
    isVisible: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/shop/categories?includeChildren=true');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        // 모든 카테고리 펼치기
        const allIds = new Set<string>();
        const collectIds = (cats: Category[]) => {
          cats.forEach(cat => {
            allIds.add(cat.id);
            if (cat.children) collectIds(cat.children);
          });
        };
        collectIds(data.data);
        setExpandedCategories(allIds);
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const openCreateModal = (parentId?: string) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      code: '',
      description: '',
      icon: '',
      parentId: parentId || '',
      displayOrder: 0,
      isActive: true,
      isVisible: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      code: category.code || '',
      description: category.description || '',
      icon: category.icon || '',
      parentId: category.parentId || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      isVisible: category.isVisible,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCategory
        ? `/api/shop/categories/${editingCategory.id}`
        : '/api/shop/categories';
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/shop/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const seedDefaultCategories = async () => {
    if (!confirm('농산물 기본 카테고리를 추가하시겠습니까?\n기존 카테고리는 유지됩니다.')) return;

    const defaultCategories = [
      { name: '과일', slug: 'fruit', code: 'FRUIT', icon: 'apple', displayOrder: 1 },
      { name: '채소', slug: 'vegetable', code: 'VEG', icon: 'carrot', displayOrder: 2 },
      { name: '곡물/잡곡', slug: 'grain', code: 'GRAIN', icon: 'wheat', displayOrder: 3 },
      { name: '수산물', slug: 'seafood', code: 'SEA', icon: 'fish', displayOrder: 4 },
      { name: '축산물', slug: 'meat', code: 'MEAT', icon: 'package', displayOrder: 5 },
      { name: '가공식품', slug: 'processed', code: 'PROC', icon: 'package', displayOrder: 6 },
      { name: '친환경/유기농', slug: 'organic', code: 'ORG', icon: 'leaf', displayOrder: 7 },
    ];

    for (const cat of defaultCategories) {
      try {
        await fetch('/api/shop/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cat),
        });
      } catch (error) {
        // 이미 존재하는 경우 무시
      }
    }

    fetchCategories();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[가-힣]/g, (char) => {
        // 간단한 한글->영어 변환
        return char;
      })
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9가-힣-]/g, '');
  };

  const renderCategory = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const IconComponent = category.icon ? iconMap[category.icon] : FolderTree;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 py-3 px-4 hover:bg-[var(--color-gray-50)] border-b border-[var(--color-gray-100)] ${
            depth > 0 ? 'bg-[var(--color-gray-50)]/50' : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          {/* 펼치기/접기 */}
          <button
            onClick={() => hasChildren && toggleExpand(category.id)}
            className={`w-6 h-6 flex items-center justify-center ${
              hasChildren ? 'cursor-pointer' : 'cursor-default opacity-0'
            }`}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </button>

          {/* 아이콘 */}
          <div className="w-8 h-8 bg-[var(--color-primary-100)] rounded-lg flex items-center justify-center">
            <IconComponent size={16} className="text-[var(--color-primary-600)]" />
          </div>

          {/* 이름 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--color-gray-900)]">{category.name}</span>
              <span className="text-xs text-[var(--color-gray-500)]">/{category.slug}</span>
              {category.code && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-mono">{category.code}</span>
              )}
            </div>
            {category.description && (
              <p className="text-xs text-[var(--color-gray-500)] mt-0.5">{category.description}</p>
            )}
          </div>

          {/* 상태 */}
          <div className="flex items-center gap-2">
            {category.isActive ? (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">활성</span>
            ) : (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">비활성</span>
            )}
            {category.isVisible ? (
              <Eye size={14} className="text-green-600" />
            ) : (
              <EyeOff size={14} className="text-gray-400" />
            )}
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => openCreateModal(category.id)}
              className="p-1.5 hover:bg-[var(--color-gray-100)] rounded"
              title="하위 카테고리 추가"
            >
              <Plus size={16} className="text-[var(--color-gray-600)]" />
            </button>
            <button
              onClick={() => openEditModal(category)}
              className="p-1.5 hover:bg-[var(--color-gray-100)] rounded"
              title="수정"
            >
              <Pencil size={16} className="text-[var(--color-gray-600)]" />
            </button>
            <button
              onClick={() => handleDelete(category.id, category.name)}
              className="p-1.5 hover:bg-red-100 rounded"
              title="삭제"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        </div>

        {/* 하위 카테고리 */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // 플랫 리스트로 만들기 (select 옵션용)
  const flatCategories = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    return cats.flatMap(cat => [
      { id: cat.id, name: cat.name, depth },
      ...(cat.children ? flatCategories(cat.children, depth + 1) : []),
    ]);
  };

  if (loading) {
    return (
      <DashboardLayout
        title="카테고리 관리"
        breadcrumb={[
          { name: '홈', href: '/' },
          { name: '설정', href: '/settings' },
          { name: '카테고리 관리' },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[var(--color-primary-500)]" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="카테고리 관리"
      breadcrumb={[
        { name: '홈', href: '/' },
        { name: '설정', href: '/settings' },
        { name: '카테고리 관리' },
      ]}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-[var(--color-gray-600)]">
            자사몰 상품 카테고리를 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={seedDefaultCategories}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--color-gray-300)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-50)] transition-colors"
          >
            <Leaf size={18} />
            <span>기본 카테고리 추가</span>
          </button>
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
          >
            <Plus size={18} />
            <span>카테고리 추가</span>
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]" />
        <input
          type="text"
          placeholder="카테고리 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        />
      </div>

      {/* 카테고리 목록 */}
      <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-2 py-3 px-4 bg-[var(--color-gray-50)] border-b border-[var(--color-gray-200)]">
          <div className="w-6" />
          <div className="w-8" />
          <div className="flex-1 text-xs font-medium text-[var(--color-gray-600)] uppercase">카테고리명</div>
          <div className="w-24 text-xs font-medium text-[var(--color-gray-600)] uppercase text-center">상태</div>
          <div className="w-28 text-xs font-medium text-[var(--color-gray-600)] uppercase text-center">액션</div>
        </div>

        {/* 목록 */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree size={48} className="mx-auto text-[var(--color-gray-400)] mb-4" />
            <p className="text-[var(--color-gray-600)]">등록된 카테고리가 없습니다</p>
            <button
              onClick={seedDefaultCategories}
              className="mt-4 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
            >
              기본 카테고리 추가하기
            </button>
          </div>
        ) : (
          categories.map(cat => renderCategory(cat))
        )}
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-6 border-b border-[var(--color-gray-200)]">
              <h2 className="text-lg font-bold text-[var(--color-gray-900)]">
                {editingCategory ? '카테고리 수정' : '카테고리 추가'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 카테고리명 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  카테고리명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value),
                    });
                  }}
                  className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  required
                />
              </div>

              {/* 슬러그 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  슬러그 (URL) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  required
                />
              </div>

              {/* 카테고리 코드 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  카테고리 코드 * <span className="text-xs text-[var(--color-gray-500)] font-normal">(상품코드 생성용)</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="예: FRUIT, VEG, MEAT"
                  className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] uppercase"
                  required
                  maxLength={10}
                />
                <p className="text-xs text-[var(--color-gray-500)] mt-1">
                  영문 대문자와 숫자만 가능 (예: FRUIT-001 형태의 상품코드가 생성됨)
                </p>
              </div>

              {/* 상위 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  상위 카테고리
                </label>
                <Dropdown
                  options={[
                    { value: '', label: '없음 (최상위)' },
                    ...flatCategories(categories)
                      .filter(c => c.id !== editingCategory?.id)
                      .map(cat => ({
                        value: cat.id,
                        label: '　'.repeat(cat.depth) + cat.name,
                      }))
                  ]}
                  value={formData.parentId}
                  onChange={(value) => setFormData({ ...formData, parentId: value })}
                  placeholder="상위 카테고리 선택"
                  searchable
                />
              </div>

              {/* 아이콘 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  아이콘
                </label>
                <div className="flex gap-2">
                  {Object.entries(iconMap).map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: key })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-colors ${
                        formData.icon === key
                          ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                          : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)]'
                      }`}
                    >
                      <Icon size={20} className={formData.icon === key ? 'text-[var(--color-primary-500)]' : 'text-[var(--color-gray-600)]'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-[var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              {/* 상태 */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--color-gray-300)]"
                  />
                  <span className="text-sm text-[var(--color-gray-700)]">활성화</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--color-gray-300)]"
                  />
                  <span className="text-sm text-[var(--color-gray-700)]">쇼핑몰 노출</span>
                </label>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-[var(--color-gray-300)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-50)]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] disabled:opacity-50"
                >
                  {saving ? '저장 중...' : editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
