// Document Generation Service for ApploydClone
// Handles generating PDF, Excel, and Word documents

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import htmlToPdfmake from 'html-to-pdfmake';

// Import pdfMake and fonts in a way that works in the browser
let pdfMake;
let pdfFonts;

// Dynamically import pdfMake to avoid SSR issues
const loadPdfMake = async () => {
  if (!pdfMake) {
    pdfMake = (await import('pdfmake/build/pdfmake')).default;
    pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
  return pdfMake;
};

// Document types
export const DOCUMENT_TYPES = {
  PDF: 'pdf',
  EXCEL: 'excel',
  WORD: 'word'
};

/**
 * Generate a PDF document from text content
 * @param {string} content - The text content to include in the PDF
 * @param {string} title - The title of the PDF
 * @param {boolean} isHtml - Whether the content is HTML
 * @returns {Promise<Blob>} - The generated PDF as a Blob
 */
export const generatePDF = async (content, title = 'Generated Document', isHtml = false, isMarkdown = true) => {
  try {
    // Check for immersive content format
    const hasImmersiveContent = content.includes('</immersive>');

    // Check if content is likely Markdown and convert to plain text if needed
    let processedContent = content;
    if ((isMarkdown && !isHtml) || hasImmersiveContent) {
      // Convert Markdown to plain text for better PDF rendering
      processedContent = markdownToPlainText(content);
    }

    if (isHtml) {
      // Load pdfMake dynamically
      await loadPdfMake();

      // Use pdfMake for HTML content
      const htmlContent = htmlToPdfmake(content);

      const documentDefinition = {
        info: {
          title: title,
          author: 'Gemini',
          subject: 'Generated Document',
          keywords: 'gemini, document, pdf',
        },
        content: [
          { text: title, style: 'header' },
          { text: `Generated on ${new Date().toLocaleString()}`, style: 'subheader' },
          htmlContent
        ],
        styles: {
          header: {
            fontSize: 22,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 12,
            italics: true,
            margin: [0, 0, 0, 20],
            color: '#666666'
          }
        },
        defaultStyle: {
          fontSize: 12,
          lineHeight: 1.5
        }
      };

      return new Promise((resolve) => {
        const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
        pdfDocGenerator.getBlob((blob) => {
          resolve(blob);
        });
      });
    } else {
      // Use jsPDF for plain text
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text(title, 20, 20);

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 30);

      // Add content
      doc.setFontSize(12);

      // Split content into lines to handle text wrapping
      const textLines = doc.splitTextToSize(processedContent, 170);

      // Calculate needed pages based on content length
      const linesPerPage = 40; // Approximate lines per page
      const totalPages = Math.ceil(textLines.length / linesPerPage);

      // Add content across multiple pages if needed
      let yPosition = 40;
      let currentPage = 1;

      for (let i = 0; i < textLines.length; i++) {
        // Add a new page if we've reached the bottom of the current page
        if (yPosition > 280) {
          doc.addPage();
          currentPage++;
          yPosition = 20; // Reset Y position for new page
        }

        doc.text(textLines[i], 20, yPosition);
        yPosition += 7; // Line height
      }

      // Add page numbers
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${totalPages}`, 20, 290);
      }

      return doc.output('blob');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF document');
  }
};

/**
 * Generate an Excel document from data
 * @param {Array<Array<any>>} data - The data to include in the Excel document
 * @param {string} title - The title of the Excel document
 * @returns {Blob} - The generated Excel document as a Blob
 */
export const generateExcel = (data, title = 'Generated Spreadsheet') => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Add worksheet to workbook with the title as the sheet name
    const sheetName = title.length > 31 ? title.substring(0, 31) : title; // Excel has a 31 character limit for sheet names
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Convert buffer to Blob
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate Excel document');
  }
};

/**
 * Generate a Word document from content
 * @param {string} content - The text content to include in the Word document
 * @param {string} title - The title of the Word document
 * @param {boolean} isStructured - Whether the content is structured (e.g., has tables)
 * @param {Array<Array<any>>} tableData - Optional table data to include
 * @returns {Promise<Blob>} - The generated Word document as a Blob
 */
export const generateWord = async (content, title = 'Generated Document', isStructured = false, tableData = null) => {
  try {
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${new Date().toLocaleString()}`,
                italics: true,
                color: '666666',
              }),
            ],
          }),
          new Paragraph({
            text: '',
          }),
        ],
      }],
    });

    // Add content paragraphs
    const paragraphs = content.split('\n');
    paragraphs.forEach(para => {
      if (para.trim()) {
        doc.addSection({
          children: [
            new Paragraph({
              text: para,
            }),
          ],
        });
      }
    });

    // Add table if provided
    if (isStructured && tableData && tableData.length > 0) {
      const table = new Table({
        rows: tableData.map(row => {
          return new TableRow({
            children: row.map(cell => {
              return new TableCell({
                children: [new Paragraph(cell.toString())],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              });
            }),
          });
        }),
      });

      doc.addSection({
        children: [table],
      });
    }

    // Generate Word document
    return await Packer.toBlob(doc);
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw new Error('Failed to generate Word document');
  }
};

