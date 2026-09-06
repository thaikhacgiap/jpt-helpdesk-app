"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Building2, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { Customer, fetchCustomers } from "@/lib/customer-operations";

export interface CustomerSearchSelectProps {
  value?: string | null;
  valueKey?: "id" | "name" | "code";
  onChange: (value: string, customer?: Customer | null) => void;
  customers?: Customer[];
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

export default function CustomerSearchSelect({
  value = "",
  valueKey = "id",
  onChange,
  customers: propCustomers,
  placeholder = "-- Tìm và chọn khách hàng --",
  allowAll = false,
  allValue = "All",
  allLabel = "Tất cả khách hàng",
  allowClear = true,
  disabled = false,
  required = false,
  className = "",
  size = "md",
  dropdownPosition = "fixed",
}: CustomerSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalCustomers, setInternalCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load customers if not provided via props
  useEffect(() => {
    if (propCustomers && propCustomers.length > 0) {
      setInternalCustomers(propCustomers);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    fetchCustomers()
      .then((data) => {
        if (isMounted) setInternalCustomers(data || []);
      })
      .catch((err) => console.error("Error fetching customers for select:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propCustomers]);

  // Keep internal list in sync if prop changes
  useEffect(() => {
    if (propCustomers) {
      setInternalCustomers(propCustomers);
    }
  }, [propCustomers]);

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

  // Find currently selected customer
  const isAllSelected = allowAll && (value === allValue || value === "All" || value === "");
  const selectedCustomer = useMemo(() => {
    if (isAllSelected || !value) return null;
    return (
      internalCustomers.find((c) => {
        if (valueKey === "id") return c.id === value;
        if (valueKey === "code") return c.code?.toLowerCase() === value.toLowerCase();
        if (valueKey === "name") return c.name?.toLowerCase() === value.toLowerCase();
        return c.id === value || c.name === value || c.code === value;
      }) || null
    );
  }, [internalCustomers, value, valueKey, isAllSelected]);

  // Filter customers by query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return internalCustomers;
    const q = searchQuery.toLowerCase().trim();
    return internalCustomers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.system_code && c.system_code.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.ttkd && c.ttkd.toLowerCase().includes(q)) ||
        (c.phu_trach && c.phu_trach.toLowerCase().includes(q))
    );
  }, [internalCustomers, searchQuery]);

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

  const handleSelect = (cust: Customer | null, isAllOption = false) => {
    if (isAllOption) {
      onChange(allValue, null);
    } else if (cust) {
      const selectedVal =
        valueKey === "name" ? cust.name : valueKey === "code" ? cust.code : cust.id;
      onChange(selectedVal, cust);
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
  } else if (selectedCustomer) {
    displayText = selectedCustomer.name;
  } else if (value) {
    // If value is set but doesn't match any customer in list yet
    displayText = value;
  }

  const isSmall = size === "sm";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form validation if required */}
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
        className={`w-full flex items-center justify-between gap-2 border rounded-xl bg-white text-left transition-all outline-none group ${
          isSmall
            ? "px-3 py-1.5 text-xs h-[34px]"
            : "px-3.5 py-2 text-sm h-[40px]"
        } ${
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/10 shadow-xs"
            : displayText
            ? "border-slate-300 text-slate-800 hover:border-slate-400"
            : "border-slate-200 text-slate-400 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2
            size={isSmall ? 13 : 15}
            className={`shrink-0 transition-colors ${
              displayText ? "text-blue-600" : "text-slate-400"
            }`}
          />
          {displayText ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
              <span className="font-medium text-slate-800 truncate">{displayText}</span>
              {selectedCustomer?.code && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedCustomer.code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate text-xs sm:text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}

          {allowClear && !disabled && (displayText && (!allowAll || !isAllSelected)) && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X size={isSmall ? 12 : 13} />
            </span>
          )}

          <ChevronDown
            size={isSmall ? 13 : 15}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-500" : "group-hover:text-slate-600"
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={
            dropdownPosition === "fixed" && dropdownRect
              ? {
                  position: "fixed",
                  top: dropdownRect.bottom + 4,
                  left: Math.max(8, Math.min(dropdownRect.left, window.innerWidth - dropdownRect.width - 8)),
                  width: Math.max(dropdownRect.width, 280),
                  maxHeight: "340px",
                  zIndex: 9999,
                }
              : {
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  zIndex: 50,
                }
          }
          className="bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, mã, email, SĐT..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400 font-normal transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
            {/* "All" Option if allowed */}
            {allowAll && !searchQuery && (
              <button
                type="button"
                onClick={() => handleSelect(null, true)}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition ${
                  isAllSelected
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                    ALL
                  </div>
                  <span>{allLabel}</span>
                </div>
                {isAllSelected && <Check size={13} className="text-blue-600" />}
              </button>
            )}

            {/* Empty selection option when not allowAll and not required */}
            {!allowAll && !required && !searchQuery && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-50 italic transition"
              >
                -- Không chọn khách hàng --
              </button>
            )}

            {/* Filtered Customer List */}
            {filteredCustomers.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                <Building2 size={24} className="mx-auto mb-1.5 text-slate-300" />
                <p>Không tìm thấy khách hàng phù hợp</p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected =
                  selectedCustomer?.id === c.id ||
                  (valueKey === "code" && c.code === value) ||
                  (valueKey === "name" && c.name === value);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 transition text-xs ${
                      isSelected
                        ? "bg-blue-50/80 text-blue-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Building2 size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 truncate">
                            {c.name}
                          </span>
                          {c.code && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200 shrink-0">
                              {c.code}
                            </span>
                          )}
                        </div>
                        {(c.email || c.phone || c.type || c.ttkd) && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                            {c.type && <span>{c.type}</span>}
                            {c.ttkd && <span>• {c.ttkd}</span>}
                            {c.phone && <span>• {c.phone}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer showing count */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Hiển thị {filteredCustomers.length} khách hàng</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-blue-600 hover:underline font-medium"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
