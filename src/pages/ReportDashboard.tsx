import { useEffect, useMemo, useState } from "react";
import {
  CubeIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline"; // ← thay solid bằng outline (khuyến nghị)

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
  // const [rangeType, setRangeType] = useState("TODAY");     // tạm comment vì chưa dùng
  // const [fromDate, setFromDate] = useState("");
  // const [toDate, setToDate] = useState("");

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

  // Tạm thời dùng ALL ngày (có thể mở lại sau khi thêm UI range)
  const filteredDates = useMemo(() => {
    return Object.keys(data).sort((a, b) => b.localeCompare(a));
    // Nếu muốn bật lại range → uncomment code cũ và thêm UI chọn range
  }, [data]);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <div className="w-14 h-14 border-4 border-slate-300 border-t-emerald-700 rounded-full animate-spin"></div>
        <p className="mt-5 text-slate-700 font-medium">Đang tải báo cáo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-[15px]">
      <header className="bg-slate-200 sticky top-0 z-20 shadow-md px-4 py-4 space-y-3">
        <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <CubeIcon className="h-6 w-6 text-indigo-700" />
          BÁO CÁO TỔNG HỢP
        </h1>

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
            <CubeIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <div className="text-xs text-slate-700 uppercase">Container</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {totalContainers}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-300 hover:shadow-md transition flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-emerald-600" />
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
                    <ChevronUpIcon className="h-5 w-5 text-slate-600" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-slate-600" />
                  )}
                  <span className="font-semibold text-slate-900">
                    {formatDateDisplay(date)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-700">{dayContainers}</span>
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

                    return (
                      <div key={team} className="bg-white rounded-xl border overflow-hidden">
                        <button
                          onClick={() => setExpandedTeam(isTeamOpen ? null : teamKey)}
                          className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium hover:bg-slate-100 transition"
                        >
                          <span className="text-slate-800">{team}</span>
                          <span className="px-2 py-1 rounded-md bg-emerald-200 text-emerald-800 text-xs font-semibold">
                            {formatNumber(day[team]?.hours || 0)}h
                          </span>
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
