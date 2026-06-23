---
outline: 2
---

# Changelog

All notable changes to hyAway are documented here.

---

## 2026-06-22

### Added

- **Tag swipe actions** — Review swipes can now add or remove tags while moving through files
- **Swipe action profiles** — Save and switch between review swipe setups for different tagging and rating workflows
- **Review stats breakdown** — Click action counts in review to see all applied actions. Tooltips over actions with secondary actions that describe everything that will be performed
- **File tag sidebars** — File details and Review now show the current file's Hydrus tags in the right sidebar
- **Tag sidebar sorting** — Gallery tag sidebars can sort by Count or Namespace, while new file tag sidebars can use Hydrus order or Namespace sorting

### Changed

- The Pages sidebar header, tree rows, and last-opened page item now use the consistent sidebar styling as the rest of the app
- Tags sidebar header is now better aligned with the app header and buttons

### Fixed

- File open, link, and download actions no longer trigger twice for some users
- App pages now reserve scrollbar space to prevent width jumps on navigation, while Review, video theater, and viewer overlays keep edge-to-edge layouts
- Hydrus page cards now handle hidden files in their preview thumbnails and file counts

---

## 2026-06-02

### Changed

- Hydrus page breadcrumbs on small screens now show only the page name, keeping parent folder names out of the compact header

### Fixed

- Thumbnail galleries now keep loading the next visible files after review actions hide a large batch of images

---

## 2026-06-01

### Added

- **Local gallery hiding** — Hide files from Hydrus-backed galleries until next data refresh/next session
- **Review hiding** — Hide files when performing review actions based on Hydrus setting "Remove files from view when they are archive/delete filtered" and "--even skipped files". Hiding is scoped to galleries that contributed to review. This is hyAway only and persists until next data refresh/session
- **Hide from view** — Thumbnail context menus now include a direct action for hiding a file from the current gallery view
- **Hide trashed files** — Trashing files hides them from view if Hydrus setting "Remove files from view when they are sent to the trash" is enabled. This will hide file in Hydrus pages. For search based queries this persists until next data refresh/session
- **Show hidden files** — Galleries with hidden files offer a footer action to show them again
- **Review source links** — Review completion now shows buttons for every source that contributed files, including saved searches, Hydrus pages, and predefined galleries
- **Latest opened page** — The pages list now adds a special card for the most recently opened Hydrus page when it still exists, and attempts matching after Hydrus assigns it a new page key on Hydrus client restart
- **System predicate comparisons** — Query builder system predicates now support greater-than-or-equal and less-than-or-equal comparisons (Hydrus versions >= 673)
- **Rating search predicates** — Search builder system predicate menus and autosuggest now include Hydrus rating services, including value comparisons, has rating, and no rating searches
- **File note editing** — File details now let you add, rename, edit, and delete Hydrus file notes inline when note editing permission is granted
- **File details note expansion** — Appearance settings now let long file notes open expanded by default

### Changed

- Query builder file predicates are now grouped together, with file type and file size shown first
- Review completion buttons now wrap on narrow screens and take full width on the smallest layouts
- Pages filter now matches terms across parent groups and leaf page names, which allows entering both at the same time

### Fixed

- Search builder dropdowns now stay within the visible mobile viewport when opened near the bottom of the screen

---

## 2026-05-20

### Added

- **Gallery image loading modes** — Thumbnail galleries now let you choose between Hydrus thumbnails, optimized images, and full-size originals
- **Optimized image controls** — Gallery and review settings now let you tune optimized image quality and choose the file size where Hydrus should return a smaller image

### Changed

- The previous full-size thumbnail toggle has been replaced with clearer image loading mode choices

### Fixed

- Image viewer wheel scrolling no longer jumps immediately to maximum zoom
- Image viewer mouse-wheel zooming stutter fixed

---

## 2026-05-19

### Added

- **Full-size gallery images** — Thumbnail galleries can now load original static images instead of thumbnails
- **Gallery footer toggle** — Gallery display settings now include a footer toggle for showing or hiding the metadata strip below images

---

## 2026-05-17

### Added

- **Search page** — New Search page accessible from the homepage and sidebar, with saved searches
- **Query builder** — Visual builder for complex searches with tag rules, OR groups, and negation
- **System predicates** — Build searches using Hydrus system predicates for file properties, dimensions, duration, file type, tags, and related metadata
- **Sort controls** — Sort search results by import time, file size, dimensions, duration, tag count, views, random order, hash, and color properties
- **Tag autocomplete** — Autocomplete tag input powered by Hydrus tag search
- **Instant search** — Automatically re-fetch results as search rules change
- **Pinned searches** — Pin search tabs so important searches stay available while clearing or managing the rest
- **Default query** — Save a default set of tags and system predicates that pre-populate each new search tab
- **Favourite tags** — Save favourite tags in Hydrus; favourite tags now show a special icon wherever tags are displayed
- **Favourite tags autosuggest** — Favourite tags appear in search autosuggest by default
- **Tag actions** — Press any tag badge to start a new search, include or exclude it from saved searches, or add or remove it from favourites
- **PIN lock** — Protect the app with a 4-digit PIN required for each new session
- **Read-only ratings** — Mark rating services as read-only so their values stay visible without edit controls on file pages or review actions

### Changed

- Reset connection settings now offers two actions: reset API values only, or reset API values and clear saved data such as searches, review queue, and watch history
- Opened Hydrus pages now show their parent page path above the title, with hierarchy colors matching the pages list
- Page breadcrumbs now show the actual page name and parent group path instead of the URL slug
- Pages search fields now include clear buttons in both the main page view and the pages sidebar
- Review completion now includes a "New random inbox" action that fetches a fresh random inbox set when opened
- Opening "Recently inboxed" from review completion now refreshes that gallery before navigation
- "Add to review" actions now use a distinct cards-with-plus icon to differentiate them from "New review"
- Documentation screenshots have been updated to show new features
- Updated major dependencies including Vite 8, TypeScript 6, ESLint 10, and react-zoom-pan-pinch 4

### Fixed

- Large collections with 100k+ files now load faster; searches and metadata fetching no longer cause the UI to hang
- File actions now update gallery metadata more consistently after trashing, restoring, archiving, unarchiving, rating, or clearing view stats, so returning from a file detail page shows the correct file state and icons
- Image viewer background now correctly matches the fill-canvas placeholder to the configured background preference
- File viewer image loading UI now respects the media viewer background preferences, preventing a brief average-color flash when opening images
- Light theme text no longer appears thin because it now uses subpixel antialiasing for fuller weight
- Inputs and form fields now have darker borders in light theme
- Page headings no longer take excessive vertical space when text wraps to multiple lines
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
