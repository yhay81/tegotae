# Security Policy

## Reporting

Use GitHub private vulnerability reporting for security issues. Do not post a management URL, access key, or production data in a public Issue.

## Implemented controls

- Management access uses a 256-bit random key in the URL fragment. Only its SHA-256 hash is stored and comparison is constant-time.
- Site creation and product events require same-origin requests, JSON content types, strict schemas, size limits, and a honeypot.
- Beacons are accepted only when the request Origin hostname matches the configured site hostname.
- Paths are stripped of query and fragment data. Referrers are reduced to hostnames.
- D1 stores hourly aggregates, not IP, User-Agent, visitor IDs, or individual pageviews.
- Hono JSX escapes server-rendered values. Client rendering uses `textContent`, not user-provided HTML.
- CSP, HSTS, frame denial, restrictive Permissions Policy, and `nosniff` are enabled.
- Dashboard responses are `no-store` and `noindex`.
- Dependencies and the Cloudflare compatibility date are pinned.

## Limitations

- A management link is a bearer capability. Anyone who receives the full fragment can view and delete the aggregate.
- Origin validation proves that a browser loaded the tag from the configured hostname; it is not domain ownership verification.
- A page path may itself contain personal data if the site owner designed it that way. Query strings are excluded, and owners should avoid personal data in paths.
