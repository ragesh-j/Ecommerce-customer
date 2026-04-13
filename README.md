# Ecommerce Customer App

A modern, responsive ecommerce customer-facing application built with React 19, TypeScript, and Tailwind CSS.

## Features

- 🛍️ Browse products with search, filter, and sort
- 🏷️ Category-based navigation
- 🛒 Cart management (backend-synced)
- 💳 Checkout with Razorpay payment integration
- 📦 Order tracking and history
- ⭐ Product reviews (after delivery)
- 👤 User profile with address management
- 🔐 Auth with email/password and Google OAuth
- 📱 Fully responsive design

## Tech Stack

- **React 19** with TypeScript
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Redux Toolkit** — auth state management
- **TanStack React Query** — server state and caching
- **Axios** — HTTP client with interceptors
- **React Router v6** — routing
- **Razorpay** — payment gateway

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (see [Ecommerce Backend](https://github.com/ragesh-j/Ecommerce))

### Installation

```bash
# Clone the repo
git clone https://github.com/ragesh-j/Ecommerce-customer.git
cd Ecommerce-customer

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SELLER_URL=http://localhost:5174
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:5175`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── app/              # Redux store and hooks
├── features/
│   ├── auth/         # Auth slice (token, user)
│   └── cart/         # Cart slice
├── pages/            # Page components
│   ├── Home.tsx
│   ├── Products.tsx
│   ├── ProductDetail.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── Orders.tsx
│   ├── Profile.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── AuthCallback.tsx
├── components/
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── services/         # API service functions
├── hooks/            # Custom hooks
└── routes/           # Router setup
```

## Authentication

- Email/password registration and login
- Google OAuth with redirect callback
- Access token stored in memory (Redux)
- Refresh token in httpOnly cookie
- Auto token refresh on expiry

## Payment Flow

1. User selects address and clicks "Place order"
2. Backend validates cart and creates Razorpay order
3. Razorpay popup opens
4. User pays → backend creates order + deducts stock
5. User dismisses → nothing created in DB

## Related Projects

- [Backend API](https://github.com/ragesh-j/Ecommerce)
- [Admin Panel](https://github.com/ragesh-j/Ecommerce-admin)
- [Seller Dashboard](https://github.com/ragesh-j/Ecommerce-seller)