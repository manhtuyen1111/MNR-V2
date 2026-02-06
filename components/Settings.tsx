import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Link as LinkIcon, AlertCircle, FileCode, CheckCircle2, Copy, ChevronDown, ChevronUp, Zap, BookOpen, X, AlertTriangle } from 'lucide-react';
import { resetToDefault } from '../utils/resetApp';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

type SettingsTab = 'connection' | 'guide';

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [url, setUrl] = useState(settings.googleScriptUrl || '');
  const [showScript, setShowScript] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('connection');

  const handleSave = () => {
    onSave({ ...settings, googleScriptUrl: url });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy mã vào bộ nhớ tạm!');
  };

  // SCRIPT_CODE giữ nguyên, đảm bảo string đóng đúng
  const SCRIPT_CODE = `// --- CẤU HÌNH v2.2 (Hỗ trợ Upload từng phần) ---
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
    var startIdx = data.startIdx || 0; 

    var year = timestamp.getFullYear().toString();
    var month = ("0" + (timestamp.getMonth() + 1)).slice(-2);
    var day = ("0" + timestamp.getDate()).slice(-2);
    
    var yearMonthFolderLabel = year + " - Tháng " + month;
    var fullDateString = day + "-" + month + "-" + year; 

    var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    
    var yearMonthFolder = getOrCreateFolder(rootFolder, yearMonthFolderLabel);
    var dateFolder = getOrCreateFolder(yearMonthFolder, fullDateString);
    var teamFolder = getOrCreateFolder(dateFolder, teamName);
    var containerFolder = getOrCreateFolder(teamFolder, containerNumber);
    
    lock.releaseLock(); 

    var timeStr = timestamp.getTime().toString();
    
    for (var i = 0; i < images.length; i++) {
      var imageBase64 = images[i].split(',')[1];
      var decodedImage = Utilities.base64Decode(imageBase64);
      
      var imageIndex = startIdx + i + 1;
      var fileName = containerNumber + '_' + timeStr + '_' + imageIndex + '.jpg';
      
      var blob = Utilities.newBlob(decodedImage, 'image/jpeg', fileName);
      containerFolder.createFile(blob);
    }

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getActiveSheet();
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(["Thời gian", "Số Container", "Tổ", "Người chụp", "Ảnh gửi đợt này", "Tổng ảnh (ước tính)", "Link Folder"]);
        }
        sheet.appendRow([
          new Date(), 
          containerNumber, 
          teamName, 
          editor, 
          images.length,
          startIdx + images.length,
          containerFolder.getUrl()
        ]);
      }
    } catch(err) {}

    return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}`;

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Tab Navigation */}
      <div className="px-4 pt-4 pb-2 bg-slate-100 shrink-0 z-10">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex">
          <button 
            onClick={() => setActiveTab('connection')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all duration-300 ${activeTab === 'connection' ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Zap className={`w-4 h-4 ${activeTab === 'connection' ? 'fill-sky-700' : ''}`} />
            <span className="text-xs font-black uppercase tracking-wider">Kết nối API</span>
          </button>
          <button 
            onClick={() => setActiveTab('guide')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all duration-300 ${activeTab === 'guide' ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'guide' ? 'fill-purple-700' : ''}`} />
            <span className="text-xs font-black uppercase tracking-wider">Mã Script & HD</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide">
        
        {activeTab === 'connection' && (
          <div className="space-y-4 animate-fadeIn mt-2">
            <div className="bg-white rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl shadow-lg shadow-sky-200">
                  <LinkIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Liên kết Web App</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Google Apps Script URL</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Dán URL vào đây..."
                    className="w-full py-4 pl-4 pr-20 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-sky-500 focus:bg-white focus:outline-none transition-all text-sm font-bold text-slate-700 shadow-inner placeholder:font-normal"
                  />
                  {url && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      <button 
                        onClick={() => setUrl('')}
                        className="p-1.5 rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"
                        title="Xóa nhanh"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <CheckCircle2 className="w-5 h-5 text-green-500 ml-1" />
                    </div>
                  )}
                </div>
                
                {!url ? (
                  <div className="flex items-start space-x-2 text-amber-600 text-[10px] font-bold bg-amber-50 p-3 rounded-xl border border-amber-100/50">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="leading-tight">Cần URL để tính năng đồng bộ hoạt động.</span>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 text-green-600 text-[10px] font-bold bg-green-50 p-3 rounded-xl border border-green-100/50">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="leading-tight">Sẵn sàng đồng bộ dữ liệu.</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-slate-900 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center space-x-3 border border-slate-700"
            >
              <Save className="w-5 h-5" />
              <span className="uppercase tracking-widest text-xs">Lưu Cấu Hình</span>
            </button>

            {/* Reset block */}
            <div className="mt-10 pt-8 border-t-2 border-red-300 bg-red-50/40 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Reset toàn bộ ứng dụng
              </h3>
              <p className="text-sm text-red-800/90 mb-5 leading-relaxed">
                Xóa hết dữ liệu cục bộ (URL script, token, cài đặt, lịch sử...). App sẽ về trạng thái mới. Không thể khôi phục!
              </p>
              <button
                onClick={resetToDefault}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                RESET TOÀN BỘ VỀ MẶC ĐỊNH BAN ĐẦU
              </button>
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-4 animate-fadeIn mt-2">
            <div className="bg-[#0f172a] text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              
              <h3 className="font-black text-lg mb-5 flex items-center border-b border-white/10 pb-4">
                <FileCode className="w-6 h-6 mr-3 text-purple-400" />
                <span className="tracking-tight">Mã Nguồn Script v2.2 (New)</span>
              </h3>

              <div className="space-y-4">
                <p className="text-[10px] text-purple-300 font-bold bg-purple-900/20 p-3 rounded-xl border border-purple-500/20 uppercase tracking-widest leading-relaxed">
                  Cập nhật: Hỗ trợ tính năng Retry thông minh (chỉ gửi ảnh lỗi). Vui lòng Deploy lại.
                </p>

                <div className="bg-[#020617] rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                  <button 
                    onClick={() => setShowScript(!showScript)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <span className="text-[10px] font-black font-mono text-purple-300 uppercase tracking-widest group-hover:text-purple-200">
                      {showScript ? 'Thu gọn mã' : 'Xem toàn bộ mã'}
                    </span>
                    {showScript ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  
                  {showScript && (
                    <div className="relative group/code">
                      <pre className="p-4 text-[9px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-black/50 custom-scrollbar">
                        {SCRIPT_CODE}
                      </pre>
                      <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(SCRIPT_CODE)}
                          className="p-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-500 flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase">Copy</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Các bước triển khai</h4>
                  <div className="flex space-x-3 items-start">
                    <span className="bg-white/10 w-5 h-5 flex items-center justify-center rounded font-bold text-[10px] shrink-0 text-purple-400">1</span>
                    <p className="text-[11px] text-slate-300 leading-tight pt-0.5">Tạo dự án mới tại <a href="https://script.google.com" target="_blank" className="text-purple-400 hover:underline font-bold">script.google.com</a></p>
                  </div>
                  <div className="flex space-x-3 items-start">
                    <span className="bg-white/10 w-5 h-5 flex items-center justify-center rounded font-bold text-[10px] shrink-0 text-purple-400">2</span>
                    <p className="text-[11px] text-slate-300 leading-tight pt-0.5">Dán mã trên vào file <code>Code.gs</code> và lưu lại.</p>
                  </div>
                  <div className="flex space-x-3 items-start">
                    <span className="bg-white/10 w-5 h-5 flex items-center justify-center rounded font-bold text-[10px] shrink-0 text-purple-400">3</span>
                    <p className="text-[11px] text-slate-300 leading-tight pt-0.5">Chọn <strong>Deploy</strong> → <strong>New deployment</strong>. Chọn <em>Web app</em>, Access: <em>Anyone</em>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
