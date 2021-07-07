# IORG Archive (public)

1. Archive locally
2. Organize files into `/{volume}/{group}`
3. Stage files and generate ID automatically
4. Maintain global list and edit metadata on Sheet

## iorg-tw/archive
- Download from Drive
  - `npm run download` (will only sync new files)
  - Check files
  - Move files into `files`
- Import from local file sys
  - Assign volume(s) from which to import
  - `npm run import-local`
  - Files to add
    - Check `stage-import-local-add`
    - Paste `import-local-add.tsv` to Sheet (edit metadata there)
    - Move files from stage into `files`
    - Commit changes
  - Files to update
    - ...
- Make thumbnails
  - `npm run make-thumbs` (option to skip files with existing thumb)
  - Commit changes

## iorg-tw/iorg-tw-nuxt
- Sync metadata from Sheet
  - `npm run sync:archive`
  - Commit changes
  - Rebuild website
