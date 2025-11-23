import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

export interface DocumentData {
  // Basic booking info
  bookingNumber?: string;
  bookingCode?: string;
  vesselName?: string;
  selectedVessel?: string;

  // Dates
  checkInDate?: string;
  checkOutDate?: string;

  // Skipper info
  skipperFirstName?: string;
  skipperLastName?: string;
  skipperEmail?: string;
  skipperPhone?: string;
  skipperNationality?: string;
  skipperPassport?: string;
  skipperAddress?: string;

  // Financial data
  amount?: string | number;
  charterAmount?: string | number;
  charterVat?: string | number;
  totalAmount?: string | number;
  deposit?: string | number;
  commission?: string | number;
  commissionVat?: string | number;

  // Agency info
  agencyName?: string;
  agencyProvidesInvoice?: boolean;

  // Crew members (for Crew List)
  crewMembers?: Array<{
    firstName: string;
    lastName: string;
    nationality: string;
    passport: string;
    dateOfBirth?: string;
  }>;

  // Additional fields
  [key: string]: any;
}

class WordDocumentService {
  /**
   * Load a Word document template from public/documents folder
   */
  private async loadTemplate(filename: string): Promise<ArrayBuffer> {
    const response = await fetch(`/documents/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${filename}`);
    }
    return await response.arrayBuffer();
  }

  /**
   * Format data for template (ensure all values are strings and handle null/undefined)
   */
  private formatDataForTemplate(data: DocumentData): Record<string, string> {
    const formatted: Record<string, string> = {};

    Object.keys(data).forEach(key => {
      const value = data[key];

      // Skip arrays and objects (except for special handling)
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return;
      }

      // Convert to string, handling null/undefined
      if (value === null || value === undefined || value === '') {
        formatted[key] = '';
      } else if (typeof value === 'number') {
        // Format numbers with 2 decimals for financial fields
        if (['amount', 'charterAmount', 'charterVat', 'totalAmount', 'deposit', 'commission', 'commissionVat'].includes(key)) {
          formatted[key] = value.toFixed(2);
        } else {
          formatted[key] = value.toString();
        }
      } else if (typeof value === 'boolean') {
        formatted[key] = value ? 'Yes' : 'No';
      } else {
        formatted[key] = String(value);
      }
    });

    return formatted;
  }

  /**
   * Fill a Word document template with data and download it
   */
  async fillAndDownloadTemplate(
    templateFilename: string,
    data: DocumentData,
    outputFilename: string
  ): Promise<void> {
    try {
      console.log('📄 Loading template:', templateFilename);

      // Load the template
      const templateContent = await this.loadTemplate(templateFilename);
      console.log('✅ Template loaded, size:', templateContent.byteLength, 'bytes');

      console.log('📦 Creating PizZip...');

      // Load the template into PizZip
      const zip = new PizZip(templateContent);
      console.log('✅ PizZip created successfully');

      console.log('🔧 Initializing Docxtemplater...');

      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      console.log('✅ Docxtemplater initialized');

      // Format data for template
      const formattedData = this.formatDataForTemplate(data);

      console.log('✏️ Filling template with data:', formattedData);

      // Fill the template with data
      doc.render(formattedData);
      console.log('✅ Template filled successfully');

      console.log('💾 Generating document...');

      // Generate the document as a blob
      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      console.log('✅ Document generated, size:', blob.size, 'bytes');

      console.log('⬇️ Downloading:', outputFilename);

      // Download the file
      saveAs(blob, outputFilename);

      console.log('✅ Document downloaded successfully!');
    } catch (error) {
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      throw new Error(`Failed to fill document template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fill Charter Agreement (Ναυλοσύμφωνο)
   */
  async fillCharterAgreement(bookingData: DocumentData): Promise<void> {
    const outputFilename = `Charter-Agreement-${bookingData.bookingCode || bookingData.bookingNumber || 'document'}.docx`;

    await this.fillAndDownloadTemplate(
      'Charter-Agreement.docx',
      bookingData,
      outputFilename
    );
  }

  /**
   * Fill Crew List
   */
  async fillCrewList(bookingData: DocumentData): Promise<void> {
    const outputFilename = `Crew-List-${bookingData.bookingCode || bookingData.bookingNumber || 'document'}.docx`;

    await this.fillAndDownloadTemplate(
      'Crew-List.docx',
      bookingData,
      outputFilename
    );
  }
}

// Export singleton instance
const wordDocumentService = new WordDocumentService();
export default wordDocumentService;
