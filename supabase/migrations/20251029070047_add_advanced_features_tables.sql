/*
  # Advanced Real Estate Features Migration

  ## New Tables Created
  
  ### 1. property_media
  - `id` (uuid, primary key) - Unique identifier
  - `property_id` (uuid, foreign key) - Reference to property
  - `media_type` (text) - Type: image or video
  - `media_url` (text) - URL to media file
  - `display_order` (integer) - Order for display
  - `created_at` (timestamptz) - Upload timestamp

  ### 2. bookings
  - `id` (uuid, primary key) - Unique identifier
  - `property_id` (uuid, foreign key) - Property being booked
  - `user_id` (uuid, foreign key) - User making booking
  - `check_in` (date) - Check-in date
  - `check_out` (date) - Check-out date
  - `guests` (integer) - Number of guests
  - `total_price` (numeric) - Total booking price
  - `status` (text) - Status: pending, confirmed, declined, cancelled
  - `payment_status` (text) - Payment status
  - `created_at` (timestamptz) - Booking creation timestamp

  ### 3. messages
  - `id` (uuid, primary key) - Unique identifier
  - `property_id` (uuid, foreign key) - Related property
  - `sender_id` (uuid, foreign key) - Message sender
  - `receiver_id` (uuid, foreign key) - Message receiver
  - `message` (text) - Message content
  - `read` (boolean) - Read status
  - `created_at` (timestamptz) - Message timestamp

  ### 4. inquiries
  - `id` (uuid, primary key) - Unique identifier
  - `property_id` (uuid, foreign key) - Property inquired about
  - `user_id` (uuid, foreign key) - User making inquiry
  - `name` (text) - Contact name
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone
  - `message` (text) - Inquiry message
  - `status` (text) - Status: new, in_progress, resolved
  - `created_at` (timestamptz) - Inquiry timestamp

  ### 5. recently_viewed
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - User who viewed
  - `property_id` (uuid, foreign key) - Property viewed
  - `viewed_at` (timestamptz) - View timestamp

  ## Updated Tables
  
  ### properties - New columns added:
  - `listing_type` (text) - Type: buy, rent, vacation
  - `price_per` (text) - Price period: month, week, day, one_time
  - `latitude` (numeric) - Property latitude
  - `longitude` (numeric) - Property longitude
  - `amenities` (text[]) - Array of amenities
  - `is_approved` (boolean) - Moderation approval status
  - `approved_by` (uuid) - Admin who approved
  - `approved_at` (timestamptz) - Approval timestamp
  - `availability_status` (text) - Available, booked, unavailable

  ## Security
  - RLS enabled on all new tables
  - Appropriate policies for each table based on user roles
*/

-- Add new columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'buy';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per text DEFAULT 'one_time';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available';

-- Create property_media table
CREATE TABLE IF NOT EXISTS property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  media_type text NOT NULL,
  media_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer DEFAULT 1,
  total_price numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'unpaid',
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Create recently_viewed table
CREATE TABLE IF NOT EXISTS recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Update profiles table to add admin role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Enable RLS on new tables
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- Property media policies
CREATE POLICY "Anyone can view property media"
  ON property_media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Property owners can insert media"
  ON property_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_media.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can delete media"
  ON property_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_media.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM properties WHERE id = bookings.property_id
  ));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and property owners can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM properties WHERE id = bookings.property_id
  ))
  WITH CHECK (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM properties WHERE id = bookings.property_id
  ));

-- Messages policies
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Inquiries policies
CREATE POLICY "Users can view their inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM properties WHERE id = inquiries.property_id
  ));

CREATE POLICY "Anyone can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Property owners can update inquiry status"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM properties WHERE id = inquiries.property_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM properties WHERE id = inquiries.property_id
  ));

-- Recently viewed policies
CREATE POLICY "Users can view their own history"
  ON recently_viewed FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their views"
  ON recently_viewed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their history"
  ON recently_viewed FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update properties policies for moderation
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;

CREATE POLICY "Users can view approved properties"
  ON properties FOR SELECT
  TO authenticated
  USING (is_approved = true OR user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS property_media_property_id_idx ON property_media(property_id);
CREATE INDEX IF NOT EXISTS bookings_property_id_idx ON bookings(property_id);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_check_in_idx ON bookings(check_in);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS inquiries_property_id_idx ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS recently_viewed_user_id_idx ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS properties_listing_type_idx ON properties(listing_type);
CREATE INDEX IF NOT EXISTS properties_is_approved_idx ON properties(is_approved);