#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Laravel Shopify App Setup..."
echo ""

# Check if Laravel is installed
if [ -f "artisan" ]; then
    echo -e "${GREEN}✓${NC} Laravel installed"
else
    echo -e "${RED}✗${NC} Laravel not found"
    exit 1
fi

# Check composer packages
echo ""
echo "📦 Checking Backend Packages..."

if grep -q "kyon147/laravel-shopify" composer.json; then
    echo -e "${GREEN}✓${NC} kyon147/laravel-shopify"
else
    echo -e "${RED}✗${NC} kyon147/laravel-shopify missing"
fi

if grep -q "guzzlehttp/guzzle" composer.json; then
    echo -e "${GREEN}✓${NC} guzzlehttp/guzzle"
else
    echo -e "${RED}✗${NC} guzzlehttp/guzzle missing"
fi

if grep -q "laravel/breeze" composer.json; then
    echo -e "${GREEN}✓${NC} laravel/breeze"
else
    echo -e "${RED}✗${NC} laravel/breeze missing"
fi

if grep -q "inertiajs/inertia-laravel" composer.json; then
    echo -e "${GREEN}✓${NC} inertiajs/inertia-laravel"
else
    echo -e "${RED}✗${NC} inertiajs/inertia-laravel missing"
fi

# Check npm packages
echo ""
echo "🎨 Checking Frontend Packages..."

if grep -q "@shopify/polaris" package.json; then
    echo -e "${GREEN}✓${NC} @shopify/polaris"
else
    echo -e "${RED}✗${NC} @shopify/polaris missing"
fi

if grep -q "@shopify/app-bridge-react" package.json; then
    echo -e "${GREEN}✓${NC} @shopify/app-bridge-react"
else
    echo -e "${RED}✗${NC} @shopify/app-bridge-react missing"
fi

if grep -q "lucide-react" package.json; then
    echo -e "${GREEN}✓${NC} lucide-react"
else
    echo -e "${RED}✗${NC} lucide-react missing"
fi

# Check configuration files
echo ""
echo "⚙️  Checking Configuration Files..."

if [ -f "config/shopify-app.php" ]; then
    echo -e "${GREEN}✓${NC} config/shopify-app.php"
else
    echo -e "${RED}✗${NC} config/shopify-app.php missing"
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    if grep -q "SHOPIFY_API_KEY" .env; then
        if grep -q "SHOPIFY_API_KEY=your-shopify-api-key" .env; then
            echo -e "${YELLOW}⚠${NC}  SHOPIFY_API_KEY needs configuration"
        else
            echo -e "${GREEN}✓${NC} SHOPIFY_API_KEY configured"
        fi
    fi
    
    if grep -q "GEMINI_API_KEY" .env; then
        if grep -q "GEMINI_API_KEY=your-gemini-api-key" .env; then
            echo -e "${YELLOW}⚠${NC}  GEMINI_API_KEY needs configuration"
        else
            echo -e "${GREEN}✓${NC} GEMINI_API_KEY configured"
        fi
    fi
else
    echo -e "${RED}✗${NC} .env file missing"
fi

# Check layouts
echo ""
echo "🎨 Checking Layout Files..."

if [ -f "resources/js/Shopify/Layouts/ShopifyLayout.jsx" ]; then
    echo -e "${GREEN}✓${NC} ShopifyLayout.jsx"
else
    echo -e "${RED}✗${NC} ShopifyLayout.jsx missing"
fi

if [ -f "resources/js/Admin/Layouts/AdminLayout.jsx" ]; then
    echo -e "${GREEN}✓${NC} AdminLayout.jsx"
else
    echo -e "${RED}✗${NC} AdminLayout.jsx missing"
fi

# Check example pages
echo ""
echo "📄 Checking Example Pages..."

if [ -f "resources/js/Shopify/Pages/Dashboard.jsx" ]; then
    echo -e "${GREEN}✓${NC} Shopify/Pages/Dashboard.jsx"
else
    echo -e "${RED}✗${NC} Shopify/Pages/Dashboard.jsx missing"
fi

if [ -f "resources/js/Admin/Pages/Dashboard.jsx" ]; then
    echo -e "${GREEN}✓${NC} Admin/Pages/Dashboard.jsx"
else
    echo -e "${RED}✗${NC} Admin/Pages/Dashboard.jsx missing"
fi

# Check routes
echo ""
echo "🛣️  Checking Routes..."

if [ -f "routes/shopify.php" ]; then
    echo -e "${GREEN}✓${NC} routes/shopify.php"
else
    echo -e "${RED}✗${NC} routes/shopify.php missing"
fi

if [ -f "routes/admin.php" ]; then
    echo -e "${GREEN}✓${NC} routes/admin.php"
else
    echo -e "${RED}✗${NC} routes/admin.php missing"
fi

if grep -q "routes/shopify.php" routes/web.php; then
    echo -e "${GREEN}✓${NC} Shopify routes loaded in web.php"
else
    echo -e "${RED}✗${NC} Shopify routes not loaded"
fi

if grep -q "routes/admin.php" routes/web.php; then
    echo -e "${GREEN}✓${NC} Admin routes loaded in web.php"
else
    echo -e "${RED}✗${NC} Admin routes not loaded"
fi

# Check documentation
echo ""
echo "📚 Checking Documentation..."

if [ -f "README.md" ]; then
    echo -e "${GREEN}✓${NC} README.md"
else
    echo -e "${RED}✗${NC} README.md missing"
fi

if [ -f "SETUP_COMPLETE.md" ]; then
    echo -e "${GREEN}✓${NC} SETUP_COMPLETE.md"
else
    echo -e "${RED}✗${NC} SETUP_COMPLETE.md missing"
fi

if [ -f "SHOPIFY_APP_BRIDGE_GUIDE.md" ]; then
    echo -e "${GREEN}✓${NC} SHOPIFY_APP_BRIDGE_GUIDE.md"
else
    echo -e "${RED}✗${NC} SHOPIFY_APP_BRIDGE_GUIDE.md missing"
fi

# Check build
echo ""
echo "🏗️  Checking Build..."

if [ -d "public/build" ]; then
    echo -e "${GREEN}✓${NC} Production build completed"
else
    echo -e "${YELLOW}⚠${NC}  No production build (run: npm run build)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Setup verification complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Shopify API credentials in .env"
echo "2. Configure Gemini API key in .env"
echo "3. Start development servers:"
echo "   - php artisan serve"
echo "   - npm run dev"
echo ""
echo "📖 Read SETUP_COMPLETE.md for detailed instructions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
