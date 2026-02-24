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

  // ===== VISIBLE HEADERS =====
  const visibleHeaders = useMemo(() => {
    return headers.filter((h) => {
      if (h === "DATE") return true;
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

  // ===== TOTAL CONT (1 cont = 1 SL) =====
  const totalCont = useMemo(() => {
    return sortedRows.reduce((sum, row) => {
      if (selectedTeam === "ALL") {
        return sum + Number(row["Grand Total"] || 0);
      }

      return (
        sum +
        visibleHeaders
          .filter((h) => h !== "DATE")
          .reduce(
            (teamSum, h) =>
              teamSum + Number(row[h] || 0),
            0
          )
      );
    }, 0);
  }, [sortedRows, selectedTeam, visibleHeaders]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-[12px]">

      {/* HEADER */}
      <div className="p-3 bg-white border-b shadow-sm space-y-2">
        <div className="text-base font-bold text-slate-700">
          Báo cáo Cont
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Tìm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-2 py-1 rounded w-full text-sm"
          />

          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          >
            <option value="ALL">Tất cả</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI MINI */}
      <div className="grid grid-cols-1 p-2 bg-white border-b">
        <div className="bg-slate-100 p-2 rounded text-center">
          <div className="text-[11px] text-slate-500">
            Tổng cont (SL)
          </div>
          <div className="text-base font-bold text-indigo-600">
            {totalCont.toLocaleString()}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <table className="text-[12px]">
            <thead className="sticky top-0 bg-slate-100 z-20">
              <tr>
                {visibleHeaders.map((h, index) => (
                  <th
                    key={h}
                    onClick={() => handleSort(h)}
                    className={`px-3 py-2 border-b whitespace-nowrap cursor-pointer ${
                      index === 0
                        ? "sticky left-0 bg-slate-100 z-30"
                        : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedRows.map((row, i) => (
                <tr key={i} className="border-b">
                  {visibleHeaders.map((h, index) => {
                    const value = row[h];
                    const num = Number(value);

                    return (
                      <td
                        key={h}
                        className={`px-3 py-2 whitespace-nowrap ${
                          index === 0
                            ? "sticky left-0 bg-white z-10 font-medium"
                            : ""
                        } ${
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
    </div>
  );
};

export default ReportDashboard;
