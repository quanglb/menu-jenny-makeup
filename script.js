// Auto scaler & Action handlers
document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('priceCard');
  const scaler = document.getElementById('scaler');
  const btnDownload = document.getElementById('btnDownload');
  const btnPrint = document.getElementById('btnPrint');
  const btnZoom = document.getElementById('btnZoom');
  const zoomText = document.getElementById('zoomText');

  let isFitToScreen = true;

  function resizeCard() {
    if (!scaler) return;
    
    // On mobile devices (<= 600px width), rely on native fluid CSS layout
    if (window.innerWidth <= 600) {
      scaler.style.transform = 'none';
      scaler.style.width = '100%';
      scaler.style.height = 'auto';
      return;
    }

    if (!isFitToScreen) {
      scaler.style.transform = 'scale(1)';
      scaler.style.width = 'auto';
      scaler.style.height = 'auto';
      return;
    }

    const availableHeight = window.innerHeight - 80; // toolbar offset
    const availableWidth = window.innerWidth - 32;

    const baseWidth = 540;
    const baseHeight = 960;

    const scaleY = availableHeight / baseHeight;
    const scaleX = availableWidth / baseWidth;
    const scale = Math.min(scaleX, scaleY, 1.15);

    scaler.style.transform = `scale(${Math.max(scale, 0.35)})`;
    scaler.style.transformOrigin = 'center top';
    
    scaler.style.width = `${baseWidth}px`;
    scaler.style.height = `${baseHeight}px`;
  }

  window.addEventListener('resize', resizeCard);
  resizeCard();

  // Toggle Zoom
  if (btnZoom) {
    btnZoom.addEventListener('click', () => {
      isFitToScreen = !isFitToScreen;
      if (isFitToScreen) {
        zoomText.textContent = 'Kích thước gốc';
        resizeCard();
      } else {
        zoomText.textContent = 'Vừa màn hình';
        resizeCard();
      }
    });
  }

  // Print
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Helper: Ensure html2canvas is loaded
  async function ensureHtml2Canvas() {
    if (typeof window.html2canvas !== 'undefined') return true;
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  // Helper: Download fallback via dataURL
  function downloadDataUrl(canvas, fileName) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Download High-Res Image (1080x1920 HD 9:16)
  if (btnDownload && card) {
    btnDownload.addEventListener('click', async () => {
      const originalHtml = btnDownload.innerHTML;
      btnDownload.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>Đang xuất ảnh HD...</span>
      `;
      btnDownload.disabled = true;

      try {
        const isLoaded = await ensureHtml2Canvas();
        if (!isLoaded || typeof html2canvas === 'undefined') {
          throw new Error('Thư viện tạo ảnh chưa được tải. Vui lòng kiểm tra lại kết nối!');
        }

        // Wait for all custom Google Fonts to load
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }

        const isCoursePage = card.classList.contains('course-card');
        const fileName = isCoursePage 
          ? 'JennyMakeup-KhoaHoc-1vs1-9x16.png' 
          : 'JennyMakeup-PriceList-9x16.png';

        // Temporarily reset zoom/scale on scaler for pristine 1080x1920 capture
        const originalTransform = scaler ? scaler.style.transform : '';
        if (scaler) {
          scaler.style.transform = 'none';
        }

        const canvas = await html2canvas(card, {
          scale: 2, // 540x960 * 2 = 1080x1920 Full HD
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#f2eae2',
          logging: false
        });

        // Restore transform
        if (scaler) {
          scaler.style.transform = originalTransform;
        }

        // Trigger Download using Blob URL for maximum browser compatibility
        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            if (!blob) {
              downloadDataUrl(canvas, fileName);
              return;
            }
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
          }, 'image/png', 1.0);
        } else {
          downloadDataUrl(canvas, fileName);
        }

        // Quick success feedback
        btnDownload.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Đã lưu ảnh!</span>
        `;
        setTimeout(() => {
          btnDownload.innerHTML = originalHtml;
          btnDownload.disabled = false;
        }, 2000);

      } catch (err) {
        console.error('Lỗi khi xuất ảnh:', err);
        alert('Không thể tạo file ảnh: ' + (err.message || err) + '\nBạn có thể dùng tính năng In/Lưu PDF!');
        btnDownload.innerHTML = originalHtml;
        btnDownload.disabled = false;
      }
    });
  }
});
