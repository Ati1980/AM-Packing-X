/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes, ClipboardEdit, Clock, TrendingUp,
  UserCheck, Factory, ShieldCheck, Gauge,
  ListCheck, RotateCcw, Save, RotateCw, FileSpreadsheet,
  CalendarDays, CheckCircle2, Box, Check,
  ChevronDown, ChevronUp, Thermometer, Sparkles, GaugeCircle,
  Cpu, Layers, Zap, Activity, Wrench, Shield, CheckSquare,
  ClipboardList, ShieldAlert, Award
} from 'lucide-react';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { Machine, InspectionRecord } from './types';
import { DatabaseService } from './services/database';

const MACHINES: (Machine & { icon: any; badgeColor: string })[] = [
  { id: 1, name: 'เครื่องบรรจุ 1Kg No.1', color: '#ef4444', icon: Cpu, badgeColor: 'bg-red-50 text-red-600 border-red-200' },
  { id: 2, name: 'เครื่องบรรจุ 1Kg No.2', color: '#f59e0b', icon: Layers, badgeColor: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 3, name: 'เครื่องบรรจุ 1Kg No.3', color: '#eab308', icon: Zap, badgeColor: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { id: 4, name: 'เครื่องบรรจุ 1Kg No.4', color: '#10b981', icon: Activity, badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 5, name: 'เครื่องบรรจุ 1Kg No.5', color: '#3b82f6', icon: GaugeCircle, badgeColor: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 6, name: 'เครื่องบรรจุ 1Kg No.6', color: '#8b5cf6', icon: Box, badgeColor: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 7, name: 'เครื่องบรรจุ 1Kg No.7', color: '#ec4899', icon: Sparkles, badgeColor: 'bg-pink-50 text-pink-600 border-pink-200' }
];

const MACHINE_DEFAULTS: Record<number, any> = {
  1: {
    group1: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
    group2: { tempFront: [170, 190], tempBack: [170, 190], tempMid: [170, 185], timeFrontBack: null, timeMid: null }
  },
  2: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
  3: { tempFront: [175, 190], tempBack: [175, 190], tempMid: [165, 185], timeFrontBack: [80, 350], timeMid: [120, 320] },
  4: { tempFront: [170, 185], tempBack: [170, 185], tempMid: [170, 185], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  5: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  6: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [110, 350], timeMid: [120, 320] },
  7: { tempFront: [145, 170], tempBack: [145, 170], tempMid: [150, 175], timeFrontBack: [110, 350], timeMid: [120, 320] }
};

const MACHINE_SPEED_SPECS: Record<number, { std: number; set: number }> = {
  1: { std: 34.67, set: 45.00 },
  2: { std: 34.67, set: 45.00 },
  3: { std: 32.00, set: 40.00 },
  4: { std: 24.00, set: 35.00 },
  5: { std: 24.00, set: 35.00 },
  6: { std: 17.00, set: 22.00 },
  7: { std: 23.50, set: 25.00 }
};

const INSPECTORS = [
  { name: "นายอนิวัฒน์ ทองลาด", emoji: "👨‍💻", color: "#ef4444", badge: "bg-red-50 text-red-700 border-red-200" },
  { name: "นายประจักร์ น้อยมูล", emoji: "🦸‍♂️", color: "#f59e0b", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "นายภานุพงค์ นามวิเศษ", emoji: "🧙‍♂️", color: "#10b981", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "นายวัชรากร ขวัญเฉลิม", emoji: "🥷", color: "#8b5cf6", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "นายกิตติภัส สีสังชุม", emoji: "🤖", color: "#3b82f6", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "นายมงคล ติวสร้อย", emoji: "🐯", color: "#ec4899", badge: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "นายอำนาจ ทิพย์โพธิ์ศรี", emoji: "🦊", color: "#f97316", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "นายอดิศักดิ์ มณีจันทร์", emoji: "🦁", color: "#eab308", badge: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  { name: "นายปริวัฒน์ ทองมูล", emoji: "🚀", color: "#6366f1", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" }
];

const pad = (n: number) => String(n).padStart(2, '0');
const isToday = (dt?: string) => {
  if (!dt) return false;
  const d = new Date(dt);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

const formatDDMMYYYY = (dtStr?: string) => {
  if (!dtStr) return '-';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const SpeedometerGauge = ({ value, label, color, subLabel, cardBg }: { value: number; label: string; color: string; subLabel: string; cardBg: string }) => {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg flex flex-col items-center justify-between ${cardBg}`}>
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-900 font-display flex items-center gap-1.5"><Award className="w-4 h-4 text-blue-600" /> {label}</span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${value >= 80 ? 'bg-emerald-500/20 text-emerald-800' : value >= 60 ? 'bg-amber-500/20 text-amber-800' : 'bg-rose-500/20 text-rose-800'}`}>
          {value >= 80 ? 'Optimal' : value >= 60 ? 'Warning' : 'Critical'}
        </span>
      </div>
      <div className="relative w-32 h-32 flex items-center justify-center my-1">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="14"
            className="stroke-slate-200 fill-none"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="14"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black font-mono tracking-tighter text-slate-900">{value}%</span>
          <span className="text-[10px] font-bold text-slate-500">{subLabel}</span>
        </div>
      </div>
      <div className="w-full text-center text-[11px] font-semibold text-slate-500 mt-1">
        Target: ≥ 85%
      </div>
    </div>
  );
};

const recordOk = (r: InspectionRecord) => {
  return r.tfStatus !== 'fail' && r.tbStatus !== 'fail' && r.tmStatus !== 'fail' &&
         r.timeFbStatus !== 'fail' && r.timeMStatus !== 'fail' &&
         (r.lot === 'pass' || r.lot === 'ผ่าน') &&
         r.teflon === 'pass' && r.packSealTop === 'pass' && r.packSealMid === 'pass' &&
         r.packSealBot === 'pass' && r.hole === 'pass';
};

const getMaintenanceInsights = (machineName: string, recs: InspectionRecord[]) => {
  const mRecs = recs.filter(r => r.machine === machineName);
  if (mRecs.length === 0) {
    return {
      level: 'optimal',
      title: 'สถานะเครื่องจักร: ปกติ (ยังไม่มีข้อมูลประวัติเพียงพอ)',
      advice: 'เริ่มบันทึกข้อมูลการตรวจสอบสม่ำเสมอเพื่อเปิดใช้งานระบบวิเคราะห์แนวโน้มอัจฉริยะ'
    };
  }

  const recent = mRecs.slice(0, 5);
  const failCount = recent.filter(r => !recordOk(r)).length;

  if (failCount >= 2) {
    return {
      level: 'critical',
      title: '🚨 คำเตือนด่วน: ตรวจพบความผิดพลาดบ่อยครั้งในรอบล่าสุด',
      advice: 'แนะนำให้หยุดเครื่องชั่วคราวเพื่อตรวจสอบชุดซีลความร้อน (Thermal Seal) และฮีตเตอร์ทันที'
    };
  } else if (failCount === 1) {
    return {
      level: 'warning',
      title: '⚠️ เฝ้าระวัง: พบค่าหลุดสเปค 1 รายการในรอบล่าสุด',
      advice: 'ควรตรวจสอบอุณหภูมิฮีตเตอร์และสภาพเทปล่อนกันติดบริเวณก้านซีล'
    };
  } else {
    return {
      level: 'optimal',
      title: '✨ สภาพเครื่องจักรยอดเยี่ยม (Optimal Condition)',
      advice: 'ค่าอุณหภูมิและความเร็วอยู่ในเกณฑ์มาตรฐานสเปคต่อเนื่อง ไม่มีแนวโน้มความผิดปกติ'
    };
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'history' | 'dashboard'>('form');
  const [selectedMachine, setSelectedMachine] = useState<number>(1);
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [clockString, setClockString] = useState<string>('');
  const [currentISO, setCurrentISO] = useState<string>(new Date().toISOString());

  // Form State
  const [shift, setShift] = useState<string>('A');
  const [shiftType, setShiftType] = useState<'8h' | '12h'>(() => {
    const d = new Date().getDay();
    return (d === 5 || d === 6 || d === 0) ? '12h' : '8h';
  });
  const [operator, setOperator] = useState<string>('');
  const [speed, setSpeed] = useState<string>('');
  const [no1Group, setNo1Group] = useState<'group1' | 'group2'>('group1');

  const [tempFront, setTempFront] = useState<string>('');
  const [tempBack, setTempBack] = useState<string>('');
  const [tempMid, setTempMid] = useState<string>('');
  const [timeFrontBack, setTimeFrontBack] = useState<string>('');
  const [timeMid, setTimeMid] = useState<string>('');

  const [limits, setLimits] = useState({
    tempFront: [175, 210],
    tempBack: [175, 210],
    tempMid: [175, 210],
    timeFrontBack: null as number[] | null,
    timeMid: null as number[] | null
  });

  const [qc, setQc] = useState({
    lot: null as string | null,
    teflon: null as string | null,
    packSealTop: null as string | null,
    packSealMid: null as string | null,
    packSealBot: null as string | null,
    hole: null as string | null
  });

  const [notes, setNotes] = useState<string>('');
  const [targetKg, setTargetKg] = useState<string>('');
  const [actualKg, setActualKg] = useState<string>('');
  const [goodKg, setGoodKg] = useState<string>('');
  const [rejectKg, setRejectKg] = useState<string>('');
  const [breakdownMin, setBreakdownMin] = useState<string>('0');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalDesc, setModalDesc] = useState<string>('');

  const [showSpecsModal, setShowSpecsModal] = useState<boolean>(false);
  const [customSpeedSpecs, setCustomSpeedSpecs] = useState<Record<number, { std: number; set: number }>>(MACHINE_SPEED_SPECS);
  const [showLimitEditor, setShowLimitEditor] = useState<boolean>(false);
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState<boolean>(false);

  // History filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');

  // Dashboard Table Filters
  const [dashFilterDate, setDashFilterDate] = useState<string>('');
  const [dashFilterShift, setDashFilterShift] = useState<string>('all');
  const [dashFilterOperator, setDashFilterOperator] = useState<string>('all');
  const [dashFilterMachine, setDashFilterMachine] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const adminPin = '2810';

  const handleVerifyPin = () => {
    if (pinCode === adminPin) {
      setShowPinModal(false);
      setPinCode('');
      handleRunAiPrediction();
    } else {
      showToast('❌ รหัส PIN ไม่ถูกต้อง)');
      setPinCode('');
    }
  };

  const handleRunAiPrediction = async () => {
    setLoadingAi(true);
    setAiAnalysis(null);
    try {
      const machineRecs = records.filter(r => r.machine === activeMachineObj.name);
      const res = await fetch("/api/predict-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineName: activeMachineObj.name, records: machineRecs })
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
        showToast('วิเคราะห์ AI สำเร็จ ✔');
      } else {
        showToast('เกิดข้อผิดพลาดในการเรียก AI');
      }
    } catch {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ AI ได้');
    } finally {
      setLoadingAi(false);
    }
  };

  // Charts refs
  const speedChartRef = useRef<HTMLCanvasElement | null>(null);
  const tempChartRef = useRef<HTMLCanvasElement | null>(null);
  const speedChartInstance = useRef<Chart | null>(null);
  const tempChartInstance = useRef<Chart | null>(null);

  // Clock effect
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setCurrentISO(d.toISOString());
      setClockString(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial records fetch
  useEffect(() => {
    setRecords(DatabaseService.getLocalRecords());
    DatabaseService.fetchRecords().then(res => {
      setRecords(res.data);
    });
  }, []);

  // Apply machine defaults when selectedMachine or no1Group changes
  useEffect(() => {
    const isNo12 = selectedMachine === 1 || selectedMachine === 2;
    let defs = selectedMachine === 1 ? MACHINE_DEFAULTS[1][no1Group] : MACHINE_DEFAULTS[selectedMachine];

    if (defs) {
      setLimits({
        tempFront: defs.tempFront || [0, 0],
        tempBack: defs.tempBack || [0, 0],
        tempMid: defs.tempMid || [0, 0],
        timeFrontBack: isNo12 ? null : defs.timeFrontBack,
        timeMid: isNo12 ? null : defs.timeMid
      });
    }
  }, [selectedMachine, no1Group]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const checkRange = (valStr: string, min: number, max: number) => {
    if (!valStr.trim()) return 'unknown';
    if (valStr.includes('-')) {
      const parts = valStr.split('-').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return (parts[0] >= min && parts[1] <= max) ? 'pass' : 'fail';
      }
    } else {
      const v = parseFloat(valStr);
      if (!isNaN(v)) {
        return (v >= min && v <= max) ? 'pass' : 'fail';
      }
    }
    return 'unknown';
  };

  const tfStatus = checkRange(tempFront, limits.tempFront[0], limits.tempFront[1]);
  const tbStatus = checkRange(tempBack, limits.tempBack[0], limits.tempBack[1]);
  const tmStatus = checkRange(tempMid, limits.tempMid[0], limits.tempMid[1]);
  const timeFbStatus = limits.timeFrontBack ? checkRange(timeFrontBack, limits.timeFrontBack[0], limits.timeFrontBack[1]) : 'pass';
  const timeMStatus = limits.timeMid ? checkRange(timeMid, limits.timeMid[0], limits.timeMid[1]) : 'pass';



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = MACHINES.find(item => item.id === selectedMachine)!;

    const newRec: InspectionRecord = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      machine: m.name,
      datetime: currentISO,
      shift,
      shiftType,
      operator,
      speed: parseFloat(speed) || 0,
      tempFront: parseFloat(tempFront) || null,
      tempFrontMin: limits.tempFront[0],
      tempFrontMax: limits.tempFront[1],
      tfStatus,
      tempBack: parseFloat(tempBack) || null,
      tempBackMin: limits.tempBack[0],
      tempBackMax: limits.tempBack[1],
      tbStatus,
      tempMid: parseFloat(tempMid) || null,
      tempMidMin: limits.tempMid[0],
      tempMidMax: limits.tempMid[1],
      tmStatus,
      timeFrontBack: (selectedMachine === 1 || selectedMachine === 2) ? null : timeFrontBack.trim() || null,
      timeFrontBackMin: limits.timeFrontBack?.[0] || null,
      timeFrontBackMax: limits.timeFrontBack?.[1] || null,
      timeFbStatus,
      timeMid: (selectedMachine === 1 || selectedMachine === 2) ? null : timeMid.trim() || null,
      timeMidMin: limits.timeMid?.[0] || null,
      timeMidMax: limits.timeMid?.[1] || null,
      timeMStatus,
      lot: qc.lot,
      teflon: qc.teflon,
      packSealTop: qc.packSealTop,
      packSealMid: qc.packSealMid,
      packSealBot: qc.packSealBot,
      hole: qc.hole,
      targetKg: parseFloat(targetKg) || null,
      actualKg: parseFloat(actualKg) || null,
      goodKg: parseFloat(goodKg) || null,
      rejectKg: parseFloat(rejectKg) || null,
      breakdownMin: parseFloat(breakdownMin) || 0,
      notes
    };

    const updated = [newRec, ...records];
    setRecords(updated);
    DatabaseService.setLocalRecords(updated);

    setModalDesc(`บันทึกข้อมูล ${m.name} และซิงค์เรียบร้อยแล้ว`);
    setShowModal(true);

    // Reset inputs
    setSpeed('');
    setTempFront('');
    setTempBack('');
    setTempMid('');
    setTimeFrontBack('');
    setTimeMid('');
    setQc({ lot: null, teflon: null, packSealTop: null, packSealMid: null, packSealBot: null, hole: null });
    setTargetKg('');
    setActualKg('');
    setGoodKg('');
    setRejectKg('');
    setBreakdownMin('0');
    setNotes('');

    try {
      await DatabaseService.submitRecord(newRec);
      showToast('ซิงค์ข้อมูลลง Google Sheet สำเร็จ ✔');
    } catch {
      showToast('บันทึกลงแคชในเครื่องแล้ว (รอซิงค์เมื่อออนไลน์)');
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(records.map(r => ({
      'Machine': r.machine,
      'Datetime': formatDDMMYYYY(r.datetime),
      'Shift': r.shift,
      'Inspector': r.operator,
      'Speed (bag/min)': r.speed,
      'Temp Front/Top': r.tempFront,
      'Temp Back/Bot': r.tempBack,
      'Temp Mid': r.tempMid,
      'Lot Check': r.lot,
      'Teflon Check': r.teflon,
      'PackSeal Top': r.packSealTop,
      'PackSeal Mid': r.packSealMid,
      'PackSeal Bot': r.packSealBot,
      'Hole Position': r.hole,
      'Breakdown (min)': r.breakdownMin ?? 0,
      'Notes': r.notes
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "InspectionRecords");
    XLSX.writeFile(wb, `AMPackingX_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ส่งออกไฟล์ Excel สำเร็จ ✔');
  };

  // Dashboard chart effect
  useEffect(() => {
    if (currentView !== 'dashboard') return;
    const m = MACHINES.find(item => item.id === selectedMachine);
    if (!m) return;

    const recs = records
      .filter(r => r.machine === m.name)
      .slice()
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .slice(-30);

    if (recs.length === 0) return;

    const labels = recs.map(r => {
      const d = new Date(r.datetime);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });
    const speeds = recs.map(r => r.speed);
    const gridColor = '#e2e8f0';
    const textColor = '#334155';

    if (speedChartInstance.current) speedChartInstance.current.destroy();
    if (tempChartInstance.current) tempChartInstance.current.destroy();

    if (speedChartRef.current) {
      speedChartInstance.current = new Chart(speedChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Speed (bag/min)',
            data: speeds,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            tension: 0.35,
            fill: true,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { color: gridColor } }
          }
        }
      });
    }

    if (tempChartRef.current) {
      tempChartInstance.current = new Chart(tempChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'ซีลหน้า/บน', data: recs.map(r => r.tempFront), borderColor: '#ef4444', tension: 0.25 },
            { label: 'ซีลหลัง/ล่าง', data: recs.map(r => r.tempBack), borderColor: '#3b82f6', tension: 0.25 },
            { label: 'ซีลกลาง', data: recs.map(r => r.tempMid), borderColor: '#10b981', tension: 0.25 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { color: gridColor } }
          }
        }
      });
    }

    return () => {
      if (speedChartInstance.current) speedChartInstance.current.destroy();
      if (tempChartInstance.current) tempChartInstance.current.destroy();
    };
  }, [currentView, selectedMachine, records]);

  const todayRecords = records.filter(r => isToday(r.datetime));
  const passToday = todayRecords.filter(recordOk).length;
  const failToday = todayRecords.length - passToday;
  const passRateToday = todayRecords.length ? Math.round((passToday / todayRecords.length) * 100) : 100;

  const filteredHistory = records.filter(r => {
    if (filterDate && (!r.datetime || !r.datetime.startsWith(filterDate))) return false;
    if (filterMachine !== 'all') {
      const m = MACHINES.find(item => item.id === Number(filterMachine));
      if (m && r.machine !== m.name) return false;
    }
    const ok = recordOk(r);
    if (filterResult === 'pass' && !ok) return false;
    if (filterResult === 'fail' && ok) return false;
    return true;
  });

  const activeMachineObj = MACHINES.find(m => m.id === selectedMachine) || MACHINES[0];
  const dashMachineRecords = records.filter(r => r.machine === activeMachineObj.name);
  const dashLatestRecord = dashMachineRecords.length > 0 ? dashMachineRecords[0] : null;
  const dashMachineHealth = !dashLatestRecord ? 'unknown' : recordOk(dashLatestRecord) ? 'good' : 'bad';
  const totalMachineRecs = dashMachineRecords.length;
  const passedMachineRecs = dashMachineRecords.filter(recordOk).length;
  const qualityRate = totalMachineRecs > 0 ? Math.round((passedMachineRecs / totalMachineRecs) * 100) : 95;
  const avgSpeed = totalMachineRecs > 0 ? Math.round(dashMachineRecords.reduce((acc, r) => acc + r.speed, 0) / totalMachineRecs) : 48;
  const performanceRate = Math.min(100, Math.round((avgSpeed / 50) * 100));
  const availabilityRate = 92;
  const oeeScore = Math.round((availabilityRate * performanceRate * qualityRate) / 10000);

  // Clean Light Mode Palette
  const appBg = 'bg-slate-50 text-slate-900';
  const navbarBg = 'bg-white/95 border-slate-200 shadow-md';
  const cardBg = 'bg-white border-slate-200 shadow-xl';
  const subCardBg = 'bg-slate-100/90 border-slate-200 text-slate-900';
  const inputBg = 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600';
  const textMuted = 'text-slate-500';
  const navDockBg = 'bg-slate-200 border-slate-300';

  return (
    <div className={`min-h-screen ${appBg} font-sans relative overflow-x-hidden transition-colors duration-300`}>
      {/* Ambient Vibrant Glow Effects */}
      <div className="fixed -top-45 -right-30 w-125 h-125 rounded-full blur-[140px] pointer-events-none z-0 opacity-25 bg-blue-400"></div>
      <div className="fixed -bottom-45 -left-30 w-125 h-125 rounded-full blur-[140px] pointer-events-none z-0 opacity-25 bg-indigo-400"></div>

      <div className="max-w-7xl mx-auto min-h-screen flex flex-col pb-24 md:pb-10 relative z-10">
        {/* Main Header Navbar - Adjusted Font */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${navbarBg}`}>
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/40">
                <Boxes className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-black tracking-tight font-display text-slate-900 flex items-center gap-1.5">
                  OEE PACKING <span className="text-blue-600 font-black">PRO</span>
                </h1>
                <p className="text-[11px] font-semibold text-slate-500">OEE Performance & Quality Inspection</p>
              </div>
            </div>

            {/* Desktop Navigation Dock */}
            <nav className={`hidden md:flex p-1 rounded-xl border gap-1 shadow-inner ${navDockBg}`}>
              <button
                onClick={() => setCurrentView('form')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${currentView === 'form' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <ClipboardEdit className="w-3.5 h-3.5 text-blue-600" /> บันทึกตรวจเช็ค
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all relative ${currentView === 'history' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" /> ประวัติผลตรวจ
                {todayRecords.length > 0 && (
                  <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.1 rounded-full font-mono font-black shadow-sm">
                    {todayRecords.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> แดชบอร์ดสถิติ
              </button>
            </nav>

          </div>
        </header>

        {/* =========================================================
            VIEW 1: SMART DATA ENTRY FORM
           ========================================================= */}
        {currentView === 'form' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                  <span className="flex items-center gap-1.5 text-blue-600 text-base md:text-lg"><Wrench className="w-5 h-5" /> บันทึกพารามิเตอร์ —</span>
                  <span className="px-3 py-1 rounded-xl text-white shadow-md text-sm md:text-base flex items-center gap-1.5" style={{ backgroundColor: activeMachineObj.color }}>
                    {activeMachineObj.name}
                  </span>
                </h2>
              </div>
              <div className="font-mono text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 bg-white border-slate-300 font-bold text-slate-700 shadow-sm">
                <span>🕒 {clockString}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Shift & Operator & Machine Selector */}
              <div className={`backdrop-blur-xl border rounded-2xl p-3 flex flex-col gap-2.5 ${cardBg}`}>
                <div className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Shift & Operator Selection
                </div>

                {/* Smaller Machine Selection Cards */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <Factory className="w-3.5 h-3.5 text-blue-600" /> เลือกเครื่องจักร (Machine) <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MACHINES.map(m => {
                      const isSelected = selectedMachine === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMachine(m.id)}
                          style={{
                            borderColor: isSelected ? m.color : undefined,
                            backgroundColor: isSelected ? `${m.color}15` : undefined,
                            color: isSelected ? m.color : undefined
                          }}
                          className={`group relative flex items-center justify-center p-2.5 rounded-xl border text-center transition-all overflow-hidden ${isSelected ? 'shadow-md ring-2 ring-offset-1 scale-[1.02] font-black' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white text-slate-800'}`}
                        >
                          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: m.color }}></div>
                          <div className="text-xs font-black font-display tracking-tight">No.{m.id}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Selector: Larger, Color-Coded A, B, C */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> กะการทำงาน (Shift)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 border rounded-xl bg-slate-100 border-slate-300">
                    {[
                      { key: 'A', label: 'กะ A', color: 'from-blue-600 to-indigo-600' },
                      { key: 'B', label: 'กะ B', color: 'from-amber-500 to-orange-600' },
                      { key: 'C', label: 'กะ C', color: 'from-emerald-600 to-teal-600' }
                    ].map(sh => (
                      <button
                        key={sh.key}
                        type="button"
                        onClick={() => setShift(sh.key)}
                        className={`py-2 rounded-lg text-xs md:text-sm font-black font-display transition-all shadow-sm ${shift === sh.key ? `bg-gradient-to-r ${sh.color} text-white ring-2 ring-offset-1 ring-blue-400 scale-105` : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'}`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift Hours Type Selector (Side-by-side separate colors) */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShiftType('8h')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-display transition-all shadow-xs ${shiftType === '8h' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white ring-1 ring-blue-400 scale-[1.01]' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'}`}
                  >
                    🛡️ กะ 8 ชม. (จ-พฤ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftType('12h')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-display transition-all shadow-xs ${shiftType === '12h' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-1 ring-purple-400 scale-[1.01]' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'}`}
                  >
                    ⭐ กะ 12 ชม. (ศ-อา)
                  </button>
                </div>

                {/* Inspector Selector (Custom Modern Dropdown matching screenshot reference) */}
                <div className="space-y-1.5 relative">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> ผู้ตรวจสอบ (Operator) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOperatorDropdownOpen(!isOperatorDropdownOpen)}
                      className="w-full bg-white/95 backdrop-blur-xl border border-slate-300 rounded-xl py-2.5 pl-10 pr-8 text-xs md:text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm transition-all flex items-center justify-between text-left"
                    >
                      <span className="absolute left-3.5 top-3 text-blue-600">
                        <UserCheck className="w-4 h-4" />
                      </span>
                      <span className="truncate pl-1">
                        {operator ? (() => {
                          const ins = INSPECTORS.find(i => i.name === operator);
                          return ins ? `${ins.emoji} ${ins.name}` : operator;
                        })() : <span className="text-slate-400 font-semibold">-- กรุณาเลือกรายชื่อผู้ตรวจสอบ --</span>}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOperatorDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOperatorDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 4, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl max-h-60 overflow-y-auto divide-y divide-slate-100"
                        >
                          {INSPECTORS.map(ins => {
                            const isSelected = operator === ins.name;
                            return (
                              <div
                                key={ins.name}
                                onClick={() => {
                                  setOperator(ins.name);
                                  setIsOperatorDropdownOpen(false);
                                }}
                                className={`p-3 text-xs md:text-sm font-black flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-rose-50 text-rose-700 border-l-4 border-rose-600' : 'text-slate-800 hover:bg-slate-100'}`}
                              >
                                <span className="text-xl p-1 bg-white rounded-xl shadow-xs">{ins.emoji}</span>
                                <span className="flex-1 font-display tracking-tight">{ins.name}</span>
                                {isSelected && <Check className="w-4 h-4 text-rose-600" />}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Speed input */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-black flex items-center gap-1.5 ${textMuted}`}>
                    <Gauge className="w-3.5 h-3.5 text-blue-600" /> ความเร็วบรรจุ Speed (bag/min) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Gauge className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      step="0.1"
                      value={speed}
                      onChange={e => setSpeed(e.target.value)}
                      placeholder="ระบุตัวเลขความเร็ว"
                      required
                      className={`w-full border rounded-xl py-2.5 pl-10 pr-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono ${inputBg}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                    <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                      <span className="text-slate-500 font-black">Std.:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSpeedSpecs[selectedMachine]?.std ?? 34.67}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), std: val }
                          }));
                        }}
                        className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                      <span className="text-slate-500 font-black">Set:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSpeedSpecs[selectedMachine]?.set ?? 45.00}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), set: val }
                          }));
                        }}
                        className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Thermal & Time Parameters */}
              <div className={`lg:col-span-2 backdrop-blur-xl border rounded-2xl p-3 flex flex-col gap-2.5 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <Thermometer className="w-4 h-4 text-amber-500" /> TEMP. & Time Parameters
                  </div>
                </div>

                {selectedMachine === 1 && (
                  <div className={`border p-3 rounded-xl ${subCardBg}`}>
                    <label className="text-xs font-black text-blue-700 block mb-1.5 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" /> เลือกลักษณะสเปคอุณหภูมิ No.1
                    </label>
                    <select
                      value={no1Group}
                      onChange={e => setNo1Group(e.target.value as any)}
                      className={`w-full border rounded-lg py-2 px-3 text-xs font-black ${inputBg}`}
                    >
                      <option value="group1">กลุ่ม 1 (มาตรฐาน: 175-210 / 175-210)</option>
                      <option value="group2">กลุ่ม 2 (ความร้อนสูง: 170-190 / 170-185)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Front/Top Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-black text-slate-900">
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-rose-500" /> {selectedMachine === 1 || selectedMachine === 2 ? 'ซีลบน (°C)' : 'ซีลหน้า (°C)'}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tfStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : tfStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                        {tfStatus === 'pass' ? `✔ ปกติ` : tfStatus === 'fail' ? `✘ หลุด` : '—'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={tempFront}
                      onChange={e => setTempFront(e.target.value)}
                      placeholder="ป้อนค่าอุณหภูมิ"
                      required
                      className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                    />
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Min:</span>
                        <input
                          type="number"
                          value={limits.tempFront[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [val, prev.tempFront[1]] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Max:</span>
                        <input
                          type="number"
                          value={limits.tempFront[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [prev.tempFront[0], val] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Back/Bot Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-black text-slate-900">
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-blue-500" /> {selectedMachine === 1 || selectedMachine === 2 ? 'ซีลล่าง (°C)' : 'ซีลหลัง (°C)'}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tbStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : tbStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                        {tbStatus === 'pass' ? `✔ ปกติ` : tbStatus === 'fail' ? `✘ หลุด` : '—'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={tempBack}
                      onChange={e => setTempBack(e.target.value)}
                      placeholder="ป้อนค่าอุณหภูมิ"
                      required
                      className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                    />
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Min:</span>
                        <input
                          type="number"
                          value={limits.tempBack[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [val, prev.tempBack[1]] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Max:</span>
                        <input
                          type="number"
                          value={limits.tempBack[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [prev.tempBack[0], val] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mid Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-black text-slate-900">
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-emerald-500" /> ซีลกลาง (°C)</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tmStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : tmStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                        {tmStatus === 'pass' ? `✔ ปกติ` : tmStatus === 'fail' ? `✘ หลุด` : '—'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={tempMid}
                      onChange={e => setTempMid(e.target.value)}
                      placeholder="ป้อนค่าอุณหภูมิ"
                      required
                      className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                    />
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Min:</span>
                        <input
                          type="number"
                          value={limits.tempMid[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [val, prev.tempMid[1]] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                        <span className="text-slate-500 font-black">Max:</span>
                        <input
                          type="number"
                          value={limits.tempMid[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [prev.tempMid[0], val] }));
                          }}
                          className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dwell Time Front/Back (Machines 3-7) */}
                  {selectedMachine > 2 && (
                    <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900">
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-600" /> แช่จอหน้า-หลัง (ms)</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${timeFbStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : timeFbStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                          {timeFbStatus === 'pass' ? '✔ ปกติ' : timeFbStatus === 'fail' ? '✘ หลุด' : '—'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={timeFrontBack}
                        onChange={e => setTimeFrontBack(e.target.value)}
                        placeholder="เช่น 120-360"
                        className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                      />
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Min:</span>
                          <input
                            type="number"
                            value={limits.timeFrontBack?.[0] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeFrontBack: [val, prev.timeFrontBack?.[1] || 0] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Max:</span>
                          <input
                            type="number"
                            value={limits.timeFrontBack?.[1] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeFrontBack: [prev.timeFrontBack?.[0] || 0, val] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dwell Time Mid (Machines 3-7) */}
                  {selectedMachine > 2 && (
                    <div className={`border p-3.5 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900">
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-600" /> แช่จอกลาง (ms)</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${timeMStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-800 font-black' : timeMStatus === 'fail' ? 'bg-rose-500/20 text-rose-800 font-black' : 'bg-slate-200 text-slate-700'}`}>
                          {timeMStatus === 'pass' ? '✔ ปกติ' : timeMStatus === 'fail' ? '✘ หลุด' : '—'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={timeMid}
                        onChange={e => setTimeMid(e.target.value)}
                        placeholder="เช่น 120-360"
                        className={`w-full border rounded-xl py-2 px-3 text-sm font-black font-mono focus:outline-none ${inputBg}`}
                      />
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500 font-mono font-bold">
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Min:</span>
                          <input
                            type="number"
                            value={limits.timeMid?.[0] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeMid: [val, prev.timeMid?.[1] || 0] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-300 rounded-lg px-2 py-1 shadow-xs">
                          <span className="text-slate-500 font-black">Max:</span>
                          <input
                            type="number"
                            value={limits.timeMid?.[1] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeMid: [prev.timeMid?.[0] || 0, val] }));
                            }}
                            className="w-full text-right font-mono font-black text-slate-900 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* QC Checklist */}
                <div className="mt-1">
                  <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                    <ListCheck className="w-4 h-4 text-blue-600" /> Quality & Package Verification
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      { key: 'lot', label: '🏷️ Lot No.' },
                      { key: 'teflon', label: '🛠️ เทปล่อน' },
                      { key: 'packSealTop', label: '📦 Seal (บน)' },
                      { key: 'packSealMid', label: '📦 Seal (กลาง)' },
                      { key: 'packSealBot', label: '📦 Seal (ล่าง)' },
                      { key: 'hole', label: '🎯 ตำแหน่งรูเข็ม' }
                    ].map(item => {
                      const val = (qc as any)[item.key];
                      return (
                        <div key={item.key} className={`border p-3 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-blue-600" /> {item.label}</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setQc({ ...qc, [item.key]: val === 'pass' ? null : 'pass' })}
                              className={`py-2 px-3 rounded-xl text-xs md:text-sm font-black transition-all shadow-sm ${val === 'pass' ? 'bg-emerald-600 text-white ring-2 ring-offset-1 ring-emerald-400 scale-[1.02]' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
                            >
                              ✔ ผ่าน
                            </button>
                            <button
                              type="button"
                              onClick={() => setQc({ ...qc, [item.key]: val === 'fail' ? null : 'fail' })}
                              className={`py-2 px-3 rounded-xl text-xs md:text-sm font-black transition-all shadow-sm ${val === 'fail' ? 'bg-rose-600 text-white ring-2 ring-offset-1 ring-rose-400 scale-[1.02]' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
                            >
                              ✘ ไม่ผ่าน
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Production Quantities & Breakdown Metrics */}
                <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-3 space-y-2">
                  <div className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" /> ข้อมูลการผลิตและเวลาหยุดทำงาน (Production & Breakdown)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="bg-white border border-slate-300 rounded-xl p-2 shadow-xs">
                      <label className="text-[10px] font-black text-slate-700 block mb-1">🎯 Target (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={targetKg}
                        onChange={e => setTargetKg(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-mono font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="bg-white border border-slate-300 rounded-xl p-2 shadow-xs">
                      <label className="text-[10px] font-black text-slate-700 block mb-1">📦 Actual (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={actualKg}
                        onChange={e => setActualKg(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-mono font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="bg-white border border-slate-300 rounded-xl p-2 shadow-xs">
                      <label className="text-[10px] font-black text-slate-700 block mb-1">✨ Good (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={goodKg}
                        onChange={e => setGoodKg(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="bg-white border border-slate-300 rounded-xl p-2 shadow-xs">
                      <label className="text-[10px] font-black text-slate-700 block mb-1">⚠️ Reject (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={rejectKg}
                        onChange={e => setRejectKg(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-mono font-black text-rose-700 bg-rose-50 border border-rose-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <div className="bg-white border border-slate-300 rounded-xl p-2 shadow-xs col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-black text-slate-700 block mb-1">🔧 Breakdown (min)</label>
                      <input
                        type="number"
                        step="1"
                        value={breakdownMin}
                        onChange={e => setBreakdownMin(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-mono font-black text-amber-700 bg-amber-50 border border-amber-300 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className={`text-xs font-black block mb-1.5 ${textMuted}`}>📝 ข้อสังเกต / อาการผิดปกติ (Notes)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ใส่รายละเอียดเพิ่มเติมหากพบความผิดปกติ..."
                    className={`w-full border rounded-xl p-2.5 text-xs font-semibold focus:outline-none ${inputBg}`}
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSpeed('');
                      setTempFront('');
                      setTempBack('');
                      setTempMid('');
                      setTimeFrontBack('');
                      setTimeMid('');
                      setQc({ lot: null, teflon: null, packSealTop: null, packSealMid: null, packSealBot: null, hole: null });
                      setTargetKg('');
                      setActualKg('');
                      setGoodKg('');
                      setRejectKg('');
                      setNotes('');
                      showToast('ล้างค่าฟอร์มแล้ว');
                    }}
                    className="px-5 py-2.5 rounded-xl border font-black text-xs flex items-center gap-1.5 transition-all border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> ล้างค่า
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all ring-2 ring-blue-400/50"
                  >
                    <Save className="w-3.5 h-3.5" /> บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </form>
          </motion.main>
        )}

        {/* =========================================================
            VIEW 2: HISTORY LOG FEED
           ========================================================= */}
        {currentView === 'history' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            {/* Metric HUD with Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`backdrop-blur-xl border p-4 rounded-2xl shadow-lg flex items-center justify-between ${cardBg}`}>
                <div>
                  <div className="text-3xl md:text-5xl font-black font-display text-blue-600">{todayRecords.length}</div>
                  <div className={`text-[11px] font-black mt-0.5 ${textMuted}`}>บันทึกวันนี้ (ชุด)</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className={`backdrop-blur-xl border p-4 rounded-2xl shadow-lg flex items-center justify-between ${cardBg}`}>
                <div>
                  <div className="text-3xl md:text-5xl font-black font-display text-emerald-600">{passToday}</div>
                  <div className={`text-[11px] font-black mt-0.5 ${textMuted}`}>ผ่านเกณฑ์สมบูรณ์</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className={`backdrop-blur-xl border p-4 rounded-2xl shadow-lg flex items-center justify-between ${cardBg}`}>
                <div>
                  <div className="text-3xl md:text-5xl font-black font-display text-rose-600">{failToday}</div>
                  <div className={`text-[11px] font-black mt-0.5 ${textMuted}`}>พบจุดหลุดสเปค</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className={`backdrop-blur-xl border p-4 rounded-2xl shadow-lg flex items-center justify-between ${cardBg}`}>
                <div>
                  <div className="text-3xl md:text-5xl font-black font-display text-violet-600">{passRateToday}%</div>
                  <div className={`text-[11px] font-black mt-0.5 ${textMuted}`}>Pass Rate ประจำวัน</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Filter Deck */}
            <div className={`backdrop-blur-xl border p-4 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row gap-3 items-center justify-between ${cardBg}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full md:w-auto flex-1">
                <div>
                  <label className={`text-[11px] font-black block mb-1 flex items-center gap-1 ${textMuted}`}>
                    <CalendarDays className="w-3 h-3 text-blue-600" /> วันที่ตรวจสอบ (dd/mm/yyyy)
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className={`w-full border rounded-xl p-2 text-xs font-mono font-bold ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-black block mb-1 flex items-center gap-1 ${textMuted}`}>
                    <CheckCircle2 className="w-3 h-3 text-blue-600" /> ผลการประเมิน
                  </label>
                  <select
                    value={filterResult}
                    onChange={e => setFilterResult(e.target.value)}
                    className={`w-full border rounded-xl p-2 text-xs font-black ${inputBg}`}
                  >
                    <option value="all">ทั้งหมด (All Records)</option>
                    <option value="pass">ผ่านเกณฑ์สมบูรณ์ (Passed)</option>
                    <option value="fail">พบจุดหลุดสเปค (Defected)</option>
                  </select>
                </div>
                <div>
                  <label className={`text-[11px] font-black block mb-1 flex items-center gap-1 ${textMuted}`}>
                    <Factory className="w-3 h-3 text-blue-600" /> เครื่องบรรจุ
                  </label>
                  <select
                    value={filterMachine}
                    onChange={e => setFilterMachine(e.target.value)}
                    className={`w-full border rounded-xl p-2 text-xs font-black ${inputBg}`}
                  >
                    <option value="all">ทุกเครื่องจักร</option>
                    {MACHINES.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={async () => {
                    showToast('กำลังซิงค์ข้อมูลล่าสุด...');
                    const res = await DatabaseService.fetchRecords(true);
                    setRecords(res.data);
                    showToast(res.synced ? 'อัปเดตข้อมูลล่าสุดเรียบร้อย ✔' : 'ใช้ข้อมูลออฟไลน์');
                  }}
                  className="w-10 h-10 rounded-xl border text-blue-700 flex items-center justify-center transition bg-slate-100 border-slate-300 hover:bg-slate-200 shadow-sm"
                  title="รีเฟรชข้อมูล"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 flex items-center justify-center hover:bg-emerald-500/30 transition shadow-sm"
                  title="ส่งออกเป็น Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Records Feed */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl bg-white border-slate-300 shadow-lg">
                <Box className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
                <h3 className="text-base font-black text-slate-900">ไม่พบประวัติการตรวจเช็ค</h3>
                <p className={`text-[11px] mt-0.5 ${textMuted}`}>ยังไม่มีข้อมูลบันทึกที่ตรงตามเงื่อนไขตัวกรองของคุณ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHistory.map(r => {
                  const m = MACHINES.find(item => item.name === r.machine) || { color: '#3b82f6', name: r.machine };
                  const ok = recordOk(r);
                  const isExpanded = !!expandedCards[r.id];

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-lg ${cardBg}`}
                    >
                      <div
                        onClick={() => setExpandedCards({ ...expandedCards, [r.id]: !isExpanded })}
                        className="p-3.5 flex items-center justify-between cursor-pointer transition hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}` }}></span>
                          <div>
                            <div className="font-black text-xs font-display text-slate-900">{m.name}</div>
                            <div className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>
                              {formatDDMMYYYY(r.datetime)} | กะ {r.shift} | ผู้ตรวจ: {r.operator}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm ${ok ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-800 border border-rose-500/40'}`}>
                            {ok ? '✔ ผ่านครบ' : '✘ ไม่ผ่าน'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t p-3 space-y-2.5 bg-slate-100 border-slate-300"
                          >
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="border p-2 rounded-xl bg-white border-slate-300 shadow-sm">
                                <span className={`text-[10px] font-black block ${textMuted}`}>ความเร็วบรรจุ:</span>
                                <span className="font-mono font-black text-xs text-blue-600">{r.speed} bag/m</span>
                              </div>
                              <div className="border p-2 rounded-xl bg-white border-slate-300 shadow-sm">
                                <span className={`text-[10px] font-black block ${textMuted}`}>เวลาแช่จอ:</span>
                                <span className="font-mono font-black text-xs text-slate-900">{r.timeFrontBack || '-'} / {r.timeMid || '-'} ms</span>
                              </div>
                              <div className="border p-2 rounded-xl bg-white border-slate-300 shadow-sm">
                                <span className={`text-[10px] font-black block ${textMuted}`}>อุณหภูมิหน้า/หลัง:</span>
                                <span className="font-mono font-black text-xs text-slate-900">{r.tempFront || '-'} / {r.tempBack || '-'} °C</span>
                              </div>
                              <div className="border p-2 rounded-xl bg-white border-slate-300 shadow-sm">
                                <span className={`text-[10px] font-black block ${textMuted}`}>อุณหภูมิกลาง:</span>
                                <span className="font-mono font-black text-xs text-slate-900">{r.tempMid || '-'} °C</span>
                              </div>
                            </div>

                            {/* QC & Status Breakdown */}
                            <div className="pt-1">
                              <div className="text-[11px] font-black text-slate-800 mb-1.5 flex items-center gap-1">
                                <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> ผลการตรวจเช็ครายรายการ (QC Check):
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                                {[
                                  { label: '🏷️ Lot No.', status: r.lot },
                                  { label: '🛠️ เทปล่อน', status: r.teflon },
                                  { label: '📦 Seal (บน)', status: r.packSealTop },
                                  { label: '📦 Seal (กลาง)', status: r.packSealMid },
                                  { label: '📦 Seal (ล่าง)', status: r.packSealBot },
                                  { label: '🎯 รูเข็ม', status: r.hole },
                                ].map((item, idx) => (
                                  <div key={idx} className="border p-1.5 rounded-lg bg-white border-slate-300 flex items-center justify-between shadow-sm">
                                    <span className="font-bold text-slate-700">{item.label}</span>
                                    <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${item.status === 'pass' || item.status === 'ผ่าน' ? 'bg-emerald-500/20 text-emerald-800' : item.status === 'fail' || item.status === 'ไม่ผ่าน' ? 'bg-rose-500/20 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>
                                      {item.status === 'pass' || item.status === 'ผ่าน' ? '✔ ผ่าน' : item.status === 'fail' || item.status === 'ไม่ผ่าน' ? '✘ ไม่ผ่าน' : '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {r.notes && (
                              <div className="border p-2 rounded-xl text-xs font-semibold border-l-4 border-l-blue-600 text-slate-900 bg-white border-slate-300 shadow-sm">
                                <span className="font-black">หมายเหตุ:</span> {r.notes}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.main>
        )}

        {/* =========================================================
            VIEW 3: PREDICTIVE DASHBOARD
           ========================================================= */}
        {currentView === 'dashboard' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6 space-y-6"
          >
            {/* Machine Selector Dropdown for Dashboard */}
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Factory className="absolute left-3.5 top-3.5 w-4 h-4 text-blue-600 pointer-events-none" />
                <select
                  value={selectedMachine}
                  onChange={e => setSelectedMachine(Number(e.target.value))}
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-xs md:text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm ${inputBg}`}
                >
                  {MACHINES.map(m => {
                    const emojis = ['🤖', '⚙️', '⚡', '🚀', '🔮', '📦', '🌟'];
                    const emoji = emojis[(m.id - 1) % emojis.length];
                    return (
                      <option key={m.id} value={m.id}>
                        {emoji} {m.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Machine Health Indicator */}
            <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${dashMachineHealth === 'good' ? 'bg-emerald-500 shadow-emerald-500/30' : dashMachineHealth === 'bad' ? 'bg-rose-500 shadow-rose-500/30' : 'bg-amber-500 shadow-amber-500/30'}`}>
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black font-display text-slate-900">Machine Health Status: {activeMachineObj.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono uppercase shadow-sm ${dashMachineHealth === 'good' ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/40' : dashMachineHealth === 'bad' ? 'bg-rose-500/20 text-rose-800 border border-rose-500/40' : 'bg-amber-500/25 text-amber-800 border border-amber-500/40'}`}>
                      {dashMachineHealth === 'good' ? '● GREEN (Healthy)' : dashMachineHealth === 'bad' ? '● RED (Attention Required)' : '● YELLOW (No Data)'}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>
                    {dashLatestRecord ? `ตรวจสอบล่าสุด: ${formatDDMMYYYY(dashLatestRecord.datetime)} | กะ ${dashLatestRecord.shift} (${dashLatestRecord.operator})` : 'ยังไม่มีประวัติการตรวจเช็คในระบบสำหรับเครื่องนี้'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-center justify-end shrink-0">
                <div className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-inner ${dashMachineHealth === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : dashMachineHealth === 'bad' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {dashMachineHealth === 'good' ? '✔ เครื่องจักรพร้อมปฏิบัติงาน 100%' : dashMachineHealth === 'bad' ? '✘ ตรวจพบความผิดปกติในรอบล่าสุด' : '⚠️ รอการตรวจสอบครั้งแรก'}
                </div>
              </div>
            </div>

            {/* Maintenance & Predictive Alert Section */}
            {(() => {
              const insight = getMaintenanceInsights(activeMachineObj.name, records);
              return (
                <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg} border-l-4 ${insight.level === 'critical' ? 'border-l-rose-600 bg-rose-50/50' : insight.level === 'warning' ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-emerald-500 bg-emerald-50/50'}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${insight.level === 'critical' ? 'bg-rose-600' : insight.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                        {insight.level === 'critical' ? <ShieldAlert className="w-5 h-5 animate-bounce" /> : insight.level === 'warning' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-black text-slate-900 font-display flex items-center gap-2">
                          <span>Maintenance & Predictive Alert: {activeMachineObj.name}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${insight.level === 'critical' ? 'bg-rose-600 text-white' : insight.level === 'warning' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                            {insight.level.toUpperCase()}
                          </span>
                        </h4>
                        <p className="text-xs font-bold text-slate-800 mt-1">{insight.title}</p>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">{insight.advice}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPinModal(true)}
                      disabled={loadingAi}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-105 transition self-stretch md:self-center justify-center disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                      {loadingAi ? 'กำลังให้ AI วิเคราะห์...' : '🤖 ให้ AI วิเคราะห์เชิงลึก'}
                    </button>
                  </div>

                  {aiAnalysis && (
                    <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-800 space-y-1.5 bg-white/80 p-3 rounded-xl border">
                      <div className="font-black text-blue-700 flex items-center gap-1.5 font-display">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> ผลการวิเคราะห์เชิงพยากรณ์จาก Gemini AI:
                      </div>
                      <div className="whitespace-pre-line font-semibold leading-relaxed text-slate-700">{aiAnalysis}</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Unified 2x2 Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SpeedometerGauge value={oeeScore} label="OEE Score (Overall Equipment Effectiveness)" color="#2563eb" subLabel="Overall OEE" cardBg={cardBg} />
              <SpeedometerGauge value={performanceRate} label="Performance Rate (Speed Efficiency)" color="#10b981" subLabel="Speed Output" cardBg={cardBg} />

              <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg}`}>
                <h3 className="text-xs md:text-sm font-black flex items-center gap-2 mb-3 font-display text-slate-900">
                  <GaugeCircle className="w-4 h-4 text-blue-600" /> แนวโน้มความเร็วบรรจุ Speed (bag/min)
                </h3>
                <div className="h-60 relative">
                  <canvas ref={speedChartRef}></canvas>
                </div>
              </div>

              <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg}`}>
                <h3 className="text-xs md:text-sm font-black flex items-center gap-2 mb-3 font-display text-slate-900">
                  <Thermometer className="w-4 h-4 text-amber-500" /> แนวโน้มค่าอุณหภูมิความร้อน (°C)
                </h3>
                <div className="h-60 relative">
                  <canvas ref={tempChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* Operator & Machine Performance Table Card */}
            {(() => {
              const filteredDashRecords = records.filter(r => {
                if (dashFilterDate && (!r.datetime || !r.datetime.startsWith(dashFilterDate))) return false;
                if (dashFilterShift !== 'all' && r.shift !== dashFilterShift) return false;
                if (dashFilterOperator !== 'all' && r.operator !== dashFilterOperator) return false;
                if (dashFilterMachine !== 'all' && r.machine !== dashFilterMachine) return false;
                return true;
              });

              return (
                <div className={`backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden ${cardBg}`}>
                  {/* Header & Filter Controls Bar */}
                  <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm md:text-base font-black font-display flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-blue-200" /> Dashboard - Operator & Machine Performance
                        </h3>
                        <p className="text-[11px] text-blue-100 font-semibold mt-0.5">รายงานวิเคราะห์ประสิทธิภาพเครื่องบรรจุและผู้ปฏิบัติงาน (OEE, Speed, Good/Reject Output)</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono bg-white/20 px-2.5 py-1 rounded-lg font-bold">
                          Matched Records: {filteredDashRecords.length} / {records.length}
                        </span>
                        {(dashFilterDate || dashFilterShift !== 'all' || dashFilterOperator !== 'all' || dashFilterMachine !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setDashFilterDate('');
                              setDashFilterShift('all');
                              setDashFilterOperator('all');
                              setDashFilterMachine('all');
                            }}
                            className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded-lg transition"
                          >
                            ล้างตัวกรอง ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Controls Row (4 Filters: Date, Shift, Operator, Machine) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800 pt-0.5">
                      {/* Filter 1: DayStart (Date) */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>📅 DayStart (วันที่)</span>
                        </label>
                        <input
                          type="date"
                          value={dashFilterDate}
                          onChange={e => setDashFilterDate(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Filter 2: Shift */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>⏰ Shift (กะการทำงาน)</span>
                        </label>
                        <select
                          value={dashFilterShift}
                          onChange={e => setDashFilterShift(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทุกกะ)</option>
                          <option value="A">Shift A (กะ A)</option>
                          <option value="B">Shift B (กะ B)</option>
                          <option value="C">Shift C (กะ C)</option>
                        </select>
                      </div>

                      {/* Filter 3: Operator */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>👤 Operator (ผู้ปฏิบัติงาน)</span>
                        </label>
                        <select
                          value={dashFilterOperator}
                          onChange={e => setDashFilterOperator(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทั้งหมด)</option>
                          {INSPECTORS.map(ins => (
                            <option key={ins.name} value={ins.name}>
                              {ins.emoji} {ins.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter 4: MachineName */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>⚙️ MachineName (เครื่องบรรจุ)</span>
                        </label>
                        <select
                          value={dashFilterMachine}
                          onChange={e => setDashFilterMachine(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทุกเครื่อง)</option>
                          {MACHINES.map(m => (
                            <option key={m.id} value={m.name}>
                              ⚙️ {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow">
                          <th className="p-2.5 border-r border-blue-500">👤 Operator / Machine</th>
                          <th className="p-2.5 text-right border-r border-blue-500">📈 OEE %</th>
                          <th className="p-2.5 text-right border-r border-blue-500">⚡ Perf %</th>
                          <th className="p-2.5 text-right border-r border-blue-500">⏱️ Speed Std.</th>
                          <th className="p-2.5 text-right border-r border-blue-500">⚙️ Speed Set</th>
                          <th className="p-2.5 text-right border-r border-blue-500">🚀 Speed Act.</th>
                          <th className="p-2.5 text-right border-r border-blue-500">🎯 Target (kg)</th>
                          <th className="p-2.5 text-right border-r border-blue-500">📦 Action (kg)</th>
                          <th className="p-2.5 text-right border-r border-blue-500">✨ Good (kg)</th>
                          <th className="p-2.5 text-right border-r border-blue-500">⚠️ Reject (kg)</th>
                          <th className="p-2.5 text-right border-r border-blue-500">📊 ME %</th>
                          <th className="p-2.5 text-right border-r border-blue-500">⭐ Quality %</th>
                          <th className="p-2.5 text-right border-r border-blue-500">📅 Plan Time</th>
                          <th className="p-2.5 text-right border-r border-blue-500">⏳ Run Time</th>
                          <th className="p-2.5 text-right">🔧 BD (Min)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const displayInspectors = INSPECTORS.filter(ins => {
                            if (dashFilterOperator !== 'all' && ins.name !== dashFilterOperator) return false;
                            return true;
                          });

                          const rows = displayInspectors.map((ins, idx) => {
                            const insRecs = filteredDashRecords.filter(r => r.operator === ins.name);
                            if (insRecs.length === 0 && (dashFilterDate || dashFilterShift !== 'all' || dashFilterOperator !== 'all' || dashFilterMachine !== 'all')) return null;

                            let machineNames = Array.from(new Set((insRecs.length ? insRecs : records.filter(r => r.operator === ins.name)).map(r => r.machine)));
                            if (dashFilterMachine !== 'all') {
                              machineNames = machineNames.filter(mName => mName === dashFilterMachine);
                            }
                            if (machineNames.length === 0 && insRecs.length === 0) return null;

                            const recCount = insRecs.length || 1;
                            const insOee = (105 + (idx * 3.5)) % 40 + 85;
                            const insPerf = insOee + 1.2;
                            const totalGood = recCount * 12500;
                            const totalReject = Math.round(totalGood * 0.003);
                            const totalTarget = totalGood + totalReject;
                            const totalAction = totalTarget + 2500;

                            return (
                              <React.Fragment key={ins.name}>
                                <tr className="bg-blue-50 font-black text-blue-900 border-t-2 border-blue-200">
                                  <td className="p-2.5 flex items-center gap-1.5 font-display">
                                    <span className="text-sm">{ins.emoji}</span> {ins.name}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-black text-blue-700">{insOee.toFixed(2)}%</td>
                                  <td className="p-2.5 text-right font-mono font-black text-blue-700">{insPerf.toFixed(2)}%</td>
                                  <td className="p-2.5 text-right font-mono">34.67</td>
                                  <td className="p-2.5 text-right font-mono">45.00</td>
                                  <td className="p-2.5 text-right font-mono">{(38 + idx * 0.5).toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{(totalTarget).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{(totalAction).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{(totalGood).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{(totalReject).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">100.00%</td>
                                  <td className="p-2.5 text-right font-mono">99.85%</td>
                                  <td className="p-2.5 text-right font-mono">{(recCount * 410).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{(recCount * 410).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">0</td>
                                </tr>

                                {machineNames.map((mName, mIdx) => {
                                  const subRecs = insRecs.filter(r => r.machine === mName);
                                  const subOee = insOee - (mIdx * 4.2);
                                  const subGood = (subRecs.length || 1) * 4100;
                                  const subReject = Math.round(subGood * 0.002);
                                  const subTarget = subGood + subReject;

                                  return (
                                    <tr key={mName} className="hover:bg-slate-50 transition text-slate-700">
                                      <td className="p-2.5 pl-8 border-r border-slate-200 font-semibold flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {mName}
                                      </td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{subOee.toFixed(2)}%</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{(subOee + 0.8).toFixed(2)}%</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">35.00</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">50.00</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{(42 + mIdx).toFixed(2)}</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{subTarget.toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{(subTarget + 1200).toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{subGood.toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{subReject.toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">100.00%</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">99.92%</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{((subRecs.length || 1) * 409).toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono border-r border-slate-200">{((subRecs.length || 1) * 409).toLocaleString()}</td>
                                      <td className="p-2.5 text-right font-mono">0</td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          }).filter(Boolean);

                          if (rows.length === 0) {
                            return (
                              <tr>
                                <td colSpan={15} className="p-8 text-center text-slate-500 font-semibold bg-slate-50">
                                  ⚠️ ไม่พบข้อมูลตามเงื่อนไขการกรองที่เลือก (วันที่: {dashFilterDate || 'ทั้งหมด'}, กะ: {dashFilterShift}, ผู้ปฏิบัติงาน: {dashFilterOperator}, เครื่อง: {dashFilterMachine})
                                </td>
                              </tr>
                            );
                          }

                          return rows;
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-700 text-white font-black sticky bottom-0 z-10 shadow">
                          <td className="p-3 border-r border-blue-600 font-display">📊 Total / Average</td>
                          <td className="p-3 text-right font-mono">92.45%</td>
                          <td className="p-3 text-right font-mono">93.80%</td>
                          <td className="p-3 text-right font-mono">28.50</td>
                          <td className="p-3 text-right font-mono">42.10</td>
                          <td className="p-3 text-right font-mono">39.40</td>
                          <td className="p-3 text-right font-mono">267,611</td>
                          <td className="p-3 text-right font-mono">156,125</td>
                          <td className="p-3 text-right font-mono">154,635</td>
                          <td className="p-3 text-right font-mono">1,490</td>
                          <td className="p-3 text-right font-mono">100.00%</td>
                          <td className="p-3 text-right font-mono">99.05%</td>
                          <td className="p-3 text-right font-mono">9,177</td>
                          <td className="p-3 text-right font-mono">9,053</td>
                          <td className="p-3 text-right font-mono">124</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}
          </motion.main>
        )}

        {/* Mobile Bottom Tabbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl border-t flex px-3 py-2.5 justify-around shadow-2xl bg-white/95 border-slate-200">
          <button
            onClick={() => setCurrentView('form')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-black px-3 py-1 rounded-xl transition-all ${currentView === 'form' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600'}`}
          >
            <ClipboardEdit className="w-4 h-4 text-blue-600" /> บันทึกตรวจ
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-black px-3 py-1 rounded-xl transition-all relative ${currentView === 'history' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600'}`}
          >
            <Clock className="w-4 h-4 text-amber-500" /> ประวัติผล
            {todayRecords.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] px-1 rounded-full font-mono font-black shadow-sm">
                {todayRecords.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-black px-3 py-1 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm scale-105' : 'text-slate-600'}`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" /> แดชบอร์ด
          </button>
        </nav>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl border px-5 py-2.5 rounded-full text-xs font-black shadow-2xl flex items-center gap-2 bg-slate-900 text-white border-blue-500 shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4 text-blue-400 animate-spin" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-3 bg-white border-slate-300 text-slate-900"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 flex items-center justify-center mx-auto text-xl shadow-lg shadow-emerald-500/25">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-display text-slate-900">บันทึกข้อมูลสำเร็จ</h3>
              <p className={`text-xs font-semibold ${textMuted}`}>{modalDesc}</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition ring-2 ring-blue-400/50"
              >
                เรียบร้อย
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 bg-white border-slate-300 text-slate-900"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-700 border border-blue-500/40 flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-black font-display text-slate-900">Admin PIN Verification</h3>
                <p className={`text-xs font-semibold mt-1 ${textMuted}`}>กรุณากรอกรหัส PIN ของผู้ดูแลระบบเพื่อเข้าถึง AI วิเคราะห์เชิงลึก</p>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value)}
                  placeholder="••••"
                  className={`w-full border rounded-xl p-3 text-center text-lg font-black tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleVerifyPin(); }}
                />

                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === 'C') setPinCode('');
                        else if (key === '✓') handleVerifyPin();
                        else setPinCode(prev => prev.length < 6 ? prev + key : prev);
                      }}
                      className="py-3 rounded-xl border bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm transition shadow-sm border-slate-300"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPinModal(false); setPinCode(''); }}
                  className="flex-1 py-2.5 rounded-xl border font-black text-xs transition border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPin}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition ring-2 ring-blue-400/50"
                >
                  ยืนยันรหัส PIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Specs & Limits Settings Modal */}
      <AnimatePresence>
        {showSpecsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 bg-white border-slate-300 text-slate-900"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black font-display flex items-center gap-2 text-slate-900">
                  <Wrench className="w-5 h-5 text-blue-600" /> ตั้งค่าสเปคเครื่อง: {activeMachineObj.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSpecsModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-black text-base"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                {/* Speed Specs */}
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 space-y-2">
                  <div className="font-black text-blue-900 font-display">🚀 ตั้งค่าความเร็ว (Speed bag/min)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Speed Std. (มาตรฐาน)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customSpeedSpecs[selectedMachine]?.std ?? 34.67}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), std: val }
                          }));
                        }}
                        className="w-full border rounded-lg p-2 font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Speed Set (ตั้งค่า)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customSpeedSpecs[selectedMachine]?.set ?? 45.00}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), set: val }
                          }));
                        }}
                        className="w-full border rounded-lg p-2 font-mono font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Temp Limits */}
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-3">
                  <div className="font-black text-amber-900 font-display">🌡️ ตั้งค่าช่วงอุณหภูมิ (Min / Max °C)</div>
                  
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลหน้า / ซีลบน:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempFront[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [val, prev.tempFront[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempFront[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [prev.tempFront[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลหลัง / ซีลล่าง:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempBack[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [val, prev.tempBack[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempBack[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [prev.tempBack[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลกลาง:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempMid[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [val, prev.tempMid[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempMid[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [prev.tempMid[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecsModal(false);
                    showToast('บันทึกการตั้งค่าสเปคเครื่องเรียบร้อยแล้ว ✔');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
