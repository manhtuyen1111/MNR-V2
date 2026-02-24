import { useEffect, useState } from "react";

const ReportDashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbywEbr-Mb9QyjxH7yu9TzNwO7tir1IaGGIZ4isEQWh0QqFLrsFg2ds0uLV0IGdV7vMN/exec")
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setRows(result.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy báo cáo:", err);
        setLoading(false);
      });
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
    <div className="overflow-x-auto p-4">
      <table className="min-w-full text-xs border border-slate-300 bg-white">
        <thead className="bg-slate-100">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 border text-left font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-slate-50">
              {headers.map((h) => (
                <td key={h} className="px-3 py-2 border">
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportDashboard;
