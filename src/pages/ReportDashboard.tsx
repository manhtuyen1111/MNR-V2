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
  const [rangeType, setRangeType] = useState("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec",
          { cache: "force-cache" } // Tăng tốc bằng caching response (nếu browser hỗ trợ, giảm fetch lặp lại)
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
      return allDates.filter(
        (d) =>
          d >= compareDate.toISOString().slice(0, 10) &&
          d <= lastMonthEnd.toISOString().slice(0, 10)
      );
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-green-800 rounded-full animate-spin"></div>
          <p className="text-gray-700 font-medium text-lg">Đang chuẩn bị báo cáo cho bạn...</p>
          <p className="text-gray-500 text-sm max-w-xs">Chúng tôi đang tổng hợp dữ liệu mới nhất. Chỉ mất vài giây thôi! ☕</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-20 bg-white shadow-md border-b border-gray-300">
        <div className="px-4 py-3 max-w-5xl mx-auto">
          {/* Title */}
          <div className="flex items-center gap-2.5 mb-3">
            <svg className="w-8 h-8 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h1 className="text-lg font-bold text-green-900">
              Báo cáo nghiệm thu MNR Matran 2026
            </h1>
          </div>

          {/* Filters - compact on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Range */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <select
                value={rangeType}
                onChange={(e) => {
                  setRangeType(e.target.value);
                  if (e.target.value !== "CUSTOM") {
                    setFromDate("");
                    setToDate("");
                  }
                }}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition flex-1 min-w-[140px]"
              >
                <option value="TODAY">Hôm nay</option>
                <option value="YESTERDAY">Hôm qua</option>
                <option value="7D">7 ngày</option>
                <option value="30D">30 ngày</option>
                <option value="THIS_MONTH">Tháng này</option>
                <option value="LAST_MONTH">Tháng trước</option>
                <option value="CUSTOM">Tùy chọn</option>
                <option value="ALL">Tất cả</option>
              </select>
            </div>

            {rangeType === "CUSTOM" && (
              <div className="flex gap-2 flex-1">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}

            {/* Team chips - horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:ml-auto">
              {teams.map((team) => (
                <button
                  key={team}
                  onClick={() => {
                    setSelectedTeam(team);
                    setExpandedDate(null);
                    setExpandedTeam(null);
                  }}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    selectedTeam === team
                      ? "bg-green-800 text-white shadow-sm"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300"
                  }`}
                >
                  {team === "ALL" ? "Tất cả" : team}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
              <svg className="w-6 h-6 text-green-800 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Container</div>
                <div className="text-2xl font-bold text-green-900">{totalContainers}</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tổng giờ</div>
                <div className="text-2xl font-bold text-red-700">{formatNumber(totalHours)} h</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-5 max-w-5xl mx-auto w-full space-y-4 pb-20">
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
            <div
              key={date}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => {
                  setExpandedDate(isOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 active:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <span className="font-semibold text-gray-900">
                    {formatDateDisplay(date)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-green-800">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {dayContainers}
                  </div>
                  <div className="px-2.5 py-1 bg-red-100 text-red-800 rounded-md font-medium">
                    {formatNumber(dayHours)} h
                  </div>
                </div>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t bg-gray-50 px-4 py-4 space-y-3">
                  {dayTeams.map((team) => {
                    const teamKey = date + team;
                    const isTeamOpen = expandedTeam === teamKey;
                    const details = [...(day[team]?.details || [])].sort((a, b) =>
                      a.container.localeCompare(b.container)
                    );

                    return (
                      <div key={team} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => setExpandedTeam(isTeamOpen ? null : teamKey)}
                          className="w-full px-4 py-3 flex justify-between items-center text-sm hover:bg-gray-50 active:bg-gray-100 transition"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5-5m0 0h-5m5 0V4h5-5m0 16H7m-5 0h5-5m0 0V4h5-5m10 16V4" />
                            </svg>
                            <span className="font-medium text-gray-900">{team}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-green-800">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              {day[team]?.containers || 0}
                            </div>
                            <div className="px-2.5 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                              {formatNumber(day[team]?.hours || 0)} h
                            </div>
                          </div>
                        </button>

                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isTeamOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="border-t bg-white divide-y divide-gray-100 max-h-80 overflow-y-auto">
                            {details.map((item, idx) => (
                              <div
                                key={`${item.container}-${idx}`}
                                className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="text-xs text-gray-500 w-5 text-right flex-shrink-0">
                                    {idx + 1}.
                                  </span>
                                  {item.link ? (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-800 hover:text-green-900 font-medium truncate flex items-center gap-1"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                      </svg>
                                      {item.container}
                                    </a>
                                  ) : (
                                    <span className="font-medium truncate">{item.container}</span>
                                  )}
                                </div>
                                <div className="px-3 py-1 bg-red-50 text-red-800 rounded text-sm font-medium flex-shrink-0">
                                  {formatNumber(item.hours)} h
                                </div>
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

        {filteredDates.length === 0 && (
          <div className="text-center py-12 text-gray-600 flex flex-col items-center gap-2">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Không có dữ liệu trong khoảng thời gian đã chọn
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportDashboard;
