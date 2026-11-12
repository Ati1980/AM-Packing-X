import { InspectionRecord } from '../types';

const GAS_API_URL = "https://script.google.com/macros/s/AKfycby0tMGCk5-0gXw1hwmnAwYN_FDLjSDsU5bd3s2kXtboL7jIak0HGgTPF6uZOg6yC5D2wA/exec";
const CACHE_KEY = "am_records";
const CACHE_TIME_KEY = "am_records_last_sync";
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

export const DatabaseService = {
  getLocalRecords(): InspectionRecord[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading localStorage:", e);
      return [];
    }
  },

  setLocalRecords(records: InspectionRecord[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(records));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Storage quota exceeded or disabled:", e);
    }
  },

  async fetchRecords(forceRefresh = false): Promise<{ data: InspectionRecord[]; synced: boolean }> {
    const localData = this.getLocalRecords();
    const lastSync = parseInt(localStorage.getItem(CACHE_TIME_KEY) || "0", 10);
    const isCacheValid = Date.now() - lastSync < CACHE_EXPIRY_MS;

    if (!forceRefresh && isCacheValid && localData.length > 0) {
      return { data: localData, synced: false };
    }

    try {
      const requestUrl = `${GAS_API_URL}?action=getAllRecords&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((r: any) => r && r.datetime)
          .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        this.setLocalRecords(cleaned);
        return { data: cleaned, synced: true };
      }
      return { data: localData, synced: false };
    } catch (err) {
      console.warn("Network fetch failed, fallback to local storage:", err);
      return { data: localData, synced: false };
    }
  },

  async submitRecord(record: InspectionRecord): Promise<any> {
    const current = this.getLocalRecords();
    current.unshift(record);
    this.setLocalRecords(current);

    try {
      const response = await fetch(GAS_API_URL, {
        method: "POST",
        mode: "cors",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(record)
      });

      if (!response.ok) throw new Error(`Server returned status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Failed to sync record to Google Sheet:", err);
      throw err;
    }
  }
};
