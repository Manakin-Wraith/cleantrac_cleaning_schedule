# PDF Refactoring Checklist: Excel to PDF Document Generation

## Phase 1: Remove Excel Legacy Code & Setup

### Backend (`core/document_template_views.py`)
- [x] **Identify `openpyxl` Usage:** Locate all sections of code in `generate_document_file` and related functions that use `openpyxl` for Excel generation.
- [x] **Comment Out/Remove Excel Logic:** Safely remove or comment out `openpyxl`-specific code (workbook creation, sheet manipulation, cell writing, styling).
- [x] **Modify API Response for PDF:** (Handled in `GeneratedDocumentViewSet.create` and `generate_document_file`)
    - [x] Change `HttpResponse` content type from `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` to `application/pdf`.
    - [x] Update `Content-Disposition` header to suggest a `.pdf` filename.
- [x] **Placeholder for PDF Generation:** `generate_document_file` now returns data bytes (currently JSON string) and a `.pdf` filename, serving as a placeholder for actual PDF content.

### Frontend
- [x] **`GeneratedDocumentList.jsx`:** (Reviewed, icon suitable, download updated)
    - [x] Update file icons or display logic to represent PDF files instead of Excel. (Current icon is generic and suitable)
    - [x] Ensure download functionality correctly handles `.pdf` extensions. (Updated to suggest .pdf)
- [x] **`DocumentGenerationForm.jsx` / `DocumentPreview.jsx`:** (Reviewed, no Excel-specific logic changes needed, Grid items removed from Form)
    - [x] Review if any logic is tied to Excel output that needs adjustment. Preview data source should remain the same. (`Grid item` props removed from `DocumentGenerationForm.jsx`)
- [ ] **General UI Review:** Check other UI elements that might refer to "Excel" documents and update text to "PDF" or "Document". (Primary components reviewed)

### Dependencies
- [ ] **Select PDF Library:** Choose a suitable Python PDF generation library (e.g., ReportLab, WeasyPrint, FPDF).
    - *Decision:* ReportLab
- [x] **Add to `requirements.txt`:** Add the chosen library and its version. (Created `requirements.txt` with `reportlab`)
- [x] **Install Dependency:** Ensure the library is installed in the development environment. (Verified via pip install)

## Phase 2: Implement PDF Generation

### Backend (`core/document_template_views.py`)
- [x] **Integrate PDF Library:** Import the chosen PDF library in `generate_document_file`. (ReportLab imported and basic PDF generation implemented)
- [ ] **Define PDF Structure Logic:**
    - [x] **Clarify Excel Template Usage:** Determine how the uploaded Excel template will inform the PDF structure.
        - Option A: Excel as a direct source (complex, might need tools like `unoconv`).
        - Option B: Excel as a layout blueprint (read structure, recreate in PDF).
        - Option C: Excel defines data fields, PDF layout is separate (e.g., HTML template).
        - *Decision based on clarification:* Option C selected. Excel template is not used for PDF layout; PDF layout is standardized. Data fields are determined by template type.
    - [x] Implement logic to create the basic PDF document (pages, margins). (SimpleDocTemplate with title, metadata, and section summaries)
- [ ] **Populate PDF with Data:**
    - [x] **Re-use Data Fetching Logic:** Adapt existing data fetching logic (for temperature logs, verifications, etc.) to feed the PDF generator. (Existing `document_info` structure is used)
    - [x] **Headers and Footers:** Implement common headers/footers (e.g., company name, date, page numbers). (Company name, doc title, page numbers implemented)
    - [x] **Data Tables:** Implement logic to draw tables for data sections (e.g., temperature readings). (ReportLab Tables with basic styling implemented)
    - [x] **Styling:** Apply basic styling (fonts, colors, text alignment) to match the intended look, possibly derived from the Excel template's intent.
        - [x] Consider how conditional formatting (e.g., red for out-of-range temperatures) will be translated to PDF. (Red text for 'Out of Range' status implemented)
- [x] **Handle Different Template Types:** Ensure PDF generation works for all existing template types (`temperature`, `verification`, `cleaning`). (Data fetching for all types implemented)
- [x] **Error Handling:** Implement robust error handling for PDF generation failures. (Detailed server-side logging and generic user-facing messages implemented)

### Testing (Phase 2 & 3)
- [ ] **Unit Tests:** Write unit tests for PDF generation logic (e.g., check for PDF validity, key text presence). (Consider feasibility and scope)
- [ ] **Manual Testing (User to perform):**
    - [ ] Test document generation for each template type (`temperature`, `verification`, `cleaning`) with various parameters.
    - [ ] Verify data accuracy, headers, footers, conditional formatting, and overall layout in generated PDFs.
    - [ ] Check formatting, layout, and styling.
    - [ ] Test with various data scenarios (empty data, large data sets).
    - [ ] Test on different browsers/PDF viewers if compatibility is a concern.

### Documentation
- [ ] **Update User Documentation:** Reflect the change from Excel to PDF generation.
- [ ] **Update Developer Documentation:** Document the new PDF generation process and any decisions made about template interpretation.

## Phase 3: Cleanup and Review
- [ ] **Code Review:** Conduct a thorough code review of all changes.
- [ ] **Remove Dead Code:** Ensure all old Excel-related code (if commented out) is fully removed.
- [ ] **Optimize:** Look for any performance optimization opportunities in PDF generation.
