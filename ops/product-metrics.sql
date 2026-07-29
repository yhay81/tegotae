WITH
  human_events AS (
    SELECT *
    FROM product_events
    WHERE is_automated = 0
  ),
  site_signals AS (
    SELECT
      s.id,
      COALESCE(SUM(p.count), 0) AS pageviews,
      COUNT(DISTINCT p.occurred_on) AS active_days
    FROM sites s
    LEFT JOIN pageview_buckets p ON p.site_id = s.id
    WHERE s.is_automated = 0
    GROUP BY s.id
  )
SELECT
  COUNT(DISTINCT CASE WHEN e.name IN ('visited', 'returned') THEN e.session_hash END) AS users,
  COUNT(DISTINCT CASE WHEN e.name = 'site_created' THEN e.session_hash END) AS creators,
  COUNT(DISTINCT CASE WHEN e.name = 'site_created' THEN e.site_id END) AS sites_created,
  COUNT(DISTINCT CASE WHEN e.name = 'snippet_copied' THEN e.session_hash END) AS snippet_copiers,
  COUNT(DISTINCT CASE WHEN e.name = 'dashboard_link_copied' THEN e.session_hash END) AS link_savers,
  COUNT(DISTINCT CASE WHEN e.name = 'dashboard_opened' THEN e.session_hash END) AS dashboard_users,
  COUNT(DISTINCT CASE WHEN e.name = 'returned' THEN e.session_hash END) AS returned_users,
  COUNT(DISTINCT CASE WHEN e.name IN ('visited', 'returned') AND e.occurred_on >= date('now', '-6 days') THEN e.session_hash END) AS users_7d,
  COUNT(DISTINCT CASE WHEN e.name = 'site_created' AND e.occurred_on >= date('now', '-6 days') THEN e.session_hash END) AS creators_7d,
  (SELECT COUNT(*) FROM site_signals WHERE pageviews > 0) AS sites_with_data,
  (SELECT COUNT(*) FROM site_signals WHERE active_days >= 2) AS returning_sites,
  (SELECT COALESCE(SUM(pageviews), 0) FROM site_signals) AS measured_pageviews
FROM human_events e;
