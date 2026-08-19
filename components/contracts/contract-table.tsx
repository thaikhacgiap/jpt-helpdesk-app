"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { fetchContracts, Contract } from "@/lib/contract-operations";
import { Pencil, FileText } from "lucide-react";

interface ContractTableProps {
  onEdit?: (ctr: Contract) => void;
  onRefresh?: () => void;
  searchValue?: string;
}

export interface ContractTableRef {
  loadContracts: () => Promise<void>;
  getAllData: () => Contract[];
}

const ContractTable = forwardRef<ContractTableRef, ContractTableProps>(({
  onEdit,
  onRefresh,
  searchValue = "",
}, ref) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await fetchContracts();
      setContracts(data);
    } catch (err) {
      console.error("Lỗi tải danh sách hợp đồng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  useImperativeHandle(ref, () => ({
    loadContracts,
    getAllData: () => contracts,
  }));

  // Filter
  const filtered = contracts.filter(c => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      (c.system_code && c.system_code.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.contract_no && c.contract_no.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(q)) ||
      (c.contract_type && c.contract_type.toLowerCase().includes(q)) ||
      (c.value && c.value.toLowerCase().includes(q)) ||
      (c.owner_name && c.owner_name.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("active") || s.includes("hiệu lực") || s.includes("đang thực hiện")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("hết hạn") || s.includes("expired") || s.includes("thanh lý")) {
      return "bg-slate-100 text-slate-600 border-slate-200";
    }
    if (s.includes("tạm dừng") || s.includes("pending")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
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
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col flex-1 min-h-0 w-full h-full">
      <div className="table-scroll flex-1 overflow-auto">
        <table className="w-full text-sm border-separate border-spacing-0 table-fixed">
          {/* Header */}
          <thead className="sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr className="text-left text-xs text-slate-600 font-bold tracking-tight">
              <th className="px-3 py-2.5 w-[75px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã HĐ</th>
              <th className="px-3 py-2.5 w-[120px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Số Hợp Đồng</th>
              <th className="px-3 py-2.5 w-[28%] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên Hợp Đồng</th>
              <th className="px-3 py-2.5 w-[20%] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Khách Hàng</th>
              <th className="px-3 py-2.5 w-[120px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Loại Hợp Đồng</th>
              <th className="px-3 py-2.5 w-[100px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ngày Ký</th>
              <th className="px-3 py-2.5 w-[115px] text-right whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Giá Trị</th>
              <th className="px-3 py-2.5 w-[95px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Trạng Thái</th>
              <th className="px-3 py-2.5 w-[130px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Người Phụ Trách</th>
              <th className="px-2 py-2.5 w-[56px] text-center whitespace-nowrap bg-slate-50 border-b border-slate-200">Thao tác</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 text-sm">Đang tải danh sách hợp đồng...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl">📄</div>
                    <p className="text-slate-500 text-sm font-semibold">
                      {searchValue ? "Không tìm thấy hợp đồng phù hợp." : "Chưa có dữ liệu hợp đồng."}
                    </p>
                    <p className="text-xs text-slate-400">Nhấn &quot;Đồng bộ Google Sheet / Import&quot; để nạp dữ liệu từ tab Contract.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((ctr, index) => (
                <tr
                  key={ctr.id || index}
                  className="border-b border-slate-100 divide-x divide-slate-100 hover:bg-blue-50/40 transition-colors duration-150"
                >
                  {/* Mã HĐ */}
                  <td className="px-2 py-2 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 font-mono">
                      {ctr.system_code || ctr.code || `HD-${String(index + 1).padStart(3, '0')}`}
                    </span>
                  </td>

                  {/* Số Hợp Đồng */}
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono truncate max-w-full" title={ctr.contract_no || ctr.code}>
                      {ctr.contract_no || ctr.code}
                    </span>
                  </td>

                  {/* Tên Hợp Đồng */}
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-800 text-xs block truncate" title={ctr.name}>
                      {ctr.name}
                    </span>
                  </td>

                  {/* Khách hàng */}
                  <td className="px-3 py-2 text-xs text-slate-700">
                    <span className="block truncate" title={ctr.customer_name || ""}>
                      {ctr.customer_name || "—"}
                    </span>
                  </td>

                  {/* Loại HĐ */}
                  <td className="px-3 py-2 text-xs text-slate-600">
                    <span className="block truncate" title={ctr.contract_type || "Hợp đồng dịch vụ"}>
                      {ctr.contract_type || "Hợp đồng dịch vụ"}
                    </span>
                  </td>

                  {/* Ngày ký */}
                  <td className="px-2 py-2 text-center text-xs font-mono text-slate-600">
                    {ctr.signed_date || "—"}
                  </td>

                  {/* Giá trị */}
                  <td className="px-3 py-2 text-right text-xs font-mono font-bold text-slate-700">
                    {ctr.value ? (
                      <span title={ctr.value}>{ctr.value}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td className="px-2 py-2 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border truncate max-w-full ${getStatusBadge(ctr.status)}`}>
                      {ctr.status || "Active"}
                    </span>
                  </td>

                  {/* Người phụ trách */}
                  <td className="px-3 py-2">
                    {(ctr.owner_name || ctr.phu_trach) ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${getAvatarColor(ctr.owner_name || ctr.phu_trach || "")}`}>
                          {getInitials(ctr.owner_name || ctr.phu_trach || "")}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate" title={(ctr.owner_name || ctr.phu_trach) || ""}>{ctr.owner_name || ctr.phu_trach}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="px-1 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onEdit?.(ctr)}
                        title="Chỉnh sửa hợp đồng"
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
          Hiển thị: <strong>{filtered.length}</strong> / <strong>{contracts.length}</strong> hợp đồng
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <FileText size={11} />
          Dữ liệu đồng bộ từ Google Sheets (Contract)
        </div>
      </div>
    </div>
  );
});

ContractTable.displayName = "ContractTable";
export default ContractTable;