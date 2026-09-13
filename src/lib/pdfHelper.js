import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình worker cho pdf.js (bắt buộc)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractPDFCover = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);
        
        // Load PDF
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        const pdf = await loadingTask.promise;
        
        // Lấy trang 1
        const page = await pdf.getPage(1);
        
        // Render ra canvas
        const viewport = page.getViewport({ scale: 1.5 }); // Độ nét 1.5x
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Chuyển thành ảnh DataURL (JPEG, 80% quality)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } catch (e) {
        console.error("Lỗi khi đọc PDF:", e);
        reject(e);
      }
    };
    
    fileReader.onerror = (e) => reject(e);
    fileReader.readAsArrayBuffer(file);
  });
};
