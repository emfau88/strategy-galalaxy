# Repository Rules

## Authoritative repositories

| Purpose | Repository | Write policy |
| --- | --- | --- |
| Strategy Galalaxy development | `https://github.com/emfau88/strategy-galalaxy.git` | All new work, commits, and pushes go here |
| Galalaxy reference | `https://github.com/emfau88/galalaxy.git` | Read-only; never change, commit, or push |

## Local layout

The Strategy Galalaxy checkout is the workspace root. If the Galalaxy reference is needed locally, its clone lives at:

```text
.reference/galalaxy/
```

The entire `.reference/` directory is ignored by the Strategy Galalaxy repository. This prevents the nested clone or reference files from entering a Strategy Galalaxy commit.

The local reference clone keeps the official repository as its fetch URL. Its push URL is set to `DISABLED`, providing an additional guard against accidental pushes.

## Required checks before changing files

Before implementation or documentation work:

1. Confirm the working root resolves to `strategy-galalaxy`.
2. Confirm `origin` resolves to `https://github.com/emfau88/strategy-galalaxy.git`.
3. Treat all paths below `.reference/` as read-only source material.
4. Copy only selected files into the working repository; never develop inside the reference clone.

## Required checks before commits and pushes

Before every commit:

```powershell
git rev-parse --show-toplevel
git remote -v
git status --short
git diff --check
```

Before every push, verify that the destination remote belongs to `strategy-galalaxy`. Never run commit or push commands with `.reference/galalaxy` as the working directory.

## Reusing reference material

Reused code and assets must be deliberate. Each imported item is recorded in `docs/SOURCE_PROVENANCE.md` with its original path, reference commit, destination, adaptation, and reason for reuse.

Large subsystems are not copied blindly. The reference audit first classifies them as directly reusable, adaptable, concept-only, or unsuitable for this game.

## Recovery check

If repository identity is ever uncertain, stop all writes and run the read-only checks above. Work resumes only after the Strategy Galalaxy root and remote are confirmed.

