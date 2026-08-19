"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2, Phone, Mail, MapPin, UserCheck, Loader2 } from "lucide-react";
import { fetchNhanSu, deleteNhanSu, NhanSu } from "@/lib/nhan-su-operations";

interface NhanSuTableProps {
  onRefresh?: () => void;
  onEdit?: (nhanSu: NhanSu) => void;
  searchValue?: string;
}

const NhanSuTable = forwardRef<any, NhanSuTableProps>(({ onRefresh, onEdit, searchValue = "" }, ref) => {
  const [nhanSuList, setNhanSuList] = useState<NhanSu[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNhanSu = async () => {
    try {
      setLoading(true);
      const data = await fetchNhanSu();
      setNhanSuList(data);
    } catch (error) {
      console.error("Error loading nhân sự:", error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    loadNhanSu,
    getAllData: () => nhanSuList,
  }));

  useEffect(() => {
    loadNhanSu();
  }, []);

  const handleDelete = async (ns: NhanSu) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân sự "${ns.ten_nhan_su}" (${ns.ma_nhan_su})?`)) return;
    setDeletingId(ns.id);
    try {
      const result = await deleteNhanSu(ns.id);
      if (result.success) {
        await loadNhanSu();
        onRefresh?.();
      } else {
        alert("Lỗi xóa nhân sự: " + result.error);
      }
    } catch {
      alert("Lỗi khi xóa nhân sự.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter by search
  const filtered = nhanSuList.filter((ns) => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      ns.ma_nhan_su?.toLowerCase().includes(q) ||
      ns.ten_nhan_su?.toLowerCase().includes(q) ||
      ns.bo_phan?.toLowerCase().includes(q) ||
      ns.chuc_vu?.toLowerCase().includes(q) ||
      ns.phu_trach?.toLowerCase().includes(q) ||
      ns.email?.toLowerCase().includes(q) ||
      ns.so_dien_thoai?.toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarColors = [
    "bg-teal-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-emerald-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];

  const getAvatarColor = (name: string) => {
    const idx = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-xs border-separate border-spacing-0 table-fixed">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-slate-400 font-semibold uppercase text-[10px]">#</th>
              <th className="w-24 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Mã NV</th>
              <th className="w-48 px-3 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Họ và tên</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Bộ phận</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Chức vụ</th>
              <th className="w-32 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Phụ trách</th>
              <th className="w-24 px-2 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Ngày sinh</th>
              <th className="w-28 px-2 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Số CCCD</th>
              <th className="w-40 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Email</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Điện thoại</th>
              <th className="w-44 px-3 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Địa chỉ</th>
              <th className="w-16 px-2 py-2 text-center font-semibold text-slate-600 uppercase text-[10px] tracking-wider sticky right-0 bg-slate-50">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                    <p className="text-xs">Đang tải danh sách nhân sự...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UserCheck size={32} className="text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600 text-xs">Không có dữ liệu nhân sự</p>
                    <p className="text-[11px] text-slate-400">Thêm mới hoặc đồng bộ nhân sự từ Google Sheets</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((ns, idx) => (
                <tr key={ns.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-2 py-2 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                  
                  {/* Mã NV */}
                  <td className="px-2.5 py-2">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200/60 block truncate">
                      {ns.ma_nhan_su}
                    </span>
                  </td>

                  {/* Họ và tên */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs ${getAvatarColor(ns.ten_nhan_su || "")}`}>
                        {getInitials(ns.ten_nhan_su || "")}
                      </div>
                      <span className="font-semibold text-slate-800 truncate" title={ns.ten_nhan_su}>
                        {ns.ten_nhan_su}
                      </span>
                    </div>
                  </td>

                  {/* Bộ phận */}
                  <td className="px-2.5 py-2">
                    {ns.bo_phan ? (
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px] truncate block" title={ns.bo_phan}>
                        {ns.bo_phan}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Chức vụ */}
                  <td className="px-2.5 py-2 text-slate-600 truncate font-medium" title={ns.chuc_vu}>
                    {ns.chuc_vu || <span className="text-slate-300">—</span>}
                  </td>

                  {/* Phụ trách */}
                  <td className="px-2.5 py-2 text-slate-600 truncate" title={ns.phu_trach}>
                    {ns.phu_trach || <span className="text-slate-300">—</span>}
                  </td>

                  {/* Ngày sinh */}
                  <td className="px-2 py-2 text-slate-500 font-mono text-[11px] truncate" title={ns.ngay_sinh}>
                    {ns.ngay_sinh || <span className="text-slate-300">—</span>}
                  </td>

                  {/* CCCD */}
                  <td className="px-2 py-2 text-slate-500 font-mono text-[11px] truncate" title={ns.so_cccd}>
                    {ns.so_cccd || <span className="text-slate-300">—</span>}
                  </td>

                  {/* Email */}
                  <td className="px-2.5 py-2">
                    {ns.email ? (
                      <div className="flex items-center gap-1 text-slate-600 truncate" title={ns.email}>
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ns.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Điện thoại */}
                  <td className="px-2.5 py-2">
                    {ns.so_dien_thoai ? (
                      <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]" title={ns.so_dien_thoai}>
                        <Phone size={12} className="text-emerald-500 shrink-0" />
                        <span>{ns.so_dien_thoai}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Địa chỉ */}
                  <td className="px-3 py-2 text-slate-500 truncate" title={ns.dia_chi}>
                    {ns.dia_chi ? (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ns.dia_chi}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="px-2 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50/70">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit?.(ns)}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(ns)}
                        disabled={deletingId === ns.id}
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
        <span>Hiển thị <strong className="text-slate-700">{filtered.length}</strong> / {nhanSuList.length} nhân sự</span>
      </div>
    </div>
  );
});

NhanSuTable.displayName = "NhanSuTable";
export default NhanSuTable;
