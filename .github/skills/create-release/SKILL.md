---
name: create-release
description: Create a GitHub release for hyAway by updating the changelog and tagging commits. Use when user wants to "release", "publish", "tag a version", or "create a release". Handles changelog updates, git tagging with date format (v2026.01.28), and pushing to trigger automated workflows.
---

# Create Release

Create releases with changelog entry and git tag.

## Tag Format

`vYYYY.MM.DD` (e.g., `v2026.01.28`)

## Process

1. **Update changelog** for today's date in `docs/changelog.md`
2. **Commit** if there are uncommitted changes
3. **Tag**: `git tag v2026.01.28`
4. **Push**: `git push origin v2026.01.28`

## What Happens Automatically

Tag push triggers:

- GitHub release with changelog content extracted
- Docker image tagged `ghcr.io/hyaway/hyaway:v2026.01.28`

## Commands

```bash
# Create and push release
git tag v2026.01.28 && git push origin v2026.01.28

# Tag specific commit
git tag v2026.01.28 <commit-hash>

# Delete tag (if needed to redo)
git tag -d v2026.01.28
git push origin :refs/tags/v2026.01.28
```

## Important

- Changelog entry date must match tag: `v2026.01.28` expects `## 2026-01-28`
- Tag must point to commit containing the changelog entry
- Old commits (before workflow existed) need manual dispatch via GitHub Actions UI
