-- YumRush Database Schema
-- This file initializes the database schema and seeds sample data

-- Create session table (required by connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  img VARCHAR(500),
  description TEXT
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cod',
  delivery_name VARCHAR(255) NOT NULL,
  delivery_phone VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'placed',
  placed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- Seed products (only if table is empty)
INSERT INTO products (name, price, img, description) 
SELECT * FROM (VALUES
  ('Adobo', 150.00, '/images/adobo.jpg', 'Classic Filipino chicken and pork adobo in savory soy sauce'),
  ('Sisig', 180.00, '/images/sisig.jpg', 'Sizzling pork sisig with onions and chili'),
  ('Fried Chicken', 120.00, '/images/FRIED.jpg', 'Crispy golden fried chicken'),
  ('BBQ', 100.00, '/images/bbq.jpg', 'Grilled BBQ skewers with sweet sauce'),
  ('Lumpia', 80.00, '/images/lumpia.jpg', 'Crispy Filipino spring rolls'),
  ('Pancit', 90.00, '/images/pan.jpg', 'Stir-fried noodles with vegetables'),
  ('Sushi', 250.00, '/images/SUSHI.jpg', 'Fresh assorted sushi platter'),
  ('Ramen', 180.00, '/images/RAMEN.jpg', 'Japanese ramen with pork and egg'),
  ('Burger', 130.00, '/images/fish.jpg', 'Juicy beef burger with cheese'),
  ('Pizza', 200.00, '/images/Valentines Day Heart Shaped Mini Pizza.jpg', 'Heart-shaped mini pizza'),
  ('Pasta Penne', 150.00, '/images/PENNE.jpg', 'Penne pasta in creamy sauce'),
  ('Pad Thai', 160.00, '/images/PAD.jpg', 'Thai stir-fried rice noodles'),
  ('Fried Rice', 80.00, '/images/FRIED.jpg', 'Classic garlic fried rice'),
  ('Chicken Wings', 140.00, '/images/WINGS.jpg', 'Spicy buffalo wings'),
  ('Salad', 100.00, '/images/SALAD.jpg', 'Fresh garden salad with dressing'),
  ('Taco', 120.00, '/images/TACO.jpg', 'Mexican tacos with beef'),
  ('Steak', 350.00, '/images/steak.jpg', 'Premium grilled ribeye steak'),
  ('French Fries', 60.00, '/images/fries.jpg', 'Crispy golden french fries'),
  ('Onion Rings', 70.00, '/images/ONION RINGS.jpg', 'Crunchy breaded onion rings'),
  ('Cake', 180.00, '/images/CAKE.jpg', 'Delicious chocolate cake slice')
) AS v(name, price, img, description)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
