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

  const teams = useMemo(() => {
    if (!rows.length) return ["ALL"];

    const found = headers
      .filter((h) => h.includes("TỔ"))
      .map((h) => h.split(" - ")[0]);

    return ["ALL", ...Array.from(new Set(found))];
  }, [rows]);

  const selectedTeam = teams[selectedIndex];

  const getRowTotal = (row: any) => {
    if (selectedTeam === "ALL")
      return Number(row["Grand Total"] || 0);

    return headers
      .filter((h) => h.startsWith(selectedTeam))
      .reduce(
        (sum, h) => sum + Number(row[h] || 0),
        0
      );
  };

  const totalCont = useMemo(() => {
    return rows.reduce(
      (sum, row) => sum + getRowTotal(row),
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

      {/* APP HEADER */}
      <div className="bg-white shadow p-4 sticky top-0 z-50">
        <div className="text-lg font-bold text-slate-800">
          📊 Báo cáo Cont
        </div>

        {/* SWIPE TEAM SELECTOR */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {teams.map((team, index) => (
            <button
              key={team}
              onClick={() => {
                setSelectedIndex(index);
                setExpanded(null);
              }}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition ${
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

      {/* FLOATING TOTAL */}
      <div className="bg-indigo-600 text-white text-center py-3 font-semibold shadow-md">
        Tổng: {totalCont.toLocaleString()} cont
      </div>

      {/* CARD LIST */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {rows.map((row, index) => {
          const date = row["DATE"];
          const total = getRowTotal(row);
          const isOpen = expanded === date;
          const highlight = total > 100;

          return (
            <div
              key={index}
              className={`rounded-2xl shadow transition-all ${
                highlight
                  ? "bg-red-50 border border-red-200"
                  : "bg-white"
              }`}
            >
              {/* CARD HEADER */}
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
                    {total} cont
                  </div>
                </div>

                <div className="text-xl transition-transform duration-300">
                  {isOpen ? "▲" : "▼"}
                </div>
              </button>

              {/* DETAILS */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-96 px-4 pb-4" : "max-h-0"
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
                      className="flex justify-between py-2 text-sm border-b last:border-none"
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
