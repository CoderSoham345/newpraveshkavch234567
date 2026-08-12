import { jsPDF } from 'jspdf';

export interface PDFPageInput {
  title?: string;
  processedImage: string; // Base64 image data URL
}

export interface GeneratePDFResult {
  pdfDataUri: string;
  blob: Blob;
  blobUrl: string;
  pageCount: number;
  fileName: string;
}

export async function generateDocumentPDF(
  pages: PDFPageInput[],
  docTitle: string = 'Aadhaar_Card'
): Promise<GeneratePDFResult> {
  if (!pages || pages.length === 0) {
    throw new Error('At least one page is required to generate a PDF.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297 mm

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      doc.addPage();
    }

    const page = pages[i];
    const pageLabel = page.title || (i === 0 ? 'Front Side' : i === 1 ? 'Back Side' : `Page ${i + 1}`);

    // Draw header bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`PraveshKavach Identity Document Verification`, 12, 9);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`${docTitle.replace(/_/g, ' ')} — ${pageLabel}`, 12, 15);

    doc.setFontSize(8);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, pageWidth - 12, 15, { align: 'right' });

    // Render Cropped/Enhanced Image inside page boundaries
    const imgData = page.processedImage;
    
    try {
      const imgProps = await getImageProps(imgData);
      const maxW = pageWidth - 20; // 10mm padding on sides
      const maxH = pageHeight - 38; // Between top header and bottom footer

      let renderW = maxW;
      let renderH = (imgProps.height * renderW) / imgProps.width;

      if (renderH > maxH) {
        renderH = maxH;
        renderW = (imgProps.width * renderH) / imgProps.height;
      }

      const x = (pageWidth - renderW) / 2;
      const y = 24 + (maxH - renderH) / 2;

      const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(imgData, format, x, y, renderW, renderH);
    } catch (err) {
      console.error('[pdfGenerator] Error placing image on PDF page:', err);
    }

    // Draw Footer bar
    doc.setFillColor(241, 245, 249);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`PraveshKavach Multi-Page Document Scanner`, 12, pageHeight - 4);
    doc.text(`Page ${i + 1} of ${pages.length}`, pageWidth - 12, pageHeight - 4, { align: 'right' });
  }

  const sanitizedTitle = docTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `PraveshKavach_${sanitizedTitle}_${Date.now()}.pdf`;

  const pdfDataUri = doc.output('datauristring');
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    pdfDataUri,
    blob,
    blobUrl,
    pageCount: pages.length,
    fileName,
  };
}

function getImageProps(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
