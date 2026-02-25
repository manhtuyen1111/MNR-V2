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

  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [rangeType, setRangeType] = useState<string>("THIS_MONTH");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // 🔥 HEADER AUTO HIDE
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec",
          { cache: "force-cache" }
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
    const allDates = Object.keys(data).sort((a, b) =>
      b.localeCompare(a)
    );
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (rangeType === "ALL") return allDates;
    if (rangeType === "TODAY")
      return allDates.filter((d) => d === todayStr);

    if (rangeType === "YESTERDAY") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      return allDates.filter((d) => d === yesterdayStr);
    }

    let compareDate = new Date();

    if (rangeType === "7D")
      compareDate.setDate(today.getDate() - 7);
    else if (rangeType === "30D")
      compareDate.setDate(today.getDate() - 30);
    else if (rangeType === "THIS_MONTH")
      compareDate = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (rangeType === "LAST_MONTH") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return allDates.filter(
        (d) =>
          d >= start.toISOString().slice(0, 10) &&
          d <= end.toISOString().slice(0, 10)
      );
    } else if (rangeType === "CUSTOM" && fromDate && toDate) {
      return allDates.filter((d) => d >= fromDate && d <= toDate);
    }

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
      <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-green-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="px-3 pt-2 pb-2 max-w-5xl mx-auto space-y-2">
          {/* RANGE */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={rangeType}
              onChange={(e) => {
                setRangeType(e.target.value);
                if (e.target.value !== "CUSTOM") {
                  setFromDate("");
                  setToDate("");
                }
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
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

            {rangeType === "CUSTOM" && (
              <>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
              </>
            )}
          </div>

          {/* TEAM FILTER */}
          <div className="flex gap-2 overflow-x-auto">
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => {
                  setSelectedTeam(team);
                  setExpandedDate(null);
                  setExpandedTeam(null);
                }}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
                  selectedTeam === team
                    ? "bg-green-800 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {team === "ALL" ? "Tất cả" : team}
              </button>
            ))}
          </div>

          {/* SUMMARY */}
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-green-900">
              {totalContainers} cont
            </span>
            <span className="text-blue-900">
              {formatNumber(totalHours)}h
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="px-3 pt-44 pb-20 max-w-5xl mx-auto space-y-3">
        {filteredDates.map((date) => {
          const day = data[date] || {};
          const dayTeams = teamOrder.filter(
            (team) =>
              day[team] &&
              (selectedTeam === "ALL" || selectedTeam === team)
          );

          if (dayTeams.length === 0) return null;

          const isDateOpen = expandedDate === date;

          const dayContainers = dayTeams.reduce(
            (sum, t) => sum + (day[t]?.containers || 0),
            0
          );
          const dayHours = dayTeams.reduce(
            (sum, t) => sum + (day[t]?.hours || 0),
            0
          );

          return (
            <div
              key={date}
              className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* DATE HEADER */}
              <button
                onClick={() => {
                  setExpandedDate(isDateOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full px-3.5 py-3 flex justify-between items-center"
              >
                <span className="font-semibold text-blue-900">
                  {formatDateDisplay(date)}
                </span>
                <div className="text-sm flex gap-4">
                  <span className="text-red-700">
                    {dayContainers}
                  </span>
                  <span className="text-blue-800">
                    {formatNumber(dayHours)}h
                  </span>
                </div>
              </button>

              {/* TEAM LIST */}
              {isDateOpen &&
                dayTeams.map((team) => {
                  const teamKey = `${date}-${team}`;
                  const isTeamOpen = expandedTeam === teamKey;
                  const teamData = day[team];

                  return (
                    <div key={team} className="border-t border-gray-200">
                      <button
                        onClick={() =>
                          setExpandedTeam(
                            isTeamOpen ? null : teamKey
                          )
                        }
                        className="w-full px-5 py-2 flex justify-between text-sm"
                      >
                        <span className="font-medium text-gray-800">
                          {team}
                        </span>
                        <span>
                          {teamData.containers} |{" "}
                          {formatNumber(teamData.hours)}h
                        </span>
                      </button>

                      {/* DETAIL */}
                      {isTeamOpen && (
                        <div className="px-8 pb-3 space-y-1 text-xs text-gray-700">
                          {teamData.details.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between"
                            >
                              <span>
                                {item.link ? (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    {item.container}
                                  </a>
                                ) : (
                                  item.container
                                )}
                              </span>
                              <span>
                                {formatNumber(item.hours)}h
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default ReportDashboard;
