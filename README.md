# Shopify AI Product Photography App

A Laravel-based Shopify app for AI-powered product photography using Google Gemini API. This application features a dual-frontend architecture with both a Shopify embedded app interface and an internal admin panel.

## 🏗️ Architecture

### Dual Frontend Architecture

This application uses two separate frontend layouts:

1. **Shopify Embedded App** (`ShopifyLayout.jsx`)
   - Uses Shopify Polaris design system
   - Integrated with Shopify App Bridge
   - Routes: `/shopify/*`
   - Middleware: `verify.shopify`

2. **Internal Admin Panel** (`AdminLayout.jsx`)
   - Custom Tailwind CSS sidebar layout
   - Standard Laravel authentication
   - Routes: `/admin/*`
   - Middleware: `auth`, `verified`

## 🚀 Tech Stack

### Backend
- **Laravel 12** - PHP framework
- **kyon147/laravel-shopify** - Shopify OAuth, billing, and webhooks
- **guzzlehttp/guzzle** - HTTP client for Gemini API requests
- **Laravel Breeze** - Authentication scaffolding
- **Inertia.js** - Modern monolith approach

### Frontend
- **React** - UI library
- **Inertia.js** - Server-driven SPA
- **Tailwind CSS** - Utility-first CSS framework
- **Shopify Polaris** - Shopify's design system
- **@shopify/app-bridge-react** - Shopify Admin iframe integration
- **lucide-react** - Icon library

## 📦 Installation

All packages have been installed. The project is ready for configuration.

### Environment Configuration

Update your `.env` file with your credentials:

```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_API_SCOPES=read_products,write_products,read_content,write_content
SHOPIFY_APP_HOST_NAME=your-app-url.com
SHOPIFY_BILLING_ENABLED=false

# Gemini AI API Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_MODEL=gemini-1.5-flash
```

### Database Setup

Run migrations:

```bash
php artisan migrate
```

### Shopify Configuration

Publish and configure Shopify settings:

```bash
# Already done during setup
php artisan vendor:publish --provider="Osiset\ShopifyApp\ShopifyAppProvider" --tag=shopify-config

# Edit config/shopify-app.php as needed
```

## 🎨 Frontend Development

### Development Server

Run the Vite development server:

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🗂️ Project Structure

### Routes (`routes/web.php`)

```
/shopify/*          - Shopify embedded app routes (verify.shopify middleware)
  ├── /dashboard    - Main Shopify app dashboard
  ├── /products     - Product photography management
  ├── /ai-processing - AI processing queue and results
  ├── /billing      - Subscription management
  └── /settings     - Merchant settings

/admin/*            - Internal admin panel (auth middleware)
  ├── /dashboard    - Admin dashboard
  ├── /merchants    - Manage all merchants
  ├── /products     - View all products
  ├── /ai-processing - Monitor AI jobs
  ├── /analytics    - Analytics and reporting
  └── /settings     - System settings
```

### Layouts (`resources/js/Layouts/`)

- **ShopifyLayout.jsx** - Wraps Shopify embedded pages with App Bridge and Polaris
- **AdminLayout.jsx** - Provides sidebar navigation for admin panel
- **AuthenticatedLayout.jsx** - Default Breeze authenticated layout
- **GuestLayout.jsx** - Default Breeze guest layout

### Creating New Pages

#### Shopify Embedded Page

```jsx
import ShopifyLayout from '@/Layouts/ShopifyLayout';
import { Page, Card, Button } from '@shopify/polaris';

export default function MyShopifyPage({ apiKey, shop }) {
    return (
        <ShopifyLayout apiKey={apiKey}>
            <Page title="My Feature">
                <Card>
                    {/* Your Polaris components */}
                </Card>
            </Page>
        </ShopifyLayout>
    );
}
```

#### Admin Panel Page

```jsx
import AdminLayout from '@/Layouts/AdminLayout';

export default function MyAdminPage() {
    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">My Admin Feature</h1>
                {/* Your Tailwind-styled content */}
            </div>
        </AdminLayout>
    );
}
```

## 🔧 Configuration Files

### Shopify Configuration
- `config/shopify-app.php` - Main Shopify app configuration

### Vite Configuration
- `vite.config.js` - Frontend build configuration
- Polaris CSS is imported in `ShopifyLayout.jsx`

## 📝 Next Steps

1. **Configure Shopify App**
   - Create app in Shopify Partners dashboard
   - Add API credentials to `.env`
   - Set up app URLs and scopes

2. **Configure Gemini API**
   - Get API key from Google AI Studio
   - Add to `.env`

3. **Create Controllers**
   - `app/Http/Controllers/Shopify/` - Shopify app controllers
   - `app/Http/Controllers/Admin/` - Admin panel controllers

4. **Build Features**
   - Product upload interface
   - AI image processing service
   - Billing integration
   - Webhook handlers

5. **Database Models**
   - Create models for shops, products, AI jobs, etc.
   - Set up relationships

## 🔐 Authentication & Middleware

### Shopify Routes
Use `verify.shopify` middleware (provided by kyon147/laravel-shopify):
- Validates Shopify OAuth
- Handles session management
- Protects routes from unauthorized access

### Admin Routes
Use standard Laravel `auth` middleware:
- For internal team members
- Separate from merchant authentication

## 📚 Documentation Links

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js](https://inertiajs.com/)
- [Shopify Polaris](https://polaris.shopify.com/)
- [Shopify App Bridge](https://shopify.dev/docs/api/app-bridge)
- [Laravel Shopify Package](https://github.com/kyon147/laravel-shopify)
- [Google Gemini API](https://ai.google.dev/)

## 🤝 Development Workflow

1. Start the Laravel server: `php artisan serve`
2. Start Vite dev server: `npm run dev`
3. Access admin panel: `http://localhost:8000/admin/dashboard`
4. For Shopify testing: Use ngrok or Laravel Sail with public URL

## 📄 License

This project is private and proprietary.
