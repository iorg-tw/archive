# IORG Archive (public)

1. Archive locally
2. Organize files into `/{volume}/{group}`
3. Stage files and generate ID locally and automatically
4. Maintain global list and edit metadata on Sheet

## iorg-tw/archive
- Import uploaded files from Dokidoki Archive
  - `npm run import-doki` (will only sync new files)
  - New downloads
    - Check `stage-import-doki`
    - Move files into `files`
    - Commit changes
- Import from local file sys
  - Assign volume(s) from which to import
  - `npm run import-local {volume} {prefix}`
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
  