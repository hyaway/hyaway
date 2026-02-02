---
name: update-changelog
description: Add entries to the hyAway changelog at docs/changelog.md. Use when documenting new features, changes, bug fixes, deprecations, or security updates. Triggers when user mentions "changelog", "document changes", "release notes", or asks to record what changed.
---

# Update Changelog

Add entries to `docs/changelog.md` following Keep a Changelog format.

## Format

```markdown
## YYYY-MM-DD

### Added
- **Feature name** — User-facing description

### Changed
- Description of behavior change

### Fixed
- Description of bug fix
```

## Rules

1. Use today's date in `YYYY-MM-DD` format
2. Add new dates at top (after first `---` separator)
3. Use `---` between date sections
4. Bold significant features: `**Feature** — Description`
5. Only include categories that have entries
6. Be user-focused, not implementation-focused

## Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Fixed**: Bug fixes
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Security**: Security fixes
