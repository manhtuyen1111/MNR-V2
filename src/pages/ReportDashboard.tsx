import { useEffect, useMemo, useState } from "react";
const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  // ===== FETCH DATA =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec"
        );
        const result = await res.json();
        if (result.success) {
          // bỏ dòng rác & Grand Total
          const clean = result.data.filter(
            (r: any) => r.DATE && r.DATE !== "Grand Total"
          );
          setRows(clean);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ===== HEADER KEYS =====
  const headers = rows.length ? Object.keys(rows[0]) : [];

  // ===== TEAMS =====
  const teams = useMemo(() => {
    if (!headers.length) return ["ALL"];

    const found = headers
      .filter((h) => h.includes("TỔ") && h.includes("Số lượng"))
      .map((h) => h.split(" - ")[0]);

    return ["ALL", ...Array.from(new Set(found))];
  }, [headers]);

  // ===== TÍNH SL =====
  const getRowSL = (row: any) => {
    if (selectedTeam === "ALL") {
      return Number(row["Grand Total - Số lượng"] || 0);
    }
    return Number(row[`${selectedTeam} - Số lượng`] || 0);
  };

  // ===== TÍNH GIỜ =====
  const getRowHours = (row: any) => {
    if (selectedTeam === "ALL") {
      return Number(row["Grand Total - Giờ"] || 0);
    }
    return Number(row[`${selectedTeam} - Giờ`] || 0);
  };

  const totalCont = useMemo(() => {
    return rows.reduce((sum, row) => sum + getRowSL(row), 0);
  }, [rows, selectedTeam]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
   <div className="h-screen overflow-hidden bg-slate-100 flex flex-col">

      {/* ===== HEADER ===== */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="p-4">
          <div className="text-lg font-bold text-slate-800">
            📊 Báo cáo Cont 2026
          </div>

          {/* TEAM SELECTOR */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => {
                  setSelectedTeam(team);
                  setExpanded(null);
                }}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedTeam === team
                    ? "bg-indigo-600 text-white shadow-md scale-105"
                    : "bg-white border border-slate-300 text-slate-600"
                }`}
              >
                {team === "ALL" ? "Tất cả" : team}
              </button>
            ))}
          </div>
        </div>

        {/* TOTAL */}
        <div className="border-t px-4 py-3 bg-slate-50">
          <div className="text-center text-xs text-slate-500 uppercase tracking-wide">
            Tổng container
          </div>
          <div className="text-center text-2xl font-bold text-indigo-600">
            {totalCont.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ===== LIST ===== */}
     <div
  className="flex-1 overflow-y-auto p-4 space-y-4"
  style={{
    WebkitOverflowScrolling: "touch",
    paddingBottom: "calc(120px + env(safe-area-inset-bottom))",
  }}
>
        {rows.map((row, index) => {
          const date = row["DATE"];
          const sl = getRowSL(row);
          const hours = getRowHours(row);
          const isOpen = expanded === date;
          const highlight = sl > 70;

          return (
            <div
              key={`${date}-${index}`}
              className={`rounded-2xl border shadow-sm transition ${
                highlight
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-slate-200"
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
                    {sl} cont • {hours} giờ
                  </div>
                </div>

                <div className="text-lg text-slate-400">
                  {isOpen ? "▲" : "▼"}
                </div>
              </button>

              {/* DETAILS */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? "max-h-96 px-4 pb-4" : "max-h-0"
                }`}
              >
                {teams
                  .filter((t) => t !== "ALL")
                  .map((team) => {
                    if (
                      selectedTeam !== "ALL" &&
                      selectedTeam !== team
                    )
                      return null;

                    const teamSL = Number(
                      row[`${team} - Số lượng`] || 0
                    );
                    const teamHours = Number(
                      row[`${team} - Giờ`] || 0
                    );

                    return (
                      <div
                        key={team}
                        className="flex justify-between py-2 border-b last:border-none text-sm"
                      >
                        <span>{team}</span>
                        <span className="font-semibold text-indigo-600">
                          {teamSL} cont • {teamHours} giờ
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
