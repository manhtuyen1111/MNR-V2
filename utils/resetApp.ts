// utils/resetApp.ts - Reset toàn bộ app về mặc định (không dùng Google API)

export const resetToDefault = (): void => {
  const confirmed = window.confirm(
    'Bạn chắc chắn muốn RESET toàn bộ ứng dụng về mặc định?\n\n' +
    '• Xóa hết dữ liệu cục bộ: cài đặt URL Google Script, token (nếu có), lịch sử...\n' +
    '• App sẽ reload và về trạng thái như mới cài đặt\n' +
    '• KHÔNG THỂ KHÔI PHỤC! Xác nhận?'
  );

  if (!confirmed) return;

  // Xóa toàn bộ storage
  localStorage.clear();
  sessionStorage.clear();

  // Xóa cache trình duyệt (nếu là PWA)
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  // Hủy service worker (nếu có)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }

  // Reload app để áp dụng reset
  alert('Đã reset toàn bộ ứng dụng về mặc định!\nApp sẽ tải lại ngay.');
  window.location.reload();
};
