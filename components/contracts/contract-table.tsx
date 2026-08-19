"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { FileText, Pencil, Trash2, Loader2, Calendar, UserCheck, Building2, Tag } from "lucide-react";
import { Contract, fetchContracts, deleteContract } from "@/lib/contract-operations";

interface ContractTableProps {
  onRefresh?: () => void;
  onEdit?: (contract: Contract) => void;
  searchValue?: string;
  statusFilter?: string;
}

const ContractTable = forwardRef<any, ContractTableProps>(({
  onRefresh,
  onEdit,
  searchValue = "",
  statusFilter = "ALL",
}, ref) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await fetchContracts();
      setContracts(data);
    } catch (err) {
      console.error("loadContracts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    loadContracts,
    getAllData: () => contracts,
  }));

  useEffect(() => {
    loadContracts();
  }, []);

  const handleDelete = async (contract: Contract) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hợp đồng "${contract.contract_no}"?`)) return;
    setDeletingId(contract.id);
    try {
      const res = await deleteContract(contract.id);
      if (res.success) {
        await loadContracts();
        onRefresh?.();
      } else {
        alert("Lỗi khi xóa hợp đồng: " + res.error);
      }
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter
  const filtered = contracts.filter((c) => {
    if (statusFilter !== "ALL" && c.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      c.contract_no?.toLowerCase().includes(q) ||
      c.project_id?.toLowerCase().includes(q) ||
      c.customer?.toLowerCase().includes(q) ||
      c.end_user?.toLowerCase().includes(q) ||
      c.supplier?.toLowerCase().includes(q) ||
      c.service?.toLowerCase().includes(q) ||
      c.am?.toLowerCase().includes(q) ||
      c.team?.toLowerCase().includes(q) ||
      c.fy?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase() || "active";
    if (s.includes("active") || s.includes("hiệu lực") || s.includes("đang")) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Active</span>;
    }
    if (s.includes("expire") || s.includes("hết hạn")) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Hết hạn</span>;
    }
    if (s.includes("pending") || s.includes("chờ")) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending</span>;
    }
    if (s.includes("thanh lý") || s.includes("closed")) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Thanh lý</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">{status || "Active"}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-xs border-separate border-spacing-0 table-fixed">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-slate-400 font-semibold uppercase text-[10px]">#</th>
              <th className="w-32 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">CONTRACT NO</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">PROJECT ID</th>
              <th className="w-24 px-2 py-2 text-center font-semibold text-slate-600 uppercase text-[10px] tracking-wider">STATUS</th>
              <th className="w-24 px-2 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">SIGNED DATE</th>
              <th className="w-24 px-2 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">EXPIRY DATE</th>
              <th className="w-36 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">SERVICE</th>
              <th className="w-32 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">CONTRACT TYPE</th>
              <th className="w-48 px-3 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">CUSTOMER</th>
              <th className="w-36 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">END USER</th>
              <th className="w-32 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">SUPPLIER</th>
              <th className="w-24 px-2 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">AM</th>
              <th className="w-24 px-2 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">TEAM</th>
              <th className="w-16 px-2 py-2 text-center font-semibold text-slate-600 uppercase text-[10px] tracking-wider">FY</th>
              <th className="w-48 px-3 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">DESCRIPTION</th>
              <th className="w-16 px-2 py-2 text-center font-semibold text-slate-600 uppercase text-[10px] tracking-wider sticky right-0 bg-slate-50">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-purple-600" />
                    <p className="text-xs">Đang tải danh sách hợp đồng...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <FileText size={32} className="text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600 text-xs">Không có dữ liệu hợp đồng</p>
                    <p className="text-[11px] text-slate-400">Thêm mới hoặc đồng bộ hợp đồng từ Google Sheets</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-2 py-2 text-center text-slate-400 text-[11px]">{idx + 1}</td>

                  {/* CONTRACT NO */}
                  <td className="px-2.5 py-2">
                    <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200/80 block truncate" title={c.contract_no}>
                      {c.contract_no}
                    </span>
                  </td>

                  {/* PROJECT ID */}
                  <td className="px-2.5 py-2">
                    {c.project_id ? (
                      <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] truncate block" title={c.project_id}>
                        {c.project_id}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-2 py-2 text-center">
                    {getStatusBadge(c.status)}
                  </td>

                  {/* SIGNED DATE */}
                  <td className="px-2 py-2 text-slate-600 font-mono text-[11px] truncate" title={c.signed_date}>
                    {c.signed_date || <span className="text-slate-300">—</span>}
                  </td>

                  {/* EXPIRY DATE */}
                  <td className="px-2 py-2 text-slate-600 font-mono text-[11px] truncate" title={c.expiry_date}>
                    {c.expiry_date || <span className="text-slate-300">—</span>}
                  </td>

                  {/* SERVICE */}
                  <td className="px-2.5 py-2 text-slate-700 font-medium truncate" title={c.service}>
                    {c.service || <span className="text-slate-300">—</span>}
                  </td>

                  {/* CONTRACT TYPE */}
                  <td className="px-2.5 py-2">
                    {c.contract_type ? (
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px] truncate block" title={c.contract_type}>
                        {c.contract_type}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-800 truncate block" title={c.customer}>
                      {c.customer || <span className="text-slate-300 font-normal">—</span>}
                    </span>
                  </td>

                  {/* END USER */}
                  <td className="px-2.5 py-2 text-slate-600 truncate" title={c.end_user}>
                    {c.end_user || <span className="text-slate-300">—</span>}
                  </td>

                  {/* SUPPLIER */}
                  <td className="px-2.5 py-2 text-slate-600 truncate" title={c.supplier}>
                    {c.supplier || <span className="text-slate-300">—</span>}
                  </td>

                  {/* AM */}
                  <td className="px-2 py-2 text-slate-700 font-medium truncate" title={c.am}>
                    {c.am || <span className="text-slate-300">—</span>}
                  </td>

                  {/* TEAM */}
                  <td className="px-2 py-2 text-slate-600 truncate" title={c.team}>
                    {c.team || <span className="text-slate-300">—</span>}
                  </td>

                  {/* FY */}
                  <td className="px-2 py-2 text-center font-mono font-bold text-slate-700">
                    {c.fy ? <span className="bg-slate-100 px-1.5 py-0.5 rounded">{c.fy}</span> : <span className="text-slate-300 font-normal">—</span>}
                  </td>

                  {/* DESCRIPTION */}
                  <td className="px-3 py-2 text-slate-500 truncate" title={c.description}>
                    {c.description || <span className="text-slate-300">—</span>}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-2 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50/70">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit?.(c)}
                        className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/50">
        <span>Hiển thị <strong className="text-slate-700">{filtered.length}</strong> / {contracts.length} hợp đồng</span>
      </div>
    </div>
  );
});

ContractTable.displayName = "ContractTable";
export default ContractTable;