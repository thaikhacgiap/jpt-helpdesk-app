"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, User, ChevronDown, Check, X, Users, Loader2 } from "lucide-react";
import { NhanSu, fetchNhanSu } from "@/lib/nhan-su-operations";

export interface StaffSearchSelectProps {
  value?: string | string[] | null;
  valueKey?: "name" | "id" | "email";
  mode?: "single" | "multiple";
  outputFormat?: "auto" | "string" | "array"; // For multiple mode: output string ("A, B") or string[] (["A", "B"])
  onChange: (value: any, staff?: NhanSu | NhanSu[] | null) => void;
  staffList?: NhanSu[];
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: "sm" | "md";
  dropdownPosition?: "fixed" | "absolute";
  colorClass?: string;
}

export default function StaffSearchSelect({
  value = "",
  valueKey = "name",
  mode = "single",
  outputFormat = "auto",
  onChange,
  staffList: propStaffList,
  placeholder,
  allowClear = true,
  disabled = false,
  required = false,
  className = "",
  size = "md",
  dropdownPosition = "fixed",
  colorClass,
}: StaffSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalStaffList, setInternalStaffList] = useState<NhanSu[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = mode === "multiple" ? "-- Chọn người theo dõi --" : "-- Chọn nhân sự --";
  const effectivePlaceholder = placeholder || defaultPlaceholder;

  // Load staff list if not provided via props
  useEffect(() => {
    if (propStaffList && propStaffList.length > 0) {
      setInternalStaffList(propStaffList);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    fetchNhanSu()
      .then((data) => {
        if (isMounted) setInternalStaffList(data || []);
      })
      .catch((err) => console.error("Error fetching staff list for select:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propStaffList]);

  // Keep internal list in sync if prop changes
  useEffect(() => {
    if (propStaffList) {
      setInternalStaffList(propStaffList);
    }
  }, [propStaffList]);

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (triggerBtnRef.current) {
        setDropdownRect(triggerBtnRef.current.getBoundingClientRect());
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Parse current selected items based on mode
  const selectedValues: string[] = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === "string") {
      if (mode === "multiple") {
        // Can be comma-separated string
        return value.split(",").map(v => v.trim()).filter(Boolean);
      }
      return [value.trim()];
    }
    return [];
  }, [value, mode]);

  // Helper to extract key from staff
  const getStaffKey = (s: NhanSu): string => {
    if (valueKey === "id") return s.id;
    if (valueKey === "email") return s.email || s.ten_nhan_su;
    return s.ten_nhan_su;
  };

  // Find staff objects corresponding to selected values
  const selectedStaffObjects = useMemo(() => {
    if (selectedValues.length === 0) return [];
    return internalStaffList.filter(s => {
      const k = getStaffKey(s);
      return selectedValues.includes(k) || selectedValues.includes(s.ten_nhan_su) || selectedValues.includes(s.id);
    });
  }, [selectedValues, internalStaffList, valueKey]);

  // Filter staff by search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return internalStaffList;
    const q = searchQuery.toLowerCase().trim();
    return internalStaffList.filter((s) => {
      const name = (s.ten_nhan_su || "").toLowerCase();
      const code = (s.ma_nhan_su || "").toLowerCase();
      const dept = (s.bo_phan || "").toLowerCase();
      const role = (s.chuc_vu || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        dept.includes(q) ||
        role.includes(q) ||
        email.includes(q)
      );
    });
  }, [internalStaffList, searchQuery]);

  // Single select click handler
  const handleSelectSingle = (staff: NhanSu) => {
    const k = getStaffKey(staff);
    onChange(k, staff);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Multi select toggle handler
  const handleToggleMultiple = (staff: NhanSu) => {
    const k = getStaffKey(staff);
    let nextValues: string[];
    if (selectedValues.includes(k)) {
      nextValues = selectedValues.filter(v => v !== k && v !== staff.ten_nhan_su && v !== staff.id);
    } else {
      nextValues = [...selectedValues, k];
    }

    const nextStaffList = internalStaffList.filter(s => nextValues.includes(getStaffKey(s)));

    const shouldReturnString = outputFormat === "string" || (outputFormat === "auto" && typeof value === "string");
    if (shouldReturnString) {
      onChange(nextValues.join(", "), nextStaffList);
    } else {
      onChange(nextValues, nextStaffList);
    }
  };

  // Clear all handler
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shouldReturnString = outputFormat === "string" || (outputFormat === "auto" && typeof value === "string");
    if (mode === "multiple") {
      onChange(shouldReturnString ? "" : [], []);
    } else {
      onChange("", null);
    }
    setIsOpen(false);
  };

  // Select all handler (for multi-select)
  const handleSelectAll = () => {
    const allKeys = filteredStaff.map(s => getStaffKey(s));
    const combined = Array.from(new Set([...selectedValues, ...allKeys]));
    const nextStaffList = internalStaffList.filter(s => combined.includes(getStaffKey(s)));
    const shouldReturnString = outputFormat === "string" || (outputFormat === "auto" && typeof value === "string");
    if (shouldReturnString) {
      onChange(combined.join(", "), nextStaffList);
    } else {
      onChange(combined, nextStaffList);
    }
  };

  // Deselect all handler
  const handleDeselectAll = () => {
    const shouldReturnString = outputFormat === "string" || (outputFormat === "auto" && typeof value === "string");
    if (shouldReturnString) {
      onChange("", []);
    } else {
      onChange([], []);
    }
  };

  // Remove single tag in multi mode
  const handleRemoveTag = (k: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextValues = selectedValues.filter(v => v !== k);
    const nextStaffList = internalStaffList.filter(s => nextValues.includes(getStaffKey(s)));
    const shouldReturnString = outputFormat === "string" || (outputFormat === "auto" && typeof value === "string");
    if (shouldReturnString) {
      onChange(nextValues.join(", "), nextStaffList);
    } else {
      onChange(nextValues, nextStaffList);
    }
  };

  // Compute label text to display in trigger button
  const renderTriggerContent = () => {
    if (selectedValues.length === 0) {
      return (
        <span className="text-slate-400 font-normal truncate block">
          {effectivePlaceholder}
        </span>
      );
    }

    if (mode === "single") {
      const selected = selectedStaffObjects[0];
      const displayName = selected ? selected.ten_nhan_su : selectedValues[0];
      const dept = selected?.bo_phan || selected?.chuc_vu;

      return (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
            {displayName}
          </span>
          {dept && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium shrink-0 max-w-[130px] truncate">
              {dept}
            </span>
          )}
        </div>
      );
    }

    // Multiple mode display
    const count = selectedValues.length;
    return (
      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 py-0.5">
        <Users size={14} className="text-blue-500 shrink-0" />
        <span className="font-semibold text-slate-800 text-xs truncate">
          {count} người đã chọn:
        </span>
        <span className="text-xs text-slate-600 truncate max-w-[280px]">
          {selectedValues.slice(0, 2).join(", ")}
          {count > 2 && ` (+${count - 2})`}
        </span>
      </div>
    );
  };

  const isSelected = (staff: NhanSu) => {
    const k = getStaffKey(staff);
    return selectedValues.includes(k) || selectedValues.includes(staff.ten_nhan_su) || selectedValues.includes(staff.id);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML5 form validation */}
      {required && (
        <input
          type="text"
          value={selectedValues.join(",")}
          onChange={() => {}}
          required
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerBtnRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full flex items-center justify-between text-left border rounded-xl transition duration-150 outline-none select-none ${
          size === "sm" ? "px-2.5 py-1.5 text-xs min-h-[34px]" : "px-3 py-2 text-xs sm:text-sm min-h-[40px]"
        } ${
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 bg-white"
            : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-1.5 overflow-hidden">
          {mode === "single" && selectedValues.length === 0 && (
            <User size={14} className="text-slate-400 shrink-0" />
          )}
          {renderTriggerContent()}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {allowClear && selectedValues.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-500" : ""
            }`}
          />
        </div>
      </button>

      {/* Selected tags badges for multiple mode */}
      {mode === "multiple" && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedValues.map((k) => {
            const matched = internalStaffList.find(s => getStaffKey(s) === k || s.ten_nhan_su === k || s.id === k);
            const label = matched ? matched.ten_nhan_su : k;
            return (
              <span
                key={k}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-2xs ${
                  colorClass || "bg-blue-50 text-blue-700 border border-blue-200/80"
                }`}
              >
                <span>{label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(k, e)}
                    className="hover:opacity-75 rounded-full p-0.5 ml-0.5 cursor-pointer"
                    title={`Bỏ ${label}`}
                  >
                    <X size={11} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          style={
            dropdownPosition === "fixed" && dropdownRect
              ? {
                  position: "fixed",
                  top: dropdownRect.bottom + 4,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                  zIndex: 9999,
                }
              : {}
          }
          className={`${
            dropdownPosition === "fixed"
              ? ""
              : "absolute left-0 right-0 top-full mt-1.5 z-50"
          } bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-3 text-slate-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, mã NV, phòng ban, chức vụ..."
                className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Multiple Mode Controls (Select All / Clear All) */}
            {mode === "multiple" && (
              <div className="flex items-center justify-between px-1 pt-2 text-[11px] text-slate-500">
                <span>{filteredStaff.length} nhân sự phù hợp</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Staff List */}
          <div className="overflow-y-auto flex-1 p-1 max-h-56 divide-y divide-slate-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span>Đang tải danh sách nhân sự...</span>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {searchQuery
                  ? `Không tìm thấy nhân sự phù hợp với "${searchQuery}"`
                  : "Chưa có dữ liệu nhân sự"}
              </div>
            ) : (
              filteredStaff.map((staff) => {
                const checked = isSelected(staff);
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      if (mode === "multiple") {
                        handleToggleMultiple(staff);
                      } else {
                        handleSelectSingle(staff);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 transition text-xs sm:text-sm cursor-pointer ${
                      checked
                        ? "bg-blue-50/70 text-blue-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {mode === "multiple" ? (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}} // handled by parent button click
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 pointer-events-none w-3.5 h-3.5"
                        />
                      ) : (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            checked
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {staff.ten_nhan_su.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-slate-800">
                            {staff.ten_nhan_su}
                          </span>
                          {staff.ma_nhan_su && (
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {staff.ma_nhan_su}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          {staff.bo_phan && <span>{staff.bo_phan}</span>}
                          {staff.bo_phan && staff.chuc_vu && <span>·</span>}
                          {staff.chuc_vu && <span>{staff.chuc_vu}</span>}
                          {staff.email && (
                            <span className="text-slate-400 font-normal">
                              ({staff.email})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {mode === "single" && checked && (
                      <Check size={15} className="text-blue-600 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
