"use client";

import React, { useState } from "react";
import {
  X, GripVertical, ArrowUp, ArrowDown, RotateCcw, Check, Plus, Trash2,
  SlidersHorizontal, Layout, Eye, EyeOff, Search, Save, Sparkles, CheckCircle2
} from "lucide-react";

export interface ColumnTemplate {
  id: string;
  name: string;
  isSystem?: boolean;
  order: string[];
  visible: Record<string, boolean>;
  widths: Record<string, number>;
  createdAt?: string;
}

export const DEFAULT_COLUMN_ORDER: string[] = [
  "ticket_id",
  "request_code",
  "title",
  "customer_name",
  "creator_name",
  "created_at",
  "start_time",
  "resolve_time",
  "duration",
  "paused_time",
  "resumed_time",
  "pause_duration",
  "work_duration",
  "sla_time",
  "contract_no",
  "tt_type",
  "contract_scope",
  "category",
  "priority",
  "tt_status",
  "sla_status",
  "assigned",
  "updated_at",
];

export const COLUMN_LABELS: Record<string, string> = {
  ticket_id: "Ticket ID",
  request_code: "Mã yêu cầu",
  title: "Tiêu đề",
  customer_name: "Khách hàng",
  creator_name: "Người tạo",
  created_at: "Thời gian tạo",
  start_time: "Start time",
  resolve_time: "Resolve time",
  duration: "Duration",
  paused_time: "Paused time",
  resumed_time: "Resumed time",
  pause_duration: "Pause duration",
  work_duration: "Work duration",
  sla_time: "SLA time",
  contract_no: "Contract No",
  tt_type: "TT Type",
  contract_scope: "Contract Scope",
  category: "Category",
  priority: "Priority",
  tt_status: "TT Status",
  sla_status: "SLA Status",
  assigned: "Người xử lý",
  updated_at: "Cập nhật",
};

export const DEFAULT_COL_WIDTHS: Record<string, number> = {
  select: 44,
  ticket_id: 155,
  request_code: 160,
  title: 220,
  customer_name: 180,
  creator_name: 140,
  created_at: 145,
  start_time: 145,
  resolve_time: 145,
  duration: 100,
  paused_time: 145,
  resumed_time: 145,
  pause_duration: 125,
  work_duration: 130,
  sla_time: 110,
  contract_no: 130,
  tt_type: 140,
  contract_scope: 130,
  category: 120,
  priority: 120,
  tt_status: 120,
  sla_status: 130,
  assigned: 140,
  updated_at: 120,
  actions: 85,
};

