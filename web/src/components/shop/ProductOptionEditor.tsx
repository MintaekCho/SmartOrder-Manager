'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

// 옵션 그룹 타입
export interface OptionValue {
  id: string;
  name: string;
  additionalPrice: number;
  isActive: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  isRequired: boolean;
  options: OptionValue[];
}

// 변형 (옵션 조합) 타입
export interface ProductVariant {
  id: string;
  optionCombination: { groupId: string; optionId: string; optionName: string }[];
  price: number;
  comparePrice?: number;
  stock: number;
  sku?: string;
  isActive: boolean;
}

interface ProductOptionEditorProps {
  optionGroups: OptionGroup[];
  variants: ProductVariant[];
  basePrice: number;
  onOptionGroupsChange: (groups: OptionGroup[]) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export default function ProductOptionEditor({
  optionGroups,
  variants,
  basePrice,
  onOptionGroupsChange,
  onVariantsChange,
}: ProductOptionEditorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 옵션 그룹 추가
  const addOptionGroup = () => {
    const newGroup: OptionGroup = {
      id: `group-${Date.now()}`,
      name: '',
      isRequired: true,
      options: [],
    };
    onOptionGroupsChange([...optionGroups, newGroup]);
    setExpandedGroups(new Set([...expandedGroups, newGroup.id]));
  };

  // 옵션 그룹 삭제
  const removeOptionGroup = (groupId: string) => {
    onOptionGroupsChange(optionGroups.filter((g) => g.id !== groupId));
    // 변형에서 해당 그룹 제거
    const updatedVariants = variants.map((v) => ({
      ...v,
      optionCombination: v.optionCombination.filter((c) => c.groupId !== groupId),
    }));
    onVariantsChange(updatedVariants);
  };

  // 옵션 그룹 업데이트
  const updateOptionGroup = (groupId: string, updates: Partial<OptionGroup>) => {
    onOptionGroupsChange(
      optionGroups.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  };

  // 옵션 값 추가
  const addOption = (groupId: string) => {
    const newOption: OptionValue = {
      id: `option-${Date.now()}`,
      name: '',
      additionalPrice: 0,
      isActive: true,
    };
    onOptionGroupsChange(
      optionGroups.map((g) =>
        g.id === groupId ? { ...g, options: [...g.options, newOption] } : g
      )
    );
  };

  // 옵션 값 삭제
  const removeOption = (groupId: string, optionId: string) => {
    onOptionGroupsChange(
      optionGroups.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
          : g
      )
    );
    // 변형에서 해당 옵션 제거
    const updatedVariants = variants.filter(
      (v) => !v.optionCombination.some((c) => c.optionId === optionId)
    );
    onVariantsChange(updatedVariants);
  };

  // 옵션 값 업데이트
  const updateOption = (
    groupId: string,
    optionId: string,
    updates: Partial<OptionValue>
  ) => {
    onOptionGroupsChange(
      optionGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === optionId ? { ...o, ...updates } : o
              ),
            }
          : g
      )
    );
  };

  // 변형 자동 생성
  const generateVariants = () => {
    if (optionGroups.length === 0 || optionGroups.every((g) => g.options.length === 0)) {
      onVariantsChange([]);
      return;
    }

    // 모든 옵션 조합 생성
    const combinations: { groupId: string; optionId: string; optionName: string; additionalPrice: number }[][] = [];

    const generateCombinations = (
      groupIndex: number,
      currentCombination: { groupId: string; optionId: string; optionName: string; additionalPrice: number }[]
    ) => {
      if (groupIndex === optionGroups.length) {
        if (currentCombination.length > 0) {
          combinations.push([...currentCombination]);
        }
        return;
      }

      const group = optionGroups[groupIndex];
      if (group.options.length === 0) {
        generateCombinations(groupIndex + 1, currentCombination);
        return;
      }

      for (const option of group.options.filter((o) => o.isActive)) {
        generateCombinations(groupIndex + 1, [
          ...currentCombination,
          {
            groupId: group.id,
            optionId: option.id,
            optionName: option.name,
            additionalPrice: option.additionalPrice,
          },
        ]);
      }
    };

    generateCombinations(0, []);

    // 기존 변형 유지하면서 새로운 조합 추가
    const newVariants: ProductVariant[] = combinations.map((combination) => {
      const existingVariant = variants.find(
        (v) =>
          v.optionCombination.length === combination.length &&
          v.optionCombination.every((c, i) => c.optionId === combination[i].optionId)
      );

      if (existingVariant) {
        return existingVariant;
      }

      const totalAdditionalPrice = combination.reduce(
        (sum, c) => sum + c.additionalPrice,
        0
      );

      return {
        id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        optionCombination: combination.map((c) => ({
          groupId: c.groupId,
          optionId: c.optionId,
          optionName: c.optionName,
        })),
        price: basePrice + totalAdditionalPrice,
        stock: 0,
        isActive: true,
      };
    });

    onVariantsChange(newVariants);
  };

  // 변형 업데이트
  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    onVariantsChange(
      variants.map((v) => (v.id === variantId ? { ...v, ...updates } : v))
    );
  };

  // 그룹 접기/펼치기
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="space-y-6">
      {/* 옵션 그룹 관리 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-gray-900)]">
            상품 옵션
          </h3>
          <button
            type="button"
            onClick={addOptionGroup}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
          >
            <Plus size={16} />
            옵션 그룹 추가
          </button>
        </div>

        {optionGroups.length === 0 ? (
          <div className="text-center py-8 bg-[var(--color-gray-50)] rounded-lg border-2 border-dashed border-[var(--color-gray-300)]">
            <p className="text-[var(--color-gray-600)] mb-2">
              옵션이 없습니다
            </p>
            <p className="text-sm text-[var(--color-gray-500)]">
              중량, 등급 등 옵션을 추가하면 옵션별로 재고와 가격을 관리할 수 있습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {optionGroups.map((group, groupIndex) => (
              <div
                key={group.id}
                className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden"
              >
                {/* 그룹 헤더 */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--color-gray-50)] cursor-pointer"
                  onClick={() => toggleGroup(group.id)}
                >
                  <GripVertical
                    size={16}
                    className="text-[var(--color-gray-400)]"
                  />
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) =>
                      updateOptionGroup(group.id, { name: e.target.value })
                    }
                    onClick={(e) => e.stopPropagation()}
                    placeholder="옵션 그룹명 (예: 중량, 등급)"
                    className="flex-1 px-3 py-1.5 border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--color-gray-600)]">
                    <input
                      type="checkbox"
                      checked={group.isRequired}
                      onChange={(e) =>
                        updateOptionGroup(group.id, { isRequired: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                    필수
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOptionGroup(group.id);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedGroups.has(group.id) ? (
                    <ChevronUp size={18} className="text-[var(--color-gray-500)]" />
                  ) : (
                    <ChevronDown size={18} className="text-[var(--color-gray-500)]" />
                  )}
                </div>

                {/* 옵션 값 목록 */}
                {expandedGroups.has(group.id) && (
                  <div className="p-4 space-y-2">
                    {group.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) =>
                            updateOption(group.id, option.id, {
                              name: e.target.value,
                            })
                          }
                          placeholder="옵션값 (예: 1kg, 3kg)"
                          className="flex-1 px-3 py-2 border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-[var(--color-gray-500)]">+</span>
                          <input
                            type="number"
                            value={option.additionalPrice}
                            onChange={(e) =>
                              updateOption(group.id, option.id, {
                                additionalPrice: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="w-24 px-3 py-2 border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                          />
                          <span className="text-sm text-[var(--color-gray-500)]">원</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(group.id, option.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(group.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-lg w-full justify-center border border-dashed border-[var(--color-primary-300)]"
                    >
                      <Plus size={16} />
                      옵션값 추가
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 변형 생성 버튼 */}
      {optionGroups.length > 0 && optionGroups.some((g) => g.options.length > 0) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={generateVariants}
            className="px-4 py-2 bg-[var(--color-gray-800)] text-white rounded-lg hover:bg-[var(--color-gray-900)] transition-colors"
          >
            옵션 조합 생성
          </button>
        </div>
      )}

      {/* 변형 목록 (재고/가격 관리) */}
      {variants.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-gray-900)] mb-4">
            옵션별 재고/가격 관리
          </h3>
          <div className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--color-gray-50)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-gray-600)] uppercase">
                    옵션 조합
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-gray-600)] uppercase">
                    판매가
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-gray-600)] uppercase">
                    재고
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-gray-600)] uppercase">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-200)]">
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-[var(--color-gray-50)]">
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--color-gray-900)]">
                        {variant.optionCombination
                          .map((c) => c.optionName)
                          .join(' / ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            price: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-28 px-3 py-1.5 border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 px-3 py-1.5 border border-[var(--color-gray-300)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          updateVariant(variant.id, { isActive: !variant.isActive })
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          variant.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {variant.isActive ? '판매중' : '품절'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
