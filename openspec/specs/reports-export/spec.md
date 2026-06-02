# Reports Export Specification

## Purpose
Enable administrators to export processed weighing records, quality audits, and batch logs into standardized Microsoft Excel spreadsheet files (.xlsx) for external analysis and archiving.

## Requirements

### Requirement: Tabular Excel Document Generation
The system MUST compile the filtered weighing datasets and generate a valid Microsoft Excel file (`.xlsx`) for download. The file MUST include separated, formatted sheets for Line Performance, Batch Traceability, and Quality Audits.

#### Scenario: Export Filtered Dataset
- GIVEN the administrator is on the report export page and has selected a date range
- WHEN the administrator clicks the "Exportar a Excel" button
- THEN the system MUST assemble the dataset, prompt the browser download, and deliver a well-formed `.xlsx` spreadsheet matching the filters

### Requirement: Audit Trail and Discard Transparency
The exported spreadsheet sheets MUST retain complete traceability, showing operator sessions, exact timestamps, tara weights, and clearly marking any locally discarded measurements.

#### Scenario: Verifying Discarded Samples in Excel
- GIVEN an active batch where the operator discarded a weight of 102.3g
- WHEN the administrator exports the batch traceability report to Excel
- THEN the system MUST include the discarded weight row in the spreadsheet, formatted with a visual label "DESCARTADO" and the operator's ID
