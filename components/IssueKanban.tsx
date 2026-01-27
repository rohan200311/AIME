import React from 'react';
import { Issue, IterationLevel } from '../types';
import { LEVEL_LABELS, LEVEL_COLORS } from '../constants';
import { Clock, AlertTriangle, Tag } from 'lucide-react';

interface IssueKanbanProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

const KanbanColumn: React.FC<{ 
    level: IterationLevel, 
    issues: Issue[], 
    onSelect: (i: Issue) => void 
}> = ({ level, issues, onSelect }) => {
  const label = LEVEL_LABELS[level];
  const colorClass = LEVEL_COLORS[level];

  // Map level to a simpler color for the header bar
  const headerColor = level === 7 ? 'bg-green-500' : level >= 5 ? 'bg-red-500' : level >= 3 ? 'bg-orange-400' : 'bg-blue-400';

  return (
    <div className="min-w-[300px] flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-200/50">
      <div className={`p-3 rounded-t-xl ${headerColor} text-white font-medium flex justify-between items-center shadow-sm`}>
        <span className="text-sm truncate mr-2">{label}</span>
        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{issues.length}</span>
      </div>
      <div className="flex-1 p-2 space-y-3 overflow-y-auto">
        {issues.length === 0 && (
            <div className="h-20 flex items-center justify-center text-gray-300 text-xs italic">
                No active issues
            </div>
        )}
        {issues.map(issue => (
          <div 
            key={issue.id}
            onClick={() => onSelect(issue)}
            className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          >
            {/* Left accent bar based on priority */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                issue.priority === 'Critical' ? 'bg-red-500' : issue.priority === 'High' ? 'bg-orange-400' : 'bg-blue-300'
            }`} />
            
            <div className="pl-2">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-500 font-mono">#{issue.id.substring(0,6)}</span>
                    {issue.priority === 'Critical' && <AlertTriangle size={14} className="text-red-500" />}
                </div>
                <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {issue.subject}
                </h4>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>Due: {new Date(issue.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {issue.category && issue.category !== "General Service" && (
                         <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                            <Tag size={8} /> {issue.category.split(' ')[0]}
                         </span>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IssueKanban: React.FC<IssueKanbanProps> = ({ issues, onSelectIssue }) => {
    // Only showing active escalation levels for the board to keep it clean
    // or we can scroll horizontally
    const relevantLevels = [
        IterationLevel.EmployerHandling, 
        IterationLevel.EmployeeAlert, 
        IterationLevel.ManagerEscalation, 
        IterationLevel.HighAuthEscalation,
        IterationLevel.ZonalEscalation,
        IterationLevel.HQEscalation
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {relevantLevels.map(level => (
                <KanbanColumn 
                    key={level} 
                    level={level} 
                    issues={issues.filter(i => i.iterationLevel === level)} 
                    onSelect={onSelectIssue}
                />
            ))}
        </div>
    );
};

export default IssueKanban;