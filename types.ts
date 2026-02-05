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
}

export type TabView = 'capture' | 'history' | 'settings';

export interface AppSettings {
  googleScriptUrl: string;
}