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
    const allDates = Object.keys(data).sort((a, b) =>
      b.localeCompare(a)
    );

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-700 font-medium">
          Đang tổng hợp báo cáo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white sticky top-0 z-10 shadow-sm px-4 py-4 space-y-4">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
          BÁO CÁO TỔNG HỢP MNR MATRAN 2026
        </h1>

        {/* Filter tổ */}
        <div className="flex gap-2 overflow-x-auto">
          {teams.map((team) => (
            <button
              key={team}
              onClick={() => {
                setSelectedTeam(team);
                setExpandedDate(null);
                setExpandedTeam(null);
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                selectedTeam === team
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {team === "ALL" ? "TẤT CẢ" : team}
            </button>
          ))}
        </div>

        {/* Filter ngày */}
        <select
          value={rangeType}
          onChange={(e) => setRangeType(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="TODAY">Hôm nay</option>
          <option value="7D">7 ngày</option>
          <option value="30D">30 ngày</option>
          <option value="MONTH">Tháng này</option>
          <option value="ALL">Tất cả</option>
          <option value="CUSTOM">Tùy chọn</option>
        </select>

        {rangeType === "CUSTOM" && (
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm flex-1"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm flex-1"
            />
          </div>
        )}

        {/* Tổng */}
        <div className="grid grid-cols-2 gap-4 bg-white border rounded-xl p-4 shadow-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
              Tổng Container
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {totalContainers}
            </div>
          </div>

          <div className="border-l pl-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
              Tổng Giờ
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {formatNumber(totalHours)}h
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {filteredDates.map((date) => {
          const day = data[date] || {};
          const dayTeams = teamOrder.filter(
            (team) =>
              day[team] &&
              (selectedTeam === "ALL" || selectedTeam === team)
          );

          if (dayTeams.length === 0) return null;

          const dayContainers = dayTeams.reduce(
            (sum, t) => sum + day[t].containers,
            0
          );
          const dayHours = dayTeams.reduce(
            (sum, t) => sum + day[t].hours,
            0
          );

          const isOpen = expandedDate === date;

          return (
            <div key={date} className="bg-white rounded-xl border shadow-sm">
              <button
                onClick={() => {
                  setExpandedDate(isOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full flex justify-between items-center px-4 py-3"
              >
                <span className="font-semibold text-slate-800">
                  {formatDateDisplay(date)}
                </span>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600">
                    {dayContainers} Cont
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-semibold">
                    {formatNumber(dayHours)}h
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t bg-slate-50 px-4 py-3">
                  {dayTeams.map((team) => {
                    const teamKey = date + team;
                    const isTeamOpen = expandedTeam === teamKey;
                    const details = [...(day[team].details || [])].sort(
                      (a, b) =>
                        a.container.localeCompare(b.container)
                    );

                    return (
                      <div
                        key={team}
                        className="mb-3 bg-white rounded-lg border"
                      >
                        <button
                          onClick={() =>
                            setExpandedTeam(
                              isTeamOpen ? null : teamKey
                            )
                          }
                          className="w-full flex justify-between items-center px-4 py-2 text-sm font-medium"
                        >
                          <span className="text-slate-700">{team}</span>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-600">
                              {day[team].containers} Cont
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-semibold">
                              {formatNumber(day[team].hours)}h
                            </span>
                          </div>
                        </button>

                        {isTeamOpen && (
                          <div className="border-t bg-slate-50 px-3 py-2 space-y-2 max-h-72 overflow-y-auto">
                            {details.map((item, index) => (
                              <div
                                key={item.container + index}
                                className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 transition"
                              >
                                <div className="flex gap-3 items-center">
                                  <span className="text-slate-400 w-6 text-right">
                                    {index + 1}.
                                  </span>
                                  {item.link ? (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-slate-800 font-medium hover:text-indigo-600"
                                    >
                                      {item.container}
                                    </a>
                                  ) : (
                                    <span className="text-slate-800 font-medium">
                                      {item.container}
                                    </span>
                                  )}
                                </div>

                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-semibold">
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
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default ReportDashboard;
