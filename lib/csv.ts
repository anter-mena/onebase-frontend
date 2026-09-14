// Builds a CSV file in the browser and downloads it, the same way the clients table exports.
// Every value is quoted, so commas and quotes inside values stay safe.
export function downloadCsv(filename: string, headings: readonly string[], rows: readonly (readonly (string | number)[])[]) {
  const csv = [headings, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
