'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  children?: DropdownOption[];
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string, option: DropdownOption) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  className?: string;
  dropdownClassName?: string;
  maxHeight?: number;
  emptyText?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  label,
  error,
  disabled = false,
  searchable = false,
  clearable = false,
  size = 'md',
  variant = 'default',
  className = '',
  dropdownClassName = '',
  maxHeight = 280,
  emptyText = '검색 결과가 없습니다',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Find selected option (including nested)
  const findOption = (opts: DropdownOption[], val: string): DropdownOption | null => {
    for (const opt of opts) {
      if (opt.value === val) return opt;
      if (opt.children) {
        const found = findOption(opt.children, val);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedOption = value ? findOption(options, value) : null;

  // Flatten options for search and keyboard navigation
  const flattenOptions = (opts: DropdownOption[], depth = 0): (DropdownOption & { depth: number })[] => {
    const result: (DropdownOption & { depth: number })[] = [];
    for (const opt of opts) {
      if (!opt.children) {
        result.push({ ...opt, depth });
      }
      if (opt.children) {
        result.push(...flattenOptions(opt.children, depth + 1));
      }
    }
    return result;
  };

  const flatOptions = flattenOptions(options);

  // Filter options based on search
  const filteredOptions = searchQuery
    ? flatOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flatOptions;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            onChange(opt.value, opt);
            setIsOpen(false);
            setSearchQuery('');
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => {
            const next = prev + 1;
            return next >= filteredOptions.length ? 0 : next;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => {
            const next = prev - 1;
            return next < 0 ? filteredOptions.length - 1 : next;
          });
        }
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Size styles
  const sizeStyles = {
    sm: 'h-8 text-sm px-2.5',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4',
  };

  // Variant styles
  const variantStyles = {
    default: `
      bg-white border border-[var(--color-gray-300)]
      hover:border-[var(--color-gray-400)]
      focus-within:border-[var(--color-primary-500)] focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]
    `,
    outline: `
      bg-transparent border-2 border-[var(--color-gray-300)]
      hover:border-[var(--color-gray-400)]
      focus-within:border-[var(--color-primary-500)]
    `,
    filled: `
      bg-[var(--color-gray-100)] border border-transparent
      hover:bg-[var(--color-gray-200)]
      focus-within:bg-white focus-within:border-[var(--color-primary-500)] focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]
    `,
  };

  const handleSelect = (opt: DropdownOption & { depth: number }) => {
    if (opt.disabled) return;
    onChange(opt.value, opt);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', { value: '', label: '' });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 rounded-lg transition-all duration-200
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${error ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-100' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--color-gray-100)]' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 text-[var(--color-gray-500)]">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate ${selectedOption ? 'text-[var(--color-gray-900)]' : 'text-[var(--color-gray-400)]'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-[var(--color-gray-200)] text-[var(--color-gray-400)] hover:text-[var(--color-gray-600)] transition-colors"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={18}
            className={`text-[var(--color-gray-400)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 w-full mt-1 bg-white rounded-lg border border-[var(--color-gray-200)]
            shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150
            ${dropdownClassName}
          `}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-[var(--color-gray-100)]">
              <div className="relative">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="검색..."
                  className="w-full h-8 pl-8 pr-3 text-sm bg-[var(--color-gray-50)] border border-[var(--color-gray-200)] rounded-md
                    focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-100)]
                    placeholder:text-[var(--color-gray-400)]"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <ul
            ref={listRef}
            className="py-1 overflow-y-auto"
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-6 text-sm text-center text-[var(--color-gray-400)]">
                {emptyText}
              </li>
            ) : (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  data-option
                  onClick={() => handleSelect(opt)}
                  className={`
                    flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                    ${opt.depth > 0 ? `pl-${3 + opt.depth * 4}` : ''}
                    ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${opt.value === value ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]' : ''}
                    ${highlightedIndex === index && opt.value !== value ? 'bg-[var(--color-gray-50)]' : ''}
                    ${!opt.disabled && opt.value !== value ? 'hover:bg-[var(--color-gray-50)]' : ''}
                  `}
                  style={{ paddingLeft: opt.depth > 0 ? `${12 + opt.depth * 16}px` : undefined }}
                >
                  {opt.icon && (
                    <span className="flex-shrink-0 text-[var(--color-gray-500)]">
                      {opt.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-[var(--color-gray-500)] truncate">{opt.description}</div>
                    )}
                  </div>
                  {opt.value === value && (
                    <Check size={16} className="flex-shrink-0 text-[var(--color-primary-600)]" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Multi-Select Dropdown
interface MultiSelectDropdownProps extends Omit<DropdownProps, 'value' | 'onChange' | 'clearable'> {
  value: string[];
  onChange: (values: string[], options: DropdownOption[]) => void;
  maxSelected?: number;
}

export function MultiSelectDropdown({
  options,
  value = [],
  onChange,
  placeholder = '선택하세요',
  label,
  error,
  disabled = false,
  searchable = false,
  size = 'md',
  variant = 'default',
  className = '',
  dropdownClassName = '',
  maxHeight = 280,
  emptyText = '검색 결과가 없습니다',
  maxSelected,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten options
  const flattenOptions = (opts: DropdownOption[]): DropdownOption[] => {
    const result: DropdownOption[] = [];
    for (const opt of opts) {
      if (!opt.children) {
        result.push(opt);
      }
      if (opt.children) {
        result.push(...flattenOptions(opt.children));
      }
    }
    return result;
  };

  const flatOptions = flattenOptions(options);

  const selectedOptions = value
    .map(v => flatOptions.find(o => o.value === v))
    .filter(Boolean) as DropdownOption[];

  const filteredOptions = searchQuery
    ? flatOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flatOptions;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = (opt: DropdownOption) => {
    if (opt.disabled) return;

    const isSelected = value.includes(opt.value);
    let newValues: string[];
    let newOptions: DropdownOption[];

    if (isSelected) {
      newValues = value.filter(v => v !== opt.value);
      newOptions = selectedOptions.filter(o => o.value !== opt.value);
    } else {
      if (maxSelected && value.length >= maxSelected) return;
      newValues = [...value, opt.value];
      newOptions = [...selectedOptions, opt];
    }

    onChange(newValues, newOptions);
  };

  const handleRemove = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = value.filter(v => v !== optValue);
    const newOptions = selectedOptions.filter(o => o.value !== optValue);
    onChange(newValues, newOptions);
  };

  const sizeStyles = {
    sm: 'min-h-8 text-sm px-2.5 py-1',
    md: 'min-h-10 text-sm px-3 py-1.5',
    lg: 'min-h-12 text-base px-4 py-2',
  };

  const variantStyles = {
    default: `
      bg-white border border-[var(--color-gray-300)]
      hover:border-[var(--color-gray-400)]
      focus-within:border-[var(--color-primary-500)] focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]
    `,
    outline: `
      bg-transparent border-2 border-[var(--color-gray-300)]
      hover:border-[var(--color-gray-400)]
      focus-within:border-[var(--color-primary-500)]
    `,
    filled: `
      bg-[var(--color-gray-100)] border border-transparent
      hover:bg-[var(--color-gray-200)]
      focus-within:bg-white focus-within:border-[var(--color-primary-500)] focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]
    `,
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 rounded-lg transition-all duration-200
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--color-gray-100)]' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-1.5 flex-1 flex-wrap">
          {selectedOptions.length === 0 ? (
            <span className="text-[var(--color-gray-400)]">{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-primary-100)] text-[var(--color-primary-700)] rounded text-xs font-medium"
              >
                {opt.label}
                <X
                  size={12}
                  className="cursor-pointer hover:text-[var(--color-primary-900)]"
                  onClick={(e) => handleRemove(opt.value, e)}
                />
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-[var(--color-gray-400)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {isOpen && (
        <div
          className={`
            absolute z-50 w-full mt-1 bg-white rounded-lg border border-[var(--color-gray-200)]
            shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150
            ${dropdownClassName}
          `}
        >
          {searchable && (
            <div className="p-2 border-b border-[var(--color-gray-100)]">
              <div className="relative">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색..."
                  className="w-full h-8 pl-8 pr-3 text-sm bg-[var(--color-gray-50)] border border-[var(--color-gray-200)] rounded-md
                    focus:outline-none focus:border-[var(--color-primary-500)]
                    placeholder:text-[var(--color-gray-400)]"
                />
              </div>
            </div>
          )}

          <ul className="py-1 overflow-y-auto" style={{ maxHeight }}>
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-6 text-sm text-center text-[var(--color-gray-400)]">
                {emptyText}
              </li>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value.includes(opt.value);
                const isDisabled = opt.disabled || (maxSelected && !isSelected && value.length >= maxSelected);

                return (
                  <li
                    key={opt.value}
                    onClick={() => !isDisabled && handleToggle(opt)}
                    className={`
                      flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--color-gray-50)]'}
                      ${isSelected ? 'bg-[var(--color-primary-50)]' : ''}
                    `}
                  >
                    <div
                      className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected
                          ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)]'
                          : 'border-[var(--color-gray-300)]'}
                      `}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    {opt.icon && <span className="text-[var(--color-gray-500)]">{opt.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="text-xs text-[var(--color-gray-500)] truncate">{opt.description}</div>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {maxSelected && (
            <div className="px-3 py-2 border-t border-[var(--color-gray-100)] text-xs text-[var(--color-gray-500)]">
              {value.length} / {maxSelected} 선택됨
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
