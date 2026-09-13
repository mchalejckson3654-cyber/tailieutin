import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import DocumentCard from './components/DocumentCard'
import DocumentViewerModal from './components/DocumentViewerModal'
import UploadDocumentModal from './components/UploadDocumentModal'
import { supabase } from './lib/supabase'

function App() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDocument = async (doc) => {
    // 1. Mở modal ngay
    setSelectedDoc(doc)
    
    // Cập nhật views locally để mượt
    setDocuments(prevDocs => 
      prevDocs.map(d => 
        d.id === doc.id ? { ...d, views: d.views + 1 } : d
      )
    )

    // Cập nhật current view trong modal
    setSelectedDoc(prev => ({...prev, views: prev.views + 1}))

    // Highlight class text-green-500 effect
    const viewEl = document.getElementById(`view-count-${doc.id}`)
    if(viewEl) {
      viewEl.classList.remove('text-[#E63946]')
      viewEl.classList.add('text-green-500')
      setTimeout(() => {
        viewEl.classList.remove('text-green-500')
        viewEl.classList.add('text-[#E63946]')
      }, 800)
    }

    // 2. Tăng view count trên Supabase RPC
    try {
      const { error } = await supabase.rpc('increment_view_count', { doc_id: doc.id })
      if (error) {
        console.error('Error incrementing view:', error)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUploadSuccess = (newDoc) => {
    // Thêm tài liệu mới vào đầu danh sách
    setDocuments(prev => [newDoc, ...prev]);
  }

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return doc.title.toLowerCase().includes(lowerQuery) || doc.category.toLowerCase().includes(lowerQuery);
  })

  return (
    <div className="text-slate-900 min-h-screen flex flex-col font-sans relative">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-red-100 text-[#E63946] font-mono text-xs font-bold mb-3 border border-red-200">
                      <i className="fas fa-code-branch mr-1"></i> V2.0.26 UPDATE
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                      Kho Tài Liệu <span className="text-[#E63946] relative inline-block">Tin Học<svg className="absolute w-full h-3 -bottom-1 left-0 text-red-200" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/></svg></span>
                  </h1>
                  <p className="text-slate-500 font-medium mt-3">Khám phá, đọc và tải tài liệu chuyên ngành CNTT mới nhất.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  <div className="flex items-center text-sm font-mono text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                      <i className="fas fa-database text-[#E63946] mr-2"></i> <span className="mx-1 font-bold">{filteredDocuments.length}</span> Documents
                  </div>
                  
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="bg-[#E63946] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-cloud-upload-alt"></i> Đăng tài liệu
                  </button>
              </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <i className="fas fa-circle-notch fa-spin text-4xl text-[#E63946]"></i>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-folder-open text-6xl text-slate-300 mb-4"></i>
              <p className="text-slate-500 font-medium">Không tìm thấy tài liệu nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDocuments.map((doc, index) => (
                  <DocumentCard key={doc.id} doc={doc} onOpen={handleOpenDocument} delayIndex={index} />
                ))}
            </div>
          )}

      </main>

      <Footer />

      <DocumentViewerModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      
      {showUploadModal && (
        <UploadDocumentModal 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={handleUploadSuccess} 
        />
      )}
    </div>
  )
}

export default App
