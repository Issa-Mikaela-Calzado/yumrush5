# YumRush - Food Delivery Application

A full-stack food delivery web application built with Node.js, Express, and PostgreSQL.

## Features
- User registration and authentication
- Product browsing with search functionality
- Session-based shopping cart
- Order placement and management
- Responsive design

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Session Store**: PostgreSQL-backed sessions (connect-pg-simple)
- **Authentication**: bcrypt

## Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (required for production)
- `PORT`: Server port (default: 5000)
- `COOKIE_NAME`: Session cookie name (default: yr.sid)

## Database Setup

### Initialize Database
To set up the database schema and seed data, run:
```bash
psql $DATABASE_URL < init-db.sql
```

Or manually create tables using the SQL in `init-db.sql`.

The script creates:
- `users` table for user accounts
- `products` table for food items
- `orders` table for customer orders
- Necessary indexes for performance

## Installation

```bash
npm install
```

## Running the Application

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Project Structure
```
.
├── server.js           # Express server and API routes
├── package.json        # Dependencies and scripts
├── init-db.sql         # Database schema and seed data
├── public/            # Static frontend files
│   ├── *.html         # HTML pages
│   ├── images/        # Product images
│   └── FOOD/          # Additional food images
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/me` - Get current user info

### Products
- `GET /api/products` - Get all products

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add item to cart

### Orders
- `POST /api/checkout` - Place order

## Admin Access

To make a user an admin, update their account in the database:

```sql
UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
```

Or in Replit, use the database tool to run:
```bash
psql $DATABASE_URL -c "UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';"
```

Once a user has admin privileges, they will see the "Admin Panel" button in the navigation bar.

## Security Notes
- Passwords are hashed using bcrypt
- Sessions are stored in PostgreSQL
- CORS is enabled for cross-origin requests
- **Important**: Set `SESSION_SECRET` environment variable in production

## Deployment
The application is configured for deployment with:
- Autoscaling target
- Port 5000 binding to 0.0.0.0
- Production-ready Express server

## License
ISC
