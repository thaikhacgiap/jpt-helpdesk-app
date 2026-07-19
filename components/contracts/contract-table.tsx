"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { fetchContracts, deleteContract, type Contract } from "@/lib/contract-operations";

interface ContractTableProps {
  onRefresh?: () => void;
  onEdit?: (contract: Contract) => void;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Active:   { label: "Đang hiệu lực", cls: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  Inactive: { label: "Tạm ngưng",     cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  Expired:  { label: "Hết hiệu lực",  cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = STATUS_MAP[status || ""] ?? { label: status || "—", cls: "bg-slate-50 text-slate-500 ring-1 ring-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

const ContractTable = forwardRef<any, ContractTableProps>(({ onRefresh, onEdit }, ref) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await fetchContracts();
      setContracts(data);
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ loadContracts }));

  useEffect(() => {
    loadContracts();
  }, []);

  const handleDelete = async (code: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hợp đồng "${name}"?`)) return;
    setDeletingId(code);
    try {
      const result = await deleteContract(code);
      if (result.success) {
        await loadContracts();
        onRefresh?.();
      } else {
        alert("Lỗi xóa hợp đồng: " + result.error);
      }
    } catch {
      alert("Lỗi khi xóa hợp đồng.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      <div className="table-scroll flex-1">
        <table className="w-full text-sm border-separate border-spacing-0">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="px-4 py-3.5 w-10 bg-slate-50 border-b border-r border-slate-200">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Số HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap min-w-[200px] bg-slate-50 border-b border-r border-slate-200">Tên HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Loại HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên khách hàng</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Phụ trách HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ngày bắt đầu HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ngày kết thúc HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ngày ký HĐ</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tình trạng</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap min-w-[160px] bg-slate-50 border-b border-r border-slate-200">Ghi chú</th>
              <th className="px-4 py-3.5 font-semibold text-slate-600 text-center whitespace-nowrap bg-slate-50 border-b border-slate-200">Thao tác</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="opacity-30">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium">Chưa có hợp đồng nào</p>
                    <p className="text-xs">Nhấn &ldquo;New Contract&rdquo; để tạo hợp đồng đầu tiên.</p>
                  </div>
                </td>
              </tr>
            ) : (
              contracts.map((contract, index) => (
                <tr
                  key={contract.id || index}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="px-4 py-4 border-b border-r border-slate-100">
                    <input type="checkbox" className="rounded" />
                  </td>

                  {/* Mã HĐ */}
                  <td className="px-4 py-4 font-semibold text-blue-700 whitespace-nowrap">
                    {contract.code}
                  </td>

                  {/* Số HĐ */}
                  <td className="px-4 py-4 text-slate-700 whitespace-nowrap font-medium">
                    {contract.contract_no || "—"}
                  </td>

                  {/* Tên HĐ */}
                  <td className="px-4 py-4 text-slate-800 max-w-[220px]">
                    <span className="line-clamp-2 leading-snug">{contract.name}</span>
                  </td>

                  {/* Loại HĐ */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {contract.contract_type || "—"}
                  </td>

                  {/* Tên khách hàng */}
                  <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                    {contract.customer_name || "—"}
                  </td>

                  {/* Phụ trách HĐ */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {contract.owner_name || "—"}
                  </td>

                  {/* Ngày bắt đầu */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {fmtDate(contract.start_date)}
                  </td>

                  {/* Ngày kết thúc */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {fmtDate(contract.end_date)}
                  </td>

                  {/* Ngày ký */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {fmtDate(contract.signed_date)}
                  </td>

                  {/* Tình trạng */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status={contract.status} />
                  </td>

                  {/* Ghi chú */}
                  <td className="px-4 py-4 text-slate-500 max-w-[180px]">
                    <span className="line-clamp-2 text-xs leading-snug">
                      {contract.description || "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Chỉnh sửa"
                        onClick={() => onEdit?.(contract)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        title="Xóa"
                        onClick={() => handleDelete(contract.code, contract.name)}
                        disabled={deletingId === contract.code}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                      >
                        {deletingId === contract.code
                          ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                      <button
                        title="Xem thêm"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: count */}
      {!loading && contracts.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between bg-slate-50/60 rounded-b-2xl">
          <span>Hiển thị {contracts.length} hợp đồng</span>
          <span>Cập nhật lúc {new Date().toLocaleTimeString("vi-VN")}</span>
        </div>
      )}
    </div>
  );
});

ContractTable.displayName = "ContractTable";
export default ContractTable;