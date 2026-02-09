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

/* ===== USER TYPES (CÁCH 2) ===== */

export type Role = 'admin' | 'qc' | 'worker';

export interface BaseUser {
  username: string;
  name: string;
  role: Role;
  assignedTeamId?: string;
}

export interface LoginUser extends BaseUser {
  role: 'admin' | 'qc';
  password: string;
}

export interface WorkerUser extends BaseUser {
  role: 'worker';
  assignedTeamId: string;
}

export type User = LoginUser | WorkerUser;