export const SYSTEM_TEMPLATES: ColumnTemplate[] = [
  {
    id: "default",
    name: "Mặc định (Tất cả cột)",
    isSystem: true,
    order: [...DEFAULT_COLUMN_ORDER],
    visible: DEFAULT_COLUMN_ORDER.reduce((acc, k) => ({ ...acc, [k]: true }), {}),
    widths: { ...DEFAULT_COL_WIDTHS },
  },
  {
    id: "sla_time",
    name: "Tập trung SLA & Thời gian",
    isSystem: true,
    order: [
      "ticket_id", "request_code", "title", "customer_name", "start_time",
      "resolve_time", "duration", "work_duration", "sla_time", "sla_status", "tt_status", "assigned"
    ],
    visible: {
      ticket_id: true,
      request_code: true,
      title: true,
      customer_name: true,
      start_time: true,
      resolve_time: true,
      duration: true,
      work_duration: true,
      sla_time: true,
      sla_status: true,
      tt_status: true,
      assigned: true,
    },
    widths: { ...DEFAULT_COL_WIDTHS },
  },
  {
    id: "operations_status",
    name: "Phân loại & Trạng thái",
    isSystem: true,
    order: [
      "ticket_id", "title", "customer_name", "tt_type", "contract_scope",
      "category", "priority", "tt_status", "assigned", "creator_name", "created_at", "updated_at"
    ],
    visible: {
      ticket_id: true,
      title: true,
      customer_name: true,
      tt_type: true,
      contract_scope: true,
      category: true,
      priority: true,
      tt_status: true,
      assigned: true,
      creator_name: true,
      created_at: true,
      updated_at: true,
    },
    widths: { ...DEFAULT_COL_WIDTHS },
  },
  {
    id: "compact",
    name: "Gọn gàng (Cơ bản)",
    isSystem: true,
    order: ["ticket_id", "title", "customer_name", "priority", "tt_status", "sla_status", "assigned"],
    visible: {
      ticket_id: true,
      title: true,
      customer_name: true,
      priority: true,
      tt_status: true,
      sla_status: true,
      assigned: true,
    },
    widths: { ...DEFAULT_COL_WIDTHS },
  }
];

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: (vis: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  colWidths: Record<string, number>;
  setColWidths: (widths: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  templates: ColumnTemplate[];
  activeTemplateId: string;
  onApplyTemplate: (template: ColumnTemplate) => void;
  onSaveNewTemplate: (name: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onResetDefault: () => void;
}

export default function ColumnConfigModal({
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
}: ColumnConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"columns" | "templates">("columns");
  const [searchTerm, setSearchTerm] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  // Move column up
  const moveColumn = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) return;
    const newOrder = [...columnOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setColumnOrder(newOrder);
  };

  // Toggle single column
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
    // Keep ticket_id and title visible
    const newVis = columnOrder.reduce((acc, k) => ({
      ...acc,
      [k]: k === "ticket_id" || k === "title",
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
    const safeWidth = Math.max(50, Math.min(600, width));
    setColWidths((prev) => ({
      ...prev,
      [key]: safeWidth,
    }));
  };

  const filteredOrder = columnOrder.map((key, index) => ({ key, index })).filter(({ key }) => {
    const label = COLUMN_LABELS[key] || key;
    return label.toLowerCase().includes(searchTerm.toLowerCase()) || key.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Cấu hình Cột & Mẫu hiển thị (Template)</h2>
              <p className="text-xs text-slate-500">Tùy biến thứ tự, kích thước (width), ẩn/hiện cột và lưu mẫu giao diện</p>
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
                ? "bg-white text-teal-700 border-t-2 border-t-teal-600 border-x-slate-200 border-b-white shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Thứ tự & Ẩn/Hiện cột</span>
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
              {visibleCount}/{columnOrder.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x -mb-px cursor-pointer ${
              activeTab === "templates"
                ? "bg-white text-teal-700 border-t-2 border-t-teal-600 border-x-slate-200 border-b-white shadow-2xs"
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

        {/* Tab 1: Columns list with reordering, visibility, and widths */}
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
                  className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={showAllColumns}
                  className="px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
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
                const label = COLUMN_LABELS[key] || key;
                const isVisible = !!visibleColumns[key];
                const width = colWidths[key] || DEFAULT_COL_WIDTHS[key] || 120;
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
                      isDragging ? "opacity-40 border-teal-500" : "border-slate-200/80"
                    } ${isDragOver ? "border-teal-500 bg-teal-50/50" : "hover:border-slate-300"}`}
                  >
                    {/* Left: Drag handle & Checkbox */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5">
                        <GripVertical size={14} />
                      </div>
                      
                      <span className="text-[11px] font-mono text-slate-400 w-5 text-right">{index + 1}</span>

                      <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleVisibility(key)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer w-4 h-4"
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
                          min={50}
                          max={600}
                          step={5}
                          onChange={(e) => handleWidthChange(key, parseInt(e.target.value, 10) || 50)}
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
                          className="p-1 text-slate-400 hover:text-teal-700 disabled:opacity-20 disabled:hover:text-slate-400 transition rounded hover:bg-slate-100 cursor-pointer"
                          title="Di chuyển lên trên"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveColumn(index, "down")}
                          disabled={index === columnOrder.length - 1}
                          className="p-1 text-slate-400 hover:text-teal-700 disabled:opacity-20 disabled:hover:text-slate-400 transition rounded hover:bg-slate-100 cursor-pointer"
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
              * Mẹo: Bạn có thể kéo thả trực tiếp tiêu đề cột trên bảng chính để đổi vị trí, hoặc kéo viền phải để chỉnh độ rộng.
            </div>
          </div>
        )}

        {/* Tab 2: Templates Management */}
        {activeTab === "templates" && (
          <div className="flex-1 flex flex-col min-h-0 p-6 space-y-4 overflow-y-auto">
            {/* Create New Template Section */}
            <div className="p-4 bg-gradient-to-r from-teal-50/50 to-slate-50 border border-teal-200/60 rounded-xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <Sparkles size={14} className="text-teal-600" />
                <span>Lưu cấu hình hiện tại thành Template mới</span>
              </div>
              <p className="text-xs text-slate-500">
                Lưu lại trạng thái hiện tại (vị trí {columnOrder.length} cột, ẩn/hiện, độ rộng) để dùng lại bất kỳ lúc nào.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập tên mẫu (ví dụ: Báo cáo Tuần IT, Xem nhanh SLA...)"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTemplateName.trim()) return;
                    onSaveNewTemplate(newTemplateName.trim());
                    setNewTemplateName("");
                  }}
                  disabled={!newTemplateName.trim()}
                  className="h-9 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
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
                          ? "bg-teal-50/40 border-teal-500 shadow-xs"
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
                            <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
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
                            className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-white hover:bg-teal-50 border border-teal-300 rounded-lg transition cursor-pointer shadow-2xs"
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
