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
    
    // Nếu là link Google Drive thì mới xử lý để nhúng
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/[-\w]{25,}/);
      if (match && (match[1] || match[0])) {
        return `https://drive.google.com/file/d/${match[1] || match[0]}/preview`;
      }
    }
    
    // Nếu là file Word (.doc, .docx) được upload lên Supabase, dùng Google Docs Viewer để xem trước
    if (url.includes('.doc') || url.includes('.docx')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    
    // Nếu là file PDF upload thẳng lên Supabase hoặc link khác, trả về y nguyên
    return url;
  };

  const embedUrl = getEmbedUrl(doc.file_url);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 m-0 p-0" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white w-full h-full flex flex-col modal-enter-active rounded-none">
            
            {/* Header Modal - Full width */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-slate-200 bg-slate-50 select-none shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 items-center mr-2">
                        <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 focus:outline-none"></button>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-700 flex items-center gap-2">
                        <i className={doc.title.toLowerCase().includes('.doc') ? "fas fa-file-word text-blue-600" : "fas fa-file-pdf text-[#E63946]"}></i>
                        <span>{doc.title}</span>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="font-mono text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center">
                        <i className="fas fa-eye text-[#E63946] mr-1"></i> <span>{doc.views?.toLocaleString() || 0}</span>
                    </div>
                    {/* Nút Tải xuống */}
                    <a 
                      href={doc.file_url.includes('drive.google.com') ? doc.file_url : `${doc.file_url}?download=`} 
                      target="_blank" rel="noopener noreferrer"
                      className="bg-[#E63946] hover:bg-red-700 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm ml-4"
                      title="Tải xuống"
                    >
                        <i className="fas fa-download text-lg"></i>
                    </a>
                    {/* Nút X to hơn */}
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors focus:outline-none ml-2" title="Đóng (Esc)">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>

            {/* Body Modal */}
            <div className="flex-grow bg-[#EAECEE] relative w-full h-full">
                <iframe className="w-full h-full bg-white border-none" src={loading ? "" : embedUrl} frameBorder="0" allowFullScreen></iframe>
                
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 font-mono text-[#E63946]">
                        <i className="fas fa-cog fa-spin text-5xl mb-4"></i>
                        <span className="text-base font-bold tracking-widest uppercase">Đang tải tài liệu...</span>
                    </div>
                )}
            </div>
            
            {/* Không cần footer rườm rà nữa vì đã full màn hình */}
        </div>
    </div>
  );
}
