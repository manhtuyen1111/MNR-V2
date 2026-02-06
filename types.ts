
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
  uploadedCount?: number; // Track how many images have been successfully uploaded to Drive
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
}
