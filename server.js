const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SESSIONS_FILE = path.join(__dirname, '.sessions.json');

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'legacy2024'
};

const defaultProducts = [
    {
        id: 1,
        name: "Discord Nitro Basic",
        duration: "1 Month",
        price: 2.99,
        originalPrice: 4.99,
    },
    {
        id: 2,
        name: "Discord Nitro Basic",
        duration: "3 Months",
        price: 7.99,
        originalPrice: 14.99,
    },
    {
        id: 3,
        name: "Discord Nitro",
        duration: "1 Month",
        price: 4.99,
        originalPrice: 9.99,
    },
    {
        id: 4,
        name: "Discord Nitro",
        duration: "3 Months",
        price: 12.99,
        originalPrice: 29.99,
    },
    {
        id: 5,
        name: "Discord Nitro",
        duration: "1 Year",
        price: 39.99,
        originalPrice: 99.99,
    },
    {
        id: 6,
        name: "Server Boost",
        duration: "1 Month",
        price: 3.99,
        originalPrice: 4.99,
    }
];

function loadProducts() {
    try {
        if (fs.existsSync(PRODUCTS_FILE)) {
            const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading products:', err);
    }
    return defaultProducts;
}

function saveProducts(products) {
    try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving products:', err);
        return false;
    }
}

function loadSessions() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading sessions:', err);
    }
    return {};
}

function saveSessions(sessions) {
    try {
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving sessions:', err);
        return false;
    }
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function isValidSession(token) {
    if (!token) return false;
    const sessions = loadSessions();
    const session = sessions[token];
    if (!session) return false;
    if (Date.now() > session.expires) {
        delete sessions[token];
        saveSessions(sessions);
        return false;
    }
    return true;
}

function requireAuth(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!isValidSession(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
}

if (!fs.existsSync(PRODUCTS_FILE)) {
    saveProducts(defaultProducts);
}

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const token = generateToken();
        const sessions = loadSessions();
        sessions[token] = {
            created: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000)
        };
        saveSessions(sessions);
        
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.post('/api/admin/logout', (req, res) => {
    const token = req.headers['x-admin-token'];
    if (token) {
        const sessions = loadSessions();
        delete sessions[token];
        saveSessions(sessions);
    }
    res.json({ success: true });
});

app.get('/api/admin/verify', (req, res) => {
    const token = req.headers['x-admin-token'];
    if (isValidSession(token)) {
        res.json({ success: true, authenticated: true });
    } else {
        res.json({ success: true, authenticated: false });
    }
});

app.get('/api/products', (req, res) => {
    const products = loadProducts();
    res.json(products);
});

app.post('/api/checkout', (req, res) => {
    const order = req.body;
    console.log('New Order Received:', order);
    
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
        const payload = {
            embeds: [{
                title: 'New Order Received',
                color: 0x7c3aed,
                fields: [
                    { name: 'Order ID', value: order.orderId, inline: true },
                    { name: 'Total', value: `₹${order.total}`, inline: true },
                    { name: 'Payment Method', value: order.paymentMethod.toUpperCase(), inline: true },
                    { name: 'Discord', value: order.discord, inline: true },
                    { name: 'Telegram', value: order.telegram || 'N/A', inline: true },
                    { name: 'Instagram', value: order.instagram || 'N/A', inline: true },
                    { name: 'Items', value: order.items },
                    { name: 'Message', value: order.message || 'No message' }
                ],
                timestamp: new Date().toISOString()
            }]
        };

        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error('Webhook error:', err));
    }

    res.json({ success: true, orderId: order.orderId });
});

app.post('/api/products', requireAuth, (req, res) => {
    const products = loadProducts();
    const newProduct = {
        id: Date.now(),
        name: req.body.name,
        duration: req.body.duration,
        price: parseFloat(req.body.price),
        originalPrice: parseFloat(req.body.originalPrice),
        image: req.body.image || '',
        qr: req.body.qr || '',
        ltcAddress: req.body.ltcAddress || '',
        color: req.body.color || 'purple',
        icon: 'fa-box'
    };
    products.push(newProduct);
    if (saveProducts(products)) {
        res.json({ success: true, product: newProduct });
    } else {
        res.status(500).json({ success: false, error: 'Failed to save product' });
    }
});

app.put('/api/products/:id', requireAuth, (req, res) => {
    const products = loadProducts();
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    products[index] = {
        ...products[index],
        name: req.body.name,
        duration: req.body.duration,
        price: parseFloat(req.body.price),
        originalPrice: parseFloat(req.body.originalPrice),
        image: req.body.image || '',
        qr: req.body.qr || '',
        ltcAddress: req.body.ltcAddress || '',
        color: req.body.color || 'purple'
    };
    
    if (saveProducts(products)) {
        res.json({ success: true, product: products[index] });
    } else {
        res.status(500).json({ success: false, error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
    let products = loadProducts();
    const id = parseInt(req.params.id);
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);
    
    if (products.length === initialLength) {
        return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    if (saveProducts(products)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
});

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Legacy Store server running at http://0.0.0.0:${PORT}`);
    console.log(`Admin credentials - Username: ${ADMIN_CREDENTIALS.username}, Password: ${ADMIN_CREDENTIALS.password}`);
});
