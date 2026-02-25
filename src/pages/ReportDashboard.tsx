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

  // 🔥 HEADER AUTO HIDE
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        setShowHeader(false); // scroll xuống
      } else {
        setShowHeader(true); // scroll lên
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
      <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-green-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 🔥 HEADER AUTO HIDE */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="px-3 pt-2 pb-2 max-w-5xl mx-auto">
          <div className="flex flex-col gap-2">
            <select
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg"
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

            {/* SUMMARY ICON ONLY */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-base font-bold text-green-900">
                  {totalContainers}
                </span>
              </div>

              <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-base font-bold text-blue-900">
                  {formatNumber(totalHours)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="px-3 pt-24 pb-20 max-w-5xl mx-auto space-y-3">
        {filteredDates.map((date) => {
          const day = data[date] || {};
          const dayTeams = teamOrder.filter(
            (team) =>
              day[team] &&
              (selectedTeam === "ALL" ||
                selectedTeam === team)
          );

          if (dayTeams.length === 0) return null;

          const dayContainers = dayTeams.reduce(
            (sum, t) => sum + (day[t]?.containers || 0),
            0
          );
          const dayHours = dayTeams.reduce(
            (sum, t) => sum + (day[t]?.hours || 0),
            0
          );

          const isOpen = expandedDate === date;

          return (
            <div key={date} className="bg-gray-100 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => {
                  setExpandedDate(isOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-blue-900">
                  {formatDateDisplay(date)}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-red-700 font-medium">
                    {dayContainers}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded-md font-medium">
                    {formatNumber(dayHours)}h
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default ReportDashboard;
