// resetApp.ts - Hàm reset toàn bộ app về mặc định

export const resetToDefault = (): void => {
  // Hỏi xác nhận để tránh reset nhầm
  const confirmed = window.confirm(
    'Bạn chắc chắn muốn RESET toàn bộ ứng dụng về mặc định ban đầu?\n\n' +
    '• Tất cả dữ liệu local (cài đặt, token Google Drive, lịch sử chat, v.v.) sẽ bị xóa.\n' +
    '• Bạn sẽ phải đăng nhập lại Google Drive và các tài khoản khác.\n' +
    '• Không thể khôi phục sau khi reset!\n\n' +
    'Xác nhận?'
  );

  if (!confirmed) return; // Nếu không xác nhận, dừng lại

  // Xóa toàn bộ dữ liệu lưu trữ tạm thời
  localStorage.clear();
  sessionStorage.clear();

  // Đăng xuất Google (nếu app dùng Google Drive API)
  try {
    // Cách 1: Nếu dùng gapi cũ
    if (window.gapi?.auth2) {
      const auth2 = window.gapi.auth2.getAuthInstance();
      if (auth2) {
        auth2.signOut();
        auth2.disconnect();
      }
    }

    // Cách 2: Nếu dùng Google Identity mới
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch (error) {
    console.warn('Không tìm thấy Google API để đăng xuất', error);
  }

  // Xóa cache trình duyệt (nếu app là PWA - progressive web app)
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }

  // Hủy service worker (nếu app có thể cài đặt như app mobile)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }

  // Thông báo và reload app
  alert('Đã reset toàn bộ ứng dụng về mặc định thành công!\nApp sẽ tải lại ngay bây giờ.');
  window.location.reload(); // Reload để áp dụng thay đổi
};
