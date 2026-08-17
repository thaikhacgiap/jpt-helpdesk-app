"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2, Lock } from "lucide-react";
import { fetchCustomers, deleteCustomer, Customer } from "@/lib/customer-operations";

interface CustomerTableProps {
  onRefresh?: () => void;
  onEdit?: (customer: Customer) => void;
  searchValue?: string;
}

const CustomerTable = forwardRef<any, CustomerTableProps>(({ onRefresh, onEdit, searchValue = "" }, ref) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    loadCustomers,
    getSelectedIds: () => Array.from(selectedIds),
    getAllData: () => customers,
  }));

  useEffect(() => { loadCustomers(); }, []);

  // Filter
  const filtered = customers.filter((c) => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      c.system_code?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.ten_tieng_anh?.toLowerCase().includes(q) ||
      c.phu_trach?.toLowerCase().includes(q) ||
      c.ttkd?.toLowerCase().includes(q)
    );
  });

  // Checkbox logic
  const allChecked = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));
  const someChecked = filtered.some(c => selectedIds.has(c.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Delete single
  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Xóa khách hàng "${customer.name}" (${customer.code})?`)) return;
    setDeletingId(customer.id);
    try {
      const result = await deleteCustomer(customer.code);
      if (result.success) { await loadCustomers(); onRefresh?.(); }
      else alert("Lỗi xóa: " + result.error);
    } catch { alert("Lỗi khi xóa khách hàng."); }
    finally { setDeletingId(null); }
  };

  // Avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const avatarColors = ["bg-teal-500","bg-blue-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-green-500"];
  const getAvatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: 'calc(100vh - 290px)' }}>
      <div className="table-scroll flex-1">
        <table className="w-full text-sm border-separate border-spacing-0">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 w-10 bg-slate-50 border-b border-r border-slate-200">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã HT</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã Khách Hàng</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên Khách Hàng (Tên Hiển Thị)</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên Tiếng Anh</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">TTKD</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Người Phụ Trách</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ghi chú</th>
              <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-50 border-b border-slate-200">Thao tác</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 text-sm">Đang tải danh sách khách hàng...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl">🏢</div>
                    <p className="text-slate-500 text-sm">
                      {searchValue ? "Không tìm thấy khách hàng phù hợp." : "Chưa có dữ liệu khách hàng."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((customer, index) => (
                <tr
                  key={customer.id || index}
                  className={`border-b border-slate-100 divide-x divide-slate-100 hover:bg-blue-50/30 transition-colors duration-150 ${selectedIds.has(customer.id) ? "bg-blue-50/50" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleOne(customer.id)}
                    />
                  </td>

                  {/* Mã HT (KH-001) */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 font-mono">
                      {customer.system_code || `KH-${String(index + 1).padStart(3, '0')}`}
                    </span>
                  </td>

                  {/* Mã KH */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Lock size={12} className="text-slate-400 shrink-0" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono">
                        {customer.code}
                      </span>
                    </div>
                  </td>

                  {/* Tên KH */}
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-800 whitespace-nowrap">{customer.name}</span>
                  </td>

                  {/* Tên Tiếng Anh */}
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {customer.ten_tieng_anh ? (
                      <span className="italic text-slate-700">{customer.ten_tieng_anh}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* TTKD */}
                  <td className="px-4 py-3.5">
                    {customer.ttkd ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-200">
                        {customer.ttkd}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Người phụ trách */}
                  <td className="px-4 py-3.5">
                    {customer.phu_trach ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${getAvatarColor(customer.phu_trach)}`}>
                          {getInitials(customer.phu_trach)}
                        </div>
                        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{customer.phu_trach}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Ghi chú */}
                  <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[140px]">
                    <span className="truncate block" title={customer.ghi_chu || ""}>{customer.ghi_chu || "—"}</span>
                  </td>

                  {/* Thao tác */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit?.(customer)}
                        title="Chỉnh sửa TTKD & Người phụ trách"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        disabled={deletingId === customer.id}
                        title="Xóa"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                      >
                        {deletingId === customer.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Hiển thị {filtered.length} / {customers.length} khách hàng</span>
          {selectedIds.size > 0 && (
            <span className="text-blue-600 font-medium">Đã chọn {selectedIds.size} khách hàng</span>
          )}
        </div>
      )}
    </div>
  );
});

CustomerTable.displayName = "CustomerTable";
export default CustomerTable;