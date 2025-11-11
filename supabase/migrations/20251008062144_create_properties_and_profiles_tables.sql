/*
  # Real Estate Application Database Schema

  ## Tables Created
  
  ### 1. profiles
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact phone number
  - `avatar_url` (text) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. properties
  - `id` (uuid, primary key) - Unique property identifier
  - `user_id` (uuid, foreign key) - Property owner reference
  - `title` (text) - Property title
  - `description` (text) - Detailed description
  - `price` (numeric) - Property price
  - `location` (text) - Property location/address
  - `city` (text) - City name
  - `state` (text) - State/Province
  - `bedrooms` (integer) - Number of bedrooms
  - `bathrooms` (integer) - Number of bathrooms
  - `area` (numeric) - Square footage
  - `property_type` (text) - Type: House, Apartment, Villa, etc.
  - `status` (text) - Status: available, sold, pending
  - `featured` (boolean) - Featured listing flag
  - `image_url` (text) - Primary property image
  - `created_at` (timestamptz) - Listing creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. favorites
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - User who favorited
  - `property_id` (uuid, foreign key) - Favorited property
  - `created_at` (timestamptz) - When favorited

  ## Security
  - RLS enabled on all tables
  - Users can read all properties
  - Users can only create/update/delete their own properties
  - Users can manage their own profile
  - Users can manage their own favorites
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  location text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  area numeric DEFAULT 0,
  property_type text DEFAULT 'House',
  status text DEFAULT 'available',
  featured boolean DEFAULT false,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS properties_user_id_idx ON properties(user_id);
CREATE INDEX IF NOT EXISTS properties_city_idx ON properties(city);
CREATE INDEX IF NOT EXISTS properties_price_idx ON properties(price);
CREATE INDEX IF NOT EXISTS properties_status_idx ON properties(status);
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_property_id_idx ON favorites(property_id);