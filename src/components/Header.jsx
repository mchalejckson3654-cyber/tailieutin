import React, { useRef, useEffect } from 'react';

export default function Header({ searchQuery, setSearchQuery, onOpenDemo, onOpenYoutube }) {
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
                
                <div className="hidden md:flex items-center gap-3">
                    {/* Nút Demo Nhúng Web 28tech (Màu xanh) */}
                    <button 
                        onClick={onOpenDemo}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-blue-200 shadow-sm"
                        title="Xem thử tính năng nhúng Web"
                    >
                        <img src="https://cdn-blog.28tech.com.vn/media/core/logo/favicon.png" alt="28tech" className="w-4 h-4 object-contain" /> Web 28tech
                    </button>

                    {/* Nút Demo Playlists Youtube (Màu đỏ) */}
                    <button 
                        onClick={onOpenYoutube}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-red-200 shadow-sm"
                        title="Xem thử danh sách Youtube"
                    >
                        <i className="fab fa-youtube text-base"></i> Học C++ 28tech
                    </button>

                    <div className="bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors rounded-lg px-3 py-1.5 flex items-center gap-3 w-48 lg:w-64 cursor-text ml-2" onClick={() => searchInputRef.current?.focus()}>
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
