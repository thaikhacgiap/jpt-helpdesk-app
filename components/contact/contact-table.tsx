"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2, Phone, Smartphone, Mail, MapPin, UsersRound, Loader2 } from "lucide-react";
import { fetchContacts, deleteContact, Contact } from "@/lib/contact-operations";

interface ContactTableProps {
  onEdit?: (contact: Contact) => void;
  onRefresh?: () => void;
  searchValue?: string;
}

const ContactTable = forwardRef<any, ContactTableProps>(({ onEdit, onRefresh, searchValue = "" }, ref) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await fetchContacts();
      setContacts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    loadContacts,
    getAllData: () => contacts,
  }));

  useEffect(() => { loadContacts(); }, []);

  const filtered = contacts.filter(c => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.ho_ten?.toLowerCase().includes(q) ||
      c.customer_code?.toLowerCase().includes(q) ||
      c.customer_name?.toLowerCase().includes(q) ||
      c.bo_phan?.toLowerCase().includes(q) ||
      c.chuc_danh?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.so_di_dong?.toLowerCase().includes(q) ||
      c.so_may_ban?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (c: Contact) => {
    if (!window.confirm(`Xóa liên hệ "${c.ho_ten}" (${c.code})?`)) return;
    setDeletingId(c.id);
    const result = await deleteContact(c.id);
    if (result.success) {
      await loadContacts();
      onRefresh?.();
    } else {
      alert("Lỗi xóa: " + result.error);
    }
    setDeletingId(null);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const avatarColors = ["bg-teal-500","bg-blue-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-indigo-500","bg-rose-500"];
  const getColor = (n: string) => avatarColors[(n?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-xs border-separate border-spacing-0 table-fixed">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-slate-400 font-semibold uppercase text-[10px]">#</th>
              <th className="w-24 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Mã LH</th>
              <th className="w-48 px-3 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Họ và tên</th>
              <th className="w-44 px-3 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Khách hàng</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Bộ phận</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Chức danh</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Số di động</th>
              <th className="w-28 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Máy bàn</th>
              <th className="w-40 px-2.5 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Email</th>
              <th className="w-44 px-3 py-2 text-left font-semibold text-slate-600 uppercase text-[10px] tracking-wider">Địa chỉ</th>
              <th className="w-16 px-2 py-2 text-center font-semibold text-slate-600 uppercase text-[10px] tracking-wider sticky right-0 bg-slate-50">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-teal-500" />
                    <p className="text-xs">Đang tải danh sách liên hệ...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UsersRound size={32} className="text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600 text-xs">Không có dữ liệu liên hệ</p>
                    <p className="text-[11px] text-slate-400">Thêm mới hoặc đồng bộ liên hệ từ Google Sheets</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-2 py-2 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                  
                  {/* Mã LH */}
                  <td className="px-2.5 py-2">
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] border border-teal-200/60 block truncate">
                      {c.code}
                    </span>
                  </td>

                  {/* Họ và tên */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs ${getColor(c.ho_ten || "")}`}>
                        {getInitials(c.ho_ten || "")}
                      </div>
                      <span className="font-semibold text-slate-800 truncate" title={c.ho_ten}>
                        {c.ho_ten}
                      </span>
                    </div>
                  </td>

                  {/* Khách hàng */}
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-700 truncate block" title={c.customer_name || c.customer_code || ""}>
                      {c.customer_name || c.customer_code || <span className="text-slate-300">—</span>}
                    </span>
                  </td>

                  {/* Bộ phận */}
                  <td className="px-2.5 py-2">
                    {c.bo_phan ? (
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px] truncate block" title={c.bo_phan}>
                        {c.bo_phan}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Chức danh */}
                  <td className="px-2.5 py-2 text-slate-600 truncate font-medium" title={c.chuc_danh}>
                    {c.chuc_danh || <span className="text-slate-300">—</span>}
                  </td>

                  {/* Số di động */}
                  <td className="px-2.5 py-2">
                    {c.so_di_dong ? (
                      <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]" title={c.so_di_dong}>
                        <Smartphone size={12} className="text-teal-500 shrink-0" />
                        <span>{c.so_di_dong}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Số máy bàn */}
                  <td className="px-2.5 py-2">
                    {c.so_may_ban ? (
                      <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]" title={c.so_may_ban}>
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>{c.so_may_ban}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-2.5 py-2">
                    {c.email ? (
                      <div className="flex items-center gap-1 text-slate-600 truncate" title={c.email}>
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Địa chỉ */}
                  <td className="px-3 py-2 text-slate-500 truncate" title={c.dia_chi}>
                    {c.dia_chi ? (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{c.dia_chi}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="px-2 py-2 text-center sticky right-0 bg-white group-hover:bg-slate-50/70">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit?.(c)}
                        className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
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
        <span>Hiển thị <strong className="text-slate-700">{filtered.length}</strong> / {contacts.length} liên hệ</span>
      </div>
    </div>
  );
});

ContactTable.displayName = "ContactTable";
export default ContactTable;
