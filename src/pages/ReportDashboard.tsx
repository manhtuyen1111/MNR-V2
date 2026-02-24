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

const ReportDashboard = () => {
  const [data, setData] = useState<ReportData>({});
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [rangeType, setRangeType] = useState("TODAY");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expanded, setExpanded] = useState<string | null>(null);
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

  const teamOrder = ["TỔ 1", "TỔ 2", "TỔ 3", "TỔ 4"];

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

  // ✅ Loading chuyên nghiệp
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="mt-6 text-center space-y-2">
          <p className="text-indigo-700 font-semibold text-lg animate-pulse">
            📊 Đang tổng hợp dữ liệu...
          </p>
          <p className="text-slate-500 text-sm">
            Hệ thống đang xử lý báo cáo, vui lòng chờ một chút
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-3 py-3 space-y-2.5">
          <h1 className="text-base font-bold text-slate-800">
            📊 BÁO CÁO TỔNG HỢP MNR MATRAN 2026
          </h1>
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

      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-24">
        {filteredDates.map((date) => {
          const day = data[date] || {};
          let dayContainers = 0;
          let dayHours = 0;

          Object.values(day).forEach((value) => {
            dayContainers += value.containers;
            dayHours += value.hours;
          });

          if (dayContainers === 0) return null;

          const isOpen = expanded === date;

          return (
            <div key={date} className="rounded-xl border bg-white shadow-sm">
              {/* Header ngày */}
              <button
                onClick={() => {
                  setExpanded(isOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full px-3.5 py-2.5 flex justify-between items-center"
              >
                <span className="font-medium text-slate-800">
                  📅 {formatDateDisplay(date)}
                </span>
                <span className="text-xs text-slate-600">
                  {dayContainers} 📦 • {formatNumber(dayHours)} ⏰
                </span>
              </button>

              {/* Nội dung khi mở ngày */}
              {isOpen && (
                <div className="px-3 pb-3 border-t bg-slate-50">
                  {teamOrder
                    .filter((team) => day[team])
                    .map((team) => {
                      const value = day[team];
                      const teamKey = date + "_" + team;
                      const isTeamOpen = expandedTeam === teamKey;

                      const sortedDetails = [...(value.details || [])].sort(
                        (a, b) =>
                          a.container.localeCompare(b.container)
                      );

                      return (
                        <div
                          key={team}
                          className="rounded-lg bg-white mb-2 border"
                        >
                          {/* Header tổ */}
                          <button
                            onClick={() =>
                              setExpandedTeam(
                                isTeamOpen ? null : teamKey
                              )
                            }
                            className="w-full flex justify-between items-center px-3 py-2 text-xs font-medium"
                          >
                            <span>{team}</span>
                            <span>
                              {value.containers} 📦 •{" "}
                              {formatNumber(value.hours)} ⏰
                            </span>
                          </button>

                          {/* Container list */}
                          {isTeamOpen && (
                            <div className="border-t bg-slate-50 px-2 py-2 space-y-1 max-h-72 overflow-y-auto">
                              {sortedDetails.map((item, index) => (
                                <div
                                  key={item.container + index}
                                  className="flex justify-between items-center text-[11px] bg-white px-2 py-1.5 rounded-md shadow-sm"
                                >
                                  <div className="flex gap-2">
                                    <span className="text-slate-400 w-5 text-right">
                                      {index + 1}.
                                    </span>
                                    {item.link ? (
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 underline font-medium"
                                      >
                                        {item.container}
                                      </a>
                                    ) : (
                                      <span className="font-medium">
                                        {item.container}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-indigo-600">
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
