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

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec"
        );
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

  const formatNumber = (num: number) => num.toFixed(1);

  const formatDateDisplay = (dateStr: string) => {
    const [, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  };

  const teams = useMemo(() => {
    const set = new Set<string>();
    Object.values(data).forEach((day) =>
      Object.keys(day).forEach((team) => set.add(team))
    );
    return ["ALL", ...Array.from(set).sort()];
  }, [data]);

  const filteredDates = useMemo(() => {
    const allDates = Object.keys(data).sort((a, b) => b.localeCompare(a));
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (rangeType === "ALL") return allDates;
    if (rangeType === "TODAY") return allDates.filter((d) => d === todayStr);

    let compareDate = new Date();

    if (rangeType === "7D") compareDate.setDate(today.getDate() - 7);
    else if (rangeType === "30D") compareDate.setDate(today.getDate() - 30);
    else if (rangeType === "MONTH")
      compareDate = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (rangeType === "CUSTOM" && fromDate && toDate)
      return allDates.filter((d) => d >= fromDate && d <= toDate);

    const compareStr = compareDate.toISOString().slice(0, 10);
    return allDates.filter((d) => d >= compareStr);
  }, [data, rangeType, fromDate, toDate]);

  const { totalContainers, totalHours } = useMemo(() => {
    let containers = 0;
    let hours = 0;

    filteredDates.forEach((date) => {
      const day = data[date] || {};
      Object.entries(day).forEach(([team, val]) => {
        if (selectedTeam === "ALL" || selectedTeam === team) {
          containers += val.containers;
          hours += val.hours;
        }
      });
    });

    return { totalContainers: containers, totalHours: hours };
  }, [filteredDates, data, selectedTeam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-lg">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white sticky top-0 z-10 shadow-md">
        <div className="px-3.5 pt-3.5 pb-2.5 space-y-3">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            📊 Báo cáo Container 2026
          </h1>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-sm text-slate-500 whitespace-nowrap">👥</span>
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => {
                  setSelectedTeam(team);
                  setExpanded(null);
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedTeam === team
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                }`}
              >
                {team === "ALL" ? "Tất cả" : team}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "TODAY", label: "Hôm nay" },
              { key: "7D", label: "7 ngày" },
              { key: "30D", label: "30 ngày" },
              { key: "MONTH", label: "Tháng này" },
              { key: "ALL", label: "Tất cả" },
              { key: "CUSTOM", label: "Tùy chọn" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeType(r.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  rangeType === r.key
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-300 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {rangeType === "CUSTOM" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1.5 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1.5 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* TỔNG */}
        <div className="bg-indigo-50 border-t border-indigo-100 px-3.5 py-3.5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-indigo-700 uppercase font-medium tracking-wide">
                📦 Tổng container
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-1">
                {totalContainers.toLocaleString("vi-VN")}
              </div>
            </div>

            <div>
              <div className="text-xs text-indigo-700 uppercase font-medium tracking-wide">
                ⏰ Tổng giờ công
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-1">
                {formatNumber(totalHours)}h
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* DANH SÁCH NGÀY - CHỈ 1 DÒNG */}
      <main className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 pb-10">
        {filteredDates.length === 0 ? (
          <div className="text-center text-slate-500 py-12 text-base">
            Không có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          filteredDates.map((date) => {
            const day = data[date] || {};
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
            const isHigh = dayContainers >= 70;

            return (
              <div
                key={date}
                className={`rounded-2xl border shadow-sm transition-all ${
                  isHigh
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : date)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500 text-base">📅</span>
                    <div>
                      <div className="font-semibold text-slate-800 text-base">
                        {formatDateDisplay(date)}
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        {dayContainers} cont • {formatNumber(dayHours)}h
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-lg font-bold">
                    {isOpen ? "🔼" : "🔽"}
                  </span>
                </button>

                {/* CHI TIẾT CHỈ HIỆN KHI EXPAND */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    {Object.entries(day)
                      .filter(
                        ([team]) =>
                          selectedTeam === "ALL" || selectedTeam === team
                      )
                      .map(([team, value]) => (
                        <div
                          key={team}
                          className="flex justify-between items-center py-2.5 text-sm border-b border-slate-200 last:border-0"
                        >
                          <span className="text-slate-700 font-medium">
                            {team}
                          </span>
                          <span className="text-indigo-600 font-semibold flex items-center gap-1.5">
                            {value.containers} 📦 • {formatNumber(value.hours)} ⏰
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default ReportDashboard;
