
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Link as LinkIcon, AlertCircle, FileCode, CheckCircle2, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [url, setUrl] = useState(settings.googleScriptUrl || '');
  const [showScript, setShowScript] = useState(false);

  const handleSave = () => {
    onSave({ ...settings, googleScriptUrl: url });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy mã vào bộ nhớ tạm!');
  };

  const SCRIPT_CODE = `
// --- CẤU HÌNH ---
// ID của thư mục mẹ chứa tất cả dữ liệu
var ROOT_FOLDER_ID = '1Gpn6ZSUAUwSJqLAbYMo50kICCufLtLx-';

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Giảm thời gian chờ lock để tối ưu tốc độ xử lý đồng thời
  lock.tryLock(10000); 

  try {
    var data = JSON.parse(e.postData.contents);
    var containerNumber = data.containerNumber;
    var teamName = data.team;
    var images = data.images; // Mảng base64
    var timestamp = new Date(data.timestamp);
    var editor = data.editor || 'unknown';

    // Định dạng thời gian
    var year = timestamp.getFullYear().toString();
    var month = ("0" + (timestamp.getMonth() + 1)).slice(-2);
    var day = ("0" + timestamp.getDate()).slice(-2);
    
    // Tên thư mục theo yêu cầu: 2026 - Tháng 02
    var yearMonthFolderLabel = year + " - Tháng " + month;
    // Tên thư mục ngày: 05-02-2026
    var fullDateString = day + "-" + month + "-" + year; 

    var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    
    // Cấu trúc phân cấp: Năm - Tháng -> Ngày -> Tổ -> Số Container
    var yearMonthFolder = getOrCreateFolder(rootFolder, yearMonthFolderLabel);
    var dateFolder = getOrCreateFolder(yearMonthFolder, fullDateString);
    var teamFolder = getOrCreateFolder(dateFolder, teamName);
    var containerFolder = getOrCreateFolder(teamFolder, containerNumber);

    // Xử lý lưu hình ảnh
    var timeStr = timestamp.getTime().toString();
    
    for (var i = 0; i < images.length; i++) {
      var imageBase64 = images[i].split(',')[1];
      var decodedImage = Utilities.base64Decode(imageBase64);
      // Tên file: SO_CONT_TIMESTAMP_INDEX.jpg
      var fileName = containerNumber + '_' + timeStr + '_' + (i + 1) + '.jpg';
      var blob = Utilities.newBlob(decodedImage, 'image/jpeg', fileName);
      containerFolder.createFile(blob);
    }

    // Ghi log vào Spreadsheet để theo dõi
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getActiveSheet();
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(["Thời gian", "Số Container", "Tổ", "Người chụp", "Số lượng ảnh", "Link Folder"]);
        }
        sheet.appendRow([new Date(), containerNumber, teamName, editor, images.length, containerFolder.getUrl()]);
      }
    } catch(err) {}

    return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}
`;

  return (
    <div className="p-4 space-y-4 animate-fadeIn pb-24">
       {/* Input Card */}
       <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
             <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm">
                <LinkIcon className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Cấu hình Hệ thống</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Liên kết Google Apps Script</p>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Web App URL</label>
             <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:bg-white focus:outline-none transition-all text-sm font-mono text-slate-600 shadow-inner"
             />
          </div>

          {!url ? (
             <div className="flex items-start space-x-3 mt-4 text-amber-600 text-[11px] font-bold bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Vui lòng triển khai Google Apps Script mới và dán URL vào đây để kích hoạt tính năng lưu ảnh theo cấu trúc thư mục mới.</span>
             </div>
          ) : (
             <div className="flex items-center space-x-3 mt-4 text-green-600 text-[11px] font-bold bg-green-50 p-4 rounded-2xl border border-green-100">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã cấu hình URL kết nối thành công.</span>
             </div>
          )}
          
          <div className="mt-8">
             <button 
                onClick={handleSave}
                className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-900/20 active:scale-95 transition-transform flex items-center justify-center space-x-3 border border-purple-400/30"
             >
                <Save className="w-5 h-5" />
                <span className="uppercase tracking-widest text-xs">Lưu Cấu Hình</span>
             </button>
          </div>
       </div>

       {/* Instruction Card */}
       <div className="bg-[#0f172a] text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl"></div>
            
            <h3 className="font-black text-lg mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center">
                    <FileCode className="w-6 h-6 mr-3 text-sky-400" />
                    Mã Script Tối Ưu
                </div>
            </h3>

            <div className="space-y-5 text-sm text-slate-300">
                <p className="text-[10px] text-sky-400 font-black bg-sky-950/50 p-3 rounded-xl border border-sky-900/50 uppercase tracking-widest leading-relaxed">
                    Lưu ý: Script này đã được tối ưu để lưu ảnh theo cấu trúc thư mục Năm-Tháng/Ngày/Tổ/Cont và xử lý nhanh hơn.
                </p>
                
                <div className="space-y-3">
                    <div className="flex space-x-3">
                        <span className="bg-slate-800 w-6 h-6 flex items-center justify-center rounded-lg font-black text-[10px] shrink-0 border border-white/10 text-sky-400">1</span>
                        <p className="text-xs">Tạo dự án mới tại <a href="https://script.google.com" target="_blank" className="text-sky-400 underline decoration-sky-400/30 font-bold">Google Apps Script</a>.</p>
                    </div>
                    <div className="flex space-x-3">
                        <span className="bg-slate-800 w-6 h-6 flex items-center justify-center rounded-lg font-black text-[10px] shrink-0 border border-white/10 text-sky-400">2</span>
                        <p className="text-xs">Sao chép mã tối ưu bên dưới và dán vào file <code>Code.gs</code>.</p>
                    </div>
                </div>
                
                {/* Script Code Block Toggle */}
                <div className="mt-4 bg-[#0a0f1d] rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                    <button 
                        onClick={() => setShowScript(!showScript)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <span className="text-[10px] font-black font-mono text-sky-300 uppercase tracking-widest">Xem Mã Code.gs</span>
                        {showScript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showScript && (
                        <div className="relative group">
                            <pre className="p-4 text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-black/30">
                                {SCRIPT_CODE}
                            </pre>
                            <button 
                                onClick={() => copyToClipboard(SCRIPT_CODE)}
                                className="absolute top-3 right-3 p-3 bg-sky-600 text-white rounded-xl shadow-2xl hover:bg-sky-500 flex items-center space-x-2 border border-sky-400/50 transition-all"
                            >
                                <Copy className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Copy</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex space-x-3">
                    <span className="bg-slate-800 w-6 h-6 flex items-center justify-center rounded-lg font-black text-[10px] shrink-0 border border-white/10 text-sky-400">3</span>
                    <p className="text-xs"><strong>Deploy</strong> &rarr; <strong>New deployment</strong> (Web App, Me, Anyone).</p>
                </div>
            </div>
       </div>
    </div>
  );
};

export default Settings;
