# Changelog

All notable changes to hyAway are documented here.

---

## 2026-01-28

### Added

- **ARM64 Docker support** — Docker images now support both AMD64 and ARM64 architectures, enabling deployment on Raspberry Pi, Orange Pi, and other ARM-based devices

---

## 2026-01-26

### Added

- **Ratings support** — View and set like/dislike and numerical (star) ratings from Hydrus on files. Requires "edit file ratings" permission to set ratings.
- **File ratings section** — Dedicated section on file details page showing all rating services with interactive controls
- **Ratings overlay** — Ratings display on thumbnails and file viewers, configurable per rating service
- **Ratings in review queue** — Set ratings while reviewing files with touch-friendly buttons and visual feedback
- **Ratings settings** — Control which ratings appear in overlays and review mode, per service
- **Gesture sensitivity settings** — Customize horizontal and vertical swipe thresholds in review mode
- **Gesture threshold debug overlay** — Visual grid showing swipe zones when adjusting gesture sensitivity
- **Background toggle button** — New button in file viewer and review queue card to cycle through background colors for transparent images
- **Keyboard shortcut hints** — Buttons now show keyboard shortcuts in tooltips on hover

### Changed

- Session key is automatically disabled when using HTTP (non-HTTPS) connections for compatibility. You can still reenable it and it will use alternate flow to refresh that doesn't need https.
- Reorganized review queue settings with consolidated ratings and gesture controls
- Moved thumbnail card size settings into layout section since usually updating them at the same time
- Improved more error pages (e.g. auth error page) to show full stack traces for easier debugging
- Permissions page now shows "edit file ratings" permission status

### Fixed

- Don't use `navigator.locks.request` when it doesn't exist (in HTTP contexts). This should when, for example, serving docker image via `http://192.168.x.y` and calling hydrus in `http://192.168.x.y:45869`

---

## 2026-01-22

### Added

- This changelog page
- Screenshots page in documentation

---

## 2026-01-21

### Added

- New PWA icons with gradient background style — re-pin the site to see them
- Long press menu on home screen with shortcuts to pages, random inbox, and review queue
- Prebuilt Docker image for self-hosting at [ghcr.io/hyaway/hyaway](https://github.com/hyaway/hyaway/pkgs/container/hyaway)
- TrueNAS Scale instructions and Docker Compose sample for the prebuilt image
- Notes indicator icon in gallery thumbnails

---

## 2026-01-19

### Added

- Swipe navigation between files in page-scoped file details view
- Search in pages list
- Folder indicators showing which folders pages belong to
- Sidebar file tree view for pages, with search
- Notes and URLs display on file details page
- Page-level error boundary with full stack trace
- Global error boundary with full stack trace and minimal dependencies

### Fixed

- Trailing slashes in API URLs now handled correctly
- Video playback on Safari/iOS with H.264 fallback and poster image
- Browser compatibility for older devices and Safari via `requestIdleCallback` polyfill

### Changed

- Removed ASCII tables from documentation for cleaner rendering

---

## 2026-01-18

Initial release of hyAway.

### Added

- **Review queue** — Swipe to archive (right), trash (left), or skip (up) files from your inbox. Keyboard shortcuts available with undo (down). Actions are sent immediately to Hydrus.
- **Gallery browsing** — Masonry layout with responsive lanes, infinite scroll, and keyboard navigation
- **Predefined galleries** — Random inbox, recently inboxed, recently archived, recently trashed, local watch history, remote watch history, most viewed, and longest viewed
- **Hydrus pages** — Browse your open Hydrus pages directly
- **File viewer** — View images, video, and audio with pan/zoom controls
- **File details** — Metadata and tags display for each file
- **Watch history** — Track viewing history locally and send view events to Hydrus
- **Customization** — Configure gallery layout, thumbnail sizes, lanes, and data fetching behavior
- **Dark/light theme** — Automatic system-aware theme with manual override
- **Mobile-first design** — Touch-friendly interface optimized for phones and tablets
- **Self-hosting** — Deploy with Docker or any static web server
- **Hosted instance** — Use directly at [hyaway.com](https://hyaway.com)
