import { useEffect, useState, useMemo } from "react";

const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec")
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setRows(result.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ===== LẤY DANH SÁCH TỔ =====
  const teams = useMemo(() => {
    if (!rows.length) return [];

    const headers = Object.keys(rows[0]);
    const teamNames = headers
      .filter(h => h.includes("TỔ"))
      .map(h => h.split(" - ")[0]);

    return [...new Set(teamNames)];
  }, [rows]);

  // ===== LỌC DỮ LIỆU =====
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const rowDate = row["DATE"];

      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;

      return true;
    });
  }, [rows, fromDate, toDate]);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Đang tải báo cáo...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-6 text-center text-slate-400">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 text-[12px]">

      {/* ===== FILTER ===== */}
      <div className="p-3 bg-white border-b space-y-2">

        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
        </div>

      </div>

      {/* ===== TABLE ===== */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              {Object.keys(rows[0]).map(h => (
                <th
                  key={h}
                  className="px-2 py-2 border-b text-left whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, i) => {
              const isTotal =
                row["DATE"]?.toString().toLowerCase().includes("total");

              return (
                <tr
                  key={i}
                  className={`border-b ${
                    isTotal ? "font-bold text-red-600 bg-red-50" : ""
                  }`}
                >
                  {Object.keys(row).map(h => (
                    <td
                      key={h}
                      className="px-2 py-2 whitespace-nowrap"
                    >
                      {row[h]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportDashboard;
