import { useEffect, useMemo, useState } from "react";

type SortDirection = "asc" | "desc" | null;

const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(null);

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

  // ===== TEAMS =====
  const teams = useMemo(() => {
    if (!rows.length) return [];
    const headers = Object.keys(rows[0]);
    const found = headers
      .filter((h) => h.includes("TỔ"))
      .map((h) => h.split(" - ")[0]);
    return Array.from(new Set(found));
  }, [rows]);

  const headers = rows.length ? Object.keys(rows[0]) : [];

  const visibleHeaders = useMemo(() => {
    return headers.filter((h) => {
      if (h === "DATE") return true;
      if (h === "SL") return true;
      if (h.includes("Grand")) return true;
      if (selectedTeam === "ALL") return true;
      return h.startsWith(selectedTeam);
    });
  }, [headers, selectedTeam]);

  // ===== SEARCH =====
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    return rows.filter((row) =>
      visibleHeaders.some((h) =>
        String(row[h] || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [rows, search, visibleHeaders]);

  // ===== SORT =====
  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === "asc"
          ? numA - numB
          : numB - numA;
      }

      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else {
      setSortDirection(
        sortDirection === "asc" ? "desc" : "asc"
      );
    }
  };

  // ===== KPI =====
  const totalCont = useMemo(() => {
    return sortedRows.reduce(
      (sum, row) => sum + Number(row["Grand Total"] || 0),
      0
    );
  }, [sortedRows]);

  const totalSL = useMemo(() => {
    return sortedRows.reduce(
      (sum, row) => sum + Number(row["SL"] || 0),
      0
    );
  }, [sortedRows]);

  const avgPerDay =
    sortedRows.length > 0
      ? Math.round(totalCont / sortedRows.length)
      : 0;

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400 text-lg">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-50">

      {/* HEADER */}
      <div className="p-4 bg-white shadow-sm border-b flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <h1 className="text-xl font-bold text-slate-700">
          Dashboard Cont Sửa PRO
        </h1>

        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded shadow-sm"
          />

          <select
            value={selectedTeam}
            onChange={(e) =>
              setSelectedTeam(e.target.value)
            }
            className="border px-3 py-2 rounded shadow-sm"
          >
            <option value="ALL">Tất cả tổ</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white border-b">
        <KpiCard title="Tổng cont" value={totalCont} />
        <KpiCard title="Tổng SL" value={totalSL} />
        <KpiCard
          title="Số ngày"
          value={sortedRows.length}
        />
        <KpiCard
          title="Trung bình/ngày"
          value={avgPerDay}
        />
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-100 z-10">
            <tr>
              {visibleHeaders.map((h) => (
                <th
                  key={h}
                  onClick={() => handleSort(h)}
                  className="px-4 py-3 border-b cursor-pointer hover:bg-slate-200 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                className="border-b hover:bg-slate-50"
              >
                {visibleHeaders.map((h) => {
                  const value = row[h];
                  const num = Number(value);

                  return (
                    <td
                      key={h}
                      className={`px-4 py-2 whitespace-nowrap ${
                        num > 100
                          ? "text-red-600 font-semibold"
                          : ""
                      }`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const KpiCard = ({
  title,
  value,
}: {
  title: string;
  value: number;
}) => (
  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded shadow-sm">
    <div className="text-sm text-slate-500">
      {title}
    </div>
    <div className="text-2xl font-bold text-indigo-600">
      {value.toLocaleString()}
    </div>
  </div>
);

export default ReportDashboard;
