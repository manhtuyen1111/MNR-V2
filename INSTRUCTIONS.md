# Hướng Dẫn Cài Đặt Google Apps Script

Để ứng dụng có thể lưu ảnh vào Google Drive của bạn, hãy làm theo các bước sau:

## Bước 1: Tạo Script
1. Truy cập [script.google.com](https://script.google.com/)
2. Tạo dự án mới (**New Project**).
3. Copy toàn bộ đoạn mã bên dưới vào file `Code.gs` (xóa mã cũ đi).

## Bước 2: Mã Script (Code.gs)

```javascript
// --- CẤU HÌNH ---
// ID thư mục gốc mà bạn đã cung cấp
var ROOT_FOLDER_ID = '1Gpn6ZSUAUwSJqLAbYMo50kICCufLtLx-';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Đợi tối đa 10 giây để tránh xung đột

  try {
    // 1. Phân tích dữ liệu từ App gửi lên
    var data = JSON.parse(e.postData.contents);
    var containerNumber = data.containerNumber;
    var teamName = data.team;
    var images = data.images; // Mảng base64
    var timestamp = new Date(data.timestamp);
    var editor = data.editor || 'unknown';

    // 2. Lấy thông tin ngày tháng
    var year = timestamp.getFullYear().toString();
    var month = ("0" + (timestamp.getMonth() + 1)).slice(-2);
    var day = ("0" + timestamp.getDate()).slice(-2);

    // 3. Xử lý thư mục theo cấu trúc: Năm / Tháng / Ngày / Tổ / Số Cont
    // DriveApp.getFolderById cần quyền truy cập Drive
    var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    
    var yearFolder = getOrCreateFolder(rootFolder, year);
    var monthFolder = getOrCreateFolder(yearFolder, month);
    var dayFolder = getOrCreateFolder(monthFolder, day);
    var teamFolder = getOrCreateFolder(dayFolder, teamName);
    var containerFolder = getOrCreateFolder(teamFolder, containerNumber);

    // 4. Lưu hình ảnh
    for (var i = 0; i < images.length; i++) {
      var imageBase64 = images[i].split(',')[1];
      var decodedImage = Utilities.base64Decode(imageBase64);
      var blob = Utilities.newBlob(decodedImage, 'image/jpeg', containerNumber + '_' + (i + 1) + '.jpg');
      containerFolder.createFile(blob);
    }

    // 5. Ghi log vào Sheet (Nếu script gắn với Google Sheet)
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getActiveSheet();
        // Thêm header nếu chưa có
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(["Thời gian", "Số Container", "Tổ", "Người chụp", "Số lượng ảnh", "Link Folder"]);
        }
        sheet.appendRow([
          new Date(), 
          containerNumber, 
          teamName, 
          editor, 
          images.length, 
          containerFolder.getUrl()
        ]);
      }
    } catch(err) {
      // Bỏ qua nếu không chạy trên Sheet
    }

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
```

## Bước 3: Deploy (Triển khai)
1. Nhấn nút **Deploy** (màu xanh dương) -> chọn **New deployment**.
2. Nhấn vào biểu tượng bánh răng (bên cạnh "Select type") -> chọn **Web app**.
3. Điền thông tin:
   - **Description**: ContainerQC API
   - **Execute as**: `Me` (quan trọng: để script dùng quyền của bạn ghi vào Folder ID kia).
   - **Who has access**: `Anyone` (quan trọng: để App không cần đăng nhập Google vẫn gửi được).
4. Nhấn **Deploy**.
5. Copy **Web App URL** (có dạng `https://script.google.com/macros/s/.../exec`).

## Bước 4: Cấu hình App
1. Quay lại App ContainerQC.
2. Vào tab **Cấu hình**.
3. Dán URL vừa copy vào ô **Web App URL**.
4. Nhấn **Lưu Cấu Hình**.
