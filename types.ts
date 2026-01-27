export enum IterationLevel {
  CustomerRaise = 0,
  EmployerHandling = 1,
  EmployeeAlert = 2,
  ManagerEscalation = 3,
  HighAuthEscalation = 4,
  ZonalEscalation = 5,
  HQEscalation = 6,
  Resolved = 7,
}

export enum IssuePriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export interface EmailMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Received';
  category?: string;
}

export interface Issue {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  createdAt: string; // ISO Date string
  lastUpdatedAt: string; // ISO Date string
  iterationLevel: IterationLevel;
  priority: IssuePriority;
  assignedTo?: string; // Employee Name/Role
  deadline: string; // ISO Date string for current phase
  logs: LogEntry[];
  aiAnalysis?: string;
  strategicAdvice?: string;
  category?: string;
  emailHistory?: EmailMessage[];
}

export interface LogEntry {
  timestamp: string;
  message: string;
  actor: 'System' | 'Employee' | 'Customer' | 'AI';
  iterationLevel?: IterationLevel;
}

export interface DashboardStats {
  totalIssues: number;
  criticalIssues: number;
  breachedDeadlines: number;
  avgResolutionTimeHours: number;
}