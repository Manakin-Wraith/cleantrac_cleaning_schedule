# Bulk Document Library & Folder Management

Implemented June 2025

## Overview
Managers and super-users can now upload multiple documents at once and organise them into folders that are visible to **all** departments.

Key points:

* Drag-and-drop or file-picker bulk upload (any file type)
* Create a new folder on-the-fly inside the upload modal
* Inline folder rename & delete (header dropdown coming soon)
* Header dropdown filters document table by folder
* Title + download action are displayed; meta columns removed for cleaner UI
* Backend `Folder` & `Document` models expose CRUD API at `/api/folders/` and `/api/documents/`
* Department filtering was removed – every folder/document is global

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET    | `/api/folders/`           | List folders (all roles) |
| POST   | `/api/folders/`           | Create folder (manager or superuser) |
| PATCH  | `/api/folders/{id}/`      | Rename folder |
| DELETE | `/api/folders/{id}/`      | Delete folder |
| GET    | `/api/documents/?folder_id={id}` | List docs, optionally filter by folder |
| POST   | `/api/documents/bulk_upload/` | Multipart bulk upload (`files[]`, optional `folder_id`) |

## Front-End Components

* `DocumentUploadModal.jsx` – handles bulk upload & folder creation
* `FolderDropdown.jsx`      – header selector
* `DocumentList.jsx`        – table (title + download)

## How to Use

1. Navigate to **Documents** in the manager portal.
2. (Optional) Select or create a destination folder via the Upload dialog.
3. Drop multiple files → Upload.
4. Use the **Folder** dropdown in the header to filter documents.

## Future Work
* Inline rename in dropdown
* Optional nested (tree) folders
* Batch import folders from CSV
