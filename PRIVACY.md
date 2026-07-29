# Privacy

## Measurement tag

- Sends: site ID, current page path, referrer hostname.
- Does not send: URL query, fragment, page title, form input, visitor ID, IP address, User-Agent.
- Does not set: Cookie, localStorage, advertising ID, browser fingerprint.
- Processing: every request is immediately added to an hourly aggregate keyed by site, date, page, and referrer. Individual pageview rows are not created.

## Product operation

The setup and dashboard surfaces use a first-party random anonymous browser ID for product-funnel measurement and basic abuse limits. It is not included in the measurement tag. Product events are deleted within 35 days.

## Retention and deletion

- Aggregated pageview buckets: up to 365 days.
- Unused site settings: deleted after 35 days without a received pageview.
- Product events: up to 35 days.
- Deletion: the capability-key dashboard deletes the site and all aggregate buckets immediately.
- Operator: yhay81.
- Security reports: use GitHub private vulnerability reporting; do not place secrets in a public Issue.
