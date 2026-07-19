"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { fetchCustomerTickets, ServiceTicket } from "@/lib/portal-operations";
import { Eye, ShieldAlert, AlertCircle } from "lucide-react";

interface ServiceRequestsTableProps {
  customerId: string;
  onViewDetails?: (ticket: ServiceTicket) => void;
}

export interface ServiceRequestsTableHandle {
  loadRequests: () => Promise<void>;
}

const ServiceRequestsTable = forwardRef<ServiceRequestsTableHandle, ServiceRequestsTableProps>(
  ({ customerId, onViewDetails }, ref) => {
    const [requests, setRequests] = useState<ServiceTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useImperativeHandle(ref, () => ({
      loadRequests,
    }));

    useEffect(() => {
      loadRequests();
    }, [customerId]);

    const loadRequests = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchCustomerTickets(customerId);
        setRequests(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải yêu cầu");
      } finally {
        setLoading(false);
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "New": 
          return "bg-blue-500/10 text-blue-400 border border-blue-500/25";
        case "In Progress": 
          return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
        case "On Hold": 
          return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
        case "Resolved": 
          return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
        case "Closed": 
          return "bg-purple-500/10 text-purple-400 border border-purple-500/25";
        default: 
          return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "New": return "Mới tạo";
        case "In Progress": return "Đang xử lý";
        case "On Hold": return "Tạm dừng";
        case "Resolved": return "Hoàn thành";
        case "Closed": return "Đã đóng";
        default: return status;
      }
    };

    const getPriorityStyle = (priority: string) => {
      switch (priority) {
        case "Critical": 
          return { text: "text-rose-400", dot: "bg-rose-400 shadow-rose-400/50" };
        case "High": 
          return { text: "text-orange-400", dot: "bg-orange-400 shadow-orange-400/50" };
        case "Medium": 
          return { text: "text-amber-400", dot: "bg-amber-400 shadow-amber-400/50" };
        case "Low": 
          return { text: "text-emerald-400", dot: "bg-emerald-400 shadow-emerald-400/50" };
        default: 
          return { text: "text-slate-400", dot: "bg-slate-400" };
      }
    };

    if (loading) {
      return (
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 backdrop-blur-md">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs">Đang tải lịch sử yêu cầu...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 backdrop-blur-md">
          <AlertCircle size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">Không có yêu cầu dịch vụ nào</p>
          <p className="text-xs text-slate-500 mt-1">Tạo yêu cầu mới để nhận hỗ trợ kỹ thuật từ quản trị viên.</p>
        </div>
      );
    }

    return (
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800/80">
              <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">
                <th className="px-6 py-3.5 w-32">Mã số</th>
                <th className="px-6 py-3.5 min-w-[200px]">Tiêu đề yêu cầu</th>
                <th className="px-6 py-3.5">Phân loại</th>
                <th className="px-6 py-3.5">Mức độ ưu tiên</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5">Ngày tạo</th>
                <th className="px-6 py-3.5 text-center w-24">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {requests.map((request) => {
                const priorityInfo = getPriorityStyle(request.priority);
                return (
                  <tr key={request.id} className="hover:bg-slate-800/25 transition-all duration-150 transform hover:scale-[1.001]">
                    {/* ID */}
                    <td className="px-6 py-4 text-xs font-semibold text-blue-400 font-mono">
                      {request.ticket_id}
                    </td>

                    {/* Title & Desc */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-200 line-clamp-1">{request.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[280px]">
                        {request.description || "Không có mô tả chi tiết."}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {request.tt_type === "Bug" ? "Lỗi kỹ thuật" :
                       request.tt_type === "Request" ? "Yêu cầu dịch vụ" :
                       request.tt_type === "Feature" ? "Yêu cầu tính năng" :
                       request.tt_type === "Enhancement" ? "Cải tiến" : request.tt_type}
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                        <span className={priorityInfo.text}>{request.priority}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(request.tt_status)}`}>
                        {getStatusLabel(request.tt_status)}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {new Date(request.created_at).toLocaleDateString("vi-VN", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onViewDetails?.(request)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 rounded-xl transition cursor-pointer"
                        title="Xem chi tiết phiếu"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

ServiceRequestsTable.displayName = "ServiceRequestsTable";

export default ServiceRequestsTable;
