# Legacy Store - Discord Nitro Shop

## Overview

Legacy Store is a modern e-commerce web application for selling Discord Nitro products. The application features a premium dark theme with glass-morphism effects, animated gradient orb backgrounds, a shopping cart system, and a secure admin panel for product management. Built as a single-page application using vanilla JavaScript with an Express.js backend for API endpoints and static file serving.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application**: Pure HTML/CSS/JavaScript without frameworks
- **Design System**: Dark theme with animated gradient orbs, mesh grid, particle effects, and glass-morphism (frosted glass) UI components
- **Styling Approach**: CSS custom properties for theming, Poppins font family via Google Fonts, Font Awesome 6.4.0 for icons
- **State Management**: Vanilla JavaScript with in-memory cart state; products fetched from server API
- **Key UI Features**: Product grid with color-themed cards, slide-out cart sidebar, modal-based checkout flow with QR code payment, admin login/management modals

### Backend Architecture
- **Express.js Server**: Node.js with Express framework handling both static files and REST API
- **REST API Endpoints**:
  - `POST /api/admin/login` - Authenticate admin and receive session token
  - `POST /api/admin/logout` - Invalidate session token
  - `GET /api/admin/verify` - Validate current session token
  - `GET /api/products` - Public endpoint to list all products
  - `POST /api/products` - Add new product (requires authentication)
  - `PUT /api/products/:id` - Update existing product (requires authentication)
  - `DELETE /api/products/:id` - Remove product (requires authentication)
- **Port Configuration**: Server runs on port 5000, bound to 0.0.0.0 for external access

### Authentication & Security
- **Server-side Authentication**: Admin credentials verified on server, not exposed to browser
- **Session Tokens**: 64-character random tokens generated via crypto module
- **Token Storage**: Sessions persisted in `.sessions.json` file with 24-hour expiry
- **Client Token Handling**: Tokens stored in browser sessionStorage, sent via `X-Admin-Token` header

### Data Storage
- **JSON File Storage**: Products stored in `products.json`, sessions in `.sessions.json`
- **Shared State**: All users see identical product catalog (server-side source of truth)
- **No Database**: Flat file storage; suitable for small-scale deployment

### File Structure
```
/indexhtmlzipzip/indexhtmlzip/
├── index.html       # Main store page with product grid, cart, modals
├── styles.css       # All styling including animations and glass effects
├── script.js        # Cart logic, API calls, admin panel, product rendering
├── server.js        # Express server with REST API and static file serving
├── products.json    # Product catalog data
├── .sessions.json   # Active admin session tokens
└── replit.md        # Project documentation
```

## External Dependencies

### NPM Packages
- **Express 5.2.1**: Web framework for serving static files and handling API routes

### CDN Resources
- **Google Fonts**: Poppins font family (weights 300-900)
- **Font Awesome 6.4.0**: Icon library for UI elements (gems, crowns, shopping bag, etc.)

### Social/Contact Integrations
- **Telegram**: Customer support contact button
- **Discord**: Community/support contact button
- **Instagram**: Social media presence button

### Payment Flow
- QR code-based payment system (implementation details in checkout modal)
- No third-party payment processor integration currently visible