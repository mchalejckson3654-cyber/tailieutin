import React, { useEffect, useState } from 'react';

export default function DocumentViewerModal({ doc, onClose }) {
  const [loading, setLoading] = useState(true);

  // Giả lập load
  useEffect(() => {
    if (doc) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [doc]);

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

  if (!doc) return null;

  // Chuyển đổi link Google Drive sang định dạng nhúng (/preview) để tránh lỗi quyền
  const getEmbedUrl = (url) => {
    if (!url) return "";
    const match = url.match(/[-\w]{25,}/);
    if (match && match[0]) {
      return `https://drive.google.com/file/d/${match[0]}/preview`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-2 p-2 sm:p-4" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white w-[98vw] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[98vh] modal-enter-active border border-slate-200">
            
            {/* Header Modal kiểu thanh tiêu đề cửa sổ */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50 select-none">
                <div className="flex gap-2 items-center mr-4">
                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 focus:outline-none"></button>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                
                <div className="flex-1 text-center font-mono text-xs font-bold text-slate-600 truncate px-4 flex items-center justify-center gap-2">
                    <i className="fas fa-file-pdf text-[#E63946]"></i>
                    <span>{doc.title}.pdf</span>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="font-mono text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center">
                        <i className="fas fa-eye text-[#E63946] mr-1"></i> <span>{doc.views?.toLocaleString() || 0}</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
            </div>

            {/* Body Modal */}
            <div className="flex-grow bg-[#EAECEE] relative w-full h-full p-2 sm:p-4">
                <iframe className="w-full h-full rounded shadow-sm bg-white border border-slate-300" src={loading ? "" : getEmbedUrl(doc.file_url)} frameBorder="0" allowFullScreen></iframe>
                
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 font-mono text-[#E63946]">
                        <i className="fas fa-cog fa-spin text-4xl mb-4"></i>
                        <span className="text-sm font-bold tracking-widest uppercase">Initializing Stream...</span>
                    </div>
                )}
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-3 bg-white border-t border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="text-xs text-slate-500 font-mono">
                    Status: <span className="text-green-600 font-bold">200 OK</span>
                </div>
                <a href={doc.file_url} target="_blank" rel="noreferrer" className="bg-[#E63946] hover:bg-red-700 text-white font-mono text-xs font-bold py-2 px-4 rounded transition-colors flex items-center shadow-sm">
                    MỞ TRONG TAB MỚI <i className="fas fa-external-link-alt ml-2"></i>
                </a>
            </div>
        </div>
    </div>
  );
}
