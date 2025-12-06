-- Migration number: 0001 	 2025-12-06T13:02:05.245Z

CREATE TABLE messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_messages_channel_created_at
  ON messages (channel_id, created_at);
