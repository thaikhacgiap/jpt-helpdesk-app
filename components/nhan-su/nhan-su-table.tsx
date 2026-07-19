"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2, Phone, Mail, MapPin } from "lucide-react";
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

  useImperativeHandle(ref, () => ({ loadNhanSu }));

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
      ns.email?.toLowerCase().includes(q)
    );
  });

  // Avatar fallback using initials
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
    "bg-green-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];

  const getAvatarColor = (name: string) => {
    const idx = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return dateStr;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      <div className="table-scroll flex-1">
        <table className="w-full text-sm border-separate border-spacing-0">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 w-10 bg-slate-50 border-b border-r border-slate-200">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã nhân sự</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Tên nhân sự</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Bộ phận</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Chức vụ</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Phụ trách</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Ngày sinh</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Số CCCD</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Cấp ngày</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Email</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Số điện thoại</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Địa chỉ</th>
              <th className="px-4 py-3 text-center whitespace-nowrap bg-slate-50 border-b border-slate-200">Thao tác</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 text-sm">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
                      👥
                    </div>
                    <p className="text-slate-500 text-sm">
                      {searchValue ? "Không tìm thấy nhân sự phù hợp." : "Chưa có nhân sự nào. Hãy thêm nhân sự mới."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((ns, index) => (
                <tr
                  key={ns.id || index}
                  className="hover:bg-teal-50/40 transition-colors duration-150"
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>

                  {/* Mã nhân sự */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 font-semibold text-xs border border-teal-200">
                      {ns.ma_nhan_su}
                    </span>
                  </td>

                  {/* Tên nhân sự + Avatar */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(ns.ten_nhan_su)}`}
                      >
                        {getInitials(ns.ten_nhan_su)}
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">
                        {ns.ten_nhan_su}
                      </span>
                    </div>
                  </td>

                  {/* Bộ phận */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {ns.bo_phan || "—"}
                  </td>

                  {/* Chức vụ */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs border border-blue-100 whitespace-nowrap">
                      {ns.chuc_vu || "—"}
                    </span>
                  </td>

                  {/* Phụ trách */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {ns.phu_trach || "—"}
                  </td>

                  {/* Ngày sinh */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {formatDate(ns.ngay_sinh)}
                  </td>

                  {/* Số CCCD */}
                  <td className="px-4 py-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                    {ns.so_cccd || "—"}
                  </td>

                  {/* Cấp ngày */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    {formatDate(ns.cap_ngay)}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-4">
                    {ns.email ? (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail size={13} className="text-teal-500 shrink-0" />
                        <span className="text-xs">{ns.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Số điện thoại */}
                  <td className="px-4 py-4">
                    {ns.so_dien_thoai ? (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={13} className="text-blue-500 shrink-0" />
                        <span className="text-xs">{ns.so_dien_thoai}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Địa chỉ */}
                  <td className="px-4 py-4">
                    {ns.dia_chi ? (
                      <div className="flex items-center gap-1.5 text-slate-500 max-w-[160px]">
                        <MapPin size={13} className="text-orange-400 shrink-0" />
                        <span className="text-xs truncate" title={ns.dia_chi}>
                          {ns.dia_chi}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => onEdit?.(ns)}
                        title="Chỉnh sửa"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(ns)}
                        disabled={deletingId === ns.id}
                        title="Xóa"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === ns.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={15} />
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

      {/* Footer row count */}
      {!loading && filtered.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          Hiển thị {filtered.length} / {nhanSuList.length} nhân sự
        </div>
      )}
    </div>
  );
});

NhanSuTable.displayName = "NhanSuTable";

export default NhanSuTable;
