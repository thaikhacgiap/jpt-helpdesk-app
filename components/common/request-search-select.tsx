"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Inbox, ChevronDown, Check, X, Loader2, Tag, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchRequests, RequestTask } from "@/lib/request-operations";
import { fetchCustomers, Customer } from "@/lib/customer-operations";

export interface RequestOption {
  id: string;
  code: string;
  title: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  priority?: string;
  category?: string;
  ttType?: string;
  status?: string;
  source: "customer" | "internal";
}

export interface RequestSearchSelectProps {
  value?: string | null;
  onChange: (code: string, request?: RequestOption | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: "sm" | "md";
  dropdownPosition?: "fixed" | "absolute";
}

export async function fetchAllAvailableRequests(): Promise<RequestOption[]> {
  const options: RequestOption[] = [];
  const seenCodes = new Set<string>();

  // 1. Fetch from Supabase tickets (Customer portal & service requests)
  try {
    const { data: portalTickets, error } = await supabase
      .from("tickets")
      .select("id, ticket_id, title, description, customer_id, customer_name, priority, category, tt_type, tt_status")
      .or("ticket_id.ilike.CR-%,ticket_id.ilike.TH-%,ticket_id.ilike.SR-%,ticket_id.ilike.TR-%")
      .order("created_at", { ascending: false });

    if (!error && portalTickets) {
      portalTickets.forEach((t) => {
        const displayCode = t.ticket_id.replace(/^TH-/, "CR-");
        if (!seenCodes.has(displayCode.toUpperCase())) {
          seenCodes.add(displayCode.toUpperCase());
          options.push({
            id: t.id,
            code: displayCode,
            title: t.title || "Yêu cầu dịch vụ",
            description: t.description,
            customerId: t.customer_id,
            customerName: t.customer_name,
            priority: t.priority,
            category: t.category,
            ttType: t.tt_type || "Yêu cầu dịch vụ",
            status: t.tt_status || "New",
            source: "customer",
          });
        }
      });
    }
  } catch (err) {
    console.error("Error fetching portal requests:", err);
  }

  // 2. Fetch from LocalStorage / Internal requests
  try {
    const internalList = fetchRequests();
    internalList.forEach((r) => {
      const code = r.code || r.id;
      if (!seenCodes.has(code.toUpperCase())) {
        seenCodes.add(code.toUpperCase());
        options.push({
          id: r.id,
          code: code,
          title: r.title,
          description: r.description,
          priority: "L3(Minor)",
          ttType: r.type,
          status: r.status,
          source: "internal",
        });
      }
    });
  } catch (err) {
    console.error("Error fetching internal requests:", err);
  }

  return options;
}

export default function RequestSearchSelect({
  value = "",
  onChange,
  placeholder = "-- Tìm và chọn mã yêu cầu (CR / SR / TR) --",
  allowClear = true,
  disabled = false,
  required = false,
  className = "",
  size = "md",
  dropdownPosition = "fixed",
}: RequestSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<RequestOption[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([fetchAllAvailableRequests(), fetchCustomers()])
      .then(([reqData, custList]) => {
        if (!isMounted) return;
        setCustomers(custList || []);
        
        // Enrich customer names if missing
        const enriched = reqData.map((r) => {
          if (!r.customerName && r.customerId) {
            const foundCust = (custList || []).find((c) => c.id === r.customerId);
            if (foundCust) {
              return { ...r, customerName: foundCust.name };
            }
          }
          return r;
        });

        setRequests(enriched);
      })
      .catch((err) => console.error("Error loading requests:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Update rect when opening
  useEffect(() => {
    if (isOpen && triggerBtnRef.current) {
      setDropdownRect(triggerBtnRef.current.getBoundingClientRect());
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Find currently selected request
  const selectedRequest = useMemo(() => {
    if (!value) return null;
    const cleanVal = String(value).trim().toUpperCase();
    return requests.find(
      (r) =>
        r.code.toUpperCase() === cleanVal ||
        r.id.toUpperCase() === cleanVal ||
        r.code.replace(/^CR-/, "TH-").toUpperCase() === cleanVal ||
        r.code.replace(/^TH-/, "CR-").toUpperCase() === cleanVal
    ) || null;
  }, [value, requests]);

  // Filter requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      return (
        r.code.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.ttType && r.ttType.toLowerCase().includes(q))
      );
    });
  }, [requests, searchQuery]);

  const handleSelect = (req: RequestOption) => {
    onChange(req.code, req);
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
      const existing = requests.find(
        (r) => r.code.toLowerCase() === code.toLowerCase()
      );
      onChange(existing ? existing.code : code, existing || null);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const isSmall = size === "sm";

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
        className={`w-full flex items-center justify-between text-left transition-all rounded-xl border ${
          isSmall
            ? "h-9 px-3 text-xs"
            : "h-11 px-3.5 text-sm"
        } ${
          disabled
            ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-teal-500 ring-2 ring-teal-500/10 bg-white"
            : value
            ? "border-teal-500/80 bg-white hover:border-teal-500"
            : "border-slate-200 bg-white hover:border-slate-300"
        } shadow-2xs cursor-pointer`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
          <Inbox
            size={isSmall ? 13 : 15}
            className={`shrink-0 ${
              value ? "text-teal-600" : "text-slate-400"
            }`}
          />
          {selectedRequest ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60 shrink-0">
                {selectedRequest.code}
              </span>
              <span className="truncate text-slate-800 font-medium">
                {selectedRequest.title}
              </span>
              {selectedRequest.customerName && (
                <span className="text-[11px] text-slate-400 truncate shrink-0 hidden sm:inline">
                  ({selectedRequest.customerName})
                </span>
              )}
            </div>
          ) : value ? (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                {value}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={
            dropdownPosition === "fixed" && dropdownRect
              ? {
                  position: "fixed",
                  top: `${dropdownRect.bottom + 6}px`,
                  left: `${dropdownRect.left}px`,
                  width: `${Math.max(dropdownRect.width, 340)}px`,
                  zIndex: 999999,
                }
              : undefined
          }
          className={`${
            dropdownPosition === "absolute"
              ? "absolute top-full left-0 right-0 mt-1.5 z-50 min-w-[320px]"
              : ""
          } bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-80`}
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
                placeholder="Tìm mã (CR-, SR-, TR-), tiêu đề, khách hàng..."
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
            </form>
          </div>

          {/* Request List */}
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 size={18} className="animate-spin text-teal-600" />
                <span className="text-xs">Đang tải danh sách yêu cầu...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-5 text-center px-4">
                <p className="text-xs text-slate-500">
                  Không tìm thấy yêu cầu nào phù hợp với &quot;{searchQuery}&quot;
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(searchQuery.trim(), null);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className="mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/60 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sử dụng mã &quot;{searchQuery.trim()}&quot;</span>
                    <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected =
                  selectedRequest?.code === req.code ||
                  value === req.code ||
                  value === req.id;

                return (
                  <button
                    key={req.id || req.code}
                    type="button"
                    onClick={() => handleSelect(req)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-start justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? "bg-teal-50/80 border border-teal-200/80 text-teal-950 font-medium"
                        : "hover:bg-slate-50 text-slate-700 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border ${
                            req.code.startsWith("CR-") || req.code.startsWith("TH-")
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : req.code.startsWith("SR-")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          {req.code}
                        </span>

                        {req.customerName && (
                          <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[140px]">
                            {req.customerName}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {req.ttType || (req.source === "customer" ? "Portal" : "Nội bộ")}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-800 truncate" title={req.title}>
                        {req.title}
                      </p>

                      {req.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 truncate">
                          {req.description}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-teal-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Footer */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400 px-3">
            <span>Tổng số: {requests.length} yêu cầu</span>
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
