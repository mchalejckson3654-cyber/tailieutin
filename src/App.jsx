import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import DocumentCard from './components/DocumentCard'
import DocumentViewerModal from './components/DocumentViewerModal'
import UploadDocumentModal from './components/UploadDocumentModal'
import { supabase } from './lib/supabase'

function App() {
  const [documents, setDocuments] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState(null)
  
  // States for new features
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  
  const [fetchError, setFetchError] = useState(null)
  
  // State for creating folder
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      setFetchError(null)
      const [docRes, folderRes] = await Promise.all([
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('folders').select('*').order('name', { ascending: true })
      ])
      
      if (docRes.error) throw docRes.error
      if (folderRes.error) throw folderRes.error

      setDocuments(docRes.data || [])
      setFolders(folderRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setFetchError(error.message || JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDocument = (doc) => {
    setSelectedDoc(doc)
    // Tăng view ngầm bằng RPC
    supabase.rpc('increment_view_count', { doc_id: doc.id }).then(() => {
      // Cập nhật state local
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, views: d.views + 1 } : d))
    })
  }

  const handleCloseDocument = () => {
    setSelectedDoc(null)
  }

  const handleUploadSuccess = (newDoc) => {
    setDocuments(prev => [newDoc, ...prev])
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName.trim(), parent_id: currentFolderId || null }])
        .select()
      
      if (error) throw error
      setFolders(prev => [...prev, data[0]].sort((a,b) => a.name.localeCompare(b.name)))
      setNewFolderName('')
      setShowNewFolderInput(false)
    } catch (err) {
      console.error(err)
      alert("Lỗi khi tạo thư mục")
    }
  }

  // Breadcrumbs
  const getBreadcrumbs = () => {
    let crumbs = []
    let curr = currentFolderId
    while (curr) {
      const f = folders.find(f => f.id === curr)
      if (f) {
        crumbs.unshift(f)
        curr = f.parent_id
      } else break
    }
    return crumbs
  }

  // Lọc hiển thị (Dựa theo search hoặc folder hiện tại)
  const visibleFolders = folders.filter(f => {
    if (searchQuery) return f.name.toLowerCase().includes(searchQuery.toLowerCase())
    return (f.parent_id === currentFolderId) || (!f.parent_id && !currentFolderId)
  })

  const visibleDocuments = documents.filter(doc => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      return doc.title.toLowerCase().includes(lowerQuery) || doc.category.toLowerCase().includes(lowerQuery)
    }
    return (doc.folder_id === currentFolderId) || (!doc.folder_id && !currentFolderId)
  })

  return (
    <div className="text-slate-900 min-h-screen flex flex-col font-sans relative">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          
          {/* Breadcrumbs & Controls */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex items-center gap-2 text-lg font-bold">
                 <button onClick={() => setCurrentFolderId(null)} className="text-[#E63946] hover:underline cursor-pointer">
                   <i className="fas fa-home"></i> Home
                 </button>
                 {getBreadcrumbs().map((crumb, idx) => (
                   <React.Fragment key={crumb.id}>
                     <span className="text-slate-400">/</span>
                     <button 
                       onClick={() => setCurrentFolderId(crumb.id)}
                       className="text-slate-700 hover:text-[#E63946] hover:underline cursor-pointer transition-colors"
                     >
                       {crumb.name}
                     </button>
                   </React.Fragment>
                 ))}
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button 
                      onClick={() => setViewMode('grid')} 
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${viewMode==='grid' ? 'bg-white shadow text-[#E63946]' : 'text-slate-500 hover:bg-slate-200'}`}
                      title="Large icons"
                    >
                      <i className="fas fa-th-large"></i>
                    </button>
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${viewMode==='list' ? 'bg-white shadow text-[#E63946]' : 'text-slate-500 hover:bg-slate-200'}`}
                      title="Details list"
                    >
                      <i className="fas fa-list"></i>
                    </button>
                  </div>

                  <button 
                    onClick={() => { setShowNewFolderInput(true); setTimeout(() => document.getElementById('folderNameInput')?.focus(), 100) }}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-folder-plus text-[#E63946]"></i> Tạo thư mục
                  </button>

                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="bg-[#E63946] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-cloud-upload-alt"></i> Đăng tài liệu
                  </button>
              </div>
          </div>

          {showNewFolderInput && (
            <form onSubmit={handleCreateFolder} className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-3">
              <i className="fas fa-folder text-[#E63946] text-xl"></i>
              <input 
                id="folderNameInput"
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Tên thư mục mới..."
                className="flex-grow px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#E63946]"
              />
              <button type="submit" className="bg-[#E63946] text-white px-4 py-1.5 rounded font-bold hover:bg-red-700 text-sm">Lưu</button>
              <button type="button" onClick={() => setShowNewFolderInput(false)} className="bg-slate-200 text-slate-700 px-4 py-1.5 rounded font-bold hover:bg-slate-300 text-sm">Hủy</button>
            </form>
          )}

          {fetchError ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center my-10">
              <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
              <h3 className="text-lg font-bold mb-2">Lỗi kết nối CSDL Supabase</h3>
              <p className="text-sm font-mono bg-white p-3 rounded border border-red-100 inline-block text-left">{fetchError}</p>
              <p className="text-sm mt-4">Vui lòng chạy lại file `supabase_setup.sql` trong Supabase SQL Editor.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-20">
              <i className="fas fa-circle-notch fa-spin text-4xl text-[#E63946]"></i>
            </div>
          ) : visibleDocuments.length === 0 && visibleFolders.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-folder-open text-6xl text-slate-300 mb-4"></i>
              <p className="text-slate-500 font-medium">Thư mục trống.</p>
            </div>
          ) : (
            <>
              {/* === VIEW MODE: GRID === */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Render Folders */}
                  {visibleFolders.map((folder) => (
                    <div 
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] border border-slate-200 tech-card-hover transition-all duration-300 flex flex-col h-full group cursor-pointer"
                    >
                      {/* Top icon area (like cover image) */}
                      <div className="h-56 w-full bg-slate-50 flex items-center justify-center border-b border-slate-200 group-hover:bg-[#E63946]/5 transition-colors">
                        <i className="fas fa-folder text-[80px] text-[#E63946]/80 group-hover:text-[#E63946] group-hover:scale-110 transition-all duration-300 drop-shadow-sm"></i>
                      </div>
                      
                      {/* Bottom content area */}
                      <div className="p-5 flex flex-col flex-grow bg-white">
                        <h3 className="text-base font-bold text-slate-900 mb-3 line-clamp-2 leading-snug group-hover:text-[#E63946] transition-colors" title={folder.name}>
                          {folder.name}
                        </h3>
                        
                        <div className="mt-auto">
                           <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-mono">
                             <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                               <i className="far fa-calendar-alt"></i>
                               <span>{new Date(folder.created_at).toLocaleDateString('vi-VN')}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                               <i className="far fa-clock"></i>
                               <span>{new Date(folder.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                           </div>
                           
                           <button className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-2">
                             MỞ THƯ MỤC <i className="fas fa-arrow-right text-xs"></i>
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Render Documents */}
                  {visibleDocuments.map((doc, index) => (
                    <DocumentCard key={doc.id} doc={doc} onOpen={handleOpenDocument} delayIndex={index} />
                  ))}
                </div>
              )}

              {/* === VIEW MODE: LIST === */}
              {viewMode === 'list' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                      <tr>
                        <th className="px-6 py-4 w-2/3">Tên</th>
                        <th className="px-6 py-4 hidden sm:table-cell">Lượt xem</th>
                        <th className="px-6 py-4 hidden md:table-cell">Ngày đăng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Folders in List */}
                      {visibleFolders.map(folder => (
                        <tr 
                          key={folder.id} 
                          onClick={() => setCurrentFolderId(folder.id)}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <i className="fas fa-folder text-xl text-[#E63946]/80"></i>
                            <span className="font-bold text-slate-700">{folder.name}</span>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">-</td>
                          <td className="px-6 py-4 hidden md:table-cell">{new Date(folder.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}

                      {/* Documents in List */}
                      {visibleDocuments.map(doc => (
                        <tr 
                          key={doc.id} 
                          onClick={() => handleOpenDocument(doc)}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-10 shrink-0 bg-slate-200 rounded overflow-hidden">
                               <img src={doc.cover_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <span className="font-bold text-slate-700 line-clamp-1">{doc.title}</span>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell"><i className="fas fa-eye text-slate-400 mr-1"></i> {doc.views}</td>
                          <td className="px-6 py-4 hidden md:table-cell">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

      </main>

      <Footer />

      {selectedDoc && (
        <DocumentViewerModal doc={selectedDoc} onClose={handleCloseDocument} />
      )}

      {showUploadModal && (
        <UploadDocumentModal onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} currentFolderId={currentFolderId} />
      )}
    </div>
  )
}

export default App
