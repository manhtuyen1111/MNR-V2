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
// ID thư mục gốc Google Drive của bạn
var ROOT_FOLDER_ID = '1Gpn6ZSUAUwSJqLAbYMo50kICCufLtLx-';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); 

  try {
    var data = JSON.parse(e.postData.contents);
    var containerNumber = data.containerNumber;
    var teamName = data.team;
    var images = data.images; 
    var timestamp = new Date(data.timestamp);
    var editor = data.editor || 'unknown';

    var year = timestamp.getFullYear().toString();
    var month = ("0" + (timestamp.getMonth() + 1)).slice(-2);
    var day = ("0" + timestamp.getDate()).slice(-2);

    var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    
    var yearFolder = getOrCreateFolder(rootFolder, year);
    var monthFolder = getOrCreateFolder(yearFolder, month);
    var dayFolder = getOrCreateFolder(monthFolder, day);
    var teamFolder = getOrCreateFolder(dayFolder, teamName);
    var containerFolder = getOrCreateFolder(teamFolder, containerNumber);

    for (var i = 0; i < images.length; i++) {
      var imageBase64 = images[i].split(',')[1];
      var decodedImage = Utilities.base64Decode(imageBase64);
      var blob = Utilities.newBlob(decodedImage, 'image/jpeg', containerNumber + '_' + (i + 1) + '.jpg');
      containerFolder.createFile(blob);
    }

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
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <LinkIcon className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-bold text-gray-800">Kết nối Google Sheet</h2>
          </div>

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

          {!url ? (
             <div className="flex items-start space-x-2 mt-3 text-amber-600 text-xs bg-amber-50 p-3 rounded-xl border border-amber-100">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Vui lòng triển khai Google Apps Script và dán URL vào đây để kích hoạt tính năng lưu ảnh.</span>
             </div>
          ) : (
             <div className="flex items-center space-x-2 mt-3 text-green-600 text-xs bg-green-50 p-3 rounded-xl border border-green-100">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã nhập URL. Nhấn Lưu để hoàn tất.</span>
             </div>
          )}
          
          <div className="mt-6">
             <button 
                onClick={handleSave}
                className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 active:scale-95 transition-transform flex items-center justify-center space-x-2"
             >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình</span>
             </button>
          </div>
       </div>

       {/* Instruction Card */}
       <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <FileCode className="w-5 h-5 mr-2 text-sky-400" />
                    Hướng dẫn & Mã Script
                </div>
            </h3>

            <div className="space-y-4 text-sm text-slate-300">
                <div className="flex space-x-3">
                    <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shrink-0">1</span>
                    <p>Truy cập <a href="https://script.google.com" target="_blank" className="text-sky-400 underline decoration-sky-400/30">script.google.com</a>, tạo dự án mới.</p>
                </div>
                <div className="flex space-x-3">
                    <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shrink-0">2</span>
                    <p>Copy mã bên dưới và dán vào file <code>Code.gs</code> (xóa mã cũ).</p>
                </div>
                
                {/* Script Code Block Toggle */}
                <div className="mt-2 bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                    <button 
                        onClick={() => setShowScript(!showScript)}
                        className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <span className="text-xs font-mono text-sky-300 font-bold">Xem Mã Script (Code.gs)</span>
                        {showScript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showScript && (
                        <div className="relative group">
                            <pre className="p-3 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                                {SCRIPT_CODE}
                            </pre>
                            <button 
                                onClick={() => copyToClipboard(SCRIPT_CODE)}
                                className="absolute top-2 right-2 p-2 bg-sky-600 text-white rounded-lg shadow-lg hover:bg-sky-500 flex items-center space-x-1"
                            >
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Copy</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex space-x-3">
                    <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shrink-0">3</span>
                    <p>Nhấn <strong>Deploy</strong> &rarr; <strong>New deployment</strong>.</p>
                </div>
                <div className="flex space-x-3">
                    <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shrink-0">4</span>
                    <p>Chọn loại <strong>Web app</strong>.</p>
                </div>
                 <div className="flex space-x-3">
                    <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shrink-0">5</span>
                    <p>Cấu hình <strong>Execute as: Me</strong> và <strong>Who has access: Anyone</strong>.</p>
                </div>
                <div className="flex space-x-3">
                    <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shrink-0">6</span>
                    <p>Copy URL và dán vào ô bên trên.</p>
                </div>
            </div>
       </div>
    </div>
  );
};

export default Settings;