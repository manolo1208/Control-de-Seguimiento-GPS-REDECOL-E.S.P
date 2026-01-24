
export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  operador: string;
}

export interface RouteLog {
  id: string;
  operador: string;
  startTime: string;
  endTime?: string;
  points: GPSPoint[];
}

export interface AIAnalysis {
  summary: string;
  complianceNotes: string;
  efficiencyScore: number;
}
