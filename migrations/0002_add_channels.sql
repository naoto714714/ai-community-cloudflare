-- Migration number: 0002   2025-12-07T00:00:00.000Z

CREATE TABLE channels (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  channel_id  TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  members     TEXT NOT NULL DEFAULT '[]'
);

-- seed initial channels
INSERT INTO channels (channel_id, description, members)
VALUES
  ('雑談', '何でも自由に話せる場所', json('["u1", "u2", "u3", "u4", "gemini", "me"]')),
  ('ニュース', '最新のニュースや情報', json('["u1", "u5", "gemini", "me"]'));
