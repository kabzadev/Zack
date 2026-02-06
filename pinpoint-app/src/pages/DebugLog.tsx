import { useState, useEffect } from 'react';
import { Layout, PageHeader } from '../components';
import { telemetry, type TelemetryEvent } from '../utils/telemetry';
import { Trash2, RefreshCw, Download, Copy, Check } from 'lucide-react';

const CAT_COLORS: Record<string, string> = {
  assistant: 'text-purple-400 bg-purple-500/10',
  voice: 'text-blue-400 bg-blue-500/10',
  color: 'text-amber-400 bg-amber-500/10',
  nav: 'text-green-400 bg-green-500/10',
  error: 'text-red-400 bg-red-500/10',
};

export const DebugLog = () => {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const refresh = () => setEvents([...telemetry.getAll()].reverse());

  useEffect(() => { refresh(); }, []);

  const filtered = filter === 'all' ? events : events.filter(e => e.cat === filter);
  const categories = ['all', ...new Set(events.map(e => e.cat))];

  const handleCopy = async () => {
    const text = JSON.stringify(filtered, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = JSON.stringify(filtered, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinpoint-debug-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    telemetry.clear();
    refresh();
  };

  return (
    <Layout>
      <PageHeader title="Debug Log" subtitle={`${filtered.length} events`} showBack />
      
      {/* Actions */}
      <div className="px-5 pb-3 flex gap-2">
        <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700">
          <RefreshCw size={14} /> Refresh
        </button>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700">
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700">
          <Download size={14} /> Export
        </button>
        <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/30 text-red-400 text-xs hover:bg-red-900/50 ml-auto">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Category filters */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === cat
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="px-5 space-y-2 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <p className="text-sm">No events recorded yet</p>
            <p className="text-xs mt-1">Events will appear as you use the app</p>
          </div>
        ) : (
          filtered.map((e, i) => (
            <div key={i} className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${CAT_COLORS[e.cat] || 'text-slate-400 bg-slate-700/50'}`}>
                  {e.cat}
                </span>
                <span className="text-xs font-semibold text-white">{e.evt}</span>
                <span className="text-[10px] text-slate-500 ml-auto">
                  {new Date(e.ts).toLocaleTimeString()}
                </span>
              </div>
              {e.data && (
                <pre className="text-[11px] text-slate-400 mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(e.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};
