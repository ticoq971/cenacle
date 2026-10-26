-- Sauvegardes en ligne de Cénacle : une ligne par joueur anonyme (id = SHA-256 de sa clé, la clé n'est jamais stockée)
CREATE TABLE IF NOT EXISTS saves (
  id         TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  score      REAL NOT NULL DEFAULT 0,
  ver        INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
