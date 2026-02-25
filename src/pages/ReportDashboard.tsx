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
      const yesterdayStr = yesterday
        .toISOString()
        .slice(0, 10);
      return allDates.filter((d) => d === yesterdayStr);
    }

    let compareDate = new Date();

    if (rangeType === "7D")
      compareDate.setDate(today.getDate() - 7);
    else if (rangeType === "30D")
      compareDate.setDate(today.getDate() - 30);
    else if (rangeType === "THIS_MONTH")
      compareDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
    else if (rangeType === "LAST_MONTH") {
      compareDate = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      const lastMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );
      return allDates.filter(
        (d) =>
          d >= compareDate.toISOString().slice(0, 10) &&
          d <= lastMonthEnd.toISOString().slice(0, 10)
      );
    } else if (
      rangeType === "CUSTOM" &&
      fromDate &&
      toDate
    )
      return allDates.filter(
        (d) => d >= fromDate && d <= toDate
      );

    const compareStr = compareDate
      .toISOString()
      .slice(0, 10);
    return allDates.filter((d) => d >= compareStr);
  }, [data, rangeType, fromDate, toDate]);

  const { totalContainers, totalHours } =
    useMemo(() => {
      let containers = 0;
      let hours = 0;

      filteredDates.forEach((date) => {
        const day = data[date] || {};
        Object.entries(day).forEach(([team, val]) => {
          if (
            selectedTeam === "ALL" ||
            selectedTeam === team
          ) {
            containers += val.containers || 0;
            hours += val.hours || 0;
          }
        });
      });

      return { totalContainers: containers, totalHours: hours };
    }, [filteredDates, data, selectedTeam]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs sm:max-w-sm">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-green-800 rounded-full animate-spin"></div>
          <p className="text-gray-800 font-semibold text-xl">
            Đang chuẩn bị báo cáo cho bạn...
          </p>
          <p className="text-gray-600 text-base">
            Chúng tôi đang tổng hợp dữ liệu mới nhất.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* HEADER TỐI ƯU */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="px-3 pt-1.5 pb-2 max-w-5xl mx-auto">
          <div className="flex flex-col gap-2">
            {/* RANGE */}
            <div className="flex items-center gap-2">
              <select
                value={rangeType}
                onChange={(e) => {
                  setRangeType(e.target.value);
                  if (e.target.value !== "CUSTOM") {
                    setFromDate("");
                    setToDate("");
                  }
                }}
                className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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

            {/* SUMMARY ICON ONLY */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 text-green-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-base font-bold text-green-900">
                  {totalContainers}
                </span>
              </div>

              <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-base font-bold text-blue-900">
                  {formatNumber(totalHours)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GIỮ NGUYÊN */}
      <main className="flex-1 px-3 py-3 max-w-5xl mx-auto w-full space-y-3 pb-20">
        {/* phần dưới bạn giữ nguyên như file gốc */}
      </main>
    </div>
  );
};

export default ReportDashboard;
