# Source Provenance

This log records every source file or asset later reused from the read-only Galalaxy reference repository.

## Reference baseline

| Field | Value |
| --- | --- |
| Repository | `https://github.com/emfau88/galalaxy.git` |
| Branch at initial clone | `main` |
| Initial audited commit | `d2c3a7bd1d8b5657b27b39bd7ce9a6414c770739` |
| Commit date | `2026-09-06T10:52:24+02:00` |
| Local location | `.reference/galalaxy/` (Git-ignored) |
| Policy | Read-only; fetch permitted, commits and pushes forbidden |

If the reference is updated before or during an audit, record the exact newer commit in the relevant entry rather than silently replacing this baseline.

## Reuse log

No code or assets have been copied yet.

Add one row per logical file or tightly related asset group:

| Reference path | Reference commit | Destination path | Reuse type | Adaptation | Reason |
| --- | --- | --- | --- | --- | --- |
| _Example: `src/example.js`_ | _full commit SHA_ | _`src/example.js`_ | _Direct / Adapted / Concept only_ | _Summary of changes_ | _Why reuse is appropriate_ |

## Reuse rules

- Record the source commit that was actually inspected or copied.
- Prefer explicit file paths over broad directory claims.
- Describe meaningful modifications rather than using a generic “adapted” label alone.
- Record derived assets as well as byte-for-byte copies.
- Keep conceptual inspiration in the audit document; use this file for concrete code and asset lineage.
- Verify licensing and attribution requirements during the reference audit before distributing reused material.

