-- Create teams table for storing team data
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  lead TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  answered INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  spin_count INTEGER NOT NULL DEFAULT 0,
  used_divisions INTEGER[] NOT NULL DEFAULT '{}',
  attempt_log JSONB NOT NULL DEFAULT '[]',
  finished BOOLEAN NOT NULL DEFAULT false,
  global_elapsed INTEGER NOT NULL DEFAULT 0,
  joined_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Anyone can insert teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update teams" ON public.teams FOR UPDATE USING (true);

CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mcq',
  diff TEXT NOT NULL DEFAULT 'easy',
  opts TEXT[] DEFAULT NULL,
  ans TEXT NOT NULL,
  hint TEXT NOT NULL DEFAULT '',
  code TEXT DEFAULT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update questions" ON public.questions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete questions" ON public.questions FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();