import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldCheck, ShieldAlert, Sparkles, Terminal, Copy, Check, RefreshCw, BrainCircuit, MessageSquareQuote, Zap } from 'lucide-react';
import { preprocessQuery, type PreprocessedQuery } from './services/geminiService';

export default function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PreprocessedQuery | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await preprocessQuery(query);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setQuery('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-24">
        <header className="mb-12 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4"
          >
            <Sparkles size={14} />
            <span>EEVA Intelligence Engine</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
          >
            Query Pre-processor
          </motion.h1>
        </header>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <form onSubmit={handleProcess} className="relative group">
            <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within:bg-blue-500/10 transition-colors rounded-2xl" />
            <div className="relative flex flex-col md:flex-row gap-4 p-2 bg-[#18181B] border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all shadow-2xl">
              <div className="flex-1 flex items-center px-4 gap-3">
                <Search className="text-gray-500" size={20} />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter video search query..."
                  className="w-full py-4 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600"
                />
              </div>
              <button 
                disabled={isLoading || !query.trim()}
                className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <><span>Process</span><Terminal size={18} /></>}
              </button>
            </div>
          </form>
        </motion.section>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="p-6 bg-[#18181B] border border-white/10 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Analysis</h3>
                    {result.is_safe ? (
                      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/20"><ShieldCheck size={14} /> SAFE</div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full text-xs font-bold border border-rose-400/20"><ShieldAlert size={14} /> UNSAFE</div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-tight">Original</label><p className="text-gray-300 italic">"{result.original_query}"</p></div>
                    {result.is_safe && <div><label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-tight">Corrected</label><p className="text-white font-medium text-lg">"{result.corrected_query}"</p></div>}
                    <div><label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-tight">Reasoning</label><p className="text-gray-400 text-sm leading-relaxed">{result.reason}</p></div>
                  </div>
                </div>

                {result.suggestions.length > 0 && (
                  <div className="p-6 bg-[#18181B] border border-white/10 rounded-2xl shadow-xl">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><MessageSquareQuote size={16} /> Suggested Follow-ups</h3>
                    <div className="grid gap-3">
                      {result.suggestions.map((s, i) => (
                        <button key={i} onClick={() => setQuery(s)} className="text-left p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm text-gray-300 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <div className="p-6 bg-[#18181B] border border-white/10 rounded-2xl shadow-xl">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2"><BrainCircuit size={16} /> Performance & Usage</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between text-gray-400"><span>Latency</span><span className="text-emerald-400">{result.timeTakenMs}ms</span></div>
                    <div className="flex justify-between text-gray-400"><span>Prompt</span><span className="text-white">{result.usageMetadata.promptTokenCount}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Output</span><span className="text-white">{result.usageMetadata.candidatesTokenCount}</span></div>
                    <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-gray-200"><span>Total Tokens</span><span>{result.usageMetadata.totalTokenCount}</span></div>
                  </div>
                </div>
                <button onClick={reset} className="w-full py-3 border border-white/5 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium text-gray-400">Clear Analysis</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-6 text-center text-xs text-gray-600 pointer-events-none">EEVA v1.1.0 • Powered by Gemini 3.1 Flash Lite</footer>
    </div>
  );
}
