"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { fetchOpportunities, Opportunity } from "@/lib/opportunity-operations";
import { Pencil, Target } from "lucide-react";

interface OpportunityTableProps {
  onEdit?: (opp: Opportunity) => void;
  onRefresh?: () => void;
  searchValue?: string;
}

export interface OpportunityTableRef {
  loadOpportunities: () => Promise<void>;
  getAllData: () => Opportunity[];
}

const OpportunityTable = forwardRef<OpportunityTableRef, OpportunityTableProps>(({
  onEdit,
  onRefresh,
  searchValue = "",
}, ref) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await fetchOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error("Lỗi tải danh sách cơ hội:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  useImperativeHandle(ref, () => ({
    loadOpportunities,
    getAllData: () => opportunities,
  }));

  // Filter
  const filtered = opportunities.filter(o => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      (o.system_code && o.system_code.toLowerCase().includes(q)) ||
      (o.code && o.code.toLowerCase().includes(q)) ||
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.giai_doan && o.giai_doan.toLowerCase().includes(q)) ||
      (o.gia_tri && o.gia_tri.toLowerCase().includes(q)) ||
      (o.ttkd && o.ttkd.toLowerCase().includes(q)) ||
      (o.phu_trach && o.phu_trach.toLowerCase().includes(q))
    );
  });

  const getStageBadge = (stage?: string) => {
    const s = (stage || "").toLowerCase();
    if (s.includes("ký") || s.includes("thành công") || s.includes("won") || s.includes("đã chốt")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("đàm phán") || s.includes("negotiation") || s.includes("thảo luận")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (s.includes("chào giá") || s.includes("báo giá") || s.includes("proposal") || s.includes("quote")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (s.includes("thất bại") || s.includes("lost") || s.includes("hủy")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-purple-50 text-purple-700 border-purple-200";
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
              <th className="px-3 py-2.5 w-[80px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã HT</th>
              <th className="px-3 py-2.5 w-[120px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã Cơ hội</th>
              <th className="px-3 py-2.5 w-[30%] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên Cơ hội / Dự án</th>
              <th className="px-3 py-2.5 w-[22%] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Khách hàng</th>
              <th className="px-3 py-2.5 w-[110px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Giai đoạn</th>
              <th className="px-3 py-2.5 w-[120px] text-right whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Giá trị dự kiến</th>
              <th className="px-3 py-2.5 w-[85px] text-center whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">TTKD</th>
              <th className="px-3 py-2.5 w-[130px] whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Phụ trách</th>
              <th className="px-2 py-2.5 w-[56px] text-center whitespace-nowrap bg-slate-50 border-b border-slate-200">Thao tác</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 text-sm">Đang tải danh sách cơ hội...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl">🎯</div>
                    <p className="text-slate-500 text-sm font-semibold">
                      {searchValue ? "Không tìm thấy cơ hội phù hợp." : "Chưa có dữ liệu cơ hội kinh doanh."}
                    </p>
                    <p className="text-xs text-slate-400">Hãy nhấn &quot;Đồng bộ Google Sheet&quot; để nạp dữ liệu từ tab Opportunity.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((opp, index) => (
                <tr
                  key={opp.id || index}
                  className="border-b border-slate-100 divide-x divide-slate-100 hover:bg-blue-50/40 transition-colors duration-150"
                >
                  {/* Mã HT */}
                  <td className="px-2 py-2 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 font-mono">
                      {opp.system_code || `CH-${String(index + 1).padStart(3, '0')}`}
                    </span>
                  </td>

                  {/* Mã Cơ hội */}
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono truncate max-w-full" title={opp.code}>
                      {opp.code}
                    </span>
                  </td>

                  {/* Tên Cơ hội */}
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-800 text-xs block truncate" title={opp.name}>
                      {opp.name}
                    </span>
                  </td>

                  {/* Khách hàng */}
                  <td className="px-3 py-2 text-xs text-slate-700">
                    <span className="block truncate" title={opp.customer_name || ""}>
                      {opp.customer_name || "—"}
                    </span>
                  </td>

                  {/* Giai đoạn */}
                  <td className="px-2 py-2 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border truncate max-w-full ${getStageBadge(opp.giai_doan)}`}>
                      {opp.giai_doan || "Tiềm năng"}
                    </span>
                  </td>

                  {/* Giá trị dự kiến */}
                  <td className="px-3 py-2 text-right text-xs font-mono font-bold text-slate-700">
                    {opp.gia_tri ? (
                      <span title={opp.gia_tri}>{opp.gia_tri}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* TTKD */}
                  <td className="px-2 py-2 text-center">
                    {opp.ttkd ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 truncate max-w-full" title={opp.ttkd}>
                        {opp.ttkd}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Người phụ trách */}
                  <td className="px-3 py-2">
                    {opp.phu_trach ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${getAvatarColor(opp.phu_trach)}`}>
                          {getInitials(opp.phu_trach)}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate" title={opp.phu_trach}>{opp.phu_trach}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="px-1 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onEdit?.(opp)}
                        title="Chỉnh sửa cơ hội"
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
          Hiển thị: <strong>{filtered.length}</strong> / <strong>{opportunities.length}</strong> cơ hội kinh doanh
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Target size={11} />
          Dữ liệu đồng bộ từ Google Sheets (Opportunity)
        </div>
      </div>
    </div>
  );
});

OpportunityTable.displayName = "OpportunityTable";
export default OpportunityTable;
