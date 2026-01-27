import React, { useState } from 'react';
import { INITIAL_ISSUES } from './services/mockData';
import { Issue, IterationLevel, IssuePriority } from './types';
import IssueKanban from './components/IssueKanban';
import IssueDetail from './components/IssueDetail';
import { LayoutDashboard, List, Activity, UserCircle, Bell, Plus, Filter, RotateCcw } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

function App() {
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  
  // Filtering state
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const handleUpdateIssue = (updated: Issue) => {
    setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
    if (selectedIssue?.id === updated.id) {
        setSelectedIssue(updated);
    }
  };

  // Compute categories dynamically
  const categories = ['All', ...Array.from(new Set(issues.map(i => i.category).filter(Boolean) as string[]))];

  // Derived filtered issues
  const filteredIssues = issues.filter(issue => {
    const matchesPriority = priorityFilter === 'All' || issue.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
    return matchesPriority && matchesCategory;
  });

  // Stats for the top cards (using all issues for overall context)
  const totalIssues = issues.length;
  const criticalCount = issues.filter(i => i.priority === IssuePriority.Critical).length;
  const escalatedCount = issues.filter(i => i.iterationLevel >= IterationLevel.ManagerEscalation).length;

  const chartData = [
      { name: 'Lvl 1', value: issues.filter(i => i.iterationLevel === 1).length },
      { name: 'Lvl 2', value: issues.filter(i => i.iterationLevel === 2).length },
      { name: 'Lvl 3', value: issues.filter(i => i.iterationLevel === 3).length },
      { name: 'Lvl 4', value: issues.filter(i => i.iterationLevel === 4).length },
      { name: 'Lvl 5', value: issues.filter(i => i.iterationLevel === 5).length },
      { name: 'HQ', value: issues.filter(i => i.iterationLevel === 6).length },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
             <Activity className="text-blue-500" />
             AIME
          </h1>
          <p className="text-xs text-slate-500 mt-1">Auto Iteration Mailing Engine</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${view === 'board' ? 'bg-blue-600/10 text-blue-400 border-blue-600/20' : 'hover:bg-slate-800 border-transparent'}`}>
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <List size={20} />
            <span className="font-medium">All Issues</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <Activity size={20} />
            <span className="font-medium">Analytics</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-2">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                   <UserCircle size={20} />
               </div>
               <div>
                   <div className="text-sm font-medium text-white">System Admin</div>
                   <div className="text-xs text-slate-500">HQ Core Access</div>
               </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-700">Live Escalation Monitor</h2>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 relative hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} className="text-gray-500" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <button 
                  onClick={() => alert("Simulated: Create Issue Modal would open here")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-transform active:scale-95 shadow-md shadow-blue-100"
                >
                    <Plus size={16} /> New Issue
                </button>
            </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                    <div className="text-gray-500 text-sm font-medium mb-1">Total Active Issues</div>
                    <div className="text-3xl font-bold text-gray-800">{totalIssues}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                    <div className="text-gray-500 text-sm font-medium mb-1 text-red-600">Critical Priority</div>
                    <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                    <div className="text-gray-500 text-sm font-medium mb-1 text-orange-600">High Level Escalations</div>
                    <div className="text-3xl font-bold text-orange-600">{escalatedCount}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
                    <div className="text-gray-500 text-sm font-medium mb-2">Escalation Distribution</div>
                    <div className="h-16 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index > 3 ? '#ef4444' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Toolbar Area */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-end justify-between gap-6">
                <div className="flex gap-6 items-end">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest flex items-center gap-1">
                            <Filter size={10} /> Priority Filter
                        </label>
                        <select 
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:bg-gray-100 min-w-[140px]"
                        >
                            <option value="All">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest flex items-center gap-1">
                            <Filter size={10} /> Category Filter
                        </label>
                        <select 
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:bg-gray-100 min-w-[160px]"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                            ))}
                        </select>
                    </div>
                    {(priorityFilter !== 'All' || categoryFilter !== 'All') && (
                        <button 
                            onClick={() => { setPriorityFilter('All'); setCategoryFilter('All'); }}
                            className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-2 hover:text-blue-700 transition-colors"
                        >
                            <RotateCcw size={12} /> Clear Filters
                        </button>
                    )}
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button 
                        onClick={() => setView('board')}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${view === 'board' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Board
                    </button>
                    <button 
                        onClick={() => setView('list')}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        List
                    </button>
                </div>
            </div>

            {/* Kanban / Board Area */}
            <div className="h-[calc(100vh-420px)]">
                <IssueKanban issues={filteredIssues} onSelectIssue={setSelectedIssue} />
            </div>

        </div>
      </main>

      {/* Details Overlay */}
      {selectedIssue && (
        <IssueDetail 
            issue={selectedIssue} 
            onClose={() => setSelectedIssue(null)} 
            onUpdateIssue={handleUpdateIssue}
        />
      )}

    </div>
  );
}

export default App;