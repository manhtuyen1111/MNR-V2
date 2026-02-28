import { useEffect, useMemo, useState } from "react";

type WorkerSalary = { [workerName: string]: number };

type ContainerDetail = {
  container: string;
  hours: number;
  link: string | null;
  salary: WorkerSalary;
};

type TeamData = {
  containers: number;
  hours: number;
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
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [rangeType, setRangeType] = useState("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"cont" | "salary">("cont");

  // Fetch data chỉ 1 lần khi mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec",
          { cache: "no-store" } // hoặc "force-cache" tùy bạn muốn
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
  }, []); // ← dependency rỗng → chỉ chạy 1 lần

  // Reset filter khi đổi tab báo cáo
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
    const teamSet = new Set<string>();
    Object.values(data).forEach((day) => {
      Object.keys(day).forEach((team) => teamSet.add(team));
    });
    return ["ALL", ...teamOrder.filter((t) => teamSet.has(t))];
  }, [data]);

  const filteredDates = useMemo(() => {
    const allDates = Object.keys(data).sort((a, b) => b.localeCompare(a));
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (rangeType === "CUSTOM" && fromDate && toDate && fromDate > toDate) {
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

    let startDate: Date;
    if (rangeType === "7D") {
      startDate = new Date();
      startDate.setDate(today.getDate() - 7);
    } else if (rangeType === "30D") {
      startDate = new Date();
      startDate.setDate(today.getDate() - 30);
    } else if (rangeType === "THIS_MONTH") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (rangeType === "LAST_MONTH") {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endLastMonth.toISOString().slice(0, 10);
      return allDates.filter((d) => d >= startStr && d <= endStr);
    } else if (rangeType === "CUSTOM" && fromDate && toDate) {
      return allDates.filter((d) => d >= fromDate && d <= toDate);
    }

    const startStr = startDate!.toISOString().slice(0, 10);
    return allDates.filter((d) => d >= startStr);
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

    const workerMap: Record<
      string,
      { hours: number; teams: Set<string> }
    > = {};

    filteredDates.forEach((date) => {
      const day = data[date] || {};
      Object.entries(day).forEach(([team, val]) => {
        if (selectedTeam === "ALL" || selectedTeam === team) {
          Object.entries(val.salary || {}).forEach(([name, h]) => {
            if (!workerMap[name]) {
              workerMap[name] = { hours: 0, teams: new Set() };
            }
            workerMap[name].hours += Number(h) || 0;
            workerMap[name].teams.add(team);
          });
        }
      });
    });

    Object.entries(workerMap).forEach(([name, info]) => {
      const hours = Math.round(info.hours * 100) / 100;
      const unitPrice = WORKER_PRICE[name] || 0;
      const baseSalary = hours * unitPrice;
      const overtimeSalary =
        hours > BONUS_THRESHOLD ? (hours - BONUS_THRESHOLD) * BONUS_PER_HOUR : 0;
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
      <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-xs sm:max-w-sm">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-green-800 rounded-full animate-spin"></div>
          <p className="text-gray-800 font-semibold text-xl">
            Đang chuẩn bị báo cáo cho bạn...
          </p>
          <p className="text-gray-600 text-base">
            Chúng tôi đang tổng hợp dữ liệu mới nhất. Chỉ mất vài giây thôi! ☕
          </p>
        </div>
      </div>
    );
  }

  // Phần return JSX giữ nguyên như code của bạn (tab chuyển đổi, báo cáo sản lượng, báo cáo lương)
  // Chỉ sửa nhỏ: đổi "BÁO CÁO SẢN PHẨM" → "BÁO CÁO LƯƠNG" cho đúng ý nghĩa
  // Và đảm bảo không có thẻ <main> lồng nhau dư thừa

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
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
            BÁO CÁO LƯƠNG
          </button>
        </div>
      </div>

      {/* Phần còn lại: header filter, main content cho từng reportType */}
      {/* Copy nguyên từ code cũ của bạn (phần {reportType === 'cont' && (...)} và {reportType === 'salary' && (...)} */}
      {/* Chỉ cần xóa thẻ <main> dư ở dòng có pb-20 và pb-[calc(...)] chồng nhau */}

      {/* Ví dụ phần cont (giữ nguyên, chỉ sửa nhỏ nếu cần) */}
      {reportType === "cont" && (
        <>
          {/* header filter + summary */}
          {/* main content danh sách ngày */}
        </>
      )}

      {reportType === "salary" && (
        <>
          {/* header filter lương */}
          {/* main content bảng lương */}
        </>
      )}
    </div>
  );
};

export default ReportDashboard;
