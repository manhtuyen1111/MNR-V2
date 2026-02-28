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
@@ -17,10 +24,24 @@ type ReportData = {
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
@@ -29,27 +50,41 @@ const ReportDashboard = () => {

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
@@ -60,12 +95,13 @@ const ReportDashboard = () => {
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
@@ -111,6 +147,7 @@ const ReportDashboard = () => {
  }, [data, rangeType, fromDate, toDate]);

  const { totalContainers, totalHours } = useMemo(() => {

    let containers = 0;
    let hours = 0;

@@ -121,11 +158,76 @@ const ReportDashboard = () => {
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

  if (loading) {
    return (
@@ -144,6 +246,33 @@ const ReportDashboard = () => {
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
@@ -239,7 +368,7 @@ const ReportDashboard = () => {
      </header>

      {/* Main - list danh sách */}
      <main className="flex-1 px-3 py-3 max-w-5xl mx-auto w-full space-y-3 pb-[calc(100px+env(safe-area-inset-bottom))]">
        {filteredDates.map((date) => {
          const day = data[date] || {};
          const dayTeams = teamOrder.filter(
@@ -388,6 +517,130 @@ const ReportDashboard = () => {
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
