import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldCheck, ShieldAlert, Sparkles, Terminal, Copy, Check, RefreshCw, BrainCircuit, MessageSquareQuote, Zap, Settings, X, Plus, Trash2 } from 'lucide-react';
import { preprocessQuery, type PreprocessedQuery } from './services/geminiService';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PreprocessedQuery | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Dictionary State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [allowedWords, setAllowedWords] = useState<string[]>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [newAllowedWord, setNewAllowedWord] = useState('');
  const [newBlockedWord, setNewBlockedWord] = useState('');

  // Listen to Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'dictionary', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAllowedWords(data.allowedWords || []);
        setBlockedWords(data.blockedWords || []);
      } else {
        // Initialize if it doesn't exist
        setDoc(doc(db, 'dictionary', 'global'), { allowedWords: [], blockedWords: [] });
      }
    }, (error) => {
      console.error("Firestore error (make sure rules allow read/write):", error);
    });
    return () => unsub();
  }, []);

  const addWord = async (type: 'allowed' | 'blocked', word: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return;
    
    const docRef = doc(db, 'dictionary', 'global');
    try {
      await updateDoc(docRef, {
        [type === 'allowed' ? 'allowedWords' : 'blockedWords']: arrayUnion(cleanWord)
      });
      if (type === 'allowed') setNewAllowedWord('');
      else setNewBlockedWord('');
    } catch (error) {
      console.error("Error adding word:", error);
      alert("Failed to add word. Check Firestore security rules.");
    }
  };

  const removeWord = async (type: 'allowed' | 'blocked', word: string) => {
    const docRef = doc(db, 'dictionary', 'global');
    try {
      await updateDoc(docRef, {
        [type === 'allowed' ? 'allowedWords' : 'blockedWords']: arrayRemove(word)
      });
    } catch (error) {
      console.error("Error removing word:", error);
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await preprocessQuery(query, allowedWords, blockedWords);
      setResult(data);
      
      // Log the query to Firestore
      try {
        await addDoc(collection(db, 'query_logs'), {
          original_query: data.original_query,
          corrected_query: data.corrected_query,
          is_safe: data.is_safe,
          reason: data.reason,
          timestamp: new Date().toISOString()
        });
      } catch (logError) {
        console.error("Failed to log query:", logError);
      }
      
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
        <div className="absolute top-6 right-6 md:top-12 md:right-12">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Global Dictionary Settings"
          >
            <Settings size={20} />
          </button>
        </div>

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

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#18181B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20} className="text-blue-400"/> Global Dictionary</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 grid md:grid-cols-2 gap-8">
                {/* Allowed Words */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2"><ShieldCheck size={16}/> Allowed Concepts</h3>
                  <p className="text-xs text-gray-500 mb-4">Words and related concepts here will bypass safety filters.</p>
                  
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={newAllowedWord}
                      onChange={(e) => setNewAllowedWord(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWord('allowed', newAllowedWord)}
                      placeholder="Add word..."
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none"
                    />
                    <button onClick={() => addWord('allowed', newAllowedWord)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {allowedWords.map(word => (
                      <span key={word} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-md">
                        {word}
                        <button onClick={() => removeWord('allowed', word)} className="hover:text-white ml-1"><X size={12}/></button>
                      </span>
                    ))}
                    {allowedWords.length === 0 && <span className="text-xs text-gray-600 italic">No allowed words.</span>}
                  </div>
                </div>

                {/* Blocked Words */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-400 mb-4 flex items-center gap-2"><ShieldAlert size={16}/> Blocked Concepts</h3>
                  <p className="text-xs text-gray-500 mb-4">Queries with these words or related concepts will be blocked.</p>
                  
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={newBlockedWord}
                      onChange={(e) => setNewBlockedWord(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWord('blocked', newBlockedWord)}
                      placeholder="Add word..."
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-rose-500/50 focus:outline-none"
                    />
                    <button onClick={() => addWord('blocked', newBlockedWord)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {blockedWords.map(word => (
                      <span key={word} className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-md">
                        {word}
                        <button onClick={() => removeWord('blocked', word)} className="hover:text-white ml-1"><X size={12}/></button>
                      </span>
                    ))}
                    {blockedWords.length === 0 && <span className="text-xs text-gray-600 italic">No blocked words.</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
