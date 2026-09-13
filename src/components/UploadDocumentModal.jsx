import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function UploadDocumentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Tài liệu',
    file_url: '',
    cover_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tự động lấy ảnh bìa từ link Google Drive
  useEffect(() => {
    if (formData.file_url) {
      // Tìm chuỗi ID chuẩn của Google Drive (ưu tiên file/d/ hoặc id=)
      const match = formData.file_url.match(/\/d\/([a-zA-Z0-9_-]+)/) || formData.file_url.match(/id=([a-zA-Z0-9_-]+)/) || formData.file_url.match(/[-\w]{25,}/);
      if (match && (match[1] || match[0])) {
        const fileId = match[1] || match[0];
        const generatedCover = `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
        if (formData.cover_url !== generatedCover) {
          setFormData(prev => ({ ...prev, cover_url: generatedCover }));
        }
      }
    }
  }, [formData.file_url]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert([
          {
            title: formData.title,
            category: formData.category,
            file_url: formData.file_url,
            cover_url: formData.cover_url || `https://placehold.co/400x550/0F172A/E63946?text=${encodeURIComponent(formData.category)}&font=Source+Code+Pro`,
            views: 0
          }
        ])
        .select();

      if (insertError) throw insertError;
      
      onSuccess(data[0]); // Gọi callback thành công
      onClose(); // Đóng modal
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi đăng tài liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 p-4 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl flex flex-col modal-enter-active border border-slate-200 relative">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i className="fas fa-cloud-upload-alt text-[#E63946]"></i>
            Đăng Tài Liệu Mới
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col md:flex-row gap-6 bg-[#F8FAFC]">
          
          {/* Cột trái: Form nhập liệu */}
          <div className="flex-1 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                <i className="fas fa-exclamation-circle mr-2"></i> {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tên tài liệu <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: C++ Masterclass"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-sm"
              />
            </div>



            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Link Google Drive (PDF) <span className="text-red-500">*</span></label>
              <input 
                type="url" 
                name="file_url"
                required
                value={formData.file_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-sm font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">Đảm bảo link Drive đã được bật "Bất kỳ ai có liên kết".</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Link Ảnh Bìa (Tự động tạo)</label>
              <input 
                type="url" 
                name="cover_url"
                value={formData.cover_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-sm font-mono bg-slate-50"
              />
            </div>
          </div>

          {/* Cột phải: Preview Ảnh Bìa */}
          <div className="w-full md:w-48 shrink-0 flex flex-col items-center">
             <label className="block text-sm font-bold text-slate-700 mb-2 self-start w-full text-center">Preview Ảnh Bìa</label>
             <div className="w-40 h-56 bg-slate-200 rounded overflow-hidden border border-slate-300 flex items-center justify-center relative shadow-sm">
                {formData.cover_url ? (
                  <img 
                    src={formData.cover_url} 
                    alt="Cover Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = `https://placehold.co/400x550/0F172A/E63946?text=PDF\\nFile&font=Source+Code+Pro`;
                    }}
                  />
                ) : (
                  <div className="text-slate-400 text-center px-4">
                    <i className="fas fa-image text-3xl mb-2"></i>
                    <p className="text-xs">Chưa có ảnh</p>
                  </div>
                )}
             </div>
          </div>
          
        </form>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-bold text-white bg-[#E63946] hover:bg-red-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><i className="fas fa-circle-notch fa-spin"></i> Đang xử lý...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> Đăng tài liệu</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