/**
 * Save a generated document to the user's device
 * @param {Blob} blob - The document as a Blob
 * @param {string} filename - The filename to save as
 */
export const saveDocument = (blob, filename) => {
  try {
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Append to the document
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error saving document:', error);

    // Fallback to saveAs if the above method fails
    try {
      saveAs(blob, filename);
    } catch (fallbackError) {
      console.error('Fallback save method also failed:', fallbackError);
      throw new Error('Failed to save document. Please try again.');
    }
  }
};

/**
 * Generate a document based on the specified type
 * @param {string} type - The document type (pdf, excel, word)
 * @param {string|Array} content - The content to include in the document
 * @param {string} title - The title of the document
 * @param {Object} options - Additional options for document generation
 * @returns {Promise<void>} - Resolves when the document is generated and saved
 */
export const generateDocument = async (type, content, title, options = {}) => {
  try {
    let blob;
    let filename;

    // Sanitize title for filename
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    switch (type.toLowerCase()) {
      case DOCUMENT_TYPES.PDF:
        blob = await generatePDF(
          content,
          title,
          options.isHtml || false,
          options.isMarkdown !== false // Default to true unless explicitly set to false
        );
        filename = `${sanitizedTitle}.pdf`;
        break;

      case DOCUMENT_TYPES.EXCEL:
        // Parse content to table data if not provided
        const tableData = options.data || parseContentToTableData(content);
        blob = generateExcel(tableData, title);
        filename = `${sanitizedTitle}.xlsx`;
        break;

      case DOCUMENT_TYPES.WORD:
        blob = await generateWord(
          content,
          title,
          options.isStructured || false,
          options.tableData || null
        );
        filename = `${sanitizedTitle}.docx`;
        break;

      default:
        throw new Error(`Unsupported document type: ${type}`);
    }

    // Verify that we have a valid blob
    if (!(blob instanceof Blob)) {
      console.error('Invalid blob:', blob);
      throw new Error('Generated document is not a valid Blob');
    }

    // Log blob details for debugging
    console.log(`Generated ${filename} (${blob.size} bytes, type: ${blob.type})`);

    // Save the document
    saveDocument(blob, filename);
    return { success: true, filename, size: blob.size, type: blob.type };
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
};

/**
 * Parse text content into table data for Excel
 * @param {string} content - The text content to parse
 * @returns {Array<Array<any>>} - The parsed table data
 */
export const parseContentToTableData = (content) => {
  // Simple parsing logic - split by newlines and then by tabs or multiple spaces
  const lines = content.trim().split('\n');
  return lines.map(line => line.split(/\t|  +/));
};

/**
 * Detect if content is likely a table
 * @param {string} content - The content to check
 * @returns {boolean} - Whether the content is likely a table
 */
export const isLikelyTable = (content) => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return false;

  // Check if lines have consistent delimiters
  const firstLineDelimiters = countDelimiters(lines[0]);
  const consistentStructure = lines.slice(1).every(line => {
    const lineDelimiters = countDelimiters(line);
    return (
      (firstLineDelimiters.tabs > 0 && lineDelimiters.tabs === firstLineDelimiters.tabs) ||
      (firstLineDelimiters.pipes > 0 && lineDelimiters.pipes === firstLineDelimiters.pipes) ||
      (firstLineDelimiters.commas > 0 && lineDelimiters.commas === firstLineDelimiters.commas)
    );
  });

  return consistentStructure;
};

