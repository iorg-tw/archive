# IORG Archive (public)

## Methods

### Local → Dokidoki Archive (Google Drive + Sheet) → GitHub
1. Prepare files locally
2. Upload files with Google Form uploader to Dokidoki Archive
3. Assign ID manually on Sheet
4. Edit metadata on Sheet

### Local archive + script → GitHub
1. Prepare files locally
2. Organize local files into `/{volume}/{group}`
3. Run script to generate ID & stage files & generate metadata tsv locally
4. Commit changes
5. Paste tsv to Sheet
6. Edit metadata on Sheet
7. Merge
8. Sync archive

## Scripts

### `npm run import-doki`
- Import uploaded files from Dokidoki Archive (Google Drive)
- Check
  - Check `stage-import-doki`
  - Move files into `files`
- Commit changes

### `npm run import-local {volume} {prefix}`
- Import local files
- Check files to _add_
  - Check files in `stage-import-local-add`
  - Paste `data/import-local-add.tsv` to Sheet (edit metadata there)
  - Move files from stage into `files`
- Check files to _update_
  - ...
- Commit changes

### `npm run make-thumbs`
- Make thumbnails
  - These is an option to skip files with existing thumb
- Commit changes

### `npm run merge`
- Merge multiple locations of archive entries to make IORG Archive
- Locations include
  - `archive` sheet in IORG Library (deprecated)
  - `entries` sheet in Dokidoki Archive
- Merged file is at `data/archive.json`