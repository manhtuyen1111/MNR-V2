import { useEffect, useMemo, useState } from "react";

const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  const headers = rows.length ? Object.keys(rows[0]) : [];

  // ===== TEAMS =====
  const teams = useMemo(() => {
    if (!rows.length) return ["ALL"];

    const found = headers
      .filter((h) => h.includes("TỔ") && h.includes("SL"))
      .map((h) => h.split(" - ")[0]);

    return ["ALL", ...Array.from(new Set(found))];
  }, [rows]);

  const selectedTeam = teams[selectedIndex];

  // ===== TÍNH SL (CONT) =====
  const getRowTotalSL = (row: any) => {
    if (selectedTeam === "ALL") {
      return Number(row["Grand Total - SL"] || 0);
    }

    return Number(row[`${selectedTeam} - SL`] || 0);
  };

  // ===== TÍNH GIỜ =====
  const getRowTotalHours = (row: any) => {
    if (selectedTeam === "ALL") {
      return Number(row["Grand Total - Giờ"] || 0);
    }

    return Number(row[`${selectedTeam} - Giờ`] || 0);
  };

  const totalCont = useMemo(() => {
    return rows.reduce(
      (sum, row) => sum + getRowTotalSL(row),
      0
    );
  }, [rows, selectedTeam]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-100">

      {/* HEADER */}
      <div className="bg-white shadow p-4 sticky top-0 z-50">
        <div className="text-lg font-bold text-slate-800">
          📊 Báo cáo Cont 2026
        </div>

        {/* TEAM SELECTOR */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {teams.map((team, index) => (
            <button
              key={team}
              onClick={() => {
                setSelectedIndex(index);
                setExpanded(null);
              }}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                selectedIndex === index
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {team === "ALL" ? "Tất cả" : team}
            </button>
          ))}
        </div>
      </div>

      {/* TOTAL BAR */}
      <div className="bg-indigo-600 text-white text-center py-3 font-semibold shadow-md">
        Tổng: {totalCont.toLocaleString()} cont
      </div>

      {/* CARD LIST */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {rows.map((row, index) => {
          const date = row["DATE"];
          const totalSL = getRowTotalSL(row);
          const totalHours = getRowTotalHours(row);
          const isOpen = expanded === date;
          const highlight = totalSL > 70;

          return (
            <div
              key={index}
              className={`rounded-2xl shadow transition ${
                highlight
                  ? "bg-red-50 border border-red-200"
                  : "bg-white"
              }`}
            >
              {/* HEADER CARD */}
              <button
                onClick={() =>
                  setExpanded(isOpen ? null : date)
                }
                className="w-full p-4 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-700">
                    📅 {date}
                  </div>
                  <div className="text-sm text-slate-500">
                    {totalSL} cont • {totalHours} giờ
                  </div>
                </div>

                <div className="text-xl">
                  {isOpen ? "▲" : "▼"}
                </div>
              </button>

              {/* DETAILS */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-96 px-4 pb-4" : "max-h-0"
                }`}
              >
                {teams
                  .filter((t) => t !== "ALL")
                  .map((team) => {
                    const sl = Number(
                      row[`${team} - SL`] || 0
                    );
                    const hours = Number(
                      row[`${team} - Giờ`] || 0
                    );

                    if (
                      selectedTeam !== "ALL" &&
                      selectedTeam !== team
                    )
                      return null;

                    return (
                      <div
                        key={team}
                        className="flex justify-between py-2 border-b last:border-none text-sm"
                      >
                        <span>{team}</span>
                        <span className="font-semibold text-indigo-600">
                          {sl} cont • {hours} giờ
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportDashboard;
