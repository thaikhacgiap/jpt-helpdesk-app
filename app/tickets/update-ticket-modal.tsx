"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateTicket } from "@/lib/ticket-operations";

interface UpdateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: {
    id: string;
    title: string;
    description?: string;
    startTime?: string;
    start_time?: string;
    endTime?: string;
    end_time?: string;
    holdTime?: string;
    hold_time?: string;
    ttStatus?: string;
    tt_status?: string;
  };
}

export default function UpdateTicketModal({ isOpen, onClose, ticket }: UpdateTicketModalProps) {
  const [formData, setFormData] = useState({
    startTime: ticket?.startTime || ticket?.start_time || "",
    endTime: ticket?.endTime || ticket?.end_time || "",
    ttStatus: ticket?.ttStatus || ticket?.tt_status || "New",
    updates: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket?.id) {
      alert("Ticket not found");
      return;
    }

    setLoading(true);
    
    try {
      const result = await updateTicket(ticket.id, formData);
      
      if (result.success) {
        alert("Ticket updated successfully");
        onClose();
      } else {
        alert(`Error updating ticket: ${result.error}`);
      }
    } catch (error) {
      alert("Error updating ticket. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">{ticket?.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Times */}
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* TT Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              TT Status
            </label>
            <select
              name="ttStatus"
              value={formData.ttStatus}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Updates - Large textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Updates
            </label>
            <textarea
              name="updates"
              value={formData.updates}
              onChange={handleChange}
              placeholder="Add update notes..."
              rows={8}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
