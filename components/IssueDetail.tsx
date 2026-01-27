import React, { useState, useEffect } from 'react';
import { Issue, IterationLevel, EmailMessage } from '../types';
import { LEVEL_COLORS, LEVEL_LABELS } from '../constants';
import { analyzeIssue, draftResponseEmail, getStrategicAdvice, generateAudioAlert, categorizeIssue } from '../services/geminiService';
import { 
  AlertTriangle, Mail, Mic, BrainCircuit, Play, Loader2, X, Send, 
  CheckCircle, Clock, Copy, Sparkles, RefreshCcw, Activity, FileText, ChevronRight,
  ArrowUpRight, ArrowDownLeft, Inbox, Tag, Check
} from 'lucide-react';

interface IssueDetailProps {
  issue: Issue;
  onClose: () => void;
  onUpdateIssue: (updated: Issue) => void;
}

const EMAIL_CATEGORIES = [
  "Technical Support",
  "Billing & Finance",
  "Feature Request",
  "Infrastructure & Network",
  "Account Management",
  "General Inquiry",
  "Other"
];

// Manual decoding functions for raw PCM audio as per Gemini API guidelines
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioDataManual(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const EmailHistoryItem: React.FC<{ 
  message: EmailMessage,
  onCategoryChange: (id: string, category: string) => void
}> = ({ message, onCategoryChange }) => {
  const isOutbound = message.direction === 'outbound';
  
  return (
    <div className={`p-4 rounded-xl border ${isOutbound ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50 border-gray-100'} mb-3 transition-all hover:shadow-sm`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {isOutbound ? (
            <ArrowUpRight size={14} className="text-blue-500" />
          ) : (
            <ArrowDownLeft size={14} className="text-gray-500" />
          )}
          <span className={`text-[10px] font-black uppercase tracking-widest ${isOutbound ? 'text-blue-600' : 'text-gray-500'}`}>
            {isOutbound ? 'Outbound / AIME' : 'Inbound / Customer'}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 font-mono">{new Date(message.timestamp).toLocaleString()}</span>
      </div>
      <div className="mb-1">
        <span className="text-[10px] text-gray-400 font-bold uppercase mr-2">Subject:</span>
        <span className="text-xs font-bold text-gray-800">{message.subject}</span>
      </div>
      <div className="mb-2">
        <span className="text-[10px] text-gray-400 font-bold uppercase mr-2">{isOutbound ? 'To:' : 'From:'}</span>
        <span className="text-xs text-gray-600">{isOutbound ? message.to : message.from}</span>
      </div>
      <p className="text-xs text-gray-600 line-clamp-2 italic bg-white/50 p-2 rounded border border-gray-100/50">
        "{message.body}"
      </p>
      
      <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-200/50">
         <div className="flex items-center gap-1.5 group">
            <Tag size={10} className={`text-gray-400 group-hover:text-blue-400 transition-colors ${message.category ? 'text-blue-500' : ''}`} />
            <select
                value={message.category || ""}
                onChange={(e) => onCategoryChange(message.id, e.target.value)}
                className="text-[9px] bg-transparent border-none outline-none text-gray-500 font-bold cursor-pointer hover:text-blue-600 focus:ring-0 p-0 uppercase tracking-tight"
            >
                <option value="" disabled>Categorize Email...</option>
                {EMAIL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
         </div>

         <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
           message.status === 'Read' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
         }`}>
           {message.status}
         </span>
      </div>
    </div>
  );
};

const IssueDetail: React.FC<IssueDetailProps> = ({ issue, onClose, onUpdateIssue }) => {
  const [analysis, setAnalysis] = useState<string | null>(issue.aiAnalysis || null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [draftEmail, setDraftEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [strategicAdvice, setStrategicAdvice] = useState<string | null>(issue.strategicAdvice || null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [category, setCategory] = useState<string>(issue.category || "Uncategorized");
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isIdCopied, setIsIdCopied] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(issue.deadline);
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('BREACHED');
        return;
      }
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [issue.deadline]);

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeIssue(issue);
    setAnalysis(result);
    setLoadingAnalysis(false);
    onUpdateIssue({ ...issue, aiAnalysis: result });
  };

  const handleAutoCategorize = async () => {
    setLoadingCategory(true);
    const result = await categorizeIssue(issue);
    setCategory(result);
    setLoadingCategory(false);
    onUpdateIssue({ ...issue, category: result });
  };

  const handleDraftEmail = async () => {
    setLoadingEmail(true);
    const result = await draftResponseEmail(issue);
    setDraftEmail(result);
    setLoadingEmail(false);
  };

  const handleStrategicAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getStrategicAdvice(issue);
    setStrategicAdvice(result);
    setLoadingAdvice(false);
    onUpdateIssue({ ...issue, strategicAdvice: result });
  };

  const handleCopyAdvice = () => {
    if (strategicAdvice) {
      navigator.clipboard.writeText(strategicAdvice);
      alert('Strategic Consulting Report copied.');
    }
  };

  const handlePlayAudioAlert = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    const textToRead = `Attention. ${issue.priority} priority issue: ${issue.subject}. Current iteration level: ${LEVEL_LABELS[issue.iterationLevel]}.`;
    const base64Audio = await generateAudioAlert(textToRead);
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const uint8Array = decodeBase64(base64Audio);
      const buffer = await decodeAudioDataManual(uint8Array, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
      source.onended = () => {
        setIsPlayingAudio(false);
        audioContext.close();
      };
    } else {
      setIsPlayingAudio(false);
    }
  };

  const handleEmailCategoryChange = (id: string, newCategory: string) => {
    if (!issue.emailHistory) return;
    const updatedHistory = issue.emailHistory.map(msg => 
        msg.id === id ? { ...msg, category: newCategory } : msg
    );
    onUpdateIssue({ ...issue, emailHistory: updatedHistory });
  };

  const handleSimulateEscalation = () => {
    const nextLevel = Math.min(issue.iterationLevel + 1, IterationLevel.HQEscalation);
    onUpdateIssue({
      ...issue,
      iterationLevel: nextLevel,
      logs: [...issue.logs, {
        timestamp: new Date().toISOString(),
        message: `Escalated to ${LEVEL_LABELS[nextLevel]}`,
        actor: 'Employee',
        iterationLevel: nextLevel
      }]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${LEVEL_COLORS[issue.iterationLevel]}`}>
                {LEVEL_LABELS[issue.iterationLevel]}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                issue.priority === 'Critical' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700'
              }`}>
                {issue.priority} Priority
              </span>
              {/* Category Badge / Button */}
              <button 
                onClick={handleAutoCategorize}
                disabled={loadingCategory}
                className="group px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                title="Click to auto-categorize with Gemini"
              >
                <Tag size={10} className="text-slate-400 group-hover:text-slate-600" />
                {loadingCategory ? <Loader2 size={10} className="animate-spin" /> : category}
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{issue.subject}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-mono uppercase tracking-tighter">
              <span>ID: {issue.id}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(issue.id);
                  setIsIdCopied(true);
                  setTimeout(() => setIsIdCopied(false), 2000);
                }}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                title="Copy ID"
              >
                {isIdCopied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
              </button>
              <span>• Registered: {new Date(issue.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all active:scale-90">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
          
          {/* Main Description */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText size={64} />
            </div>
            <h3 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-[0.2em]">Customer Statement</h3>
            <p className="text-gray-700 leading-relaxed font-medium relative z-10">{issue.description}</p>
          </div>

          {/* AI Operations Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50 backdrop-blur-sm flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="flex items-center gap-2 font-bold text-blue-900 text-xs tracking-wide">
                        <BrainCircuit size={16} className="text-blue-600" />
                        Quick Analysis
                    </h4>
                    <button 
                        onClick={handleAnalyze} 
                        disabled={loadingAnalysis}
                        className="text-[9px] bg-blue-600 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {loadingAnalysis ? <Loader2 size={10} className="animate-spin" /> : (analysis ? <RefreshCcw size={10} /> : "Analyze")}
                    </button>
                </div>
                {analysis ? (
                   <div className="text-xs text-blue-800 whitespace-pre-line leading-relaxed font-medium">
                       {analysis}
                   </div>
                ) : (
                    <p className="text-xs text-blue-400 italic mt-auto">Awaiting automated summary report.</p>
                )}
             </div>

             <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100/50 flex flex-col justify-between backdrop-blur-sm">
                <h4 className="flex items-center gap-2 font-bold text-purple-900 text-xs tracking-wide mb-2">
                    <Mic size={16} className="text-purple-600" />
                    Audio Briefing
                </h4>
                <p className="text-[10px] text-purple-700 mb-4 opacity-75 font-medium">Synthesize an executive audio brief of the current situation.</p>
                <button 
                    onClick={handlePlayAudioAlert}
                    disabled={isPlayingAudio}
                    className="w-full flex justify-center items-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-purple-700 transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                >
                    {isPlayingAudio ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {isPlayingAudio ? "Streaming" : "Play Briefing"}
                </button>
             </div>
          </div>

          {/* Strategic Consulting Section */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Sparkles size={140} className="text-indigo-400" />
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                        <h3 className="flex items-center gap-2 font-black text-white uppercase tracking-[0.2em] text-[10px]">
                            <BrainCircuit size={18} className="text-indigo-400" />
                            AIME Strategic Intelligence
                        </h3>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Consulting Core v3.0 // Gemini Pro</span>
                    </div>
                    <div className="flex gap-2">
                        {strategicAdvice && (
                            <button 
                              onClick={handleCopyAdvice}
                              className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-lg"
                              title="Copy Strategic Report"
                            >
                              <Copy size={16} />
                            </button>
                        )}
                        <button 
                          onClick={handleStrategicAdvice}
                          disabled={loadingAdvice}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${
                            strategicAdvice 
                              ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' 
                              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500'
                          }`}
                        >
                            {loadingAdvice ? (
                                <>
                                  <Loader2 size={14} className="animate-spin text-indigo-400" />
                                  Thinking...
                                </>
                            ) : (
                                <>
                                  <RefreshCcw size={14} />
                                  {strategicAdvice ? "Regenerate" : "Engage AI Engine"}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="min-h-[140px] flex flex-col">
                    {loadingAdvice ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em] text-center">
                                Processing Organizational Context...
                            </p>
                        </div>
                    ) : strategicAdvice ? (
                        <div className="bg-slate-950/90 p-6 rounded-2xl border border-slate-800 text-[13px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed shadow-inner relative border-l-4 border-l-indigo-500">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600/10 text-indigo-400 text-[8px] font-bold uppercase tracking-widest border-l border-b border-slate-800 rounded-bl-lg">
                                Internal Strategic Report
                            </div>
                            {strategicAdvice}
                        </div>
                    ) : (
                        <div className="flex-1 text-center py-12 px-6 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-4 group-hover:border-slate-700 transition-colors">
                            <Activity className="text-slate-800 group-hover:text-slate-700" size={32} />
                            <p className="text-[11px] text-slate-500 font-medium max-w-[300px] leading-relaxed">
                                Engage the strategic core for root-cause analysis and corrective action steps.
                            </p>
                        </div>
                    )}
                </div>
              </div>
          </div>

          {/* Email Drafter */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
             <div className="flex justify-between items-center mb-5">
                 <h3 className="flex items-center gap-2 font-bold text-gray-800 text-xs tracking-wide">
                     <Mail size={16} className="text-gray-400" />
                     Mailing Engine Draft
                 </h3>
                 <button 
                    onClick={handleDraftEmail}
                    disabled={loadingEmail}
                    className="text-[9px] bg-slate-900 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all"
                 >
                     {loadingEmail ? <Loader2 size={10} className="animate-spin" /> : "Draft with AI"}
                 </button>
             </div>
             {draftEmail && (
                 <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                     <textarea 
                        className="w-full bg-transparent border-none outline-none text-xs text-gray-700 h-40 resize-none leading-relaxed font-medium"
                        value={draftEmail}
                        readOnly
                     />
                     <div className="mt-4 flex justify-end gap-3 items-center border-t border-gray-100 pt-4">
                         <button className="text-[9px] font-black uppercase text-gray-400 hover:text-gray-900 tracking-widest">Copy Content</button>
                         <button className="text-[10px] bg-blue-600 text-white px-5 py-2 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-100 active:scale-95">
                             <Send size={12} /> Dispatch
                         </button>
                     </div>
                 </div>
             )}
          </div>

          {/* Mailing Engine Activity - THE NEW SECTION */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Inbox size={14} /> Mailing Engine Activity
            </h3>
            {issue.emailHistory && issue.emailHistory.length > 0 ? (
              <div className="space-y-3">
                {issue.emailHistory.map(email => (
                  <EmailHistoryItem 
                    key={email.id} 
                    message={email} 
                    onCategoryChange={handleEmailCategoryChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No communication history found</p>
              </div>
            )}
          </div>
          
           {/* Event Timeline */}
           <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Event Timeline</h3>
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-10">
                    {issue.logs.map((log, idx) => (
                        <div key={idx} className="relative pl-8 group">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500 group-last:border-green-500 shadow-sm z-10 transition-transform group-hover:scale-125" />
                            <div className="text-[9px] font-black text-gray-300 font-mono mb-1 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</div>
                            <div className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                {log.message}
                                <ChevronRight size={12} className="text-gray-300" />
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">Actor: <span className="font-bold text-gray-600 uppercase tracking-tighter">{log.actor}</span></div>
                        </div>
                    ))}
                </div>
           </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white/90 backdrop-blur-xl flex gap-4 justify-between items-center sticky bottom-0 z-10">
            <div className="flex flex-col">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                    <Clock size={10} /> Active Deadline
                </div>
                <div className={`text-sm font-black font-mono transition-colors tracking-widest ${timeLeft === 'BREACHED' ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                    {timeLeft}
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleSimulateEscalation}
                    className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-red-100 shadow-sm"
                >
                    <AlertTriangle size={14} />
                    Escalate
                </button>
                <button 
                    onClick={() => {
                        onUpdateIssue({...issue, iterationLevel: IterationLevel.Resolved, logs: [...issue.logs, {
                            timestamp: new Date().toISOString(),
                            message: "Resolved manually",
                            actor: "Employee",
                            iterationLevel: IterationLevel.Resolved
                        }]});
                        onClose();
                    }}
                    className="px-8 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-green-100 transition-all active:scale-95"
                >
                    <CheckCircle size={14} />
                    Resolve
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;