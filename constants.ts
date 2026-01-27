import { IterationLevel } from './types';

// Business Rules for Deadlines (in hours)
// 2.5 business days = ~20 hours (assuming 8h day) or 60 hours (realtime). 
// For simplicity in this demo, we use realtime hours.
export const DEADLINES: Record<IterationLevel, number> = {
  [IterationLevel.CustomerRaise]: 0,
  [IterationLevel.EmployerHandling]: 60, // 2.5 Days
  [IterationLevel.EmployeeAlert]: 48,    // 2 Days
  [IterationLevel.ManagerEscalation]: 24, // 1 Day
  [IterationLevel.HighAuthEscalation]: 24, // 1 Day
  [IterationLevel.ZonalEscalation]: 2,    // 2 Hours
  [IterationLevel.HQEscalation]: 0,       // Indefinite/Immediate
  [IterationLevel.Resolved]: 0,
};

export const LEVEL_LABELS: Record<IterationLevel, string> = {
  [IterationLevel.CustomerRaise]: "New Issue (Level 0)",
  [IterationLevel.EmployerHandling]: "Employer Handling (Level 1)",
  [IterationLevel.EmployeeAlert]: "Employee Alerted (Level 2)",
  [IterationLevel.ManagerEscalation]: "Manager Escalation (Level 3)",
  [IterationLevel.HighAuthEscalation]: "High Authority (Level 4)",
  [IterationLevel.ZonalEscalation]: "Zonal Manager (Level 5)",
  [IterationLevel.HQEscalation]: "HQ Chief Core (Level 6)",
  [IterationLevel.Resolved]: "Resolved",
};

export const LEVEL_COLORS: Record<IterationLevel, string> = {
  [IterationLevel.CustomerRaise]: "bg-blue-100 text-blue-800 border-blue-200",
  [IterationLevel.EmployerHandling]: "bg-indigo-100 text-indigo-800 border-indigo-200",
  [IterationLevel.EmployeeAlert]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [IterationLevel.ManagerEscalation]: "bg-orange-100 text-orange-800 border-orange-200",
  [IterationLevel.HighAuthEscalation]: "bg-red-100 text-red-800 border-red-200",
  [IterationLevel.ZonalEscalation]: "bg-red-200 text-red-900 border-red-300",
  [IterationLevel.HQEscalation]: "bg-purple-200 text-purple-900 border-purple-300 animate-pulse",
  [IterationLevel.Resolved]: "bg-green-100 text-green-800 border-green-200",
};