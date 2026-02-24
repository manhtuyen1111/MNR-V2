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

  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [filterType, setFilterType] =
    useState<FilterType>("TODAY");

  const [showCustomRange, setShowCustomRange] =
    useState(false);

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ===== LẤY DANH SÁCH TỔ =====
  const teams = useMemo(() => {
    if (!rows.length) return [];
    const headers = Object.keys(rows[0]);

    const found = headers
      .filter((h) => h.includes("TỔ"))
      .map((h) => h.split(" - ")[0]);

    return Array.from(new Set(found));
  }, [rows]);

  // ===== FILTER THEO NGÀY =====
  const filteredByDate = useMemo(() => {
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

  // ===== HEADER THEO TỔ =====
  const headers = rows.length ? Object.keys(rows[0]) : [];

  const visibleHeaders = useMemo(() => {
    return headers.filter((h) => {
      if (h === "DATE") return true;
      if (h.includes("Grand")) return true;
      if (selectedTeam === "ALL") return true;
      return h.startsWith(selectedTeam);
    });
  }, [headers, selectedTeam]);

  // ===== TỔNG CONT =====
  const totalCont = useMemo(() => {
    return filteredByDate.reduce((sum, row) => {
      const value =
        selectedTeam === "ALL"
          ? Number(row["Grand Total"] || 0)
          : visibleHeaders
              .filter((h) => h !== "DATE")
              .reduce(
                (teamSum, h) =>
                  teamSum + Number(row[h] || 0),
                0
              );

      return sum + value;
    }, 0);
  }, [filteredByDate, selectedTeam, visibleHeaders]);

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

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-[13px] overflow-hidden">

      {/* ===== FILTER AREA ===== */}
      <div className="p-4 bg-white border-b space-y-4 shadow-sm">

        {/* Chọn tổ */}
        <div>
          <label className="block mb-1 font-semibold text-slate-600">
            Chọn tổ
          </label>
          <select
            value={selectedTeam}
            onChange={(e) =>
              setSelectedTeam(e.target.value)
            }
            className="border px-3 py-2 rounded w-full"
          >
            <option value="ALL">Tất cả tổ</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {/* Bộ lọc thời gian */}
        <div>
          <label className="block mb-2 font-semibold text-slate-600">
            Chọn thời gian
          </label>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Hôm nay", value: "TODAY" },
              { label: "Hôm qua", value: "YESTERDAY" },
              { label: "Tháng này", value: "THIS_MONTH" },
              { label: "Tháng trước", value: "LAST_MONTH" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => {
                  setFilterType(
                    btn.value as FilterType
                  );
                  setShowCustomRange(false);
                }}
                className={`px-3 py-2 rounded border transition ${
                  filterType === btn.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-slate-100"
                }`}
              >
                {btn.label}
              </button>
            ))}

            <button
              onClick={() => {
                setFilterType("RANGE");
                setShowCustomRange(true);
              }}
              className={`px-3 py-2 rounded border transition ${
                showCustomRange
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              Tùy chọn
            </button>
          </div>

          {showCustomRange && (
            <div className="flex gap-2 mt-3">
              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
                className="border px-3 py-2 rounded w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* ===== TOTAL ===== */}
      <div className="p-3 bg-yellow-50 border-b font-semibold text-red-600">
        Tổng số cont sửa: {totalCont}
      </div>

      {/* ===== TABLE ===== */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              {visibleHeaders.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 border-b text-left whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredByDate.map((row, i) => {
              const isTotal =
                row["DATE"]
                  ?.toString()
                  .toLowerCase()
                  .includes("total");

              return (
                <tr
                  key={i}
                  className={`border-b ${
                    isTotal
                      ? "font-bold text-red-600 bg-red-50"
                      : ""
                  }`}
                >
                  {visibleHeaders.map((h) => (
                    <td
                      key={h}
                      className="px-3 py-2 whitespace-nowrap"
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
