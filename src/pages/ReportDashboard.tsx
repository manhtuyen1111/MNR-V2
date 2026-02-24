import { useEffect, useState } from "react";

const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbwRAOP4r12ZoBWH8Q__jdFG1u-mro3ecaWHJqgruk9MpY4IeI9iNsUXKhE8nWg7KC0W/exec")
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setRows(result.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Đang tải báo cáo...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-6 text-center text-slate-400">
        Không có dữ liệu
      </div>
    );
  }

  const headers = Object.keys(rows[0]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-4 py-3 border-b bg-white font-semibold text-slate-700">
        BÁO CÁO SỬA CHỮA
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-[11px] text-slate-700">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 border-b text-left font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b hover:bg-slate-100"
              >
                {headers.map((h) => (
                  <td
                    key={h}
                    className="px-3 py-2 whitespace-nowrap"
                  >
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportDashboard;
