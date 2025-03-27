BEGIN;

-- Drop existing type if exists to recreate it with new values
DROP TYPE IF EXISTS time_entry_type CASCADE;

-- Create enum type for entry types with distinct start/end for pauses
CREATE TYPE time_entry_type AS ENUM (
  'entrada', 
  'salida', 
  'inicioPausaCafe', 
  'finPausaCafe', 
  'inicioPausaComida', 
  'finPausaComida', 
  'inicioOtros', 
  'finOtros'
);

-- Check if time_entries table exists and handle column type
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'time_entries') THEN
    -- Table exists, check if the column 'type' exists
    IF EXISTS (SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'time_entries' 
              AND column_name = 'type') THEN
      -- Column exists, alter its type
      ALTER TABLE time_entries 
      ALTER COLUMN type TYPE time_entry_type USING type::text::time_entry_type;
    ELSE
      -- Column does not exist, add it
      ALTER TABLE time_entries
      ADD COLUMN type time_entry_type NOT NULL DEFAULT 'entrada';
    END IF;
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE time_entries (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      type time_entry_type NOT NULL,
      timestamp timestamptz NOT NULL DEFAULT now(),
      notes text,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    -- Add RLS policies
    ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

    -- Policy to allow users to read their own time entries
    CREATE POLICY "Users can read their own time entries"
      ON time_entries
      FOR SELECT
      USING (auth.uid() = user_id);

    -- Policy to allow users to insert their own time entries
    CREATE POLICY "Users can insert their own time entries"
      ON time_entries
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Policy to allow users to update their own time entries
    CREATE POLICY "Users can update their own time entries"
      ON time_entries
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Check if daily_summaries table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_summaries') THEN
    -- Table exists, alter it to add the new columns if they don't exist
    
    -- Check and add pause_cafe_time column if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'daily_summaries' 
                  AND column_name = 'pause_cafe_time') THEN
      ALTER TABLE daily_summaries 
      ADD COLUMN pause_cafe_time INT NOT NULL DEFAULT 0;
    END IF;
    
    -- Check and add pause_comida_time column if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'daily_summaries' 
                  AND column_name = 'pause_comida_time') THEN
      ALTER TABLE daily_summaries 
      ADD COLUMN pause_comida_time INT NOT NULL DEFAULT 0;
    END IF;
    
    -- Check and add otros_time column if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'daily_summaries' 
                  AND column_name = 'otros_time') THEN
      ALTER TABLE daily_summaries 
      ADD COLUMN otros_time INT NOT NULL DEFAULT 0;
    END IF;
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE daily_summaries (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      date date NOT NULL,
      total_time INT NOT NULL DEFAULT 0, -- in seconds
      start_time timestamptz,
      end_time timestamptz,
      breaks_count INT NOT NULL DEFAULT 0,
      breaks_time INT NOT NULL DEFAULT 0, -- in seconds
      pause_cafe_time INT NOT NULL DEFAULT 0, -- in seconds
      pause_comida_time INT NOT NULL DEFAULT 0, -- in seconds 
      otros_time INT NOT NULL DEFAULT 0, -- in seconds
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      
      -- Unique constraint to ensure only one summary per user per day
      UNIQUE(user_id, date)
    );

    -- Add RLS policies for daily_summaries
    ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

    -- Policy to allow users to read their own daily summaries
    CREATE POLICY "Users can read their own daily summaries"
      ON daily_summaries
      FOR SELECT
      USING (auth.uid() = user_id);
      
    -- Policy to allow authenticated users to insert daily summaries
    CREATE POLICY "Allow authenticated users to insert daily summaries" 
      ON daily_summaries 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
  END IF;
END $$;

-- Drop the function if it exists to recreate it
DROP FUNCTION IF EXISTS update_daily_summary() CASCADE;

-- Create or replace function to automatically update daily summary when time entries change
CREATE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  entry_date date;
  summary_id uuid;
  total_seconds int;
  breaks_count_val int;
  breaks_time_val int;
  pause_cafe_time_val int;
  pause_comida_time_val int;
  otros_time_val int;
  start_time_val timestamptz;
  end_time_val timestamptz;
