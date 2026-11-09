"use client";

import React, { useState } from "react";
import {
  X, GripVertical, ArrowUp, ArrowDown, RotateCcw, Check, Plus, Trash2,
  SlidersHorizontal, Layout, Eye, EyeOff, Search, Save, Sparkles, CheckCircle2
} from "lucide-react";

export interface MaintenanceColumnTemplate {
  id: string;
  name: string;
  isSystem?: boolean;
  order: string[];
  visible: Record<string, boolean>;
  widths: Record<string, number>;
  createdAt?: string;
}

export const MAINTENANCE_COLUMN_ORDER: string[] = [
  "id",
  "customer",
  "customer_short",
  "contract",
  "notes",
  "creator",
  "created_at",
  "hold_time",
  "status",
  "progress",
];

export const MAINTENANCE_COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  customer: "Tên khách hàng",
  customer_short: "Tên KH Viết tắt",
  contract: "Tên hợp đồng",
  notes: "Ghi chú",
  creator: "Người tạo",
  created_at: "Thời gian tạo",
  hold_time: "Tổng kỳ",
  status: "Tình trạng",
  progress: "Tiến độ",
};

export const DEFAULT_MAINTENANCE_COL_WIDTHS: Record<string, number> = {
  id: 145,
  customer: 230,
  customer_short: 130,
  contract: 200,
  notes: 180,
  creator: 150,
  created_at: 150,
  hold_time: 85,
  status: 120,
  progress: 150,
  actions: 85,
};

export const MIN_MAINTENANCE_COL_WIDTHS: Record<string, number> = {
  id: 45,
  customer: 45,
  customer_short: 40,
  contract: 45,
  notes: 45,
  creator: 45,
  created_at: 45,
  hold_time: 35,
  status: 45,
  progress: 45,
  actions: 55,
};

export const MAINTENANCE_SYSTEM_TEMPLATES: MaintenanceColumnTemplate[] = [
  {
    id: "default",
    name: "Mặc định (Tất cả cột)",
    isSystem: true,
    order: [...MAINTENANCE_COLUMN_ORDER],
    visible: MAINTENANCE_COLUMN_ORDER.reduce((acc, k) => ({ ...acc, [k]: true }), {}),
    widths: { ...DEFAULT_MAINTENANCE_COL_WIDTHS },
  },
  {
    id: "compact",
    name: "Thu gọn (Cơ bản)",
    isSystem: true,
    order: ["id", "customer_short", "customer", "hold_time", "status", "progress"],
    visible: {
      id: true,
      customer: true,
      customer_short: true,
      contract: false,
      notes: false,
      creator: false,
      created_at: false,
      hold_time: true,
      status: true,
      progress: true,
    },
    widths: { ...DEFAULT_MAINTENANCE_COL_WIDTHS },
  },
  {
    id: "contract_notes",
    name: "Theo dõi Hợp đồng & Ghi chú",
    isSystem: true,
    order: ["id", "customer_short", "customer", "contract", "notes", "status", "progress"],
    visible: {
      id: true,
      customer: true,
      customer_short: true,
      contract: true,
      notes: true,
      creator: false,
      created_at: false,
      hold_time: false,
      status: true,
      progress: true,
    },
    widths: { ...DEFAULT_MAINTENANCE_COL_WIDTHS },
  },
  {
    id: "progress_cycles",
    name: "Theo dõi Tiến độ & Kỳ",
    isSystem: true,
    order: ["id", "customer_short", "hold_time", "progress", "status", "creator", "created_at"],
    visible: {
      id: true,
      customer: false,
      customer_short: true,
      contract: false,
      notes: false,
      creator: true,
      created_at: true,
      hold_time: true,
      status: true,
      progress: true,
    },
    widths: { ...DEFAULT_MAINTENANCE_COL_WIDTHS },
  },
];

