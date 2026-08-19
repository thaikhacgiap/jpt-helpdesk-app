export interface ParsedRow {
  code: string;
  name: string;
  ten_tieng_anh?: string;
  tax_code?: string;
  address?: string;
}

export function parseCustomerCSV(csvText: string): ParsedRow[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Helper to split CSV line handling quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headerRow = parseLine(lines[0]);
  const headers = headerRow.map(h => h.toLowerCase().trim());
  const getIndex = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

  let codeIdx = getIndex(["mã khách hàng", "ma khach hang", "code", "mã kh"]);
  let fullNameIdx = getIndex(["tên khách hàng", "ten khach hang", "tên công ty", "ten cong ty"]);
  let displayIdx = getIndex(["tên hiển thị", "ten hien thi", "name"]);
  let taxIdx = getIndex(["mã số thuế", "ma so thue", "mst", "tax"]);
  let addressIdx = getIndex(["địa chỉ", "dia chi", "address"]);
  let engIdx = getIndex(["tên tiếng anh", "ten tieng anh", "english name"]);

  if (codeIdx < 0) codeIdx = 0;
  if (fullNameIdx < 0) fullNameIdx = 1;
  if (displayIdx < 0) displayIdx = 2;

  const results: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    const fullName = String(row[fullNameIdx] ?? "").trim();
    const displayName = String(row[displayIdx] ?? "").trim();
    const name = fullName || displayName;
    if (!name) continue;

    const code = String(row[codeIdx] ?? "").trim();
    const tax_code = taxIdx >= 0 ? String(row[taxIdx] ?? "").trim() : "";
    const address = addressIdx >= 0 ? String(row[addressIdx] ?? "").trim() : "";
    const ten_tieng_anh = engIdx >= 0 ? String(row[engIdx] ?? "").trim() : "";

    results.push({ code, name, ten_tieng_anh, tax_code, address });
  }

  return results;
}
