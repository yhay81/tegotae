# Metrics

## Funnel

| Stage               | Database signal                                               |
| ------------------- | ------------------------------------------------------------- |
| User                | non-automated `visited` event                                 |
| Creator             | non-automated `site_created` event                            |
| Installation intent | `snippet_copied` and management link saved                    |
| Job activated       | a non-automated site has aggregated pageviews                 |
| Job repeated        | a non-automated site receives pageviews on at least two dates |
| Dashboard value     | `dashboard_opened` by a non-automated session                 |
| Returned            | non-automated `returned` event                                |

`npm run metrics` prints aggregate production JSON. Automated QA uses `?qa=1` or WebDriver detection and is excluded. Pageviews, smoke tests, IndexNow responses, and anonymous visits alone are not counted as verified users.

No report output contains site names, hostnames, paths, referrers, session hashes, site IDs, or management keys.

## Decision metrics

- `creators / users`: whether the operational surface is understandable.
- `sites_with_data / sites_created`: whether owners complete installation.
- `returning_sites / sites_with_data`: whether the dashboard remains useful after the first day.
- Direct confirmation that an owner would replace their previous analytics tool is required for the final success decision.
