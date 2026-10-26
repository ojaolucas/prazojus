import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from 'react';
import {
  ChevronDown,
  X,
  SearchX,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Remove acentos e converte para minúsculas para comparação insensível a acentuação e caixa
 */
export const normalizeText = (text: string): string => {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Destaca todos os trechos correspondentes com fonte azul, negrito e sublinhado (conforme imagem de referência)
 */
const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <span>{text}</span>;

  const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const escaped = normalizedQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalizedText)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }
    parts.push(
      <span
        key={startIndex}
        className="text-blue-600 font-bold underline decoration-blue-600 decoration-1"
      >
        {text.slice(startIndex, endIndex)}
      </span>
    );
    lastIndex = endIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span>{parts.length > 0 ? parts : text}</span>;
};

// ============================================================================
// SINGLE SELECT: SearchableSelect (Sem lupa, direto e simples como na referência)
// ============================================================================

export interface SearchableSelectProps {
  options: (string | SelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  emptyMessage?: string;
  allowClear?: boolean;
  size?: 'sm' | 'md' | 'form';
  autoFocus?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options: rawOptions,
  value,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder,
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  id: customId,
  name,
  className = '',
  emptyMessage = 'Nenhum resultado encontrado',
  allowClear = true,
  size = 'md',
  autoFocus = false,
}) => {
  const generatedId = useId();
  const id = customId || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normaliza opções para o formato SelectOption
  const options: SelectOption[] = useMemo(() => {
    return rawOptions.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [rawOptions]);

  // Opção atualmente selecionada
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Filtragem dinâmica por qualquer parte do nome ignorando acentos e maiúsculas
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = normalizeText(searchQuery);
    return options.filter((opt) => {
      const matchLabel = normalizeText(opt.label).includes(q);
      const matchDesc = opt.description ? normalizeText(opt.description).includes(q) : false;
      return matchLabel || matchDesc;
    });
  }, [options, searchQuery]);

  // Limpa query de busca ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Rola o item em destaque para a área visível do menu
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLLIElement>('[role="option"]');
      const item = items[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;
      onChange(option.value);
      setIsOpen(false);
      setSearchQuery('');
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setSearchQuery('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(filteredOptions.length - 1);
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;

      case 'Tab':
        setIsOpen(false);
        break;

      default:
        if (!isOpen && e.key.length === 1) {
          setIsOpen(true);
        }
        break;
    }
  };

  const isForm = size === 'form';
  const isSmall = size === 'sm';
  const hasValueOrQuery = Boolean(value || searchQuery);

  const containerHeightClass = isForm
    ? 'h-[34px] rounded-lg'
    : isSmall
    ? 'h-[38px] rounded-xl'
    : 'h-[38px] rounded-xl';

  const containerBgBorderClass = disabled
    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
    : error
    ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/30 bg-red-50/20'
    : isOpen
    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs bg-white'
    : isSmall
    ? 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white shadow-2xs'
    : isForm
    ? 'border-slate-300 hover:border-slate-400 bg-white'
    : 'border-slate-300 hover:border-slate-400 bg-white shadow-2xs';

  const inputPaddingAndTextClass = isForm
    ? 'text-sm py-1 pl-3 pr-1'
    : isSmall
    ? 'text-xs py-1.5 pl-2.5 pr-1'
    : 'text-sm py-1.5 pl-3 pr-1';

  const iconClass = isForm
    ? 'w-3.5 h-3.5 text-slate-400'
    : isSmall
    ? 'w-3.5 h-3.5 text-slate-500'
    : 'w-4 h-4 text-slate-400';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className={`block mb-1 ${
            isSmall
              ? 'text-[11px] font-bold uppercase tracking-wider text-slate-500'
              : 'text-xs font-medium text-slate-700'
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Caixa de Entrada / Trigger (Tamanho exato e proporcional) */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            inputRef.current?.focus();
          }
        }}
        className={`group relative flex items-center w-full transition-all cursor-pointer border ${containerHeightClass} ${containerBgBorderClass}`}
      >
        {/* Input de digitação e pesquisa */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          disabled={disabled}
          value={isOpen ? searchQuery : selectedOption ? selectedOption.label : ''}
          placeholder={isOpen && searchPlaceholder ? searchPlaceholder : placeholder}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setHighlightedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent border-none outline-none font-normal text-slate-800 placeholder-slate-400 ${inputPaddingAndTextClass}`}
        />

        {/* Ícone à direita */}
        <div className="flex items-center pr-2 shrink-0">
          {allowClear && !disabled && hasValueOrQuery ? (
            <button
              type="button"
              onClick={handleClear}
              title="Limpar seleção"
              aria-label="Limpar seleção"
              className="p-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className={iconClass} />
            </button>
          ) : (
            <div
              className={`p-0.5 text-slate-500 transition-transform duration-200 pointer-events-none ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            >
              <ChevronDown className={iconClass} />
            </div>
          )}
        </div>
      </div>

      {/* Menu Suspenso (Dropdown simples e limpo como na imagem de referência) */}
      {isOpen && !disabled && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
        >
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1 select-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-6 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                <SearchX className="w-5 h-5 text-slate-300 stroke-[1.5]" />
                <span className="text-xs font-medium text-slate-600">{emptyMessage}</span>
                <span className="text-[11px] text-slate-400">
                  Tente outro termo na busca.
                </span>
              </li>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs leading-normal ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                        : isSelected || isHighlighted
                        ? 'bg-blue-50/90 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <HighlightMatch text={option.label} query={searchQuery} />
                    </div>
                    {option.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                        {option.description}
                      </p>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Mensagem de Erro ou Helper Text */}
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

// ============================================================================
// MULTI SELECT: MultiSearchableSelect (Sem lupa, direto com tags e busca inline)
// ============================================================================

export interface MultiSearchableSelectProps {
  options: (string | SelectOption)[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  emptyMessage?: string;
  selectAllOption?: boolean;
  size?: 'sm' | 'md';
}

export const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({
  options: rawOptions,
  value = [],
  onChange,
  placeholder = 'Selecione as opções...',
  searchPlaceholder = 'Buscar...',
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  id: customId,
  className = '',
  emptyMessage = 'Nenhuma opção encontrada',
  selectAllOption = true,
  size = 'md',
}) => {
  const generatedId = useId();
  const id = customId || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normaliza opções para SelectOption
  const options: SelectOption[] = useMemo(() => {
    return rawOptions.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [rawOptions]);

  // Filtragem dinâmica por qualquer parte do nome ignorando acentos e maiúsculas
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = normalizeText(searchQuery);
    return options.filter((opt) => {
      const matchLabel = normalizeText(opt.label).includes(q);
      const matchDesc = opt.description ? normalizeText(opt.description).includes(q) : false;
      return matchLabel || matchDesc;
    });
  }, [options, searchQuery]);

  // Fechar ao clicar fora
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

  const toggleOption = useCallback(
    (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    },
    [value, onChange]
  );

  const handleRemoveTag = (e: React.MouseEvent, valToRemove: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== valToRemove));
  };

  const handleSelectAll = () => {
    const allValidValues = options.filter((o) => !o.disabled).map((o) => o.value);
    onChange(allValidValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(filteredOptions.length - 1);
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          toggleOption(filteredOptions[highlightedIndex].value);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;

      case 'Backspace':
        if (!searchQuery && value.length > 0) {
          onChange(value.slice(0, -1));
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-700"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {value.length} de {options.length} selecionado{value.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Caixa do Multi-Select com Tags */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`group relative flex flex-wrap items-center gap-1.5 w-full p-1.5 transition-all cursor-pointer border rounded-xl bg-white ${
          isSmall ? 'min-h-[38px] text-xs' : 'min-h-[44px] text-sm'
        } ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
            : error
            ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/30 bg-red-50/20'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 shadow-2xs'
        }`}
      >
        {/* Chips / Tags selecionados */}
        {value.map((val) => {
          const opt = options.find((o) => o.value === val);
          const displayLabel = opt ? opt.label : val;

          return (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium max-w-full shadow-2xs animate-fade-in"
            >
              <span className="truncate max-w-[200px]" title={displayLabel}>
                {displayLabel}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveTag(e, val)}
                  className="p-0.5 text-blue-500 hover:text-blue-800 hover:bg-blue-100/80 rounded-sm transition-colors cursor-pointer"
                  title="Remover"
                  aria-label={`Remover ${displayLabel}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        })}

        {/* Input inline de pesquisa */}
        <div className="flex-1 min-w-[130px] flex items-center pl-1">
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={`${id}-multi-listbox`}
            disabled={disabled}
            value={searchQuery}
            placeholder={value.length === 0 ? placeholder : searchPlaceholder}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400 py-1"
          />
        </div>

        {/* Ações de limpar tudo e chevron */}
        <div className="flex items-center gap-1 ml-auto pr-1">
          {!disabled && value.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              title="Limpar todos os itens selecionados"
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div
            className={`p-1 text-slate-500 transition-transform duration-200 pointer-events-none ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Menu Suspenso Multi-Select */}
      {isOpen && !disabled && (
        <div
          id={`${id}-multi-listbox`}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
        >
          {/* Barra de Ações Rápidas */}
          {selectAllOption && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Selecionar Todos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  Limpar
                </button>
              </div>

              <span className="text-[11px] text-slate-500">
                {filteredOptions.length} disponível{filteredOptions.length === 1 ? '' : 'is'}
              </span>
            </div>
          )}

          {/* Lista de Opções com Checkboxes */}
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1 select-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-6 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                <SearchX className="w-5 h-5 text-slate-300 stroke-[1.5]" />
                <span className="text-xs font-medium text-slate-600">{emptyMessage}</span>
                <span className="text-[11px] text-slate-400">
                  Tente outro termo na busca.
                </span>
              </li>
            ) : (
              filteredOptions.map((option, idx) => {
                const isChecked = value.includes(option.value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => toggleOption(option.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : isChecked
                        ? 'bg-blue-50/70 text-blue-950 font-medium'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="shrink-0 text-slate-400">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate">
                        <HighlightMatch text={option.label} query={searchQuery} />
                      </div>
                      {option.description && (
                        <p className="text-[11px] text-slate-400 truncate font-normal">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Erro ou Helper */}
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
