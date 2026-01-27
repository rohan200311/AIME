import { Issue, IterationLevel, IssuePriority, EmailMessage } from '../types';
import { DEADLINES } from '../constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmailHistory = (subject: string, customerName: string, customerEmail: string): EmailMessage[] => {
  return [
    {
      id: generateId(),
      direction: 'inbound',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      from: customerEmail,
      to: 'support@aime-engine.tech',
      subject: `New Support Request: ${subject}`,
      body: "Hello, I am writing regarding a problem I encountered. Please find the details in the system log.",
      status: 'Received'
    },
    {
      id: generateId(),
      direction: 'outbound',
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      from: 'AIME Auto-Responder',
      to: customerEmail,
      subject: `RE: ${subject} (Ticket Received)`,
      body: `Dear ${customerName}, we have received your request. Our team is currently investigating. Level 1 iteration has commenced.`,
      status: 'Delivered'
    }
  ];
};

const createIssue = (
  subject: string, 
  desc: string, 
  level: IterationLevel, 
  priority: IssuePriority
): Issue => {
  const now = new Date();
  const created = new Date(now.getTime() - Math.random() * 100000000);
  
  // Calculate deadline based on level start (mocking simplified)
  const deadlineHours = DEADLINES[level] || 24;
  const deadline = new Date(now.getTime() + (deadlineHours * 60 * 60 * 1000));
  const customerName = `Customer ${generateId().substring(0, 4)}`;
  const customerEmail = `customer${generateId().substring(0, 4)}@example.com`;

  return {
    id: generateId(),
    customerName,
    customerEmail,
    subject,
    description: desc,
    createdAt: created.toISOString(),
    lastUpdatedAt: now.toISOString(),
    iterationLevel: level,
    priority,
    deadline: deadline.toISOString(),
    logs: [
      {
        timestamp: created.toISOString(),
        message: "Issue raised by customer",
        actor: 'Customer',
        iterationLevel: IterationLevel.CustomerRaise
      }
    ],
    category: "General Service",
    emailHistory: createEmailHistory(subject, customerName, customerEmail)
  };
};

export const INITIAL_ISSUES: Issue[] = [
  createIssue(
    "Login Failure on Mobile App", 
    "I cannot login to my account since yesterday. It says 'Network Error' even though my wifi is fine. I've tried reinstalling.",
    IterationLevel.EmployerHandling, 
    IssuePriority.High
  ),
  createIssue(
    "Billing Discrepancy - Overcharged", 
    "My bill for this month is 20% higher than agreed contract. Please explain immediately.",
    IterationLevel.ManagerEscalation, 
    IssuePriority.Critical
  ),
  createIssue(
    "Feature Request: Dark Mode", 
    "It would be nice to have dark mode in the dashboard.",
    IterationLevel.CustomerRaise, 
    IssuePriority.Low
  ),
  createIssue(
    "Service Outage in Region East", 
    "Our entire office in East region is down. No connectivity.",
    IterationLevel.ZonalEscalation, 
    IssuePriority.Critical
  ),
  createIssue(
    "Password Reset Not Working", 
    "I didn't receive the reset email.",
    IterationLevel.EmployeeAlert, 
    IssuePriority.Medium
  ),
];