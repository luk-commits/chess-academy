-- Seed data for E2E tests
-- Positions used by tests in frontend/tests/E2E/coach/positions.spec.ts

INSERT INTO positions (fen, opening, theme_tags, engine_top_lines, rating, difficulty, popularity, created_by_user_id)
VALUES
  (
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'Italian Game',
    '["opening","middlegame"]',
    '[{"moves":["e2e4"]}]',
    1500,
    1500,
    100,
    3
  ),
  (
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    'Fork Tactic',
    '["fork","tactic","middlegame"]',
    '[{"moves":["e7e5"]}]',
    1200,
    1200,
    80,
    3
  ),
  (
    '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
    'Basic Endgame',
    '["endgame"]',
    '[{"moves":["e1e2"]}]',
    800,
    800,
    60,
    3
  )
ON CONFLICT (fen) DO NOTHING;
