"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { fetchCustomers, deleteCustomer, Customer } from "@/lib/customer-operations";

interface CustomerTableProps {
  onRefresh?: () => void;
  onEdit?: (customer: Customer) => void;
  searchValue?: string;
}

const TYPE_COLORS: Record<string, string> = {
  BANK: "bg-blue-50 text-blue-700 border-blue-200",
  GOV: "bg-purple-50 text-purple-700 border-purple-200",
  CORP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SME: "bg-green-50 text-green-700 border-green-200",
  Corporate: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Individual: "bg-pink-50 text-pink-700 border-pink-200",
};

const PHAN_LOAI_COLORS: Record<string, string> = {
  "End User": "bg-blue-50 text-blue-700 border-blue-200",
  "Partner":  "bg-purple-50 text-purple-700 border-purple-200",
  "Reseller": "bg-orange-50 text-orange-700 border-orange-200",
  "Internal": "bg-slate-100 text-slate-600 border-slate-200",
};

const KHU_VUC_COLORS: Record<string, string> = {
  "Bắc": "bg-cyan-50 text-cyan-700",
  "Trung": "bg-amber-50 text-amber-700",
  "Nam": "bg-orange-50 text-orange-700",
};

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
      c.code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.phu_trach?.toLowerCase().includes(q) ||
      c.khu_vuc?.toLowerCase().includes(q) ||
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
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã khách hàng</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên khách hàng</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Phân loại</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Loại DN</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tình trạng</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Khu vực</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Địa chỉ</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Người phụ trách</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">TTKD</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ghi chú</th>
              <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-50 border-b border-slate-200">Thao tác</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 text-sm">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl">🏢</div>
                    <p className="text-slate-500 text-sm">
                      {searchValue ? "Không tìm thấy khách hàng phù hợp." : "Chưa có khách hàng nào."}
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
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleOne(customer.id)}
                    />
                  </td>

                  {/* Mã KH */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono">
                      {customer.code}
                    </span>
                  </td>

                  {/* Tên KH */}
                  <td className="px-4 py-4">
                    <span className="font-medium text-slate-800 whitespace-nowrap">{customer.name}</span>
                  </td>

                  {/* Phân loại */}
                  <td className="px-4 py-4">
                    {customer.phan_loai ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        PHAN_LOAI_COLORS[customer.phan_loai] || "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {customer.phan_loai}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Loại DN */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                      TYPE_COLORS[customer.type || ""] || "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {customer.type || "—"}
                    </span>
                  </td>

                  {/* Tình trạng */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      customer.tinh_trang === "Active" || !customer.tinh_trang
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        customer.tinh_trang === "Active" || !customer.tinh_trang ? "bg-green-500" : "bg-red-400"
                      }`} />
                      {customer.tinh_trang || "Active"}
                    </span>
                  </td>

                  {/* Khu vực */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      KHU_VUC_COLORS[customer.khu_vuc || ""] || "bg-slate-50 text-slate-500"
                    }`}>
                      {customer.khu_vuc || "—"}
                    </span>
                  </td>

                  {/* Địa chỉ */}
                  <td className="px-4 py-4 text-slate-600 text-xs max-w-[140px]">
                    <span className="truncate block" title={customer.address || ""}>{customer.address || "—"}</span>
                  </td>

                  {/* Người phụ trách */}
                  <td className="px-4 py-4">
                    {customer.phu_trach ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(customer.phu_trach)}`}>
                          {getInitials(customer.phu_trach)}
                        </div>
                        <span className="text-sm text-slate-700 whitespace-nowrap">{customer.phu_trach}</span>
                      </div>
                    ) : customer.contact_person ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(customer.contact_person)}`}>
                          {getInitials(customer.contact_person)}
                        </div>
                        <span className="text-sm text-slate-700 whitespace-nowrap">{customer.contact_person}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* TTKD */}
                  <td className="px-4 py-4">
                    <span className="text-xs text-slate-600 font-medium">{customer.ttkd || "—"}</span>
                  </td>

                  {/* Ghi chú */}
                  <td className="px-4 py-4 text-xs text-slate-500 max-w-[120px]">
                    <span className="truncate block" title={customer.ghi_chu || ""}>{customer.ghi_chu || "—"}</span>
                  </td>

                  {/* Thao tác */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit?.(customer)}
                        title="Chỉnh sửa"
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