"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2, Phone, Smartphone, Mail } from "lucide-react";
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

  useImperativeHandle(ref, () => ({ loadContacts }));
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
      c.email?.toLowerCase().includes(q)
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
  const avatarColors = ["bg-teal-500","bg-blue-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-indigo-500"];
  const getColor = (n: string) => avatarColors[(n?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-3 whitespace-nowrap">Mã liên hệ</th>
              <th className="px-4 py-3 whitespace-nowrap">Mã khách hàng</th>
              <th className="px-4 py-3 whitespace-nowrap">Họ và tên</th>
              <th className="px-4 py-3 whitespace-nowrap">Bộ phận</th>
              <th className="px-4 py-3 whitespace-nowrap">Chức danh</th>
              <th className="px-4 py-3 whitespace-nowrap">Số máy bàn</th>
              <th className="px-4 py-3 whitespace-nowrap">Số di động</th>
              <th className="px-4 py-3 whitespace-nowrap">Email</th>
              <th className="px-4 py-3 whitespace-nowrap">Địa chỉ</th>
              <th className="px-4 py-3 whitespace-nowrap">Ghi chú</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-400 text-sm">Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-slate-400 text-sm">
                    {searchValue ? "Không tìm thấy liên hệ phù hợp." : "Chưa có liên hệ nào."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => (
                <tr key={c.id} className={`${idx < filtered.length - 1 ? "border-b border-slate-100" : ""} hover:bg-blue-50/30 transition-colors`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" className="rounded" />
                  </td>

                  {/* Mã liên hệ */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-semibold text-xs border border-teal-200 font-mono">
                      {c.code}
                    </span>
                  </td>

                  {/* Mã KH */}
                  <td className="px-4 py-3.5">
                    {c.customer_code ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono">
                          {c.customer_code}
                        </span>
                        {c.customer_name && (
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[120px] truncate">{c.customer_name}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Họ và tên */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColor(c.ho_ten)}`}>
                        {getInitials(c.ho_ten)}
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{c.ho_ten}</span>
                    </div>
                  </td>

                  {/* Bộ phận */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-600">{c.bo_phan || "—"}</span>
                  </td>

                  {/* Chức danh */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium text-slate-700">{c.chuc_danh || "—"}</span>
                  </td>

                  {/* Số máy bàn */}
                  <td className="px-4 py-3.5">
                    {c.so_may_ban ? (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Phone size={11} className="text-slate-400" />
                        {c.so_may_ban}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Số di động */}
                  <td className="px-4 py-3.5">
                    {c.so_di_dong ? (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Smartphone size={11} className="text-slate-400" />
                        {c.so_di_dong}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Mail size={11} />
                        {c.email}
                      </a>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Địa chỉ */}
                  <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[130px]">
                    <span className="truncate block" title={c.dia_chi || ""}>{c.dia_chi || "—"}</span>
                  </td>

                  {/* Ghi chú */}
                  <td className="px-4 py-3.5 text-xs text-slate-400 max-w-[110px]">
                    <span className="truncate block" title={c.ghi_chu || ""}>{c.ghi_chu || "—"}</span>
                  </td>

                  {/* Thao tác */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit?.(c)}
                        title="Chỉnh sửa"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        title="Xóa"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                      >
                        {deletingId === c.id
                          ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={14} />}
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          Hiển thị {filtered.length} / {contacts.length} liên hệ
        </div>
      )}
    </div>
  );
});

ContactTable.displayName = "ContactTable";
export default ContactTable;