BEGIN
  -- Get the date from the timestamp
  entry_date := date(NEW.timestamp);
  
  -- Check if a summary already exists for this user and date
  SELECT id INTO summary_id FROM daily_summaries 
  WHERE user_id = NEW.user_id AND date = entry_date;
  
  -- Calculate metrics for pause periods
  WITH pause_periods AS (
    -- Coffee break periods
    SELECT 
      s.timestamp AS start_time,
      e.timestamp AS end_time,
      'pausaCafe' AS type
    FROM time_entries s
    LEFT JOIN time_entries e ON 
      s.user_id = e.user_id AND
      e.type = 'finPausaCafe' AND
      e.timestamp > s.timestamp AND
      e.timestamp <= s.timestamp + interval '2 hours' -- Reasonable upper bound
    WHERE 
      s.user_id = NEW.user_id AND 
      date(s.timestamp) = entry_date AND
      s.type = 'inicioPausaCafe'
    
    UNION ALL
    
    -- Lunch break periods
    SELECT 
      s.timestamp AS start_time,
      e.timestamp AS end_time,
      'pausaComida' AS type
    FROM time_entries s
    LEFT JOIN time_entries e ON 
      s.user_id = e.user_id AND
      e.type = 'finPausaComida' AND
      e.timestamp > s.timestamp AND
      e.timestamp <= s.timestamp + interval '4 hours' -- Reasonable upper bound
    WHERE 
      s.user_id = NEW.user_id AND 
      date(s.timestamp) = entry_date AND
      s.type = 'inicioPausaComida'
    
    UNION ALL
    
    -- Other break periods
    SELECT 
      s.timestamp AS start_time,
      e.timestamp AS end_time,
      'otros' AS type
    FROM time_entries s
    LEFT JOIN time_entries e ON 
      s.user_id = e.user_id AND
      e.type = 'finOtros' AND
      e.timestamp > s.timestamp AND
      e.timestamp <= s.timestamp + interval '4 hours' -- Reasonable upper bound
    WHERE 
      s.user_id = NEW.user_id AND 
      date(s.timestamp) = entry_date AND
      s.type = 'inicioOtros'
  )
  SELECT 
    COUNT(*),
    COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)))::INT, 0),
    COALESCE(SUM(CASE WHEN type = 'pausaCafe' THEN EXTRACT(EPOCH FROM (end_time - start_time)) ELSE 0 END)::INT, 0),
    COALESCE(SUM(CASE WHEN type = 'pausaComida' THEN EXTRACT(EPOCH FROM (end_time - start_time)) ELSE 0 END)::INT, 0),
    COALESCE(SUM(CASE WHEN type = 'otros' THEN EXTRACT(EPOCH FROM (end_time - start_time)) ELSE 0 END)::INT, 0)
  INTO 
    breaks_count_val, breaks_time_val, pause_cafe_time_val, pause_comida_time_val, otros_time_val
  FROM pause_periods
  WHERE end_time IS NOT NULL;
  
  -- Get workday start and end time
  SELECT 
    MIN(timestamp) FILTER (WHERE type = 'entrada'),
    MAX(timestamp) FILTER (WHERE type = 'salida')
  INTO 
    start_time_val, end_time_val
  FROM time_entries
  WHERE user_id = NEW.user_id AND date(timestamp) = entry_date;
  
  -- Calculate total time (only if we have both start and end)
  IF start_time_val IS NOT NULL AND end_time_val IS NOT NULL THEN
    total_seconds := EXTRACT(EPOCH FROM (end_time_val - start_time_val))::INT - breaks_time_val;
    IF total_seconds < 0 THEN total_seconds := 0; END IF;
  ELSE
    total_seconds := 0;
  END IF;
  
  -- Insert or update summary
  IF summary_id IS NULL THEN
    INSERT INTO daily_summaries (
      user_id, date, total_time, start_time, end_time, 
      breaks_count, breaks_time, pause_cafe_time, pause_comida_time, otros_time
    ) VALUES (
      NEW.user_id, entry_date, total_seconds, start_time_val, end_time_val,
      breaks_count_val, breaks_time_val, pause_cafe_time_val, pause_comida_time_val, otros_time_val
    );
  ELSE
    UPDATE daily_summaries
    SET 
      total_time = total_seconds,
      start_time = start_time_val,
      end_time = end_time_val,
      breaks_count = breaks_count_val,
      breaks_time = breaks_time_val,
      pause_cafe_time = pause_cafe_time_val,
      pause_comida_time = pause_comida_time_val,
      otros_time = otros_time_val,
      updated_at = now()
    WHERE id = summary_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists and drop it if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'time_entry_summary_update') THEN
    DROP TRIGGER time_entry_summary_update ON time_entries;
  END IF;
END $$;

-- Create trigger to update daily summary on time entry changes
CREATE TRIGGER time_entry_summary_update
AFTER INSERT OR UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- Create indexes for performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'time_entries_user_id_timestamp_idx') THEN
    CREATE INDEX time_entries_user_id_timestamp_idx ON time_entries(user_id, timestamp);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'daily_summaries_user_id_date_idx') THEN
    CREATE INDEX daily_summaries_user_id_date_idx ON daily_summaries(user_id, date);
  END IF;
END $$;

COMMIT;

-- Generated by Copilot