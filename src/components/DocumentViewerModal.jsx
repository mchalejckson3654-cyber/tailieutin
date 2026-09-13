import React, { useEffect, useState } from 'react';

export default function DocumentViewerModal({ doc, onClose }) {
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");

  const isWebPage = (url) => {
    if (!url) return false;
    if (url.includes('drive.google.com')) return false;
    if (url.includes('.doc') || url.includes('.docx') || url.includes('.pdf')) return false;
    if (url.includes('supabase.co/storage')) return false;
    // Có thể thêm các điều kiện khác nếu cần
    return true;
  };

  useEffect(() => {
    if (doc) {
      setLoading(true);
      setHtmlContent("");

      if (isWebPage(doc.file_url)) {
        const fetchWebPage = async () => {
          try {
            // Thay vì dùng AllOrigins bị Cloudflare chặn CORS, ta dùng proxy của Vite cấu hình trong vite.config.js
            let proxyUrl = doc.file_url;
            if (doc.file_url.includes('blog.28tech.com.vn')) {
              proxyUrl = doc.file_url.replace('https://blog.28tech.com.vn', '/proxy/28tech');
            } else {
              // Fallback cho các trang khác nếu có proxy AllOrigins (có thể vẫn bị CORS tùy trang)
              proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(doc.file_url)}`;
            }

            const response = await fetch(proxyUrl);
            const htmlString = await response.text();
            
            if (htmlString) {
              const parser = new DOMParser();
              const dom = parser.parseFromString(htmlString, 'text/html');
              
              // Xóa header và footer của trang web
              const header = dom.querySelector('header');
              if (header) header.remove();
              
              const footer = dom.querySelector('footer');
              if (footer) footer.remove();

              // Chèn thẻ <base> để các link CSS/JS/Image tương đối vẫn hoạt động đúng
              try {
                const urlObj = new URL(doc.file_url);
                const baseTag = dom.createElement('base');
                baseTag.href = urlObj.origin;
                dom.head.insertBefore(baseTag, dom.head.firstChild);
              } catch (e) {
                console.error("Lỗi parse URL:", e);
              }

              // Lấy toàn bộ HTML sau khi đã chỉnh sửa
              setHtmlContent(dom.documentElement.outerHTML);
            }
          } catch (err) {
            console.error("Lỗi khi tải trang web:", err);
            setHtmlContent(`<div style="padding: 20px; font-family: sans-serif; text-align: center; color: red;">Lỗi khi tải trang web hoặc trang web chặn hiển thị.</div>`);
          } finally {
            setLoading(false);
          }
        };
        fetchWebPage();
      } else {
        // Xử lý các tài liệu bình thường (PDF, Doc, Drive)
        const timer = setTimeout(() => {
          setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
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

  const isWeb = isWebPage(doc.file_url);
  const embedUrl = !isWeb ? getEmbedUrl(doc.file_url) : "";

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
                        <i className={isWeb ? "fas fa-globe text-blue-500" : (doc.title.toLowerCase().includes('.doc') ? "fas fa-file-word text-blue-600" : "fas fa-file-pdf text-[#E63946]")}></i>
                        <span>{doc.title}</span>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="font-mono text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center">
                        <i className="fas fa-eye text-[#E63946] mr-1"></i> <span>{doc.views?.toLocaleString() || 0}</span>
                    </div>
                    {/* Nút Tải xuống (Chỉ hiện cho file thường) */}
                    {!isWeb && (
                      <a 
                        href={doc.file_url.includes('drive.google.com') ? doc.file_url : `${doc.file_url}?download=`} 
                        target="_blank" rel="noopener noreferrer"
                        className="bg-[#E63946] hover:bg-red-700 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm ml-4"
                        title="Tải xuống"
                      >
                          <i className="fas fa-download text-lg"></i>
                      </a>
                    )}
                    {isWeb && (
                      <a 
                        href={doc.file_url} 
                        target="_blank" rel="noopener noreferrer"
                        className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm ml-4"
                        title="Mở trong tab mới"
                      >
                          <i className="fas fa-external-link-alt text-lg"></i>
                      </a>
                    )}
                    {/* Nút X to hơn */}
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors focus:outline-none ml-2" title="Đóng (Esc)">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>

            {/* Body Modal */}
            <div className="flex-grow bg-[#EAECEE] relative w-full h-full">
                {!isWeb ? (
                  <iframe className="w-full h-full bg-white border-none" src={loading ? "" : embedUrl} frameBorder="0" allowFullScreen></iframe>
                ) : (
                  <iframe className="w-full h-full bg-white border-none" srcDoc={loading ? "" : htmlContent} frameBorder="0" allowFullScreen></iframe>
                )}
                
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 font-mono text-[#E63946]">
                        <i className="fas fa-cog fa-spin text-5xl mb-4"></i>
                        <span className="text-base font-bold tracking-widest uppercase">Đang tải tài liệu...</span>
                    </div>
                )}
            </div>
            
        </div>
    </div>
  );
}

