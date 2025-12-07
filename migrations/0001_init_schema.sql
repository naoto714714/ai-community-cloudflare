-- Migration number: 0001   2025-12-07T00:00:00.000Z

CREATE TABLE messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  channel_id  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  content     TEXT NOT NULL
);

CREATE INDEX idx_messages_channel_created_at
  ON messages (channel_id, created_at);

CREATE TABLE channels (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  channel_id  TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  members     TEXT NOT NULL DEFAULT '[]'
);

INSERT INTO channels (channel_id, description, members)
VALUES
  ('雑談', '何でも自由に話せる場所', json('["u1", "u2", "u3", "u4", "gemini", "me"]')),
  ('ニュース', '最新のニュースや情報', json('["u1", "u5", "gemini", "me"]'));
