import { useEffect, useMemo, useState } from "react";

const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const headers = rows.length ? Object.keys(rows[0]) : [];

  // ===== FILTER THEO TỔ =====
  const filteredRows = useMemo(() => {
    let data = rows;

    if (search) {
      data = data.filter((row) =>
        row["DATE"]
          ?.toString()
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    return data;
  }, [rows, search]);

  const getRowTotal = (row: any) => {
    if (selectedTeam === "ALL") {
      return Number(row["Grand Total"] || 0);
    }

    return headers
      .filter((h) => h.startsWith(selectedTeam))
      .reduce(
        (sum, h) => sum + Number(row[h] || 0),
        0
      );
  };

  const totalCont = useMemo(() => {
    return filteredRows.reduce(
      (sum, row) => sum + getRowTotal(row),
      0
    );
  }, [filteredRows, selectedTeam]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Đang tải...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-50">

      {/* HEADER APP STYLE */}
      <div className="bg-white shadow-sm p-4 space-y-3">
        <div className="text-lg font-bold text-slate-800">
          📊 Báo cáo Cont
        </div>

        <input
          placeholder="Tìm theo ngày..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="ALL">Tất cả tổ</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      {/* TOTAL FLOAT */}
      <div className="bg-indigo-600 text-white text-center py-3 font-semibold shadow">
        Tổng: {totalCont.toLocaleString()} cont
      </div>

      {/* LIST CARD */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {filteredRows.map((row, index) => {
          const date = row["DATE"];
          const total = getRowTotal(row);
          const isOpen = expanded === date;

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm overflow-hidden transition-all"
            >
              {/* CARD HEADER */}
              <button
                onClick={() =>
                  setExpanded(isOpen ? null : date)
                }
                className="w-full text-left p-4 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-700">
                    📅 {date}
                  </div>
                  <div className="text-sm text-slate-500">
                    Tổng: {total} cont
                  </div>
                </div>

                <div className="text-xl">
                  {isOpen ? "▲" : "▼"}
                </div>
              </button>

              {/* DETAIL */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? "max-h-96 p-4 pt-0" : "max-h-0"
                }`}
              >
                {headers
                  .filter((h) =>
                    selectedTeam === "ALL"
                      ? h.includes("TỔ")
                      : h.startsWith(selectedTeam)
                  )
                  .map((h) => (
                    <div
                      key={h}
                      className="flex justify-between py-1 text-sm"
                    >
                      <span>{h}</span>
                      <span className="font-semibold text-indigo-600">
                        {row[h]}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportDashboard;
