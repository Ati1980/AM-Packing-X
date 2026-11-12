export interface Machine {
  id: number;
  name: string;
  color: string;
}

export interface InspectionRecord {
  id: string;
  machine: string;
  datetime: string;
  shift: string;
  shiftType: string;
  operator: string;
  speed: number;
  tempFront: number | null;
  tempFrontMin: number | null;
  tempFrontMax: number | null;
  tfStatus: string;
  tempBack: number | null;
  tempBackMin: number | null;
  tempBackMax: number | null;
  tbStatus: string;
  tempMid: number | null;
  tempMidMin: number | null;
  tempMidMax: number | null;
  tmStatus: string;
  timeFrontBack: string | null;
  timeFrontBackMin: number | null;
  timeFrontBackMax: number | null;
  timeFbStatus: string;
  timeMid: string | null;
  timeMidMin: number | null;
  timeMidMax: number | null;
  timeMStatus: string;
  lot: string | null;
  teflon: string | null;
  packSealTop: string | null;
  packSealMid: string | null;
  packSealBot: string | null;
  hole: string | null;
  targetKg: number | null;
  actualKg: number | null;
  goodKg: number | null;
  rejectKg: number | null;
  breakdownMin?: number | null;
  notes: string;
}
