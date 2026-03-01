import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
  const [reportType, setReportType] = useState<'cont' | 'salary'>('cont');

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

  return ["ALL", ...teamOrder.filter((t) => set.has(t))];
}, [data]);

  const filteredDates = useMemo(() => {
    const allDates = Object.keys(data).sort((a, b) => b.localeCompare(a));
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
     // 🚫 Chặn chọn ngày sai
  if (
    rangeType === "CUSTOM" &&
    fromDate &&
    toDate &&
    fromDate > toDate
  ) {
    return [];
  }
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
      totalSalary
    });
  });

  return result.sort((a, b) => b.totalSalary - a.totalSalary);

}, [filteredDates, data, selectedTeam]);
const exportExcel = () => {
  const rows: any[] = [];

  filteredDates.forEach((date) => {
    const day = data[date] || {};

    Object.entries(day).forEach(([team, val]) => {
      if (selectedTeam === "ALL" || selectedTeam === team) {
        (val.details || []).forEach((item) => {
          rows.push({
            Ngày: date,
            Tổ: team,
            Container: item.container,
            Giờ: item.hours,
            Link: item.link || "",
          });
        });
      }
    });
  });

  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, `BaoCao_${rangeType}.xlsx`);
};
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs sm:max-w-sm">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-green-800 rounded-full animate-spin"></div>
          <p className="text-gray-800 font-semibold text-xl">Đang chuẩn bị báo cáo cho bạn...</p>
          <p className="text-gray-600 text-base">
            Chúng tôi đang tổng hợp dữ liệu mới nhất. Chỉ mất vài giây thôi! ☕
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header - Sticky, siêu gọn, không title */}
      <div className="px-3 pt-3">
  <div className="flex bg-gray-200 p-1 rounded-xl">
    <button
      onClick={() => setReportType('cont')}
      className={`flex-1 py-2 text-sm font-bold rounded-lg ${
        reportType === 'cont'
          ? 'bg-green-700 text-white'
          : 'text-gray-600'
      }`}
    >
      BÁO CÁO SẢN LƯỢNG
    </button>

    <button
      onClick={() => setReportType('salary')}
      className={`flex-1 py-2 text-sm font-bold rounded-lg ${
        reportType === 'salary'
          ? 'bg-green-700 text-white'
          : 'text-gray-600'
      }`}
    >
     BÁO CÁO SẢN PHẨM
    </button>
  </div>
