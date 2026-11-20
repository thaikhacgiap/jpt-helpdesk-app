"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X, Loader2, ArrowUpRight, Wrench, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchContracts, Contract } from "@/lib/contract-operations";

export interface MaintenanceOption {
  id: string;
  code: string;
  title?: string;
  customerName?: string;
  contractNo?: string;
  type: "plan" | "contract";
}

export interface MaintenanceSearchSelectProps {
  value?: string | null;
  onChange: (code: string, option?: MaintenanceOption | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: "sm" | "md";
  dropdownPosition?: "fixed" | "absolute";
}

export async function fetchAllMaintenanceOptions(): Promise<MaintenanceOption[]> {
  const options: MaintenanceOption[] = [];
  const seenCodes = new Set<string>();

  // 1. Fetch maintenance plans (BTR-) from tickets table
  try {
    const { data: btrTickets, error } = await supabase
      .from("tickets")
      .select("id, ticket_id, title, customer_name, contract_no, created_at")
      .or("ticket_id.ilike.BTR-%,tt_type.ilike.maintenance")
      .order("created_at", { ascending: false });

    if (!error && btrTickets) {
      btrTickets.forEach((t) => {
        const code = (t.ticket_id || "").trim();
        if (code && !seenCodes.has(code.toUpperCase())) {
          seenCodes.add(code.toUpperCase());
          options.push({
            id: t.id,
            code: code,
            title: t.title || "Kế hoạch bảo trì",
            customerName: t.customer_name || undefined,
            contractNo: t.contract_no || undefined,
            type: "plan",
          });
        }
      });
    }
  } catch (err) {
    console.error("Error fetching maintenance plans:", err);
  }

  // 2. Fetch contracts from contracts table
  try {
    const contracts = await fetchContracts().catch(() => []);
    contracts.forEach((c) => {
      const code = (c.contract_no || c.code || "").trim();
      if (code && !seenCodes.has(code.toUpperCase())) {
        seenCodes.add(code.toUpperCase());
        options.push({
          id: c.id,
          code: code,
          title: c.name || c.service || "Hợp đồng bảo trì / dịch vụ",
          customerName: c.customer || c.customer_name || undefined,
          contractNo: code,
          type: "contract",
        });
      }
    });
  } catch (err) {
    console.error("Error fetching contracts for maintenance:", err);
  }

  return options;
}

export default function MaintenanceSearchSelect({
  value = "",
  onChange,
  placeholder = "-- Tìm và chọn mã bảo trì (BTR-...) hoặc hợp đồng --",
  allowClear = true,
  disabled = false,
  required = false,
  className = "",
  size = "md",
  dropdownPosition = "fixed",
}: MaintenanceSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<MaintenanceOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchAllMaintenanceOptions()
      .then((data) => {
        if (isMounted) setOptions(data);
      })
      .catch((err) => console.error("Error loading maintenance options:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle outside click & resize/scroll
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen && triggerBtnRef.current) {
        setDropdownRect(triggerBtnRef.current.getBoundingClientRect());
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Update rect and focus input on open
  useEffect(() => {
    if (isOpen && triggerBtnRef.current) {
      setDropdownRect(triggerBtnRef.current.getBoundingClientRect());
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value) return null;
    const cleanVal = String(value).trim().toUpperCase();
    return (
      options.find(
        (o) =>
          o.code.toUpperCase() === cleanVal ||
          o.id.toUpperCase() === cleanVal ||
          (o.contractNo && o.contractNo.toUpperCase() === cleanVal)
      ) || null
    );
  }, [value, options]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((o) => {
      return (
        o.code.toLowerCase().includes(q) ||
        (o.title && o.title.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.contractNo && o.contractNo.toLowerCase().includes(q))
      );
    });
  }, [options, searchQuery]);

  const handleSelect = (opt: MaintenanceOption) => {
    onChange(opt.code, opt);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", null);
    setSearchQuery("");
  };

  const handleCustomCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const code = searchQuery.trim();
      const codeUpper = code.toUpperCase();
      const existing = options.find((o) => o.code.toUpperCase() === codeUpper);
      onChange(existing ? existing.code : code, existing || null);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const isSmall = size === "sm";

  // Dropdown list rendering
  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownContent = (
      <div
        ref={dropdownRef}
        style={
          dropdownPosition === "fixed" && dropdownRect
            ? {
                position: "fixed",
                top: `${dropdownRect.bottom + 4}px`,
                left: `${dropdownRect.left}px`,
                width: `${Math.max(dropdownRect.width, 360)}px`,
                zIndex: 999999,
              }
            : undefined
        }
        className={`${
          dropdownPosition === "absolute"
            ? "absolute top-full left-0 right-0 mt-1.5 z-50 min-w-[340px]"
            : ""
        } bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-80`}
      >
        {/* Search Box */}
        <div className="p-2 border-b border-slate-100 bg-slate-50/70">
          <form onSubmit={handleCustomCodeSubmit} className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã BTR-, số hợp đồng, khách hàng..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </form>
        </div>

        {/* Option List */}
        <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
          {isLoading ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <span className="text-xs">Đang tải danh sách bảo trì...</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-5 text-center px-4">
              <p className="text-xs text-slate-500">
                Không tìm thấy mã bảo trì nào phù hợp với &quot;{searchQuery}&quot;
              </p>
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchQuery.trim(), null);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Sử dụng mã &quot;{searchQuery.trim()}&quot;</span>
                  <ArrowUpRight size={12} />
                </button>
              )}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected =
                selectedOption?.code === opt.code ||
                value === opt.code ||
                value === opt.id;

              return (
                <button
                  key={`${opt.type}-${opt.id}-${opt.code}`}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-start justify-between gap-2.5 cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200 text-blue-950 font-medium"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border ${
                          opt.type === "plan"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {opt.code}
                      </span>

                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {opt.type === "plan" ? "Kế hoạch BTR" : "Hợp đồng"}
                      </span>

                      {opt.customerName && (
                        <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[170px]">
                          {opt.customerName}
                        </span>
                      )}
                    </div>

                    {opt.title && (
                      <p className="text-xs font-medium text-slate-800 truncate" title={opt.title}>
                        {opt.title}
                      </p>
                    )}

                    {opt.contractNo && opt.contractNo !== opt.code && (
                      <p className="text-[11px] text-slate-400 truncate">
                        HĐ: {opt.contractNo}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <Check size={14} className="text-blue-600 shrink-0 mt-1" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Quick Footer */}
        <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400 px-3">
          <span>Tổng số: {options.length} mã bảo trì / hợp đồng</span>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Bỏ chọn
            </button>
          )}
        </div>
      </div>
    );

