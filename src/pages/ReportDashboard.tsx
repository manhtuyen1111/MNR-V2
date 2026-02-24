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
  const [rangeType, setRangeType] = useState("MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expanded, setExpanded] = useState<string | null>(null);

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
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-3 py-3 space-y-2.5">
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            📊 BÁO CÁO TỔNG HỢP MNR MATRAN 2026
          </h1>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-slate-500 whitespace-nowrap">👥</span>
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => {
                  setSelectedTeam(team);
                  setExpanded(null);
                }}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all touch-manipulation ${
                  selectedTeam === team
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                {team === "ALL" ? "Tất cả" : team}
              </button>
            ))}
          </div>

          {/* Bộ lọc thời gian dạng dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-600">Khoảng thời gian</label>
            <select
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="TODAY">Hôm nay</option>
              <option value="7D">7 ngày</option>
              <option value="30D">30 ngày</option>
              <option value="MONTH">Tháng này</option>
              <option value="ALL">Tất cả</option>
              <option value="CUSTOM">Tùy chọn</option>
            </select>

            {rangeType === "CUSTOM" && (
              <div className="flex gap-2 mt-1">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-50 border-t border-indigo-100 px-3 py-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-[10px] text-indigo-700 uppercase font-medium">
                📦 Tổng cont
              </div>
              <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
                {totalContainers.toLocaleString("vi-VN")}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-indigo-700 uppercase font-medium">
                ⏰ Tổng giờ
              </div>
              <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
                {formatNumber(totalHours)}h
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 pb-24">
        {filteredDates.length === 0 ? (
          <div className="text-center text-slate-500 py-10 text-sm">
            Không có dữ liệu
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
                className={`rounded-xl border shadow-sm transition-all ${
                  isHigh
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : date)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left touch-manipulation"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-slate-500 text-base">📅</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm truncate">
                        {formatDateDisplay(date)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-700 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        {dayContainers}
                        <span className="text-indigo-500">📦</span>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="flex items-center gap-1">
                        {formatNumber(dayHours)}
                        <span className="text-indigo-500">⏰</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-slate-400 text-base ml-2">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3 pt-1 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                    {Object.entries(day)
                      .filter(
                        ([team]) =>
                          selectedTeam === "ALL" || selectedTeam === team
                      )
                      .map(([team, value]) => (
                        <div
                          key={team}
                          className="flex justify-between items-center py-2 text-xs border-b border-slate-200 last:border-0"
                        >
                          <span className="text-slate-700 font-medium">
                            {team}
                          </span>
                          <span className="text-indigo-600 font-semibold flex items-center gap-2">
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
