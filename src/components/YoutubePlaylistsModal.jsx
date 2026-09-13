import React, { useEffect } from 'react';

export default function YoutubePlaylistsModal({ onClose }) {
  // Đóng modal bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const playlists = [
    {
      title: "Ngôn ngữ lập trình C++",
      url: "https://youtube.com/playlist?list=PLux-_phi0Rz0Hq9fDP4TlOulBl8APKp79&si=2Hv8RuQ8ak60wwIw"
    },
    {
      title: "Hàm Lý thuyết Số",
      url: "https://youtube.com/playlist?list=PLux-_phi0Rz2ageRhWahGK9v1dmLJUvIU&si=BaZFdAUY82kahh6S"
    },
    {
      title: "BÀI TẬP LẬP TRÌNH PTIT",
      url: "https://youtube.com/playlist?list=PLux-_phi0Rz3YIzDrDj0Tjc5aqf0tO4e-&si=YsJ3E7UnznG1QMYE"
    },
    {
      title: "KHÓA HỌC C++",
      url: "https://youtube.com/playlist?list=PLMS0MQLUa94VEVcZV5Bp-ri0SRRpdgixS&si=tMAvHiTdYJL37VMT"
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-5xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden modal-enter-active">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-md">
              <i className="fab fa-youtube text-white text-xl"></i>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">HỌC C++ 28TECH</h2>
          </div>
          
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-xl transition-colors focus:outline-none" title="Đóng (Esc)">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-grow bg-[#EAECEE] p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist, idx) => (
              <a 
                key={idx} 
                href={playlist.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="aspect-video w-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center relative overflow-hidden">
                  <i className="fab fa-youtube text-[80px] text-white/90 group-hover:scale-110 group-hover:text-white transition-all duration-300"></i>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">PLAYLIST</div>
                </div>
                {/* Content */}
                <div className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                    <img src="https://cdn-blog.28tech.com.vn/media/core/logo/favicon.png" alt="28tech" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">{playlist.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">28tech • Đã cập nhật</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
