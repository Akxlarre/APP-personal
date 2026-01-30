-- Life Blocks MVP - Initial schema (Supabase/PostgreSQL)
-- Run with: supabase db push (or via Dashboard SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates (user's day templates)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);

-- Blocks (blocks belonging to a template)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  is_critical BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'work' CHECK (category IN ('work', 'health', 'home', 'ceo', 'social')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blocks_template ON blocks(template_id);

-- Daily schedule (instance of a template applied to a date)
CREATE TABLE IF NOT EXISTS daily_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_user_date ON daily_schedule(user_id, date);

-- Daily blocks (blocks for a given day, with overrides)
CREATE TABLE IF NOT EXISTS daily_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES daily_schedule(id) ON DELETE CASCADE,
  original_block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'in_debt')),
  completion_note TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_blocks_user_date ON daily_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_blocks_schedule ON daily_blocks(schedule_id);

-- Streaks (habit streaks per block name)
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_name TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_completed DATE,
  freeze_count INTEGER DEFAULT 2,
  freeze_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, block_name)
);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);

-- Habit debt (skipped critical blocks)
CREATE TABLE IF NOT EXISTS habit_debt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL,
  block_name TEXT NOT NULL,
  original_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'forgiven')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habit_debt_user ON habit_debt(user_id);

-- Shared blocks (invitations to blocks)
CREATE TABLE IF NOT EXISTS shared_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  confirmed_attendance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shared_blocks_invited ON shared_blocks(invited_user_id);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('protein', 'carb', 'vegetable', 'dairy', 'condiment')),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory_items(user_id);

-- Meal suggestions (recipes / dishes with required items as JSONB)
CREATE TABLE IF NOT EXISTS meal_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  required_items JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('quick', 'normal', 'elaborate')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn schedule (partner shift calendar)
CREATE TABLE IF NOT EXISTS turn_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  turn_type TEXT NOT NULL CHECK (turn_type IN ('morning', 'afternoon', 'double', 'off')),
  exceptions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_turn_schedule_user ON turn_schedule(user_id);

-- Achievements (optional, for gamification)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  block_name TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at to main tables
CREATE TRIGGER templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER blocks_updated_at BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER daily_schedule_updated_at BEFORE UPDATE ON daily_schedule FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER daily_blocks_updated_at BEFORE UPDATE ON daily_blocks FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER streaks_updated_at BEFORE UPDATE ON streaks FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER shared_blocks_updated_at BEFORE UPDATE ON shared_blocks FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER turn_schedule_updated_at BEFORE UPDATE ON turn_schedule FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policies: users see only their own data (and shared blocks where invited)
CREATE POLICY "Users own templates" ON templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see blocks of own templates" ON blocks FOR ALL USING (
  template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
);
CREATE POLICY "Users own daily_schedule" ON daily_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own daily_blocks" ON daily_blocks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own habit_debt" ON habit_debt FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own inventory" ON inventory_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own turn_schedule" ON turn_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);

-- Shared blocks: owner and invited user can access
CREATE POLICY "Shared blocks owner" ON shared_blocks FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Shared blocks invited" ON shared_blocks FOR ALL USING (auth.uid() = invited_user_id);

-- Realtime for shared_blocks (invitations)
ALTER PUBLICATION supabase_realtime ADD TABLE shared_blocks;
