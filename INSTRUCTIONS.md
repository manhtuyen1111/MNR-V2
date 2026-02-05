# Hướng Dẫn Cài Đặt Google Apps Script

Để ứng dụng có thể lưu ảnh vào Google Drive của bạn, hãy làm theo các bước sau:

## Bước 1: Tạo Script
1. Truy cập [script.google.com](https://script.google.com/)
2. Tạo dự án mới (**New Project**).
3. Copy toàn bộ đoạn mã bên dưới vào file `Code.gs` (xóa mã cũ đi).

## Bước 2: Mã Script (Code.gs)

```javascript
// --- CẤU HÌNH ---
var ROOT_FOLDER_ID = '1Gpn6ZSUAUwSJqLAbYMo50kICCufLtLx-';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000); // Wait 5s max

  try {
    var data = JSON.parse(e.postData.contents);
    var containerNumber = data.containerNumber;
    var teamName = data.team;
    var images = data.images; // Mảng base64
    var timestamp = new Date(data.timestamp);
    var editor = data.editor || 'unknown';

    var year = timestamp.getFullYear().toString();
    var month = ("0" + (timestamp.getMonth() + 1)).slice(-2);
    var day = ("0" + timestamp.getDate()).slice(-2);
    var fullDateString = day + "-" + month + "-" + year; // Định dạng NGÀY-THÁNG-NĂM

    var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    
    // Cấu trúc: NĂM -> THÁNG -> NGÀY-THÁNG-NĂM -> SỐ CONTAINER
    var yearFolder = getOrCreateFolder(rootFolder, year);
    var monthFolder = getOrCreateFolder(yearFolder, month);
    var dateFolder = getOrCreateFolder(monthFolder, fullDateString);
    var containerFolder = getOrCreateFolder(dateFolder, containerNumber);

    // Lưu hình ảnh (Sử dụng timestamp trong tên file để tránh trùng lặp khi up bổ sung)
    var timeStr = timestamp.getTime().toString();
    for (var i = 0; i < images.length; i++) {
      var imageBase64 = images[i].split(',')[1];
      var decodedImage = Utilities.base64Decode(imageBase64);
      // Tên file: SO_CONT_TIMESTAMP_INDEX.jpg
      var fileName = containerNumber + '_' + timeStr + '_' + (i + 1) + '.jpg';
      var blob = Utilities.newBlob(decodedImage, 'image/jpeg', fileName);
      containerFolder.createFile(blob);
    }

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getActiveSheet();
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(["Thời gian", "Số Container", "Tổ", "Người chụp", "Số lượng ảnh gửi lên", "Link Folder"]);
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
