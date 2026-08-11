# Security Policy

## Supported versions

`edit-table-pro` is pre-1.0. Only the latest published version receives fixes.

| Version | Supported |
| --- | --- |
| latest `0.x` | ✅ |
| anything older | ❌ |

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Use GitHub's private reporting:
[Report a vulnerability](https://github.com/zzgiabaozzbui/edit-table-pro/security/advisories/new).

You should get an acknowledgement within 7 days. If a fix is warranted, it ships in a patch
release and the advisory is published once users have had a chance to upgrade.

## Threat model

This is a browser-side rendering library with **zero runtime dependencies**. It has no network
access, no storage access and no code evaluation. The realistic attack surface is:

- **Untrusted cell content.** Values are rendered as text via React, which escapes them. A
  `ColDef.render` callback, however, is your code — if it returns
  `dangerouslySetInnerHTML` built from row data, that is an XSS vector in your application,
  not in this library.
- **Clipboard input.** Pasted TSV is parsed as plain text and routed through the same
  validation pipeline as typed input. It is never evaluated.
- **`ColDef.validate` / `format` / `sideEffect` handlers.** Consumer-supplied functions; they
  run with whatever privileges your app has.

Reports about any of these being handled unsafely *by the library* are in scope.
