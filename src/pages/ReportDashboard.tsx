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
        <div className="w-14 h-14 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-5 text-slate-600 text-sm">
          Đang tải báo cáo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-[15px]">
      <header className="bg-white sticky top-0 z-20 shadow-sm px-4 py-4 space-y-4">

        <h1 className="text-base font-semibold text-slate-800">
          BÁO CÁO TỔNG HỢP
        </h1>

        {/* Team filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {team === "ALL" ? "TẤT CẢ" : team}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition">
            <div className="text-xs text-slate-500 uppercase">
              Container
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {totalContainers}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition">
            <div className="text-xs text-slate-500 uppercase">
              Tổng giờ
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
            <div key={date} className="bg-white rounded-2xl shadow-sm border overflow-hidden">

              {/* Date header */}
              <button
                onClick={() => {
                  setExpandedDate(isOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full flex justify-between items-center px-4 py-4 active:scale-[0.99] transition"
              >
                <span className="font-semibold text-slate-800">
                  {formatDateDisplay(date)}
                </span>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">
                    {dayContainers}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-semibold">
                    {formatNumber(dayHours)}h
                  </span>
                </div>
              </button>

              {/* Animated content */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="border-t bg-slate-50 px-4 py-3 space-y-3">
                  {dayTeams.map((team) => {
                    const teamKey = date + team;
                    const isTeamOpen = expandedTeam === teamKey;
                    const details = [...(day[team].details || [])].sort(
                      (a, b) =>
                        a.container.localeCompare(b.container)
                    );

                    return (
                      <div key={team} className="bg-white rounded-xl border overflow-hidden">

                        <button
                          onClick={() =>
                            setExpandedTeam(
                              isTeamOpen ? null : teamKey
                            )
                          }
                          className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium hover:bg-slate-50 transition active:scale-[0.99]"
                        >
                          <span>{team}</span>

                          <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-semibold">
                            {formatNumber(day[team].hours)}h
                          </span>
                        </button>

                        <div
                          className={`transition-all duration-300 ease-in-out ${
                            isTeamOpen
                              ? "max-h-[600px] opacity-100"
                              : "max-h-0 opacity-0"
                          } overflow-hidden`}
                        >
                          <div className="border-t bg-slate-50 px-3 py-2 space-y-2 max-h-72 overflow-y-auto">
                            {details.map((item, index) => (
                              <div
                                key={item.container + index}
                                className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                              >
                                <div className="flex gap-3 items-center">
                                  <span className="text-slate-400 w-6 text-right text-xs">
                                    {index + 1}.
                                  </span>

                                  {item.link ? (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-slate-800 hover:text-indigo-600 transition"
                                    >
                                      {item.container}
                                    </a>
                                  ) : (
                                    <span className="font-medium text-slate-800">
                                      {item.container}
                                    </span>
                                  )}
                                </div>

                                <span className="text-emerald-600 font-semibold text-sm">
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
