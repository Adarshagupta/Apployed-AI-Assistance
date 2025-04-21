import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export document as PDF
 * @param {string} title - Document title
 * @param {string} content - Document content
 */
export const exportToPDF = async (title, content) => {
  try {
    // Create a temporary div to render the content
    const tempDiv = document.createElement('div');
    tempDiv.className = 'pdf-export-container';
    
    // Style the container for PDF export
    tempDiv.style.width = '595px'; // A4 width in pixels at 72 DPI
    tempDiv.style.padding = '40px';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.color = '#000';
    tempDiv.style.backgroundColor = '#fff';
    
    // Add title and content
    const titleElement = document.createElement('h1');
    titleElement.style.fontSize = '24px';
    titleElement.style.marginBottom = '20px';
    titleElement.style.fontWeight = 'bold';
    titleElement.textContent = title;
    
    const contentElement = document.createElement('div');
    contentElement.style.fontSize = '12px';
    contentElement.style.lineHeight = '1.5';
    
    // Convert newlines to paragraphs
    content.split('\n').forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      p.style.margin = '0 0 10px 0';
      contentElement.appendChild(p);
    });
    
    tempDiv.appendChild(titleElement);
    tempDiv.appendChild(contentElement);
    
    // Add to document temporarily (hidden)
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });
    
    // Convert the div to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
    });
    
    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // If content is too long, it might need multiple pages
    const pageCount = Math.ceil(tempDiv.offsetHeight / 842); // A4 height
    
    if (pageCount > 1) {
      for (let i = 1; i < pageCount; i++) {
        pdf.addPage();
        pdf.addImage(
          imgData, 
          'PNG', 
          0, 
          -(i * 842), // Offset for each page
          pdfWidth, 
          pdfHeight
        );
      }
    }
    
    // Save the PDF
    pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    
    // Clean up
    document.body.removeChild(tempDiv);
    
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

/**
 * Export document as DOCX
 * @param {string} title - Document title
 * @param {string} content - Document content
 */
export const exportToDOCX = (title, content) => {
  try {
    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 36, // 18pt
                }),
              ],
              spacing: {
                after: 400, // Space after title
              },
            }),
            ...content.split('\n').map(
              line =>
                new Paragraph({
                  children: [new TextRun(line)],
                  spacing: {
                    after: 200, // Space between paragraphs
                  },
                })
            ),
          ],
        },
      ],
    });
    
    // Generate and save document
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
    });
    
    return true;
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    throw error;
  }
};

/**
 * Export document as HTML
 * @param {string} title - Document title
 * @param {string} content - Document content
 */
export const exportToHTML = (title, content) => {
  try {
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #444;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          p {
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
      </body>
      </html>
    `;
    
    // Create blob and save
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to HTML:', error);
    throw error;
  }
};

/**
 * Export document as plain text
 * @param {string} title - Document title
 * @param {string} content - Document content
 */
export const exportToTXT = (title, content) => {
  try {
    // Create text content with title
    const textContent = `${title}\n\n${content}`;
    
    // Create blob and save
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to TXT:', error);
    throw error;
  }
};

export default {
  exportToPDF,
  exportToDOCX,
  exportToHTML,
  exportToTXT
};
