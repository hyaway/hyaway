# Future development

hyAway's main stand-out feature, and the reason I built it, is the swipe-based [archive/delete](https://hydrusnetwork.github.io/hydrus/getting_started_files.html#inbox_and_archive) (I call it review) workflow.

The rest of the app is there to support that review workflow. New features should make review better. The goal is not to turn hyAway into a full Hydrus UI replacement.

## Feature areas

These are the parts of the app that support review today.

### Finding files for review

- Media pages browser
- Predefined queries like random inbox, recently inboxed, recently archived, and recently trashed
- Search, including favourite tags, saved searches, default queries, pinned searches, and visual system predicates
- Search result sorting, including Hydrus file sorts and namespace-based sorts
- Saving hyAway searches as Hydrus file-search pages
- Scratchpad page actions for collecting individual files during browsing or review
- Page tag counts, tag sorting, and tag filtering for building new searches from current page tags
- Buttons at the end of review to navigate to other pages

### Info for deciding what to do with a file

- Image, video, and audio viewers
- Tags
- Metadata (file size, dimensions, etc.)
- Ratings
- Notes, including inline add, edit, rename, and delete on file pages

### Review queue itself

- Swipe-based archive/delete flow
- Skip/undo support while reviewing
- Configurable swipe bindings and thresholds
- Rating and tag actions during review
- Swipe action profiles for switching between review workflows
- Touch and keyboard controls
- Review footer actions for the current file

### Review-like actions outside the queue

- Archive/delete from gallery and file pages
- Add or edit ratings
- Add files to the scratchpad page

### Review of the review

- Undo and recovery paths for mistakes
- Decision filmstrip at the end of review, grouped by action, with action count breakdowns
- Predefined queries for recently archived and recently trashed files
- Watch history

### Viewing statistics

- Most viewed
- Longest viewed

### Mobile support and customization

- Primary use case is mobile or tablet
- Focus on touch, large touch targets
- Desktop supported, but trying to keep UI density relatively low
- Keep UI consistent, provide a reasonable amount of customization

## Likely future features

### Using existing Client API

New features will serve the review workflow. Some examples:

- Add/remove tags from file pages and gallery items
- Actions on whole pages, like archive all or trash all
- Multi select on gallery views
- Stats about overall archive/review progress
- Further improvements to file loading

### Requiring Hydrus support

Some features depend on Hydrus supporting them and exposing them through the Client API:

- Namespace sorting though search api instead of doing it in hyAway
- Showing the search query of saved media pages
- Editing media page queries
- Moving, closing pages, other media page management
- Using Hydrus saved searches instead of browser local storage
- Notes positioning info for showing notes on images
- Hydrus grouping, including sending a whole group to review

## What hyAway is not

::: info Hydrus scope still applies
Hydrus has its own docs on [what Hydrus is for](https://hydrusnetwork.github.io/hydrus/getting_started_files.html#what_hydrus_is_for). hyAway does not change that scope.
It does not try to make Hydrus good at things Hydrus is not trying to be good at, e.g. editing in-progress files, acting as a comic manager, or becoming a music player.
:::

Some features are better covered by Hydrus itself or other tools:

- Import, download, and subscription management
- Downloader and parser configuration
- Tag sibling and parent management
- Bulk tag editing
- PTR management
- Duplicate processing
- Database migration and maintenance
- Sidecar import and export
- Auto-tagging
- IPFS
- Hydrus settings not related to review
- Heavy management tasks better suited to the desktop client