</div>
      {reportType === 'cont' && (
<>
      <header className="sticky top-0 z-20 bg-white shadow-md border-b border-gray-300">
        <div className="px-3 pt-2 pb-2.5 max-w-5xl mx-auto">
          {/* Filters + Summary - đẩy sát top */}
          <div className="flex flex-col gap-2">
            {/* Range + Custom */}
           {/* Filters gộp 1 dòng */}
<div className="flex gap-2">

  {/* Range select */}
  <select
    value={rangeType}
    onChange={(e) => {
      setRangeType(e.target.value);
      setExpandedDate(null);
      setExpandedTeam(null);
      if (e.target.value !== "CUSTOM") {
        setFromDate("");
        setToDate("");
      }
    }}
    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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

  {/* Team select */}
  <select
    value={selectedTeam}
    onChange={(e) => {
      setSelectedTeam(e.target.value);
      setExpandedDate(null);
      setExpandedTeam(null);
    }}
    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
  >
    {teams.map((team) => (
      <option key={team} value={team}>
        {team === "ALL" ? "Tất cả tổ" : team}
      </option>
    ))}
  </select>

</div>
            {rangeType === "CUSTOM" && (
  <div className="flex gap-2 mt-2">
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

    
            {/* Summary - 1 dòng ngang */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm flex items-center gap-2">
                <svg className="w-6 h-6 text-green-800 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Container</div>
                  <div className="text-lg font-bold text-green-900">{totalContainers}</div>
                </div>
              </div>

              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-800 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Tổng giờ</div>
                <div className="flex items-center gap-2">
  <div className="text-lg font-bold text-blue-900">
    {formatNumber(totalHours)} h
  </div>

  <button
    onClick={exportExcel}
    className="p-1 rounded hover:bg-blue-100 active:bg-blue-200 transition"
    title="Xuất Excel"
  >
    <svg
      className="w-4 h-4 text-blue-700"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16v-8m0 8l-3-3m3 3l3-3M4 20h16"
      />
    </svg>
  </button>
</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main - list danh sách */}
      <main className="flex-1 px-3 py-3 max-w-5xl mx-auto w-full space-y-3 pb-[calc(100px+env(safe-area-inset-bottom))]">
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
            <div key={date} className="bg-gray-100 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => {
                  setExpandedDate(isOpen ? null : date);
                  setExpandedTeam(null);
                }}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-gray-200 active:bg-gray-300 transition"
              >
                <div className="flex items-center gap-2.5">
                  {isOpen ? (
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {/* Icon lịch cạnh ngày */}
                  <svg className="w-5 h-5 text-blue-800 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold text-blue-900 text-base">
                    {formatDateDisplay(date)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-red-700 font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {dayContainers}
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-900 rounded-md font-medium">
                    {formatNumber(dayHours)} h
                  </div>
                </div>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t bg-white px-3 py-3 space-y-3">
                  {dayTeams.map((team) => {
                    const teamKey = date + team;
                    const isTeamOpen = expandedTeam === teamKey;
                    const details = [...(day[team]?.details || [])].sort((a, b) =>
                      a.container.localeCompare(b.container)
                    );

                    return (
                      <div key={team} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => setExpandedTeam(isTeamOpen ? null : teamKey)}
                          className="w-full px-3.5 py-3 flex justify-between items-center text-sm hover:bg-gray-100 active:bg-gray-200 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM6 9a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium text-gray-900">{team}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-green-800">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              {day[team]?.containers || 0}
                            </div>
                            <div className="px-3 py-1 bg-blue-100 text-blue-900 rounded text-sm font-medium">
                              {formatNumber(day[team]?.hours || 0)} h
                            </div>
                          </div>
                        </button>

                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isTeamOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="border-t bg-white divide-y divide-gray-100 max-h-72 overflow-y-auto">
                            {details.map((item, idx) => (
                              <div
                                key={`${item.container}-${idx}`}
                                className="px-3.5 py-2.5 flex items-center justify-between hover:bg-gray-50 transition text-sm"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">
                                    {idx + 1}.
                                  </span>
                                  {item.link ? (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-800 hover:text-green-900 font-medium truncate flex items-center gap-1.5"
                                    >
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                      </svg>
                                      {item.container}
                                    </a>
                                  ) : (
                                    <span className="font-medium truncate">{item.container}</span>
                                  )}
                                </div>
                                <div className="px-3 py-1 bg-blue-50 text-blue-900 rounded text-sm font-medium flex-shrink-0">
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
          <div className="text-center py-10 text-gray-600 flex flex-col items-center gap-3">
            <svg className="w-14 h-14 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-medium">Không có dữ liệu trong khoảng thời gian đã chọn</p>
          </div>
        )}
      </main>
  </>
)}
{reportType === "salary" && (
<>
<header className="sticky top-0 z-20 bg-white shadow-md border-b border-gray-300">
  <div className="px-3 pt-2 pb-2.5 max-w-5xl mx-auto">

    {/* Hàng select */}
    <div className="flex gap-2">

      <select
        value={rangeType}
        onChange={(e) => {
          setRangeType(e.target.value);

          // reset nếu không phải custom
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

    {/* 👇 QUAN TRỌNG: THÊM ĐOẠN NÀY */}
    {rangeType === "CUSTOM" && (
      <div className="flex gap-2 mt-2">
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

  </div>
</header>

<main className="flex-1 px-3 py-4 max-w-5xl mx-auto w-full space-y-3 pb-[calc(120px+env(safe-area-inset-bottom))]">

    {salaryReport.length === 0 && (
      <div className="text-center py-10 text-gray-500">
        Không có dữ liệu lương
      </div>
    )}
{salaryReport.length > 0 && (
  <div className="bg-green-50 border border-green-200 rounded-xl p-4 font-bold text-green-900">
    Tổng lương toàn bộ:{" "}
    {salaryReport
      .reduce((sum, item) => sum + item.totalSalary, 0)
      .toLocaleString()} đ
  </div>
)}
    {salaryReport.map((item, idx) => (
      <div
        key={item.name}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-2"
      >
        <div className="flex justify-between items-center">
          <div className="font-bold text-green-800 text-lg">
            {idx + 1}. {item.name}
          </div>
          <div className="text-sm bg-gray-100 px-3 py-1 rounded">
            {item.team}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">

          <div>Sản lượng:</div>
          <div className="font-medium">{item.hours.toFixed(2)} giờ</div>

          <div>Lương sản phẩm:</div>
          <div className="font-medium">
            {item.baseSalary.toLocaleString()} đ
          </div>

          <div>Lương vượt giờ:</div>
          <div className="font-medium text-blue-700">
            {item.overtimeSalary.toLocaleString()} đ
          </div>

          <div className="font-bold">Tổng lương:</div>
          <div className="font-bold text-red-700">
            {item.totalSalary.toLocaleString()} đ
          </div>

        </div>
      </div>
    ))}

  </main>
</>
)}
    </div>
  );
};

export default ReportDashboard;
