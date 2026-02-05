import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [url, setUrl] = useState(settings.googleScriptUrl || '');

  const handleSave = () => {
    onSave({ ...settings, googleScriptUrl: url });
  };

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <LinkIcon className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-bold text-gray-800">Kết nối Google Sheet</h2>
          </div>

          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
             Dán đường dẫn (URL) của Google Apps Script Web App vào dưới đây để đồng bộ dữ liệu nghiệm thu về Google Sheet.
          </p>

          <div className="space-y-2">
             <label className="text-xs font-bold uppercase text-gray-400">Web App URL</label>
             <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:bg-white focus:outline-none transition-colors text-sm font-mono text-gray-700"
             />
          </div>

          {!url && (
             <div className="flex items-center space-x-2 mt-3 text-amber-500 text-xs bg-amber-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>Bạn cần nhập URL để sử dụng tính năng lưu trữ.</span>
             </div>
          )}
          
          <div className="mt-6">
             <button 
                onClick={handleSave}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 active:scale-95 transition-transform flex items-center justify-center space-x-2"
             >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình</span>
             </button>
          </div>
       </div>

       <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <h3 className="font-bold text-blue-800 text-sm mb-2">Hướng dẫn nhanh:</h3>
            <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                <li>Mở Google Sheet &rarr; Extensions &rarr; Apps Script.</li>
                <li>Deploy dạng Web App (Triển khai ứng dụng web).</li>
                <li>Quyền truy cập: &quot;Anyone&quot; (Bất kỳ ai).</li>
                <li>Copy URL và dán vào ô trên.</li>
            </ul>
       </div>
    </div>
  );
};

export default Settings;