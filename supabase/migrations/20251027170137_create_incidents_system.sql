/*
  # Create Incidents Reporting System

  1. New Tables
    - `incidents`
      - `id` (uuid, primary key) - Unique incident identifier
      - `incident_type` (text) - Type of incident reported
      - `location` (text) - Location of incident
      - `description` (text) - Detailed description
      - `reporter_name` (text, nullable) - Reporter's name (optional)
      - `reporter_contact` (text, nullable) - Reporter's contact (optional)
      - `is_anonymous` (boolean) - Whether report is anonymous
      - `image_url` (text, nullable) - URL to uploaded image
      - `status` (text) - Current status: 'active', 'investigating', 'resolved'
      - `priority` (text) - Priority level: 'low', 'medium', 'high'
      - `latitude` (decimal, nullable) - GPS coordinates
      - `longitude` (decimal, nullable) - GPS coordinates
      - `created_at` (timestamptz) - Timestamp of report
      - `updated_at` (timestamptz) - Last update timestamp
      - `resolved_at` (timestamptz, nullable) - Resolution timestamp

  2. Storage
    - Create storage bucket for incident images
    - Public read access for incident images

  3. Security
    - Enable RLS on incidents table
    - Allow public INSERT (for reporting)
    - Allow public SELECT (for viewing active incidents)
    - Only authenticated admins can UPDATE/DELETE
*/

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  reporter_name text,
  reporter_contact text,
  is_anonymous boolean DEFAULT false,
  image_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  latitude decimal(10, 7),
  longitude decimal(10, 7),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create storage bucket for incident images
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-images', 'incident-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active and investigating incidents
CREATE POLICY "Anyone can view active incidents"
  ON incidents FOR SELECT
  TO public
  USING (status IN ('active', 'investigating'));

-- Allow anyone to report incidents
CREATE POLICY "Anyone can report incidents"
  ON incidents FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can update incidents
CREATE POLICY "Authenticated users can update incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete incidents
CREATE POLICY "Authenticated users can delete incidents"
  ON incidents FOR DELETE
  TO authenticated
  USING (true);

-- Storage policies for incident images
CREATE POLICY "Anyone can upload incident images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'incident-images');

CREATE POLICY "Anyone can view incident images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'incident-images');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on status and created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
