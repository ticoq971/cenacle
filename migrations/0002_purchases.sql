-- Achats Stripe de Cénacle : une ligne par session de paiement réglée (id = identifiant de session Stripe, unique), liée à l'empreinte du joueur anonyme
CREATE TABLE IF NOT EXISTS purchases (
  session_id TEXT PRIMARY KEY,
  id         TEXT NOT NULL,
  pack       TEXT NOT NULL,
  amount     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS purchases_id ON purchases (id);
