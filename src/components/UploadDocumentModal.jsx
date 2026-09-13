import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function UploadDocumentModal({ onClose, onSuccess, currentFolderId }) {
  const [uploadMode, setUploadMode] = useState('drive'); // 'drive' | 'files' | 'folder'
  
  // State Drive
  const [formData, setFormData] = useState({ title: '', category: 'Tài liệu', file_url: '', cover_url: '' });

  // State Local (Files & Folders)
  const [selectedFiles, setSelectedFiles] = useState([]); // { file, status, error }
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Tự động lấy ảnh bìa từ link Google Drive
  useEffect(() => {
    if (uploadMode === 'drive' && formData.file_url) {
      const match = formData.file_url.match(/\/d\/([a-zA-Z0-9_-]+)/) || formData.file_url.match(/id=([a-zA-Z0-9_-]+)/) || formData.file_url.match(/[-\w]{25,}/);
      if (match && (match[1] || match[0])) {
        const fileId = match[1] || match[0];
        const generatedCover = `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
        if (formData.cover_url !== generatedCover) {
          setFormData(prev => ({ ...prev, cover_url: generatedCover }));
        }
      }
    }
  }, [formData.file_url, uploadMode]);

  const handleDriveChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const processFiles = (files) => {
    if (files.length === 0) return;
    
    const newFiles = files.filter(f => f.name.match(/\.(pdf|doc|docx)$/i)).map(file => ({
      file,
      status: 'pending', // pending, uploading, success, error
      error: null
    }));

    if (newFiles.length === 0) {
      setGlobalError('Chỉ hỗ trợ file định dạng PDF hoặc Word (.doc, .docx).');
      return;
    }

    setGlobalError('');
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFilesSelected = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = ''; // reset input
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isSubmitting || uploadMode === 'drive') return;

    const items = e.dataTransfer.items;
    if (!items) return;

    const allFiles = [];

    const readAllEntries = async (dirReader) => {
      let entries = [];
      let readEntries = await new Promise(resolve => dirReader.readEntries(resolve));
      while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await new Promise(resolve => dirReader.readEntries(resolve));
      }
      return entries;
    };

    const traverseFileTree = async (item, path = '') => {
      if (item.isFile) {
        const file = await new Promise((resolve) => item.file(resolve));
        // Fake webkitRelativePath for folder structure logic
        Object.defineProperty(file, 'webkitRelativePath', {
          value: path + file.name,
          writable: false
        });
        allFiles.push(file);
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const entries = await readAllEntries(dirReader);
        for (let i = 0; i < entries.length; i++) {
          await traverseFileTree(entries[i], path + item.name + '/');
        }
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        await traverseFileTree(item);
      }
    }

    processFiles(allFiles);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Cache thư mục để tránh tạo trùng khi tải thư mục
  const folderCacheRef = useRef({ '': currentFolderId });

  const getFolderIdRecursive = async (pathParts) => {
    let parent = currentFolderId;
    let currentPath = '';
    
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (folderCacheRef.current[currentPath] !== undefined) {
        parent = folderCacheRef.current[currentPath];
      } else {
        const { data: existing } = await supabase
          .from('folders')
          .select('id')
          .eq('name', part)
          .eq('parent_id', parent || null)
          .maybeSingle();
        
        if (existing) {
          parent = existing.id;
        } else {
          const { data: newFolder } = await supabase
            .from('folders')
            .insert([{ name: part, parent_id: parent || null }])
            .select().single();
          parent = newFolder?.id || null;
        }
        folderCacheRef.current[currentPath] = parent;
      }
    }
    return parent;
  };

  const updateFileState = (index, updates) => {
    setSelectedFiles(prev => {
      const nw = [...prev];
      nw[index] = { ...nw[index], ...updates };
      return nw;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (uploadMode === 'drive') {
      setIsSubmitting(true);
      setGlobalError('');
      try {
        let finalCoverUrl = formData.cover_url || '/pdf-cover.svg';
        const { data, error } = await supabase.from('documents').insert([{
          title: formData.title,
          category: 'Tài liệu',
          file_url: formData.file_url,
          cover_url: finalCoverUrl,
          views: 0,
          folder_id: currentFolderId || null
        }]).select();

        if (error) throw error;
        onSuccess(data[0]); 
        onClose();
      } catch (err) {
        setGlobalError(err.message || 'Lỗi đăng tài liệu.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Chế độ Tải nhiều file hoặc Thư mục
    if (selectedFiles.length === 0) {
      setGlobalError('Vui lòng chọn ít nhất 1 file.');
      return;
    }

    setIsSubmitting(true);
    setGlobalError('');
    folderCacheRef.current = { '': currentFolderId }; // Reset cache

    let hasError = false;
    let anySuccess = false;

    // Xử lý tuần tự từng file để không làm sập mạng hoặc trình duyệt
    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      if (item.status === 'success') continue;

      updateFileState(i, { status: 'uploading', error: null });

      try {
        const file = item.file;
        const isWord = file.name.match(/\.(doc|docx)$/i);
        
        // 1. Tìm hoặc tạo Folder ID (Nếu tải cả thư mục)
        let targetFolderId = currentFolderId;
        if (uploadMode === 'folder' && file.webkitRelativePath) {
          const pathParts = file.webkitRelativePath.split('/');
          pathParts.pop(); // Bỏ tên file, lấy các thư mục
          if (pathParts.length > 0) {
            targetFolderId = await getFolderIdRecursive(pathParts);
          }
        }

        // 2. Upload file PDF/Word lên Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `docs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents_bucket')
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl: fileUrl } } = supabase.storage.from('documents_bucket').getPublicUrl(filePath);

        // 3. Ảnh bìa mặc định (để tải nhanh hàng loạt, dùng ảnh mặc định)
        const coverUrl = isWord 
          ? '/word-cover.svg' 
          : '/pdf-cover.svg';

        // 4. Lưu vào Database
        const title = file.name.replace(/\.(pdf|doc|docx)$/i, '');
        const { data, error: insertError } = await supabase.from('documents').insert([{
          title: title,
          category: 'Tài liệu',
          file_url: fileUrl,
          cover_url: coverUrl,
          views: 0,
          folder_id: targetFolderId || null
        }]).select();

        if (insertError) throw insertError;

        updateFileState(i, { status: 'success' });
        anySuccess = true;
        onSuccess(data[0]); // Bắn sự kiện lên App.jsx để hiện ngay lập tức
      } catch (err) {
        updateFileState(i, { status: 'error', error: err.message });
        hasError = true;
      }
    }

    setIsSubmitting(false);
    
    // Nếu tải xong hết không lỗi thì tự đóng modal
    if (!hasError && anySuccess) {
      setTimeout(() => onClose(), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 p-4 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] modal-enter-active border border-slate-200">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i className="fas fa-cloud-upload-alt text-[#E63946]"></i>
            Đăng Tài Liệu
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none disabled:opacity-50">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 shrink-0 bg-white">
          <button 
            type="button"
            className={`flex-1 py-3 text-sm font-bold transition-colors ${uploadMode === 'drive' ? 'text-[#E63946] border-b-2 border-[#E63946]' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setUploadMode('drive')}
            disabled={isSubmitting}
          >
            <i className="fab fa-google-drive mr-2"></i> Link Google Drive
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 text-sm font-bold transition-colors ${uploadMode === 'files' ? 'text-[#E63946] border-b-2 border-[#E63946]' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setUploadMode('files')}
            disabled={isSubmitting}
          >
            <i className="fas fa-file-alt mr-2"></i> Tải nhiều File
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 text-sm font-bold transition-colors ${uploadMode === 'folder' ? 'text-[#E63946] border-b-2 border-[#E63946]' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setUploadMode('folder')}
            disabled={isSubmitting}
          >
            <i className="fas fa-folder-open mr-2"></i> Tải nguyên Thư mục
          </button>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className={`flex flex-col flex-1 overflow-hidden bg-[#F8FAFC] transition-colors relative ${isDragging && uploadMode !== 'drive' ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          
          {isDragging && uploadMode !== 'drive' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-blue-50/90 backdrop-blur-sm pointer-events-none">
              <i className="fas fa-cloud-download-alt text-6xl text-blue-500 mb-4 animate-bounce"></i>
              <p className="text-xl font-bold text-blue-600">Thả file hoặc thư mục vào đây</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-0">
            {globalError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center">
                <i className="fas fa-exclamation-circle mr-2 text-lg"></i> {globalError}
              </div>
            )}
            
            {uploadMode === 'drive' && (
              <div className="space-y-4 max-w-lg mx-auto mt-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tên tài liệu <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="title" required value={formData.title} onChange={handleDriveChange}
                    placeholder="Ví dụ: C++ Masterclass"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#E63946]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Link Google Drive (PDF/Word) <span className="text-red-500">*</span></label>
                  <input 
                    type="url" name="file_url" required value={formData.file_url} onChange={handleDriveChange}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#E63946] font-mono text-sm"
                  />
                </div>
                {formData.cover_url && (
                    <div className="mt-4 flex flex-col items-center">
                       <p className="text-xs font-bold text-slate-500 mb-2">Ảnh bìa trích xuất tự động</p>
                       <img src={formData.cover_url} referrerPolicy="no-referrer" className="h-40 object-contain rounded shadow border border-slate-200 bg-slate-200" alt="Preview" />
                    </div>
                )}
              </div>
            )}

            {(uploadMode === 'files' || uploadMode === 'folder') && (
              <div className="flex flex-col h-full">
                {/* Inputs Ẩn */}
                <input 
                  type="file" multiple accept=".pdf,.doc,.docx"
                  ref={fileInputRef} className="hidden"
                  onChange={handleFilesSelected}
                />
                <input 
                  type="file" webkitdirectory="" directory="" multiple
                  ref={folderInputRef} className="hidden"
                  onChange={handleFilesSelected}
                />

                <div className="flex justify-center gap-4 mb-4">
                   {uploadMode === 'files' && (
                     <button type="button" onClick={() => fileInputRef.current.click()} disabled={isSubmitting} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                       <i className="fas fa-plus mr-2"></i> Chọn thêm File
                     </button>
                   )}
                   {uploadMode === 'folder' && (
                     <button type="button" onClick={() => folderInputRef.current.click()} disabled={isSubmitting} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                       <i className="fas fa-folder-plus mr-2"></i> Chọn Thư mục từ máy tính
                     </button>
                   )}
                </div>

                <div className="text-center mb-2">
                  <span className="text-xs font-bold text-slate-400">Hoặc kéo thả trực tiếp File / Thư mục vào khu vực này</span>
                </div>

                {/* Danh sách file dạng cuộn */}
                <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[250px]">
                   <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 flex justify-between">
                      <span>DANH SÁCH FILE ({selectedFiles.length})</span>
                      {selectedFiles.length > 0 && !isSubmitting && (
                        <button type="button" onClick={() => setSelectedFiles([])} className="text-red-500 hover:underline">Xóa tất cả</button>
                      )}
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-2">
                      {selectedFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                          <i className={uploadMode === 'folder' ? "fas fa-folder-open text-5xl mb-3" : "fas fa-file-upload text-5xl mb-3"}></i>
                          <p className="text-sm">Chưa chọn {uploadMode === 'folder' ? 'thư mục' : 'file'} nào.</p>
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {selectedFiles.map((item, index) => {
                            const isPDF = item.file.name.match(/\.pdf$/i);
                            const iconClass = isPDF ? "fas fa-file-pdf text-[#E63946]" : "fas fa-file-word text-blue-600";
                            const displayName = item.file.webkitRelativePath ? item.file.webkitRelativePath : item.file.name;
                            
                            return (
                              <li key={index} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <i className={`${iconClass} text-xl w-6 text-center`}></i>
                                  <span className="text-sm text-slate-700 font-medium truncate" title={displayName}>{displayName}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                  {/* Status */}
                                  <div className="text-xs font-bold w-28 text-right">
                                    {item.status === 'pending' && <span className="text-slate-400">Đang chờ</span>}
                                    {item.status === 'uploading' && <span className="text-blue-500"><i className="fas fa-circle-notch fa-spin"></i> Đang tải</span>}
                                    {item.status === 'success' && <span className="text-green-500"><i className="fas fa-check"></i> Xong</span>}
                                    {item.status === 'error' && <span className="text-red-500" title={item.error}><i className="fas fa-exclamation-triangle"></i> Lỗi</span>}
                                  </div>
                                  {/* Delete Button */}
                                  {!isSubmitting && (
                                    <button type="button" onClick={() => removeFile(index)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <i className="fas fa-times"></i>
                                    </button>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button 
              type="button" onClick={onClose} disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Đóng
            </button>
            <button 
              type="submit" disabled={isSubmitting || (uploadMode !== 'drive' && selectedFiles.length === 0)}
              className="px-6 py-2 text-sm font-bold text-white bg-[#E63946] hover:bg-red-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Đang xử lý...</>
              ) : (
                <><i className="fas fa-cloud-upload-alt"></i> Tải lên ngay</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
