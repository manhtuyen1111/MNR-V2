import { useEffect, useMemo, useState } from "react";

type WorkerSalary = {
  [workerName: string]: number;
};

type ContainerDetail = {
  container: string;
  hours: number;
  link: string | null;
  salary: WorkerSalary;
};

type TeamData = {
  containers: number;
  hours: number;
  salary: WorkerSalary;
  details: ContainerDetail[];
};

type ReportData = {
  [date: string]: {
    [team: string]: TeamData;
  };
};

const teamOrder = ["TỔ 1", "TỔ 2", "TỔ 3", "TỔ 4"];

const WORKER_PRICE: { [key: string]: number } = {
  "Phạm Quang Tuấn": 16000,
  "Trần Hoàng Việt": 13000,
  "Lê Quang Khải": 16000,
  "Mai Văn Long": 13000,
  "Bùi Trọng Hà": 13000,
  "Mai Xuân Cảnh": 16000,
  "Đặng Văn Kiên": 13000,
  "Nguyễn Văn Tuấn": 13000,
  "Vũ Văn Ngừng": 16000,
  "Bùi Văn Anh": 13000,
};

const BONUS_THRESHOLD = 200;
const BONUS_PER_HOUR = 3000;

const ReportDashboard = () => {
  const [data, setData] = useState<ReportData>({});
  const [loading, setLoading] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [rangeType, setRangeType] = useState("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"cont" | "salary">("cont");

  useEffect(() => {
    if (Object.keys(data).length > 0) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec",
          { cache: "no-store" }
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

  useEffect(() => {
    setRangeType("THIS_MONTH");
    setFromDate("");
    setToDate("");
  }, [reportType]);

  const formatNumber = (num: number) => num.toFixed(1);

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const teams = useMemo(() => {
    const set = new Set<string>();
    Object.values(data).forEach((day) =>
      Object.keys(day).forEach((team) => set.add(team))
    );

    return ["ALL", ...teamOrder.filter((t) => set.has(t))];
  }, [data]);

  const filteredDates = useMemo(() => {
    const allDates = Object.keys(data).sort((a, b) => b.localeCompare(a));

    if (rangeType === "TODAY") {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      return allDates.filter((d) => d === todayStr);
    }

    if (rangeType === "YESTERDAY") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      return allDates.filter((d) => d === yesterdayStr);
    }

    if (rangeType === "7D") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return allDates.filter((d) => new Date(d) >= sevenDaysAgo);
    }

    if (rangeType === "30D") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return allDates.filter((d) => new Date(d) >= thirtyDaysAgo);
    }

    if (rangeType === "THIS_MONTH") {
      return allDates.filter((d) => {
        const date = new Date(d);
        const now = new Date();
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    }

    if (rangeType === "LAST_MONTH") {
      const now = new Date();
      const lastMonth = now.getMonth() - 1;
      const year = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      return allDates.filter((d) => {
        const date = new Date(d);
        return date.getMonth() === lastMonth % 12 && date.getFullYear() === year;
      });
    }

    if (rangeType === "CUSTOM" && fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      return allDates.filter((d) => {
        const date = new Date(d);
        return date >= start && date <= end;
      });
    }

    if (rangeType === "ALL") {
      return allDates;
    }

    return allDates;
  }, [data, rangeType, fromDate, toDate]);

  const { totalContainers, totalHours } = useMemo(() => {
    let containers = 0;
    let hours = 0;

    filteredDates.forEach((date) => {
      const day = data[date] || {};
      Object.values(day).forEach((teamData) => {
        containers += teamData.containers || 0;
        hours += teamData.hours || 0;
      });
    });

    return { totalContainers: containers, totalHours: hours };
  }, [filteredDates, data, selectedTeam]);

  const salaryReport = useMemo(() => {
    const result: {
      name: string;
      team: string;
      hours: number;
      baseSalary: number;
      overtimeSalary: number;
      totalSalary: number;
    }[] = [];

    const workerMap: {
      [key: string]: {
        hours: number;
        teams: Set<string>;
      };
    } = {};

    filteredDates.forEach((date) => {
      const day = data[date] || {};
      Object.entries(day).forEach(([team, val]) => {
        if (selectedTeam === "ALL" || selectedTeam === team) {
          Object.entries(val.salary || {}).forEach(([name, hours]) => {
            if (!workerMap[name]) {
              workerMap[name] = { hours: 0, teams: new Set() };
            }
            workerMap[name].hours += Number(hours) || 0;
            workerMap[name].teams.add(team);
          });
        }
      });
    });

    Object.entries(workerMap).forEach(([name, info]) => {
      const hours = Math.round(info.hours * 100) / 100;
      const unitPrice = WORKER_PRICE[name] || 0;

      const baseSalary = hours * unitPrice;

      let overtimeSalary = 0;
      if (hours > BONUS_THRESHOLD) {
        overtimeSalary = (hours - BONUS_THRESHOLD) * BONUS_PER_HOUR;
      }

      const totalSalary = baseSalary + overtimeSalary;

      result.push({
        name,
        team: Array.from(info.teams).join(", "),
        hours,
        baseSalary,
        overtimeSalary,
        totalSalary,
      });
    });

    return result.sort((a, b) => b.totalSalary - a.totalSalary);
  }, [filteredDates, data, selectedTeam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header - Sticky, siêu gọn, không title */}
      <div className="px-3 pt-3">
        <div className="flex bg-gray-200 p-1 rounded-xl">
          <button
            onClick={() => setReportType("cont")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg ${
              reportType === "cont" ? "bg-green-700 text-white" : "text-gray-600"
            }`}
          >
            BÁO CÁO SẢN LƯỢNG
          </button>

          <button
            onClick={() => setReportType("salary")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg ${
              reportType === "salary" ? "bg-green-700 text-white" : "text-gray-600"
            }`}
          >
            BÁO CÁO SẢN PHẨM
          </button>
        </div>
      </div>

      {reportType === "cont" && (
        <>
          <header className="sticky top-0 z-20 bg-white shadow-md border-b border-gray-300">
            <div className="px-3 pt-2 pb-2.5 max-w-5xl mx-auto">
              {/* Filters + Summary - đẩy sát top */}
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <select
                  value={rangeType}
                  onChange={(e) => {
                    setRangeType(e.target.value);

                    if (e.target.value !== "CUSTOM") {
                      setFromDate("");
                      setToDate("");
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
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

                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                >
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team === "ALL" ? "Tất cả tổ" : team}
                    </option>
                  ))}
                </select>
              </div>

              {rangeType === "CUSTOM" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Tổng: {totalContainers} container ({totalHours} giờ)
                </div>
              </div>
            </div>
          </header>

          {/* Main - list danh sách */}
          <main className="flex-1 px-3 py-3 max-w-5xl mx-auto w-full space-y-3 pb-[calc(100px+env(safe-area-inset-bottom))]">
            {filteredDates.map((date) => {
              const day = data[date] || {};
              const dayTeams = teamOrder.filter(
                (t) => selectedTeam === "ALL" || selectedTeam === t
              );

              return dayTeams.map((team) => {
                const teamData = day[team];
                if (!teamData) return null;

                const isExpanded = expandedDate === date && expandedTeam === team;

                return (
                  <div
                    key={`${date}-${team}`}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedDate(
                          expandedDate === date && expandedTeam === team
                            ? null
                            : date
                        )
                      }
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="text-left">
                        <div className="font-bold text-green-800">
                          {team}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateDisplay(date)} • {teamData.containers}{" "}
                          container • {formatNumber(teamData.hours)} giờ
                        </div>
                      </div>
                      {/* Icon expand/collapse */}
                      {isExpanded ? (
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t">
                        {/* Chi tiết container */}
                        <div className="p-4 space-y-2">
                          {teamData.details.map((detail, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 border-b last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">
                                  {idx + 1}.
                                </span>
                                {detail.link ? (
                                  <a
                                    href={detail.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:underline"
                                  >
                                    {detail.container}
                                  </a>
                                ) : (
                                  <span>{detail.container}</span>
                                )}
                              </div>
                              <div className="font-medium">
                                {formatNumber(detail.hours)} giờ
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })}

            {filteredDates.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                Không có dữ liệu trong khoảng thời gian đã chọn
              </div>
            )}
          </main>
        </>
      )}

      {reportType === "salary" && (
        <>
          {/* Phần báo cáo lương - bạn có thể thêm tương tự nếu commit có, nhưng trong diff này chủ yếu là phần cont */}
          <div className="p-4 text-center text-gray-600">
            Báo cáo lương đang được cập nhật...
          </div>
        </>
      )}
    </div>
  );
};

export default ReportDashboard;