    if (dropdownPosition === "fixed" && mounted && typeof document !== "undefined") {
      return createPortal(dropdownContent, document.body);
    }
    return dropdownContent;
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerBtnRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between text-left transition-all rounded-lg border ${
          isSmall ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-xs sm:text-sm"
        } ${
          disabled
            ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/10 bg-white"
            : value
            ? "border-blue-500/80 bg-white hover:border-blue-500"
            : "border-slate-200 bg-white hover:border-slate-300"
        } shadow-2xs cursor-pointer`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
          {selectedOption?.type === "contract" ? (
            <FileText
              size={isSmall ? 13 : 15}
              className={`shrink-0 ${value ? "text-indigo-600" : "text-slate-400"}`}
            />
          ) : (
            <Wrench
              size={isSmall ? 13 : 15}
              className={`shrink-0 ${value ? "text-amber-600" : "text-slate-400"}`}
            />
          )}

          {selectedOption ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                {selectedOption.code}
              </span>
              <span className="truncate text-slate-800 font-medium">
                {selectedOption.title || selectedOption.customerName}
              </span>
              {selectedOption.customerName && selectedOption.title && (
                <span className="text-[11px] text-slate-400 truncate shrink-0 hidden sm:inline">
                  ({selectedOption.customerName})
                </span>
              )}
            </div>
          ) : value ? (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                {value}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate text-xs">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              title="Xóa lựa chọn"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {renderDropdown()}
    </div>
  );
}