interface MaintenanceColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: (vis: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  colWidths: Record<string, number>;
  setColWidths: (widths: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  templates: MaintenanceColumnTemplate[];
  activeTemplateId: string;
  onApplyTemplate: (template: MaintenanceColumnTemplate) => void;
  onSaveNewTemplate: (name: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onResetDefault: () => void;
}

export default function MaintenanceColumnConfigModal({
  isOpen,
  onClose,
  columnOrder,
  setColumnOrder,
  visibleColumns,
  setVisibleColumns,
  colWidths,
  setColWidths,
  templates,
  activeTemplateId,
  onApplyTemplate,
  onSaveNewTemplate,
  onDeleteTemplate,
  onResetDefault,
}: MaintenanceColumnConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"columns" | "templates">("columns");
  const [searchTerm, setSearchTerm] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  // Move column up / down
  const moveColumn = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) return;
    const newOrder = [...columnOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setColumnOrder(newOrder);
  };

  // Toggle single column visibility
  const toggleVisibility = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Quick actions
  const showAllColumns = () => {
    const allVis = columnOrder.reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setVisibleColumns(allVis);
  };

  const hideOptionalColumns = () => {
    // Keep id, customer_short, customer visible
    const newVis = columnOrder.reduce((acc, k) => ({
      ...acc,
      [k]: k === "id" || k === "customer_short" || k === "customer",
    }), {});
    setVisibleColumns(newVis);
  };

  // Drag and drop in list
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newOrder = [...columnOrder];
    const [moved] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(idx, 0, moved);
    setColumnOrder(newOrder);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Width change
  const handleWidthChange = (key: string, width: number) => {
    const minW = MIN_MAINTENANCE_COL_WIDTHS[key] || 40;
    const safeWidth = Math.max(minW, Math.min(600, width));
    setColWidths((prev) => ({
      ...prev,
      [key]: safeWidth,
    }));
  };

  const filteredOrder = columnOrder
    .map((key, index) => ({ key, index }))
    .filter(({ key }) => {
      const label = MAINTENANCE_COLUMN_LABELS[key] || key;
      const term = searchTerm.toLowerCase().trim();
      return !term || label.toLowerCase().includes(term) || key.toLowerCase().includes(term);
    });

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Cấu hình Cột & Mẫu hiển thị (Template)</h2>
              <p className="text-xs text-slate-500">Tùy biến vị trí cột, ẩn/hiện, độ rộng và lưu mẫu giao diện kế hoạch bảo trì</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("columns")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x -mb-px cursor-pointer ${
              activeTab === "columns"
                ? "bg-white text-blue-700 border-t-2 border-t-blue-600 border-x-slate-200 border-b-white shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Thứ tự & Ẩn/Hiện cột</span>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {visibleCount}/{columnOrder.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x -mb-px cursor-pointer ${
              activeTab === "templates"
                ? "bg-white text-blue-700 border-t-2 border-t-blue-600 border-x-slate-200 border-b-white shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Layout size={14} />
            <span>Mẫu giao diện (Templates)</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {templates.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Columns List */}
        {activeTab === "columns" && (
          <div className="flex-1 flex flex-col min-h-0 p-6 space-y-4 overflow-hidden">
            {/* Toolbar: Search & Quick actions */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Tìm tên cột..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={showAllColumns}
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                >
                  Hiện tất cả
                </button>
                <button
                  type="button"
                  onClick={hideOptionalColumns}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  Thu gọn
                </button>
                <button
                  type="button"
                  onClick={onResetDefault}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                  title="Trả thứ tự, độ rộng và hiển thị về mặc định"
                >
                  <RotateCcw size={12} />
                  <span>Mặc định</span>
                </button>
              </div>
            </div>

            {/* List with drag & drop */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/40 divide-y divide-slate-100">
              {filteredOrder.map(({ key, index }) => {
                const label = MAINTENANCE_COLUMN_LABELS[key] || key;
                const isVisible = !!visibleColumns[key];
                const width = colWidths[key] || DEFAULT_MAINTENANCE_COL_WIDTHS[key] || 120;
                const isDragging = draggedIdx === index;
                const isDragOver = dragOverIdx === index;

                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white border transition shadow-2xs ${
                      isDragging ? "opacity-40 border-blue-500" : "border-slate-200/80"
                    } ${isDragOver ? "border-blue-500 bg-blue-50/50" : "hover:border-slate-300"}`}
                  >
                    {/* Left: Drag handle & Checkbox */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5" title="Kéo để đổi thứ tự cột">
                        <GripVertical size={14} />
                      </div>
                      
                      <span className="text-[11px] font-mono text-slate-400 w-5 text-right">{index + 1}</span>

                      <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleVisibility(key)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                        />
                        <span className={`text-xs truncate ${isVisible ? "font-semibold text-slate-800" : "text-slate-400 line-through"}`}>
                          {label}
                        </span>
                      </label>
                    </div>

                    {/* Right: Width input & Up/Down reorder buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Width display & manual input */}
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5" title="Độ rộng cột (px)">
                        <input
                          type="number"
                          value={width}
                          min={MIN_MAINTENANCE_COL_WIDTHS[key] || 40}
                          max={600}
                          step={5}
                          onChange={(e) => handleWidthChange(key, parseInt(e.target.value, 10) || 40)}
                          className="w-12 text-right bg-transparent text-[11px] font-mono font-medium text-slate-700 outline-none"
                        />
                        <span className="text-[10px] text-slate-400">px</span>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => moveColumn(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-blue-700 disabled:opacity-20 disabled:hover:text-slate-400 transition rounded hover:bg-slate-100 cursor-pointer"
                          title="Di chuyển lên trên"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveColumn(index, "down")}
                          disabled={index === columnOrder.length - 1}
                          className="p-1 text-slate-400 hover:text-blue-700 disabled:opacity-20 disabled:hover:text-slate-400 transition rounded hover:bg-slate-100 cursor-pointer"
                          title="Di chuyển xuống dưới"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 italic">
              * Mẹo: Bạn có thể kéo thả trực tiếp tiêu đề cột trên bảng để thay đổi vị trí, hoặc kéo mép phải cột để chỉnh kích cỡ.
            </div>
          </div>
        )}

        {/* Tab 2: Templates Management */}
        {activeTab === "templates" && (
          <div className="flex-1 flex flex-col min-h-0 p-6 space-y-4 overflow-y-auto">
            {/* Create New Template Section */}
            <div className="p-4 bg-gradient-to-r from-blue-50/50 to-slate-50 border border-blue-200/60 rounded-xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles size={14} className="text-blue-600" />
                <span>Lưu cấu hình hiện tại thành Template mới</span>
              </div>
              <p className="text-xs text-slate-500">
                Lưu lại trạng thái hiện tại (vị trí {columnOrder.length} cột, ẩn/hiện, độ rộng) để dùng lại bất kỳ lúc nào.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập tên mẫu (ví dụ: Xem nhanh Hợp đồng, Báo cáo Tổng thể...)"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTemplateName.trim()) {
                      onSaveNewTemplate(newTemplateName.trim());
                      setNewTemplateName("");
                    }
                  }}
                  className="flex-1 h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTemplateName.trim()) return;
                    onSaveNewTemplate(newTemplateName.trim());
                    setNewTemplateName("");
                  }}
                  disabled={!newTemplateName.trim()}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Save size={13} />
                  <span>Lưu Template</span>
                </button>
              </div>
            </div>

            {/* List of Templates */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Danh sách Mẫu Template ({templates.length})
              </span>
              <div className="space-y-2">
                {templates.map((tpl) => {
                  const isActive = activeTemplateId === tpl.id;
                  const visColCount = Object.values(tpl.visible).filter(Boolean).length;

                  return (
                    <div
                      key={tpl.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        isActive
                          ? "bg-blue-50/40 border-blue-500 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{tpl.name}</span>
                          {tpl.isSystem ? (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                              Hệ thống
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                              Tùy chỉnh
                            </span>
                          )}
                          {isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                              <CheckCircle2 size={11} />
                              Đang áp dụng
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Hiển thị {visColCount} cột • Thứ tự tùy biến • Độ rộng riêng biệt
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => onApplyTemplate(tpl)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition cursor-pointer shadow-2xs"
                          >
                            Áp dụng
                          </button>
                        )}
                        {!tpl.isSystem && (
                          <button
                            type="button"
                            onClick={() => onDeleteTemplate(tpl.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Xóa template"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <RotateCcw size={13} className="text-slate-400" />
            <span>Trả về mặc định ban đầu</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

