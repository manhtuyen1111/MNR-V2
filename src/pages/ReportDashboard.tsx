import { useEffect, useMemo, useState } from "react";

type TeamData = {
  containers: number;
  hours: number;
  details: {
    container: string;
    hours: number;
    link: string | null;
  }[];
};

type ReportData = {
  [date: string]: {
    [team: string]: TeamData;
  };
};

const teamOrder = ["TỔ 1", "TỔ 2", "TỔ 3", "TỔ 4"];

const ReportDashboard = () => {
  const [data, setData] = useState<ReportData>({});
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [rangeType, setRangeType] = useState("TODAY");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

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
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatNumber = (num: number) => num.toFixed(1);

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [, month, day] = parts;
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
    if (rangeType === "YESTERDAY") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      return allDates.filter((d) => d === yesterdayStr);
    }

    let compareDate = new Date();

    if (rangeType === "7D") compareDate.setDate(today.getDate() - 7);
    else if (rangeType === "30D") compareDate.setDate(today.getDate() - 30);
    else if (rangeType === "THIS_MONTH")
      compareDate = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (rangeType === "LAST_MONTH") {
      compareDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return allDates.filter((d) => d >= compareDate.toISOString().slice(0, 10) && d <= lastMonthEnd.toISOString().slice(0, 10));
    } else if (rangeType === "CUSTOM" && fromDate && toDate)
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
          containers += val.containers || 0;
          hours += val.hours || 0;
        }
      });
    });

    return { totalContainers: containers, totalHours: hours };
  }, [filteredDates, data, selectedTeam]);

 if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6">
      {/* Con mèo chính - wave cute */}
      <div className="text-9xl mb-8 animate-wave transform-gpu">
        😼🐱
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-indigo-700 mb-4 text-center drop-shadow-md">
        Đang mèo mắn dữ liệu nè...
      </h2>

      <p className="text-lg text-slate-600 mb-8 text-center max-w-md">
        Chờ chút xíu thôi nha, mèo đang chạy siêu tốc để mang container về cho cậu đây~ 🚀🐾
      </p>

      {/* Thanh progress cute gradient */}
      <div className="w-80 sm:w-96 h-4 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar"
        ></div>
      </div>

      {/* Các icon nhỏ nhảy nhót xung quanh */}
      <div className="mt-10 flex gap-6">
        <span className="text-4xl animate-bounce" style={{ animationDelay: "0.1s" }}>📦</span>
        <span className="text-4xl animate-bounce" style={{ animationDelay: "0.3s" }}>⏳</span>
        <span className="text-4xl animate-bounce" style={{ animationDelay: "0.5s" }}>✨</span>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(15deg) scale(1.1); }
          75% { transform: rotate(-15deg) scale(1.1); }
        }
        .animate-wave {
          animation: wave 2.2s infinite ease-in-out;
          transform-origin: bottom center;
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-loading-bar {
          animation: loading-bar 3s infinite linear;
          width: 40%;
        }
      `}</style>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-[15px]">
      <header className="bg-slate-200 sticky top-0 z-20 shadow-md px-4 py-4 space-y-3">
        <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          {/* Cube SVG inline */}
          <svg
            className="h-6 w-6 text-indigo-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          BÁO CÁO TỔNG HỢP
        </h1>

        {/* Range selector - Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={rangeType}
            onChange={(e) => {
              setRangeType(e.target.value);
              if (e.target.value !== "CUSTOM") {
                setFromDate("");
                setToDate("");
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-400 text-slate-900 hover:bg-slate-200 transition"
          >
            <option value="TODAY">Hôm nay</option>
            <option value="YESTERDAY">Hôm qua</option>
            <option value="7D">7 ngày</option>
            <option value="30D">30 ngày</option>
            <option value="THIS_MONTH">Tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
            <option value="CUSTOM">Custom</option>
            <option value="ALL">Tất cả</option>
          </select>

          {rangeType === "CUSTOM" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-white border border-slate-400 text-slate-900"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-white border border-slate-400 text-slate-900"
              />
            </div>
          )}
        </div>

        {/* Team filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {teams.map((team) => (
            <button
              key={team}
              onClick={() => {
                setSelectedTeam(team);
                setExpandedDate(null);
                setExpandedTeam(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                selectedTeam === team
                  ? "bg-indigo-700 text-white shadow-md"
                  : "bg-white border border-slate-400 text-slate-900 hover:bg-slate-200"
              }`}
            >
              {team === "ALL" ? "TẤT CẢ" : team}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-300 hover:shadow-md transition flex items-center gap-2">
            {/* Cube SVG inline (nhỏ hơn) */}
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <div>
              <div className="text-xs text-slate-700 uppercase">Container</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {totalContainers}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-300 hover:shadow-md transition flex items-center gap-2">
            {/* Clock SVG inline */}
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-xs text-slate-700 uppercase">Tổng giờ</div>
              <div className="text-2xl font-bold text-emerald-800 mt-1">
                {formatNumber(totalHours)}h
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {filteredDates.map((date) => {
          const day = data[date] || {};
          const dayTeams = teamOrder.filter(
            (team) => day[team] && (selectedTeam === "ALL" || selectedTeam === team)
          );

          if (dayTeams.length === 0) return null;

          const dayContainers = dayTeams.reduce((sum, t) => sum + (day[t]?.containers || 0), 0);
          const dayHours = dayTeams.reduce((sum, t) => sum + (day[t]?.hours || 0), 0);

          const isOpen = expandedDate === date;

          return (
            <div key={date} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <button
                onClick={() => {
                  setExpandedDate(isOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full flex justify-between items-center px-4 py-3 active:scale-[0.97] transition"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    // Chevron Up SVG
                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    // Chevron Down SVG
                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <span className="font-semibold text-slate-900">
                    {formatDateDisplay(date)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-slate-700">
                    <svg
                      className="h-4 w-4 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {dayContainers}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-200 text-emerald-800 font-semibold">
                    {formatNumber(dayHours)}h
                  </span>
                </div>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="border-t bg-slate-50 px-4 py-3 space-y-3">
                  {dayTeams.map((team) => {
                    const teamKey = date + team;
                    const isTeamOpen = expandedTeam === teamKey;
                    const details = [...(day[team]?.details || [])].sort((a, b) =>
                      a.container.localeCompare(b.container)
                    );
                    const teamContainers = day[team]?.containers || 0;
                    const teamHours = day[team]?.hours || 0;

                    return (
                      <div key={team} className="bg-white rounded-xl border overflow-hidden">
                        <button
                          onClick={() => setExpandedTeam(isTeamOpen ? null : teamKey)}
                          className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium hover:bg-slate-100 transition"
                        >
                          <span className="text-slate-800">{team}</span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-slate-700">
                              <svg
                                className="h-4 w-4 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              {teamContainers}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-emerald-200 text-emerald-800 text-xs font-semibold">
                              {formatNumber(teamHours)}h
                            </span>
                          </div>
                        </button>

                        <div
                          className={`transition-all duration-300 ease-in-out ${
                            isTeamOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                          } overflow-hidden`}
                        >
                          <div className="border-t bg-slate-50 px-3 py-2 space-y-2 max-h-72 overflow-y-auto">
                            {details.map((item, index) => (
                              <div
                                key={`${item.container}-${index}`}
                                className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition"
                              >
                                <div className="flex gap-3 items-center">
                                  <span className="text-slate-600 w-6 text-right text-xs">
                                    {index + 1}.
                                  </span>

                                  {item.link ? (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-slate-900 hover:text-indigo-700 transition"
                                    >
                                      {item.container}
                                    </a>
                                  ) : (
                                    <span className="font-medium text-slate-900">
                                      {item.container}
                                    </span>
                                  )}
                                </div>

                                <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800 font-semibold text-sm">
                                  {formatNumber(item.hours)}h
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default ReportDashboard;
