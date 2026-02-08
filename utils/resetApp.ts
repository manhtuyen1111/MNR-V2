// utils/resetApp.ts - Reset toàn bộ app, xóa hết IndexedDB mà không cần biết tên DB

export const resetToDefault = async (): Promise<void> => {
  const confirmed = window.confirm(
    'Bạn chắc chắn muốn RESET toàn bộ ứng dụng về mặc định?\n\n' +
    '• Xóa hết cài đặt, user, teams\n' +
    '• XÓA TOÀN BỘ lịch sử sửa chữa (tab Lịch sử)\n' +
    '• App sẽ reload về trạng thái mới\n' +
    '• KHÔNG THỂ KHÔI PHỤC! Xác nhận?'
  );

  if (!confirmed) return;

  try {
    // Xóa localStorage và sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Xóa cache PWA
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }

    // Xóa service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // Xóa TOÀN BỘ IndexedDB databases (không cần biết tên DB)
    if (indexedDB.databases) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(dbInfo => {
          if (dbInfo.name) {
            return new Promise<void>((resolve, reject) => {
              const req = indexedDB.deleteDatabase(dbInfo.name!);  // Thêm ! ở đây
              req.onsuccess = () => resolve();
              req.onerror = () => reject(req.error);
              req.onblocked = () => {
                console.warn('Delete blocked for DB:', dbInfo.name!);  // Thêm ! nếu cần
                resolve(); // Tiếp tục dù blocked
              };
            });
          }
          return Promise.resolve();
        })
      );
    } else {
      // Fallback cho browser cũ
      console.warn('indexedDB.databases() not supported, skipping DB clear');
    }

    alert('Đã reset toàn bộ thành công!\nApp sẽ tải lại ngay.');
    window.location.reload();
  } catch (error) {
    console.error('Lỗi reset:', error);
    alert('Reset thành công một phần. Vui lòng reload trang hoặc xóa cache trình duyệt thủ công.');
    window.location.reload();
  }
};
