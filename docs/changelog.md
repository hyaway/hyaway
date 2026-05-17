# Changelog

All notable changes to hyAway are documented here.

---

## 2026-05-17

### Changed

- Updated major dependencies: Vite 8, TypeScript 6, ESLint 10, react-zoom-pan-pinch 4, and others

### Added

- **Read-only ratings** — Rating services can now be marked read-only so their values remain visible without edit controls on file pages or review actions
- **Pinned searches** — Search tabs can now be pinned so important searches stay available while clearing or managing the rest
- **Custom search actions** — Search actions now support include/exclude behavior and direct search creation from pages and tag menus

---

## 2026-05-16

### Fixed

- File actions now update gallery metadata immediately after trashing, restoring, archiving, unarchiving, rating, or clearing view stats, so returning from a file detail page shows the correct file state and icons

---

## 2026-05-14

### Added

- **Search page** — New dedicated search experience accessible from the homepage and sidebar, with persistent search tabs that survive navigation
- **Query builder** — Visual query builder for constructing complex searches with tag rules, OR groups, and negation
- **System predicates** — Build searches using system predicates for file properties, dimensions, duration, file type, tags, time, URLs, notes, ratings, and file viewing statistics
- **Sort controls** — Sort search results by import time, file size, dimensions, duration, number of tags, views, random, hash, and color properties with ascending/descending direction
- **Instant search** — Toggle per-search-tab instant mode that automatically re-fetches results as rules change, without needing to press a search button
- **Tag autocomplete** — Autocomplete input for tags powered by the Hydrus tag search API, with support for namespace colors
- **Tag actions** — Right-click (or long-press) any tag badge to start a new search, include/exclude it from the current search, or add/remove it from favourites
- **Favourite tags** — Save tags as favourites via the Hydrus API; favourite tags now show a special icon
- **Default query** — Save a default set of tags and system predicates that pre-populate every new search tab
- **Auto-generated search names** — New search tabs get readable auto-generated names based on their query rules
- **PIN lock** — Protect the app with a 4-digit PIN required each new session
- **Auto-lock** — Optionally lock the app after being in the background for a configurable duration
- Lock button in the sidebar header for quick manual locking
- "Forgot PIN?" popover on the lock screen that clears the PIN and disconnects from the API

### Changed

- "Add to review" actions now show a distinct cards-with-plus icon to differentiate from "New review"
- Page breadcrumbs now show the actual page name and parent group path instead of the URL slug
- Reset connection settings card now offers two separate actions: reset API values only, or reset and clear all saved data (searches, review queue, watch history)
- Review completion now offers a "New random inbox" action that fetches a fresh random inbox set when opened
- Opening "Recently inboxed" from review completion now refreshes that gallery before navigation
- Opened Hydrus pages now show their parent page path above the title with matching hierarchy styling and quick links back to filtered pages
- Pages search fields now include buttons to clear query in both the main page view and the pages sidebar

### Fixed

- Image viewer background now correctly matches the fill-canvas placeholder to the configured background preference
- Image loading now respects the media viewer background preferences, preventing a brief average-color flash when opening images
- Significantly improved speed when loading large collections (100k+ files) — searches and metadata fetching no longer cause the UI to hang
- Page headings no longer take excessive vertical space when text wraps to multiple lines
- Inputs and form fields are now more visible in light theme with darker borders
- Light theme text no longer appears thin. It now uses subpixel antialiasing for fuller weight
- Pages search inputs now preserve typed spaces while still trimming searches and highlights correctly

---

## 2026-03-19

### Changed

- Error screens now display the request URL and HTTP status code for easier troubleshooting
- Updated dependencies

### Fixed

- Thumbnail gallery no longer blocks rendering when thumbnail dimensions can't be loaded from Hydrus

---

## 2026-02-10

### Added

- Rating service dropdowns in swipe bindings now show service icons

### Changed

- Review swipe thresholds now allow a 1% minimum and finer adjustment (snaps to 1%, then 5% increments)
- Ratings overlays and inc/dec controls are styled closer to Hydrus, with improved theme-aware coloring

