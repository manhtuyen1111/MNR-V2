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
  imageHashes?: string[];         // Mới: Lưu hash SHA-256 của từng ảnh để tránh duplicate khi retry
}

export type TabView = 'capture' | 'history' | 'settings';

export interface AppSettings {
  googleScriptUrl: string;
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'qc' | 'worker';
  assignedTeamId?: string; // If set, user is locked to this team
  password?: string;          // optional để không bắt buộc phải có ở mọi user
}
