# ops-center-viewer

Standalone, static, browser-hosted viewer for `project-logs.csv` files produced by the
[ops-center](https://github.com/nickbenes/ops-center) Claude Code skill — a flat,
Redux-DevTools-style turn/action log, plus a Mermaid diagram of agent-to-agent
communications.

No backend. Deployed to Vercel as a static site. Ships with three bundled demo runs and
an "upload your own `project-logs.csv`" option.

## Status

Actively being built — see [issues](../../issues) for the prioritized roadmap (P0 → P1 →
P2.1 → P2.2/P3).

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm test        # unit tests (Vitest)
npm run test:e2e  # end-to-end (Playwright)
```

## Deploy

Static build (`npm run build`) deployed to Vercel. See `vercel.json`.
