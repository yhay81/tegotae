PRAGMA foreign_keys = ON;

CREATE TABLE sites (
  id TEXT PRIMARY KEY CHECK (length(id) = 32),
  access_key_hash TEXT NOT NULL CHECK (length(access_key_hash) = 64),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
  hostname TEXT NOT NULL CHECK (length(hostname) BETWEEN 1 AND 253),
  is_automated INTEGER NOT NULL DEFAULT 0 CHECK (is_automated IN (0, 1)),
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER
);

CREATE INDEX sites_last_seen_idx ON sites(last_seen_at);

CREATE TABLE pageview_buckets (
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL CHECK (length(occurred_on) = 10),
  occurred_hour INTEGER NOT NULL CHECK (occurred_hour BETWEEN 0 AND 23),
  path TEXT NOT NULL CHECK (length(path) BETWEEN 1 AND 500),
  referrer_host TEXT NOT NULL CHECK (length(referrer_host) <= 253),
  count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (site_id, occurred_on, occurred_hour, path, referrer_host)
);

CREATE INDEX pageview_buckets_date_idx
  ON pageview_buckets(site_id, occurred_on);

CREATE TABLE product_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_hash TEXT NOT NULL CHECK (length(session_hash) = 64),
  name TEXT NOT NULL CHECK (
    name IN (
      'visited',
      'site_created',
      'dashboard_opened',
      'snippet_copied',
      'dashboard_link_copied',
      'returned'
    )
  ),
  site_id TEXT NOT NULL DEFAULT '',
  is_automated INTEGER NOT NULL DEFAULT 0 CHECK (is_automated IN (0, 1)),
  occurred_on TEXT NOT NULL CHECK (length(occurred_on) = 10),
  created_at INTEGER NOT NULL
);

CREATE INDEX product_events_metrics_idx
  ON product_events(is_automated, name, occurred_on, session_hash);

CREATE INDEX product_events_expiry_idx ON product_events(created_at);
