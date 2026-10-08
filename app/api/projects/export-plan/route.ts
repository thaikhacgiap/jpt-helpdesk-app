import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

interface TaskItem {
  id?: string;
  taskIndex?: string;
  title: string;
  phase?: string;
  isHeader?: boolean;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignee?: string;
  progress?: number;
  status?: string;
  notes?: string;
}

const statusMapToVi: Record<string, string> = {
  "Todo": "Chưa thực hiện",
  "In Progress": "Đang thực hiện",
  "Completed": "Hoàn thành",
  "Chưa thực hiện": "Chưa thực hiện",
  "Đang thực hiện": "Đang thực hiện",
  "Hoàn thành": "Hoàn thành",
};

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectCode = "DU_AN",
      projectName = "Kế hoạch dự án",
      customer = "",
      manager = "",
      startDate = "",
      endDate = "",
      plan = [],
      isTemplate = false,
    } = body;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "JPT Helpdesk System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Kế hoạch dự án", {
      views: [{ showGridLines: true }],
    });

    // 1. Title Banner
    sheet.mergeCells("A1:K1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = isTemplate
      ? `MẪU KẾ HOẠCH DỰ ÁN (PROJECT PLAN TEMPLATE)`
      : `KẾ HOẠCH CHI TIẾT DỰ ÁN: [${projectCode}] ${projectName}`.toUpperCase();
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" }, // Blue-800
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 36;

    // 2. Project Metadata Banner
    sheet.mergeCells("A2:K2");
    const subTitle = sheet.getCell("A2");
    subTitle.value = isTemplate
      ? `Hướng dẫn: Nhập thông tin các Phase (Giai đoạn) và Công việc con tương ứng. Cột 'Loại dòng' ghi 'Phase' cho giai đoạn chính, hoặc 'Công việc' cho việc con.`
      : `Khách hàng: ${customer || "—"} | PM: ${manager || "—"} | Thời gian: ${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    subTitle.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF334155" } };
    subTitle.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" }, // Slate-100
    };
    subTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    sheet.getRow(2).height = 24;

    // Blank row 3
    sheet.getRow(3).height = 8;

    // 3. Table Headers (Row 4)
    const headers = [
      "STT",
      "Công việc",
      "Loại dòng",
      "Thời gian bắt đầu",
      "Thời gian kết thúc",
      "Thời gian bắt đầu thực tế",
      "Thời gian kết thúc thực tế",
      "Người thực hiện",
      "% Hoàn thành",
      "Trạng thái",
      "Ghi chú",
    ];

    const headerRow = sheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" }, // Blue-600
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "medium", color: { argb: "FF1E3A8A" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } },
      };
    });

    // 4. Data Rows
    let tasksToExport: TaskItem[] = plan;

    if (isTemplate && (!tasksToExport || tasksToExport.length === 0)) {
      tasksToExport = [
        {
          taskIndex: "1",
          title: "Phase 1: Khảo sát & Chuẩn bị",
          isHeader: true,
          startDate: "2026-10-01",
          endDate: "2026-10-07",
          progress: 100,
          status: "Completed",
          notes: "Giai đoạn chuẩn bị",
        },
        {
          taskIndex: "1.1",
          title: "Họp Kick-off và thống nhất yêu cầu",
          isHeader: false,
          startDate: "2026-10-01",
          endDate: "2026-10-03",
          actualStartDate: "2026-10-01",
          actualEndDate: "2026-10-03",
          assignee: "Nguyễn Văn A",
          progress: 100,
          status: "Completed",
          notes: "Đã hoàn thành biên bản họp",
        },
        {
          taskIndex: "1.2",
          title: "Khảo sát hạ tầng và môi trường triển khai",
          isHeader: false,
          startDate: "2026-10-04",
          endDate: "2026-10-07",
          actualStartDate: "2026-10-04",
          actualEndDate: "2026-10-07",
          assignee: "Trần Thị B",
          progress: 100,
          status: "Completed",
          notes: "Hạ tầng đạt tiêu chuẩn",
        },
        {
          taskIndex: "2",
          title: "Phase 2: Triển khai cấu hình hệ thống",
          isHeader: true,
          startDate: "2026-10-08",
          endDate: "2026-10-25",
          progress: 30,
          status: "In Progress",
          notes: "Giai đoạn cài đặt chính",
        },
        {
          taskIndex: "2.1",
          title: "Cài đặt phần mềm máy chủ & Database",
          isHeader: false,
          startDate: "2026-10-08",
          endDate: "2026-10-15",
          actualStartDate: "2026-10-08",
          assignee: "Lê Văn C",
          progress: 60,
          status: "In Progress",
          notes: "Đang kiểm tra cấu hình DB",
        },
        {
          taskIndex: "2.2",
          title: "Cấu hình phân quyền và tài khoản người dùng",
          isHeader: false,
          startDate: "2026-10-16",
          endDate: "2026-10-25",
          assignee: "Nguyễn Văn A",
          progress: 0,
          status: "Todo",
          notes: "Chờ xong cài đặt máy chủ",
        },
        {
          taskIndex: "3",
          title: "Phase 3: Nghiệm thu & Bàn giao",
          isHeader: true,
          startDate: "2026-10-26",
          endDate: "2026-10-31",
          progress: 0,
          status: "Todo",
          notes: "Giai đoạn nghiệm thu",
        },
        {
          taskIndex: "3.1",
          title: "Đào tạo người dùng & Chuyển giao tài liệu",
          isHeader: false,
          startDate: "2026-10-26",
          endDate: "2026-10-28",
          assignee: "Trần Thị B",
          progress: 0,
          status: "Todo",
          notes: "Chuẩn bị slide đào tạo",
        },
        {
          taskIndex: "3.2",
          title: "Ký biên bản nghiệm thu đưa vào vận hành",
          isHeader: false,
          startDate: "2026-10-29",
          endDate: "2026-10-31",
          assignee: "John D.",
          progress: 0,
          status: "Todo",
          notes: "Nghiệm thu chính thức",
        },
      ];
    }

    let currentRowIdx = 5;
    for (let i = 0; i < tasksToExport.length; i++) {
      const task = tasksToExport[i];
      const isHeader = !!task.isHeader;
      const row = sheet.getRow(currentRowIdx);

      const viStatus = statusMapToVi[task.status || "Todo"] || task.status || "Chưa thực hiện";
      const progressNum = typeof task.progress === "number" ? task.progress : 0;

      row.values = [
        task.taskIndex || (isHeader ? `${i + 1}` : `${i + 1}.1`),
        task.title || "",
        isHeader ? "Phase" : "Công việc",
        formatDisplayDate(task.startDate),
        formatDisplayDate(task.endDate),
        formatDisplayDate(task.actualStartDate),
        formatDisplayDate(task.actualEndDate),
        isHeader ? "" : (task.assignee || ""),
        progressNum,
        viStatus,
        task.notes || "",
      ];

      row.height = isHeader ? 24 : 22;

      // Styling per cell
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = {
          name: "Arial",
          size: 9.5,
          bold: isHeader,
          color: { argb: isHeader ? "FF0F172A" : "FF334155" },
        };

        if (isHeader) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE2E8F0" }, // Slate-200
          };
        } else {
          // Zebra striping
          if (currentRowIdx % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFC" }, // Slate-50
            };
          }
        }

        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        // Alignments
        if (colNumber === 1 || colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 2 || colNumber === 8 || colNumber === 11) {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        } else if (colNumber >= 4 && colNumber <= 7) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 9) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = '0"%"';
        } else if (colNumber === 10) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      });

      currentRowIdx++;
    }

    // Column widths
    sheet.columns = [
      { key: "index", width: 10 },
      { key: "title", width: 44 },
      { key: "type", width: 14 },
      { key: "start", width: 18 },
      { key: "end", width: 18 },
      { key: "actStart", width: 22 },
      { key: "actEnd", width: 22 },
      { key: "assignee", width: 22 },
      { key: "progress", width: 14 },
      { key: "status", width: 18 },
      { key: "notes", width: 32 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const safeCode = (projectCode || "du_an").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const filename = isTemplate
      ? "mau_ke_hoach_du_an.xlsx"
      : `ke_hoach_${safeCode}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          filename
        )}"`,
      },
    });
  } catch (err: any) {
    console.error("Export plan error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Không thể tạo file Excel." },
      { status: 500 }
    );
  }
}
