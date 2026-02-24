import { useEffect, useMemo, useState } from "react";

type TeamData = {
  containers: number;
  hours: number;
};

type ReportData = {
  [date: string]: {
    [team: string]: TeamData;
  };
};

const ReportDashboard = () => {
  const [data, setData] = useState<ReportData>({});
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [rangeType, setRangeType] = useState("7D");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expanded, setExpanded] = useState<string | null>(null);

  // ===== FETCH =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec");
        const result = await res.json();
        if (result.success) {
          setData(result.data || {});
        }
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
    const set = new Set<string>();
    Object.values(data).forEach(day =>
      Object.keys(day).forEach(team => set.add(team))
    );
    return ["ALL", ...Array.from(set)];
  }, [data]);

  // ===== DATE FILTER =====
  const filteredDates = useMemo(() => {
    const allDates = Object.keys(data).sort((a, b) =>
      b.localeCompare(a)
    );

    const today = new Date();

    if (rangeType === "ALL") return allDates;

    if (rangeType === "CUSTOM" && fromDate && toDate) {
      return allDates.filter(d => d >= fromDate && d <= toDate);
    }

    let compareDate = new Date();

    if (rangeType === "TODAY") {
      compareDate = today;
    } else if (rangeType === "7D") {
      compareDate.setDate(today.getDate() - 7);
    } else if (rangeType === "30D") {
      compareDate.setDate(today.getDate() - 30);
    } else if (rangeType === "MONTH") {
      compareDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const compareStr = compareDate.toISOString().slice(0, 10);

    return allDates.filter(d => d >= compareStr);
  }, [data, rangeType, fromDate, toDate]);

  // ===== TOTAL =====
  const totalContainers = useMemo(() => {
    let total = 0;

    filteredDates.forEach(date => {
      const day = data[date];
      Object.entries(day).forEach(([team, value]) => {
        if (selectedTeam === "ALL" || selectedTeam === team) {
          total += value.containers;
        }
      });
    });

    return total;
  }, [filteredDates, data, selectedTeam]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 flex flex-col">

      {/* HEADER */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="p-4 space-y-4">

          <div className="text-lg font-bold text-slate-800">
            📊 Báo cáo Cont 2026
          </div>

          {/* TEAM FILTER */}
          <div className="flex gap-2 overflow-x-auto">
            {teams.map(team => (
              <button
                key={team}
                onClick={() => {
                  setSelectedTeam(team);
                  setExpanded(null);
                }}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  selectedTeam === team
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-300 text-slate-600"
                }`}
              >
                {team === "ALL" ? "Tất cả" : team}
              </button>
            ))}
          </div>

          {/* TIME FILTER */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "TODAY", label: "Hôm nay" },
              { key: "7D", label: "7 ngày" },
              { key: "30D", label: "30 ngày" },
              { key: "MONTH", label: "Tháng này" },
              { key: "ALL", label: "Tất cả" },
              { key: "CUSTOM", label: "Tuỳ chọn" }
            ].map(r => (
              <button
                key={r.key}
                onClick={() => setRangeType(r.key)}
                className={`px-3 py-1 rounded-full text-xs ${
                  rangeType === r.key
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* CUSTOM RANGE */}
          {rangeType === "CUSTOM" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
          )}

        </div>

        {/* TOTAL */}
        <div className="border-t px-4 py-3 bg-slate-50">
          <div className="text-center text-xs text-slate-500 uppercase">
            Tổng container
          </div>
          <div className="text-center text-2xl font-bold text-indigo-600">
            {totalContainers}
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredDates.map(date => {
          const day = data[date];

          let dayContainers = 0;
          let dayHours = 0;

          Object.entries(day).forEach(([team, value]) => {
            if (selectedTeam === "ALL" || selectedTeam === team) {
              dayContainers += value.containers;
              dayHours += value.hours;
            }
          });

          if (dayContainers === 0) return null;

          const isOpen = expanded === date;
          const highlight = dayContainers > 70;

          return (
            <div
              key={date}
              className={`rounded-2xl border shadow-sm ${
                highlight
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-slate-200"
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : date)}
                className="w-full p-4 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-700">
                    📅 {date}
                  </div>
                  <div className="text-sm text-slate-500">
                    {dayContainers} cont • {dayHours} giờ
                  </div>
                </div>
                <div>{isOpen ? "▲" : "▼"}</div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  {Object.entries(day).map(([team, value]) => {
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
                          {value.containers} cont • {value.hours} giờ
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportDashboard;
