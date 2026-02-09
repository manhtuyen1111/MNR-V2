export interface Team {
  id: string;
  name: string;
  color: string; // Tailwind class for background/text
  isCustom?: boolean;
}

export type SyncStatus = 'pending' | 'synced' | 'error';

export interface RepairRecord {
  id: string;
  containerNumber: string;
  teamId: string;
  teamName: string;
  images: string[];
  timestamp: number;
  status: SyncStatus;
  uploadedCount: number;          // Bắt buộc, để theo dõi số ảnh đã upload thành công
  imageHashes?: string[];         // Lưu hash SHA-256 của từng ảnh
}

export type TabView = 'capture' | 'history' | 'settings';

export interface AppSettings {
  googleScriptUrl: string;
}

/* ===== USER ===== */

export type Role = 'admin' | 'qc' | 'worker';

export interface User {
  username: string;
  name: string;
  role: Role;
  password: string;          // 🔥 BẮT BUỘC cho TẤT CẢ (admin / qc / worker)
  assignedTeamId?: string;   // worker dùng
}
