"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { fetchCustomers, Customer } from "@/lib/customer-operations";
import { Pencil, Lock } from "lucide-react";

interface CustomerTableProps {
  onEdit?: (customer: Customer) => void;
  onRefresh?: () => void;
  searchValue?: string;
}

export interface CustomerTableRef {
  loadCustomers: () => Promise<void>;
  getAllData: () => Customer[];
}

const CustomerTable = forwardRef<CustomerTableRef, CustomerTableProps>(({
  onEdit,
  onRefresh,
  searchValue = "",
}, ref) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Lỗi tải danh sách khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useImperativeHandle(ref, () => ({
    loadCustomers,
    getAllData: () => customers,
  }));

  // Filter
  const filtered = customers.filter(c => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      (c.system_code && c.system_code.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.ten_tieng_anh && c.ten_tieng_anh.toLowerCase().includes(q)) ||
      (c.ttkd && c.ttkd.toLowerCase().includes(q)) ||
      (c.phu_trach && c.phu_trach.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  // Avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const avatarColors = ["bg-teal-500","bg-blue-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-green-500"];
  const getAvatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col flex-1 min-h-0 w-full h-full">
      <div className="table-scroll flex-1 overflow-auto">
        <table className="w-full text-sm border-separate border-spacing-0 table-fixed">
          {/* Header */}
          <thead className="sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr className="text-left text-xs text-slate-600 font-bold tracking-tight">
              <th className="px-3 py-2.5 w-[84px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã HT</th>
              <th className="px-3 py-2.5 w-[130px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã KH</th>
              <th className="px-3 py-2.5 w-[34%] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên Khách Hàng (Tên Hiển Thị)</th>
              <th className="px-3 py-2.5 w-[24%] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên Tiếng Anh</th>
              <th className="px-3 py-2.5 w-[90px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">TTKD</th>
              <th className="px-3 py-2.5 w-[140px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Người Phụ Trách</th>
              <th className="px-3 py-2.5 w-[130px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ghi chú</th>
              <th className="px-2 py-2.5 w-[56px] text-center whitespace-nowrap bg-slate-50 border-b border-slate-200">Thao tác</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 text-sm">Đang tải danh sách khách hàng...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
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
                  className="border-b border-slate-100 divide-x divide-slate-100 hover:bg-blue-50/40 transition-colors duration-150"
                >
                  {/* Mã HT (KH-001) */}
                  <td className="px-2 py-2 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 font-mono">
                      {customer.system_code || `KH-${String(index + 1).padStart(3, '0')}`}
                    </span>
                  </td>

                  {/* Mã KH */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Lock size={12} className="text-slate-400 shrink-0" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono truncate" title={customer.code}>
                        {customer.code}
                      </span>
                    </div>
                  </td>

                  {/* Tên KH */}
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-800 text-xs block truncate" title={customer.name}>
                      {customer.name}
                    </span>
                  </td>

                  {/* Tên Tiếng Anh */}
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {customer.ten_tieng_anh ? (
                      <span className="italic text-slate-700 block truncate" title={customer.ten_tieng_anh}>{customer.ten_tieng_anh}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* TTKD */}
                  <td className="px-2 py-2 text-center">
                    {customer.ttkd ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-200 truncate max-w-full" title={customer.ttkd}>
                        {customer.ttkd}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Người phụ trách */}
                  <td className="px-3 py-2">
                    {customer.phu_trach ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${getAvatarColor(customer.phu_trach)}`}>
                          {getInitials(customer.phu_trach)}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate" title={customer.phu_trach}>{customer.phu_trach}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Ghi chú */}
                  <td className="px-3 py-2 text-xs text-slate-500">
                    <span className="truncate block" title={customer.ghi_chu || ""}>{customer.ghi_chu || "—"}</span>
                  </td>

                  {/* Thao tác */}
                  <td className="px-1 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onEdit?.(customer)}
                        title="Chỉnh sửa TTKD & Người phụ trách"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Pencil size={14} />
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
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/70 shrink-0">
        <div>
          Hiển thị: <strong>{filtered.length}</strong> / <strong>{customers.length}</strong> khách hàng
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Lock size={11} />
          Mã KH được quản lý từ Google Sheet
        </div>
      </div>
    </div>
  );
});

CustomerTable.displayName = "CustomerTable";
export default CustomerTable;