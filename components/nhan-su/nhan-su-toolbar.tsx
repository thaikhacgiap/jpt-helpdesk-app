"use client";

import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";

interface NhanSuToolbarProps {
  onNewClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function NhanSuToolbar({ onNewClick, searchValue, onSearchChange }: NhanSuToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* New Nhân Sự */}
        <button
          onClick={onNewClick}
          id="btn-new-nhan-su"
          className="h-10 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={16} />
          Thêm nhân sự
        </button>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            id="search-nhan-su"
            placeholder="Tìm kiếm nhân sự..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Filter */}
        <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium flex items-center gap-2 transition shadow-sm">
          <Filter size={15} />
          Lọc
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-2 transition shadow-sm">
          <Upload size={15} />
          Import
        </button>

        <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-2 transition shadow-sm">
          <Download size={15} />
          Export
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}
