import React, { useRef, useEffect } from 'react';

export default function Header({ searchQuery, setSearchQuery }) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bắt sự kiện Ctrl + K hoặc Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // Chặn hành vi mặc định (tìm kiếm trên trình duyệt)
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-1 cursor-pointer group">
                    <div className="font-mono font-extrabold text-2xl tracking-tight text-slate-900">
                        <span className="text-[#E63946] group-hover:text-red-600 transition-colors">~/</span>IT_Docs<span className="text-[#E63946] cursor-blink">_</span>
                    </div>
                </div>
                
                <div className="hidden sm:flex items-center">
                    <div className="bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors rounded-lg px-3 py-1.5 flex items-center gap-3 w-64 cursor-text" onClick={() => searchInputRef.current?.focus()}>
                        <i className="fas fa-search text-slate-400 text-sm"></i>
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search docs..." 
                            className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 flex-grow font-mono" 
                        />
                        <kbd className="hidden lg:inline-block font-mono text-[10px] bg-white border border-slate-300 text-slate-500 px-1.5 py-0.5 rounded shadow-sm">Ctrl K</kbd>
                    </div>
                </div>
            </div>
        </div>
    </header>
  );
}
