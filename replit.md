# Legacy Store - Discord Nitro Shop

## Overview

Legacy Store is a modern e-commerce web application for selling Discord Nitro products. Built as a single-page application using vanilla JavaScript with an Express.js backend. Features a clean dark theme with indigo/cyan accents, a product grid with search/filter/sort, shopping cart, wishlist, quick-view, FAQ, and a secure admin panel for product management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application**: Pure HTML/CSS/JavaScript without frameworks
- **Design System**: Dark theme (deep navy #080b14) with indigo/cyan accent palette, Inter + Space Grotesk fonts, Font Awesome 6.4.0 icons
- **Styling Approach**: CSS custom properties, modern glassmorphism cards, smooth transitions
- **State Management**: Vanilla JS in-memory cart/wishlist state; products fetched from server API
- **Key UI Features**:
  - Hero section with orbital animation and floating badges
  - Product search bar, category filter tabs, sort dropdown
  - Wishlist sidebar with add-to-cart shortcut
  - Cart sidebar with quantity controls and checkout form
  - Quick-view modal for product details
  - QR code and LTC payment checkout flow
  - FAQ accordion section
  - Scroll-to-top button
  - Mobile hamburger menu
  - Admin login/management modals with tabbed UI

### Backend Architecture
- **Express.js Server**: Node.js with Express handling both static files and REST API
- **Port**: 5000, bound to 0.0.0.0
- **REST API Endpoints**:
  - `POST /api/admin/login` - Authenticate admin
  - `POST /api/admin/logout` - Invalidate session
  - `GET /api/admin/verify` - Validate session
  - `GET /api/products` - Public product list
  - `POST /api/products` - Add product (auth required)
  - `PUT /api/products/:id` - Update product (auth required)
  - `DELETE /api/products/:id` - Delete product (auth required)
  - `POST /api/checkout` - Submit order (sends Discord webhook if configured)

### Authentication & Security
- Admin credentials verified server-side
- 64-character random session tokens via Node.js crypto
- Sessions stored in `.sessions.json` with 24-hour expiry
- Client stores token in sessionStorage, sends as `X-Admin-Token` header

### Data Storage
- Products: `products.json` (flat file)
- Sessions: `.sessions.json` (flat file)
- No database — suitable for small-scale deployment

### File Structure
```
/
├── public/
│   ├── index.html      # Main store page
│   ├── styles.css      # All styling (Inter/Space Grotesk, dark theme, responsive)
│   └── script.js       # Cart, wishlist, quickview, FAQ, admin, filter/search logic
├── server.js           # Express server + REST API
├── products.json       # Product catalog
├── .sessions.json      # Active admin sessions
└── replit.md           # Project documentation
```

## External Dependencies

### NPM Packages
- **Express 5.2.1**: Web framework

### CDN Resources
- **Google Fonts**: Inter (300–800), Space Grotesk (400–700)
- **Font Awesome 6.4.0**: Icons
- **QRCodeJS**: QR code generation in checkout modal

### Environment Variables
- `DISCORD_WEBHOOK_URL` (optional): Webhook URL for order notifications

### New Features Added (v2)
1. Product search bar with live filtering
2. Category filter tabs (All / Nitro Basic / Nitro / Server Boost)
3. Sort by price and discount
4. Wishlist sidebar with heart button on cards
5. Quick-view product modal
6. FAQ accordion section
7. Mobile hamburger navigation menu
8. Scroll-to-top button
9. Counter animation for hero stats
10. Completely redesigned UI — new dark indigo theme, orbital hero, modern card layout
