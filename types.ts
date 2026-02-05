export interface Team {
  id: string;
  name: string;
  color: string; // Tailwind class for background/text
  isCustom?: boolean;
}

export interface RepairRecord {
  id: string;
  containerNumber: string;
  teamId: string;
  images: string[]; // Changed from single string to array
  timestamp: number;
  synced?: boolean;
}

export type TabView = 'capture' | 'history' | 'settings';

export interface AppSettings {
  googleScriptUrl: string;
}