# YumRush - Food Delivery Application

## Overview
YumRush is a full-stack food delivery web application built with Node.js, Express, and PostgreSQL. The application features user authentication, product browsing, shopping cart functionality, and order management.

## Project Architecture

### Backend
- **Framework**: Express.js (ES modules)
- **Database**: PostgreSQL with pg driver
- **Session Management**: express-session with connect-pg-simple (PostgreSQL-backed sessions)
- **Authentication**: bcrypt for password hashing
- **Port**: 5000 (bound to 0.0.0.0)

### Frontend
- **Technology**: Vanilla JavaScript with HTML/CSS
- **Location**: `/public` directory
- **Default page**: iii.html

### Database Schema
1. **users**: User accounts with authentication
   - id, uid, email, pass_hash, name, phone, address, created_at, last_login_at

2. **products**: Available food items
   - id, name, price, img, description

3. **orders**: Customer orders
   - id, order_id, user_id, items (JSONB), total, payment_method, delivery info, status, placed_at

## Key Features
- User registration and login
- Product browsing with search
- Session-based shopping cart
- Checkout and order placement
- Responsive design

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET`: Session encryption key
- `PORT`: Server port (default: 5000)

## Database Setup
The database schema is defined in `init-db.sql`. To initialize:
```bash
psql $DATABASE_URL < init-db.sql
```

The database has already been initialized with the schema and 20 sample products.

## Security Notes
- **SESSION_SECRET**: Required environment variable - application will not start without it. Set as a secret in Replit.
- Passwords are hashed with bcrypt before storage
- Sessions are stored securely in PostgreSQL
- DATABASE_URL is also required and validated at startup

## Recent Changes (Nov 25, 2024)
- Migrated from GitHub import to Replit environment
- Created public directory structure
- Set up PostgreSQL database with schema
- Seeded database with 20 sample products
- Configured server to run on port 5000 with 0.0.0.0 binding
- Removed auto-browser-open functionality for Replit compatibility
- Created workflow for automatic server startup
- Added init-db.sql for reproducible database setup
- Added README.md and .gitignore
- Configured autoscale deployment target

## Development
- Run: `npm start`
- Dev mode: `npm run dev` (with nodemon)

## Deployment
- Target: Autoscale (stateless, scales with demand)
- Command: `node server.js`
- Port: 5000