/**
 * Count delimiters in a string
 * @param {string} str - The string to check
 * @returns {Object} - Counts of different delimiters
 */
const countDelimiters = (str) => {
  return {
    tabs: (str.match(/\t/g) || []).length,
    pipes: (str.match(/\|/g) || []).length,
    commas: (str.match(/,/g) || []).length
  };
};

/**
 * Convert Markdown to plain text
 * @param {string} markdown - The markdown content to convert
 * @returns {string} - The plain text version
 */
export const markdownToPlainText = (markdown) => {
  if (!markdown) return '';

  let text = markdown;

  // Handle Apploydimmersive content format
  text = text.replace(/(<\/immersive>\s*id="[^"]*"\s*type="[^"]*"\s*title="[^"]*">)(.*?)(<\/immersive>)/gs, (_, start, content) => {
    // Extract the title if available
    const titleMatch = start.match(/title="([^"]*)"/i);
    const title = titleMatch ? `${titleMatch[1]}\n\n` : '';
    return title + content;
  });

  // Remove any remaining immersive tags
  text = text.replace(/<\/?immersive[^>]*>/g, '');

  // Remove code blocks (both ``` and indented)
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/^( {4}|\t)[^\n]+/gm, '');

  // Remove headers but keep the text
  text = text.replace(/^#{1,6}\s+(.*?)$/gm, '$1');

  // Remove emphasis but keep the text
  text = text.replace(/[\*_]{1,3}([^\*_]+)[\*_]{1,3}/g, '$1');

  // Remove blockquotes but keep the text
  text = text.replace(/^>\s+(.*?)$/gm, '$1');

  // Remove horizontal rules
  text = text.replace(/^(?:[-*_]\s*){3,}$/gm, '');

  // Remove images but keep alt text
  text = text.replace(/!\[(.*?)\]\([^)]+\)/g, '$1');

  // Convert links to just their text
  text = text.replace(/\[(.*?)\]\([^)]+\)/g, '$1');

  // Remove HTML tags but keep their content
  text = text.replace(/<[^>]*>([^<]*)<\/[^>]*>/g, '$1');
  text = text.replace(/<[^>]*>/g, '');

  // Convert list markers to proper text
  text = text.replace(/^[\*\-+]\s+(.*?)$/gm, '• $1');
  text = text.replace(/^(\d+)\.\s+(.*?)$/gm, '$1. $2');

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
};

/**
 * Suggest the best document format based on content
 * @param {string} content - The content to analyze
 * @returns {string} - The suggested document type
 */
export const suggestDocumentFormat = (content) => {
  if (isLikelyTable(content)) {
    return DOCUMENT_TYPES.EXCEL;
  }

  if (content.includes('<html>') || content.includes('<div>') || content.includes('<p>')) {
    return DOCUMENT_TYPES.PDF;
  }

  // Default to Word for text content
  return DOCUMENT_TYPES.WORD;
};

export default {
  generatePDF,
  generateExcel,
  generateWord,
  saveDocument,
  generateDocument,
  isLikelyTable,
  suggestDocumentFormat,
  parseContentToTableData,
  markdownToPlainText,
  DOCUMENT_TYPES
};
