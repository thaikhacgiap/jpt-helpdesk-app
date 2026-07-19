"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Pencil, Trash2, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { fetchContacts, deleteContact } from "@/lib/contact-operations";

interface Contact {
  id: string;
  code: string;
  name: string;
  ho_ten?: string;
  customer_code?: string;
  customer_name?: string;
  customer_id?: string;
  bo_phan?: string;
  chuc_danh?: string;
  position?: string;
  phone?: string;
  so_di_dong?: string;
  so_may_ban?: string;
  email?: string;
  dia_chi?: string;
  address?: string;
  ghi_chu?: string;
}

interface ContactTableProps {
  onRefresh?: () => void;
  searchValue?: string;
}

const ContactTable = forwardRef<any, ContactTableProps>(({ onRefresh, searchValue = "" }, ref) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await fetchContacts();
      setContacts(data as Contact[]);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ loadContacts }));

  useEffect(() => { loadContacts(); }, []);

  const handleDelete = async (contact: Contact) => {
    if (!window.confirm(`Xóa liên hệ "${contact.name || contact.ho_ten}" (${contact.code})?`)) return;
    setDeletingId(contact.id);
    try {
      const result = await deleteContact(contact.code);
      if (result.success) {
        await loadContacts();
        onRefresh?.();
      } else {
        alert("Lỗi xóa: " + result.error);
      }
    } catch { alert("Lỗi khi xóa liên hệ."); }
    finally { setDeletingId(null); }
  };

  // Filter
  const filtered = contacts.filter((c) => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.ho_ten?.toLowerCase().includes(q) ||
      c.customer_name?.toLowerCase().includes(q) ||
      c.customer_code?.toLowerCase().includes(q) ||
      c.bo_phan?.toLowerCase().includes(q) ||
      c.chuc_danh?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  // Avatar initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const avatarColors = ["bg-teal-500","bg-blue-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-green-500","bg-indigo-500","bg-rose-500"];
  const getAvatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const displayName = (c: Contact) => c.ho_ten || c.name || "—";

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
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã liên hệ</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Mã khách hàng</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Họ và tên</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Bộ phận</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Chức danh</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Số máy bàn</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Số di động</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Email</th>
              <th className="px-4 py-3 whitespace-nowrap bg-slate-50 border-b border-r border-slate-200">Địa chỉ</th>
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
                    <div className="text-3xl">📞</div>
                    <p className="text-slate-500 text-sm">
                      {searchValue ? "Không tìm thấy liên hệ phù hợp." : "Chưa có liên hệ nào."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((contact, index) => (
                <tr key={contact.id || index} className="hover:bg-blue-50/30 transition-colors duration-150">

                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>

                  {/* Mã liên hệ */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono">
                      {contact.code}
                    </span>
                  </td>

                  {/* Mã + Tên KH */}
                  <td className="px-4 py-4">
                    {contact.customer_name ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs border border-blue-100 w-fit">
                          {contact.customer_code}
                        </span>
                        <span className="text-xs text-slate-500 truncate max-w-[160px]" title={contact.customer_name}>
                          {contact.customer_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Họ và tên + avatar */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(displayName(contact))}`}>
                        {getInitials(displayName(contact))}
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">{displayName(contact)}</span>
                    </div>
                  </td>

                  {/* Bộ phận */}
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap text-sm">
                    {contact.bo_phan ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-slate-400 shrink-0" />
                        {contact.bo_phan}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Chức danh */}
                  <td className="px-4 py-4">
                    {(contact.chuc_danh || contact.position) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs border border-purple-100 whitespace-nowrap">
                        {contact.chuc_danh || contact.position}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Số máy bàn */}
                  <td className="px-4 py-4 text-slate-600 text-xs whitespace-nowrap">
                    {contact.so_may_ban || <span className="text-slate-300">—</span>}
                  </td>

                  {/* Số di động */}
                  <td className="px-4 py-4">
                    {(contact.so_di_dong || contact.phone) ? (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={12} className="text-blue-500 shrink-0" />
                        <span className="text-xs">{contact.so_di_dong || contact.phone}</span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-4">
                    {contact.email ? (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail size={12} className="text-teal-500 shrink-0" />
                        <span className="text-xs">{contact.email}</span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Địa chỉ */}
                  <td className="px-4 py-4">
                    {(contact.dia_chi || contact.address) ? (
                      <div className="flex items-center gap-1.5 text-slate-500 max-w-[160px]">
                        <MapPin size={12} className="text-orange-400 shrink-0" />
                        <span className="text-xs truncate" title={contact.dia_chi || contact.address}>
                          {contact.dia_chi || contact.address}
                        </span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Ghi chú */}
                  <td className="px-4 py-4 text-xs text-slate-500 max-w-[150px]">
                    <span className="truncate block" title={contact.ghi_chu}>{contact.ghi_chu || "—"}</span>
                  </td>

                  {/* Thao tác */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        title="Chỉnh sửa"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact)}
                        disabled={deletingId === contact.id}
                        title="Xóa"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                      >
                        {deletingId === contact.id
                          ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={14} />
                        }
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
          <span>Hiển thị {filtered.length} / {contacts.length} liên hệ</span>
        </div>
      )}
    </div>
  );
});

ContactTable.displayName = "ContactTable";
export default ContactTable;