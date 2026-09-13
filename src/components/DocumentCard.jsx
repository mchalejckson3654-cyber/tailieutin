import React from 'react';

export default function DocumentCard({ doc, onOpen, delayIndex }) {
  const delay = delayIndex * 0.05;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] border border-slate-200 tech-card-hover transition-all duration-300 flex flex-col h-full group fade-up relative"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* 1. Bìa */}
      <div className="relative h-56 w-full bg-slate-900 overflow-hidden cursor-pointer border-b border-slate-200" onClick={() => onOpen(doc)}>
        <img
          src={doc.cover_url?.includes('placehold.co') ? (doc.title.toLowerCase().includes('.doc') ? '/word-cover.svg' : '/pdf-cover.svg') : doc.cover_url}
          alt={doc.title}
          className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.onerror = null;
            // Dùng ảnh mặc định nếu file ảnh bị lỗi
            e.target.src = doc.title.toLowerCase().includes('.doc') ? '/word-cover.svg' : '/pdf-cover.svg';
          }}
        />



        {/* Badge Category (Monospace) */}
        <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700 text-white px-2 py-1 rounded text-[10px] font-mono font-bold shadow-sm">
          <i className="fas fa-tag text-[#E63946] mr-1"></i>{doc.category}
        </span>


      </div>

      {/* Nội dung dưới */}
      <div className="p-5 flex flex-col flex-grow bg-white relative z-10">
        {/* 2. Tên tài liệu */}
        <h3 className="text-base font-bold text-slate-900 mb-3 line-clamp-2 leading-snug cursor-pointer group-hover:text-[#E63946] transition-colors" onClick={() => onOpen(doc)} title={doc.title}>
          {doc.title}
        </h3>

        <div className="mt-auto">
          {/* 4. Số người xem (Tech Style) */}
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-xs text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              <i className="fas fa-terminal text-slate-400"></i>
              <span className="truncate max-w-[80px]">ID: {doc.id?.substring(0, 8)}</span>
            </div>
            <div className="font-mono text-xs font-bold text-[#E63946] flex items-center gap-1.5 transition-colors duration-500" id={`view-count-${doc.id}`}>
              <i className="fas fa-chart-line"></i>
              <span>{doc.views?.toLocaleString() || 0}</span> views
            </div>
          </div>

          {/* 3. Nút đọc (Màu đỏ nổi bật) */}
          <button onClick={() => onOpen(doc)} className="w-full bg-[#E63946] hover:bg-red-700 text-white font-mono font-bold py-3 px-4 rounded-lg transition-all duration-200 text-sm shadow-[0_4px_12px_rgba(230,57,70,0.3)] hover:shadow-[0_6px_20px_rgba(230,57,70,0.4)] flex items-center justify-center gap-2 active:scale-95">
            <i className="fas fa-play text-xs"></i> ĐỌC NGAY
          </button>
        </div>
      </div>
    </div>
  );
}
