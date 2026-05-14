export interface ElectronAPI {
  saveNotes: (notes: any[]) => Promise<void>;
  loadNotes: () => Promise<any[]>;
  saveSettings: (settings: any) => Promise<void>;
  loadSettings: () => Promise<any>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}