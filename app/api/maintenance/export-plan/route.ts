import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { 
  DEFAULT_MAINTENANCE_TEMPLATE, 
  generateDefaultTasks, 
  getSortedHierarchicalTasks, 
  MaintenanceTask 
} from "@/lib/maintenance-template";

export const dynamic = "force-dynamic";

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
      planTitle = "Kế hoạch bảo trì",
      cycleNum = "1",
      customerName = "",
      contractNo = "",
      startDate = "",
      tasks = [],
      isTemplate = false,
    } = body;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "JPT Helpdesk System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Kế Hoạch", {
      views: [{ showGridLines: true }],
    });

    // Determine tasks to export
    let exportTasks: any[] = [];
    if (isTemplate || !tasks || tasks.length === 0) {
      exportTasks = getSortedHierarchicalTasks(generateDefaultTasks(startDate));
    } else {
      exportTasks = getSortedHierarchicalTasks(tasks);
    }

    // 1. Row 1: "Kế Hoạch" Blue Banner
    sheet.mergeCells("A1:G1");
    const r1 = sheet.getCell("A1");
    r1.value = "Kế Hoạch";
    r1.font = { name: "Arial", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
    r1.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1565C0" }, // Blue
    };
    r1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    sheet.getRow(1).height = 34;

    // 2. Row 2: "Kiểm tra định kỳ - kỳ" Light Gray Banner
    sheet.mergeCells("A2:G2");
    const r2 = sheet.getCell("A2");
    const cycleText = cycleNum ? ` - kỳ ${cycleNum}` : " - kỳ";
    const extraInfo = customerName ? ` (${customerName}${contractNo ? ` - HĐ: ${contractNo}` : ""})` : "";
    r2.value = isTemplate ? "Kiểm tra định kỳ - kỳ" : `Kiểm tra định kỳ${cycleText}${extraInfo}`;
    r2.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF1E293B" } };
    r2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" }, // Gray
    };
    r2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    sheet.getRow(2).height = 28;

    // 3. Row 3: "Công việc thực hiện" Blue Banner
    sheet.mergeCells("A3:G3");
    const r3 = sheet.getCell("A3");
    r3.value = "Công việc thực hiện";
    r3.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    r3.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1565C0" }, // Blue
    };
    r3.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(3).height = 32;

    // 4. Row 4: Column Headers
    const headers = [
      "STT",
      "Công việc",
      "Người thực hiện",
      "Bắt đầu (dự kiến)",
      "Kết thúc (dự kiến)",
      "Tình trạng",
      "Ghi chú",
    ];

    const headerRow = sheet.getRow(4);
    headerRow.height = 26;

    headers.forEach((h, colIdx) => {
      const cell = headerRow.getCell(colIdx + 1);
      cell.value = h;
      cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF374151" }, // Dark charcoal
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF4B5563" } },
        bottom: { style: "thin", color: { argb: "FF4B5563" } },
        left: { style: "thin", color: { argb: "FF4B5563" } },
        right: { style: "thin", color: { argb: "FF4B5563" } },
      };
    });

    // 5. Data rows
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };

    exportTasks.forEach((task, idx) => {
      const rowIndex = 5 + idx;
      const row = sheet.getRow(rowIndex);
      row.height = 24;

      const isMainHeader = task.level === 1;
      const isSubParent = task.hasChildren && task.level > 1;
      const isBold = isMainHeader || isSubParent;

      // STT
      const cellSTT = row.getCell(1);
      cellSTT.value = task.stt;
      cellSTT.font = { name: "Arial", size: 9.5, bold: isBold, color: { argb: "FF1E293B" } };
      cellSTT.alignment = { vertical: "middle", horizontal: "center" };
      cellSTT.border = thinBorder;

      // Công việc
      const cellName = row.getCell(2);
      // Indentation for tree view
      const indentSpaces = task.level > 1 ? "  ".repeat(task.level - 1) : "";
      cellName.value = indentSpaces + task.name;
      cellName.font = {
        name: "Arial",
        size: 9.5,
        bold: isBold,
        italic: isSubParent,
        color: { argb: isMainHeader ? "FF0F172A" : "FF334155" },
      };
      cellName.alignment = { vertical: "middle", horizontal: "left" };
      cellName.border = thinBorder;

      // Người thực hiện
      const cellAssignees = row.getCell(3);
      const assigneesStr = Array.isArray(task.assignees) ? task.assignees.join(", ") : (task.assignees || "");
      cellAssignees.value = assigneesStr;
      cellAssignees.font = { name: "Arial", size: 9.5, color: { argb: "FF1E293B" } };
      cellAssignees.alignment = { vertical: "middle", horizontal: "left" };
      cellAssignees.border = thinBorder;

      // Bắt đầu (dự kiến)
      const cellStart = row.getCell(4);
      cellStart.value = formatDisplayDate(task.startDate);
      cellStart.font = { name: "Arial", size: 9.5, color: { argb: "FF475569" } };
      cellStart.alignment = { vertical: "middle", horizontal: "center" };
      cellStart.border = thinBorder;

      // Kết thúc (dự kiến)
      const cellEnd = row.getCell(5);
      cellEnd.value = formatDisplayDate(task.endDate);
      cellEnd.font = { name: "Arial", size: 9.5, color: { argb: "FF475569" } };
      cellEnd.alignment = { vertical: "middle", horizontal: "center" };
      cellEnd.border = thinBorder;

      // Tình trạng
      const cellStatus = row.getCell(6);
      cellStatus.value = task.status || "";
      cellStatus.font = {
        name: "Arial",
        size: 9.5,
        bold: !!task.status,
        color: {
          argb: task.status === "Hoàn thành"
            ? "FF16A34A"
            : task.status === "Đang Thực Hiện" || task.status === "Đang thực hiện"
            ? "FF2563EB"
            : task.status === "Đang Kế Hoạch" || task.status === "Đang kế hoạch"
            ? "FF475569"
            : "FF64748B",
        },
      };
      cellStatus.alignment = { vertical: "middle", horizontal: "center" };
      cellStatus.border = thinBorder;

      // Ghi chú
      const cellNotes = row.getCell(7);
      cellNotes.value = task.notes || "";
      cellNotes.font = { name: "Arial", size: 9, color: { argb: "FF64748B" } };
      cellNotes.alignment = { vertical: "middle", horizontal: "left" };
      cellNotes.border = thinBorder;
    });

    // Set Column Widths
    sheet.columns = [
      { key: "stt", width: 8 },
      { key: "name", width: 56 },
      { key: "assignees", width: 24 },
      { key: "startDate", width: 18 },
      { key: "endDate", width: 18 },
      { key: "status", width: 18 },
      { key: "notes", width: 28 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = isTemplate
      ? "Mau_Ke_Hoach_Bao_Tri.xlsx"
      : `Ke_Hoach_Bao_Tri_Ky_${cycleNum || 1}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error: any) {
    console.error("Export maintenance plan error:", error);
    return NextResponse.json(
      { error: "Lỗi xuất file Excel: " + (error?.message || "Không xác định") },
      { status: 500 }
    );
  }
}