### Fixed

- Review swipe direction/opacity calculations now safely handle zero-size cards and edge-case threshold ranges

## 2026-02-08

### Added

- **Immersive/Theater mode in review queue** — Hide most UI shell for distraction-free reviewing
- **Double-tap to zoom in review queue** — Double-tap images in review queue to zoom in for a closer look. Previously you could only zoom in with pinch gesture. This is now similar to behavior in theater mode for full file viewer.
- **Review completion filmstrip preloading** — Thumbnails in the decision filmstrip are preloaded when they appear in virtualized rendered items instead of when they appear on the screen for smoother scrolling.
- **Filmstrip scroll restoration** — Decision filmstrips remember horizontal scroll position when returning from file details
- **Review completion follow-up actions** — New buttons to browse inboxed files or random inbox after finishing a queue
- **File viewer preloading** — Adjacent image files are preloaded when browsing files for faster navigation

### Changed

- Review completion screen file descriptors reflow better
- Swipe thresholds use finer steps and allow lower minimums for more precise tuning
- Settings accordion sections scroll into view when expanded
- Navigating away via browse pages button in review completion screen no longer clears the queue — only the explicit "Clear" button does
- Dev builds use distinct PWA name and icons to differentiate from production installs

### Fixed

- Scroll lock no longer persists when navigating pages before completing review

---

## 2026-02-07

### Added

- **Undo as swipe direction** — Undo can now be assigned to any swipe direction, allowing one-gesture undo without the dedicated footer button
- **Swipe bindings in settings page** — Swipe action configuration is now accessible from the main settings page and sidebar, not just during review mode

### Changed

- Swipe and keyboard animations improved — footer buttons and keyboard actions now skip exit animations
- Review footer dynamically hides standalone undo button when undo is bound to a swipe direction
- Review controls settings reorganized into collapsible accordion sections (swipe actions, thresholds)
- Swipe bindings editor warns when queue is active and disables editing until cleared
- Default down-swipe binding changed from "skip" to "undo" (existing users migrated automatically unless customized)
- Undo-bound swipe overlay shows disabled state when there's nothing to undo

### Fixed

- Dragging cards out of bounds in review mode no longer causes vertical page scrollbar to appear or allow scrolling to the empty area

---

## 2026-02-06

### Added

- **Rating actions on swipe** — Swipe directions can trigger rating changes (like/dislike, numerical stars, or inc/dec) alongside the primary file action, allowing one-gesture triage + rating
- **Customizable swipe bindings in review mode** — Each swipe direction (left, right, up, down) can be mapped to any file action (archive, trash, or skip), plus optional secondary action for setting a rating
- **Per-direction swipe thresholds** — Each direction now has its own configurable activation threshold instead of shared horizontal/vertical values
- **Decision filmstrip on review completion** — After finishing a review queue, each direction group shows a horizontally-scrolling filmstrip of thumbnails so you can see which files were sorted where
- **Context menu in review filmstrip** — Right-click thumbnails in the decision filmstrip for the same actions available in gallery context menus
- **"More actions" overflow menu in review footer** — Access file actions (open externally, download, copy URL, etc.) for the current file without leaving review mode
- **Rating colors from Hydrus** — Rating overlay badges and controls now use the custom colors configured in your Hydrus rating services instead of hardcoded defaults
- **Rating overlay source setting** — Choose between "Hydrus" (use the server's thumbnail visibility flags) and "Custom" (manual per-service toggles) for controlling which ratings appear on thumbnails
- **Orphaned rating service cleanup** — Rating settings now detect services that were removed from Hydrus and let you delete their leftover local settings

### Changed

- Review footer supports up to 7 buttons (undo, 4 directional actions, rating, more) with responsive layout on small screens
- Swipe threshold overlay now displays the icon and label for each direction's configured binding instead of generic direction arrows
- Review completion screen redesigned with a grid stats breakdown and per-direction filmstrips
- Stricter rating service type parsing via Zod discriminated unions

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
