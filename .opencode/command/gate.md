---
description: Run the full verification gate (lint, typecheck, tests, build).
agent: table-dev
---

Run every gate in order and report a compact PASS/FAIL table. If something fails, fix it before reporting done.

```bash
npm run check
npm run typecheck
npm run test:run
npm run build
```

$ARGUMENTS
