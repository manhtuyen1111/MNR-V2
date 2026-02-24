import { useEffect, useMemo, useState } from "react";

type FilterType =
  | "TODAY"
  | "YESTERDAY"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "RANGE";

const formatDate = (date: Date) =>
  date.toISOString().split("T")[0];

const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] =
    useState<FilterType>("TODAY");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ===== FETCH DATA =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec"
        );
        const result = await res.json();
        if (result.success) setRows(result.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ===== FILTER LOGIC =====
  const filteredRows = useMemo(() => {
    if (!rows.length) return [];

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const firstThisMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const firstLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    const lastLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );

    return rows.filter((row) => {
      const rowDate = row["DATE"];
      if (!rowDate) return false;

      switch (filterType) {
        case "TODAY":
          return rowDate === formatDate(today);

        case "YESTERDAY":
          return rowDate === formatDate(yesterday);

        case "THIS_MONTH":
          return rowDate >= formatDate(firstThisMonth);

        case "LAST_MONTH":
          return (
            rowDate >= formatDate(firstLastMonth) &&
            rowDate <= formatDate(lastLastMonth)
          );

        case "RANGE":
          if (fromDate && rowDate < fromDate) return false;
          if (toDate && rowDate > toDate) return false;
          return true;

        default:
          return true;
      }
    });
  }, [rows, filterType, fromDate, toDate]);

  // ===== TOTAL GRAND =====
  const totalCont = useMemo(() => {
    return filteredRows.reduce((sum, row) => {
      const value = Number(row["Grand Total"] || 0);
      return sum + value;
    }, 0);
  }, [filteredRows]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Đang tải báo cáo...
      </div>
    );

  if (!rows.length)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Không có dữ liệu
      </div>
    );

  const headers = Object.keys(rows[0]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-[12px] overflow-hidden">

      {/* ===== FILTER ===== */}
      <div className="p-3 bg-white border-b space-y-3">

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Hôm nay", value: "TODAY" },
            { label: "Hôm qua", value: "YESTERDAY" },
            { label: "Tháng này", value: "THIS_MONTH" },
            { label: "Tháng trước", value: "LAST_MONTH" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterType(btn.value as FilterType)}
              className={`px-2 py-1 rounded border ${
                filterType === btn.value
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFilterType("RANGE");
              setFromDate(e.target.value);
            }}
            className="border px-2 py-1 rounded w-full"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setFilterType("RANGE");
              setToDate(e.target.value);
            }}
            className="border px-2 py-1 rounded w-full"
          />
        </div>
      </div>

      {/* ===== TOTAL ===== */}
      <div className="p-2 bg-yellow-50 border-b font-semibold text-red-600">
        Tổng số cont sửa: {totalCont}
      </div>

      {/* ===== TABLE ===== */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              {headers.map((h) => (
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
                    isTotal
                      ? "font-bold text-red-600 bg-red-50"
                      : ""
                  }`}
                >
                  {headers.map((h) => (
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
