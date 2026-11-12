/**
 * Database & API Bridge Service (Full Production Code)
 * รองรับการทำงานภายนอก Google Apps Script เต็มรูปแบบ
 */
const DatabaseService = (() => {
  // 1. ระบุ Web App URL ที่ได้จากการ Deploy เป็น "Anyone"
  const GAS_API_URL = "https://script.google.com/macros/s/AKfycby0tMGCk5-0gXw1hwmnAwYN_FDLjSDsU5bd3s2kXtboL7jIak0HGgTPF6uZOg6yC5D2wA/exec";
  const CACHE_KEY = "am_records";
  const CACHE_TIME_KEY = "am_records_last_sync";
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // แคชไว้ 5 นาทีสำหรับเปิดแบบออฟไลน์

  /**
   * ดึงข้อมูลที่บันทึกไว้ใน LocalStorage
   */
  function getLocalRecords() {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading localStorage:", e);
      return [];
    }
  }

  /**
   * บันทึกข้อมูลชุดใหญ่ลง LocalStorage พร้อมประทับเวลา
   */
  function setLocalRecords(records) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(records));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Storage quota exceeded or disabled:", e);
    }
  }

  /**
   * ดึงข้อมูลทั้งหมดจาก Google Sheet ผ่าน Apps Script
   * @param {boolean} forceRefresh - บังคับดึงข้อมูลใหม่จาก Server
   * @returns {Promise<{data: Array, synced: boolean}>}
   */
  async function fetchRecords(forceRefresh = false) {
    const localData = getLocalRecords();
    const lastSync = parseInt(localStorage.getItem(CACHE_TIME_KEY) || "0", 10);
    const isCacheValid = Date.now() - lastSync < CACHE_EXPIRY_MS;

    // ถ้าไม่บังคับรีเฟรช และแคชยังไม่หมดอายุ ให้ใช้ข้อมูลเดิมก่อนเพื่อความเร็ว
    if (!forceRefresh && isCacheValid && localData.length > 0) {
      return { data: localData, synced: false };
    }

    try {
      // เพิ่ม timestamp ป้องกัน Browser แคชผลลัพธ์ของ GET request
      const requestUrl = `${GAS_API_URL}?action=getAllRecords&_t=${Date.now()}`;
      
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow", // จำเป็นสำหรับ Google Apps Script เพื่อรองรับ HTTP 302 Redirect
        headers: {
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter(r => r && r.datetime)
          .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

        setLocalRecords(cleaned);
        return { data: cleaned, synced: true };
      }

      return { data: localData, synced: false };
    } catch (err) {
      console.warn("Network fetch failed, fallback to local storage:", err);
      return { data: localData, synced: false };
    }
  }

  /**
   * ส่งบันทึกผลการตรวจสอบขึ้น Google Sheet
   * @param {Object} record - ข้อมูลจุดตรวจ
   * @returns {Promise<Object>}
   */
  async function submitRecord(record) {
    // 1. บันทึกลงเครื่องทันที (Optimistic UI Update) เพื่อให้หน้าเว็บแสดงผลทันทีโดยไม่ต้องรอโหลด
    const current = getLocalRecords();
    current.unshift(record);
    setLocalRecords(current);

    try {
      // 2. ส่งข้อมูลแบบ POST
      // ข้อสำคัญ: ใช้ Content-Type เป็น text/plain เพื่อป้องกันเบราว์เซอร์ส่ง OPTIONS Preflight
      // ซึ่ง Google Apps Script ไม่รองรับ OPTIONS request
      const response = await fetch(GAS_API_URL, {
        method: "POST",
        mode: "cors",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Failed to sync record to Google Sheet:", err);
      // ส่ง error ต่อให้ UI แจ้งเตือนว่าบันทึกเฉพาะในเครื่อง
      throw err;
    }
  }

  return {
    getLocalRecords,
    setLocalRecords,
    fetchRecords,
    submitRecord
  };
})();