// utils/resetApp.ts - Reset toàn bộ app về mặc định (bao gồm xóa lịch sử IndexedDB)

export const resetToDefault = async (): Promise<void> => {
  const confirmed = window.confirm(
    'Bạn chắc chắn muốn RESET toàn bộ ứng dụng về mặc định?\n\n' +
    '• Xóa hết dữ liệu cục bộ: cài đặt URL Google Script, teams, user...\n' +
    '• XÓA TOÀN BỘ lịch sử sửa chữa (tab Lịch sử)\n' +
    '• App sẽ reload và về trạng thái như mới cài đặt\n' +
    '• KHÔNG THỂ KHÔI PHỤC! Xác nhận?'
  );

  if (!confirmed) return;

  try {
    // Xóa localStorage và sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Xóa cache trình duyệt (nếu là PWA)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Hủy service worker (nếu có)
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // Xóa IndexedDB (lịch sử sửa chữa)
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('RepairDB', 1); // Thay 'RepairDB' bằng tên DB thực tế của mày

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = db.transaction('repairRecords', 'readwrite'); // Thay 'repairRecords' bằng tên objectStore thực tế
        const store = tx.objectStore('repairRecords');
        const clearReq = store.clear();

        clearReq.onsuccess = () => resolve();
        clearReq.onerror = () => reject(clearReq.error || new Error('Clear failed'));
      };

      request.onerror = () => reject(request.error);
    });

    alert('Đã reset toàn bộ ứng dụng về mặc định!\nApp sẽ tải lại ngay.');
    window.location.reload();
  } catch (error) {
    console.error('Lỗi reset:', error);
    alert('Reset thất bại. Vui lòng thử lại hoặc xóa cache trình duyệt thủ công.');
  }
};
