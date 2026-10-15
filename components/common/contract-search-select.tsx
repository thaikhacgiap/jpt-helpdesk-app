"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, FileText, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { Contract, fetchContracts } from "@/lib/contract-operations";

export interface ContractSearchSelectProps {
  value?: string | null;
  onChange: (value: string, contract?: Contract | null) => void;
  contracts?: Contract[];
  placeholder?: string;
  allowAll?: boolean;
  allValue?: string;
  allLabel?: string;
  allowClear?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: "sm" | "md";
  dropdownPosition?: "fixed" | "absolute";
}

export default function ContractSearchSelect({
  value = "",
  onChange,
  contracts: propContracts,
  placeholder = "-- Tìm và chọn hợp đồng --",
  allowAll = false,
  allValue = "",
  allLabel = "Tất cả hợp đồng",
  allowClear = true,
  disabled = false,
  required = false,
  className = "",
  size = "md",
  dropdownPosition = "fixed",
}: ContractSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalContracts, setInternalContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load contracts if not provided via props
  useEffect(() => {
    if (propContracts && propContracts.length > 0) {
      setInternalContracts(propContracts);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    fetchContracts()
      .then((data) => {
        if (isMounted) setInternalContracts(data || []);
      })
      .catch((err) => console.error("Error fetching contracts for select:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propContracts]);

  // Keep internal list in sync if prop changes
  useEffect(() => {
    if (propContracts) {
      setInternalContracts(propContracts);
    }
  }, [propContracts]);

  // Handle outside click & window resize
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
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

  // Find currently selected contract
  const isAllSelected = allowAll && (!value || value === allValue);
  const selectedContract = useMemo(() => {
    if (isAllSelected || !value) return null;
    const cleanVal = String(value).trim().toLowerCase();
    return (
      internalContracts.find((c) => {
        const no = (c.contract_no || c.code || "").toLowerCase();
        return no === cleanVal || c.id === value;
      }) || null
    );
  }, [internalContracts, value, isAllSelected]);

  // Filter contracts by query
  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return internalContracts;
    const q = searchQuery.toLowerCase().trim();
    return internalContracts.filter(
      (c) =>
        (c.contract_no && c.contract_no.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.service && c.service.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.customer && c.customer.toLowerCase().includes(q)) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(q))
    );
  }, [internalContracts, searchQuery]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && triggerBtnRef.current) {
      setDropdownRect(triggerBtnRef.current.getBoundingClientRect());
    }
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  const handleSelect = (contract: Contract | null, isAllOption = false) => {
    if (isAllOption) {
      onChange(allValue, null);
    } else if (contract) {
      const selectedVal = contract.contract_no || contract.code || "";
      onChange(selectedVal, contract);
    } else {
      onChange("", null);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(allowAll ? allValue : "", null);
    setSearchQuery("");
  };

  // Determine display label
  let displayText = "";
  if (isAllSelected) {
    displayText = allLabel;
  } else if (selectedContract) {
    displayText = selectedContract.contract_no || selectedContract.code || "";
  } else if (value) {
    displayText = value;
  }

  const isSmall = size === "sm";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {required && (
        <input
          type="text"
          value={value || ""}
          required
          tabIndex={-1}
          className="sr-only"
          onChange={() => {}}
        />
      )}

      {/* Main Trigger Button */}
      <button
        ref={triggerBtnRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl bg-white text-left transition-all outline-none group cursor-pointer ${
          isSmall
            ? "px-3 py-1.5 text-xs h-[38px]"
            : "px-3.5 py-2 text-sm h-[42px]"
        } ${
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-teal-500 ring-2 ring-teal-500/10 shadow-xs"
            : displayText
            ? "border-slate-300 text-slate-800 hover:border-slate-400"
            : "border-slate-200 text-slate-400 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText
            size={isSmall ? 13 : 15}
            className={`shrink-0 transition-colors ${
              displayText ? "text-teal-600" : "text-slate-400"
            }`}
          />
          {displayText ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
              <span className="font-medium text-slate-800 truncate">{displayText}</span>
              {selectedContract?.service && (
                <span className="shrink-0 text-xs text-slate-400 truncate hidden sm:inline">
                  ({selectedContract.service})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate text-xs sm:text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}

          {allowClear && !disabled && displayText && (!allowAll || !isAllSelected) && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={
            dropdownPosition === "fixed" && dropdownRect
              ? {
                  position: "fixed",
                  top: `${dropdownRect.bottom + 6}px`,
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
          } bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-80`}
        >
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm số hợp đồng, dịch vụ, khách hàng..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
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
            </div>
          </div>

          {/* List Options */}
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
            {/* Allow All Option */}
            {allowAll && !searchQuery.trim() && (
              <button
                type="button"
                onClick={() => handleSelect(null, true)}
                className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                  isAllSelected
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "hover:bg-slate-50 text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-teal-100/60 text-teal-700 flex items-center justify-center font-bold text-[10px]">
                    All
                  </div>
                  <span>{allLabel}</span>
                </div>
                {isAllSelected && <Check size={14} className="text-teal-600 shrink-0" />}
              </button>
            )}

            {filteredContracts.length === 0 ? (
              <div className="py-6 text-center px-4 text-xs text-slate-400">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-teal-600" />
                    <span>Đang tải danh sách hợp đồng...</span>
                  </div>
                ) : (
                  <span>Không tìm thấy hợp đồng nào phù hợp</span>
                )}
              </div>
            ) : (
              filteredContracts.map((c) => {
                const contractNo = c.contract_no || c.code || "";
                const isSelected = selectedContract?.id === c.id || (contractNo && value === contractNo);

                return (
                  <button
                    key={c.id || contractNo}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-teal-50 border border-teal-200/80 text-teal-950 font-medium"
                        : "hover:bg-slate-50 text-slate-700 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {contractNo}
                        </span>
                        {(c.customer || c.customer_name) && (
                          <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {c.customer || c.customer_name}
                          </span>
                        )}
                      </div>
                      {(c.service || c.description) && (
                        <p className="text-[11px] text-slate-600 truncate" title={c.service || c.description}>
                          {c.service || c.description}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-teal-600 shrink-0 mt-1" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Footer */}
          <div className="p-1.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400 px-3">
            <span>Tổng: {internalContracts.length} hợp đồng</span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-teal-600 hover:underline cursor-pointer"
              >
                Bỏ chọn
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
