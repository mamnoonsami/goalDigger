-- =====================================================
-- Goal Digger — Seed Data
-- Run AFTER 001_initial_schema.sql
-- NOTE: profiles.id must match real auth.users rows.
--       These fake UUIDs work only with the RLS bypass
--       approach (SERVICE_ROLE key or disabling RLS).
--       To add real users: sign up via the app first,
--       then UPDATE profiles SET role = 'admin' WHERE id = '<your-uid>'.
-- =====================================================

-- ─────────────────────────────────────────────
-- We bypass the auth.users FK by inserting directly
-- into auth.users (only works in SQL Editor as service role)
-- ─────────────────────────────────────────────
DO $$
DECLARE
  uid_admin   UUID := '00000000-0000-0000-0000-000000000001';
  uid_manager UUID := '00000000-0000-0000-0000-000000000002';
  uid_p1      UUID := '00000000-0000-0000-0000-000000000003';
  uid_p2      UUID := '00000000-0000-0000-0000-000000000004';
  uid_p3      UUID := '00000000-0000-0000-0000-000000000005';
  uid_p4      UUID := '00000000-0000-0000-0000-000000000006';

  match_id_1  UUID := gen_random_uuid();
  match_id_2  UUID := gen_random_uuid();

  tourn_id    UUID := gen_random_uuid();
  tp_id_1     UUID := gen_random_uuid();
  tp_id_2     UUID := gen_random_uuid();
  tp_id_3     UUID := gen_random_uuid();
  tp_id_4     UUID := gen_random_uuid();
BEGIN

  -- ─────────────────────────────────────────────
  -- 1. FAKE auth.users rows (service-role only)
  -- ─────────────────────────────────────────────
  INSERT INTO auth.users (id, email, created_at, updated_at, raw_user_meta_data)
  VALUES
    (uid_admin,   'admin@goaldigger.com',   NOW(), NOW(), '{"first_name":"Carlos","last_name":"Admin"}'),
    (uid_manager, 'manager@goaldigger.com', NOW(), NOW(), '{"first_name":"Sofia","last_name":"Manager"}'),
    (uid_p1,      'ali@goaldigger.com',     NOW(), NOW(), '{"first_name":"Ali","last_name":"Hassan"}'),
    (uid_p2,      'marco@goaldigger.com',   NOW(), NOW(), '{"first_name":"Marco","last_name":"Rossi"}'),
    (uid_p3,      'yuki@goaldigger.com',    NOW(), NOW(), '{"first_name":"Yuki","last_name":"Tanaka"}'),
    (uid_p4,      'amara@goaldigger.com',   NOW(), NOW(), '{"first_name":"Amara","last_name":"Diallo"}')
  ON CONFLICT (id) DO NOTHING;
  -- The handle_new_user trigger will auto-insert into profiles.
  -- We update the profiles below with richer data.

  -- ─────────────────────────────────────────────
  -- 2. PROFILES — enrich the auto-created rows
  -- ─────────────────────────────────────────────
  UPDATE profiles SET
    role = 'admin', is_admin = true, is_viewer = false,
    player_position = 'midfielder', base_score = 85, goals = 12, matches_played = 20
  WHERE id = uid_admin;

  UPDATE profiles SET
    role = 'manager', is_manager = true, is_viewer = false,
    player_position = 'defender', base_score = 70, goals = 3, matches_played = 15,
    auction_budget = 2000
  WHERE id = uid_manager;

  UPDATE profiles SET
    role = 'player', is_player = true, is_viewer = false,
    player_position = 'forward', base_score = 80, goals = 18, matches_played = 22
  WHERE id = uid_p1;

  UPDATE profiles SET
    role = 'player', is_player = true, is_viewer = false,
    player_position = 'goalkeeper', base_score = 75, goals = 0, matches_played = 18
  WHERE id = uid_p2;

  UPDATE profiles SET
    role = 'player', is_player = true, is_viewer = false,
    player_position = 'midfielder', base_score = 72, goals = 9, matches_played = 16
  WHERE id = uid_p3;

  UPDATE profiles SET
    role = 'player', is_player = true, is_viewer = false,
    player_position = 'defender', base_score = 68, goals = 2, matches_played = 14
  WHERE id = uid_p4;

  -- ─────────────────────────────────────────────
  -- 3. MATCHES
  -- ─────────────────────────────────────────────
  INSERT INTO matches (id, title, scheduled_at, location, status, max_players, created_by, notes)
  VALUES
    (match_id_1, 'Friday Night Futsal', NOW() + INTERVAL '3 days', 'Sports Complex A', 'open',       10, uid_admin,   'Bring your own water'),
    (match_id_2, 'Weekend 11-a-side',   NOW() + INTERVAL '7 days', 'Central Park Pitch', 'balanced', 22, uid_manager, 'Teams already balanced');

  -- ─────────────────────────────────────────────
  -- 4. MATCH SIGNUPS
  -- ─────────────────────────────────────────────
  INSERT INTO match_signups (match_id, player_id, team)
  VALUES
    (match_id_1, uid_p1,      1),
    (match_id_1, uid_p2,      2),
    (match_id_1, uid_p3,      1),
    (match_id_1, uid_p4,      2),
    (match_id_2, uid_p1,      1),
    (match_id_2, uid_p2,      2),
    (match_id_2, uid_admin,   1),
    (match_id_2, uid_manager, 2);

  -- ─────────────────────────────────────────────
  -- 5. MATCH STATS  (for match_id_2 as completed data)
  -- ─────────────────────────────────────────────
  INSERT INTO match_stats (match_id, player_id, goals, assists, recorded_by)
  VALUES
    (match_id_2, uid_p1,    2, 1, uid_admin),
    (match_id_2, uid_p2,    0, 0, uid_admin),
    (match_id_2, uid_p3,    1, 2, uid_admin),
    (match_id_2, uid_admin, 1, 0, uid_admin);

  -- ─────────────────────────────────────────────
  -- 6. TOURNAMENTS
  -- ─────────────────────────────────────────────
  INSERT INTO tournaments (id, name, description, auction_start_at, auction_end_at, budget_per_manager, status, created_by)
  VALUES (
    tourn_id,
    'Spring Cup 2026',
    'Annual spring tournament with live player auction',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    1500,
    'auction',
    uid_admin
  );

  -- ─────────────────────────────────────────────
  -- 7. TOURNAMENT PLAYERS
  -- ─────────────────────────────────────────────
  INSERT INTO tournament_players (id, tournament_id, player_id, base_price, sold_to, sold_price)
  VALUES
    (tp_id_1, tourn_id, uid_p1, 200, uid_manager, 350),  -- sold to Sofia
    (tp_id_2, tourn_id, uid_p2, 150, NULL,         NULL), -- not yet sold
    (tp_id_3, tourn_id, uid_p3, 175, NULL,         NULL),
    (tp_id_4, tourn_id, uid_p4, 120, NULL,         NULL);

  -- ─────────────────────────────────────────────
  -- 8. BIDS
  -- ─────────────────────────────────────────────
  INSERT INTO bids (tournament_id, tournament_player_id, manager_id, amount, status)
  VALUES
    (tourn_id, tp_id_1, uid_manager, 300, 'outbid'),
    (tourn_id, tp_id_1, uid_manager, 350, 'won'),
    (tourn_id, tp_id_2, uid_manager, 160, 'active'),
    (tourn_id, tp_id_3, uid_manager, 180, 'active');

END $$;
