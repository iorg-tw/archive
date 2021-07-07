# iorg-tw/archive

1. Archive locally
2. Organize files to volumes
3. Stage files and generate ID automatically
4. Maintain global list and edit metadata on Google Sheet

## iorg-tw/archive
- Download from drive
  - `npm run download` (will only sync new files)
  - check files
  - move files into `files`
- Import from local file sys
  - `npm run import-local`
  - check `stage`
  - paste `add.tsv` to Dokidoki Archive (edit metadata there)
  - move files into `files`
  - commit changes
- Make thumbnails
  - `npm run make-thumbs` (option to skip files with existing thumb)

## iorg-tw/iorg-tw-nuxt
- Sync
  - `npm run sync:archive`
