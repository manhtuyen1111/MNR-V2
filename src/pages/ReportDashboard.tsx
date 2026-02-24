import { useEffect, useState } from "react";

interface ReportRow {
  [key: string]: string;
}

export default function ReportDashboard() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbywEbr-Mb9QyjxH7yu9TzNwO7tir1IaGGIZ4isEQWh0QqFLrsFg2ds0uLV0IGdV7vMN/exec")
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải báo cáo...</div>;
  }

  if (data.length === 0) {
    return <div style={{ padding: 20 }}>Không có dữ liệu</div>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>📊 BÁO CÁO</h2>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header} style={thStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={i % 2 === 0 ? rowEven : rowOdd}>
                {headers.map(header => (
                  <td key={header} style={tdStyle}>
                    {formatCell(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(value: string) {
  if (!isNaN(Number(value))) {
    return Number(value).toLocaleString("vi-VN");
  }
  return value;
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 600
};

const thStyle: React.CSSProperties = {
  backgroundColor: "#1976d2",
  color: "white",
  padding: "10px",
  textAlign: "left",
  position: "sticky",
  top: 0
};

const tdStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #ddd"
};

const rowEven: React.CSSProperties = {
  backgroundColor: "#f9f9f9"
};

const rowOdd: React.CSSProperties = {
  backgroundColor: "white"
};
