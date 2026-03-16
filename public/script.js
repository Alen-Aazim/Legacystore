let products = [];
let cart = [];
let wishlist = [];
let editingProductId = null;
let adminToken = null;
let activeFilter = 'all';
let searchQuery = '';
let sortMode = 'default';
let selectedPaymentMethod = 'upi';
const LTC_ADDRESS = 'LYx1zNfX7zH7v8Vz1v1v1v1v1v1v1v1v1v';

async function init() {
    initNavScroll();
    initScrollTop();
    animateCounters();
    await loadProducts();
    renderProducts();
}

function initNavScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    const menu = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    menu.classList.toggle('open');
    hamburger.classList.toggle('active');
}

function closeMobileMenu() {
    const menu = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    menu.classList.remove('open');
    hamburger.classList.remove('active');
}

function getAdminToken() {
    if (!adminToken) adminToken = sessionStorage.getItem('adminToken');
    return adminToken;
}

function setAdminToken(token) {
    adminToken = token;
    if (token) sessionStorage.setItem('adminToken', token);
    else sessionStorage.removeItem('adminToken');
}

async function checkAuth() {
    const token = getAdminToken();
    if (!token) return false;
    try {
        const res = await fetch('/api/admin/verify', { headers: { 'X-Admin-Token': token } });
        const data = await res.json();
        return data.authenticated;
    } catch { return false; }
}

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        if (res.ok) products = await res.json();
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

function getFilteredProducts() {
    let filtered = [...products];
    if (activeFilter !== 'all') {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.duration.toLowerCase().includes(q)
        );
    }
    if (sortMode === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortMode === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortMode === 'discount') filtered.sort((a, b) => discountPct(b) - discountPct(a));
    return filtered;
}

function discountPct(p) {
    return Math.round((1 - p.price / p.originalPrice) * 100);
}

function filterProducts() {
    searchQuery = document.getElementById('productSearch').value.trim();
    sortMode = document.getElementById('productSort').value;
    const clearBtn = document.getElementById('clearSearch');
    if (searchQuery) clearBtn.classList.add('visible');
    else clearBtn.classList.remove('visible');
    renderProducts();
}

function setFilter(filter, el) {
    activeFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderProducts();
}

function clearSearch() {
    document.getElementById('productSearch').value = '';
    searchQuery = '';
    document.getElementById('clearSearch').classList.remove('visible');
    renderProducts();
}

function resetFilters() {
    activeFilter = 'all';
    searchQuery = '';
    sortMode = 'default';
    document.getElementById('productSearch').value = '';
    document.getElementById('productSort').value = 'default';
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.filter-tab[data-filter="all"]').classList.add('active');
    renderProducts();
}

function isWishlisted(id) {
    return wishlist.some(w => w.id === id);
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('emptyProducts');
    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        grid.innerHTML = filtered.map(product => {
            const pct = discountPct(product);
            const wishlisted = isWishlisted(product.id);
            const iconEl = product.image
                ? `<img src="${product.image}" class="product-thumb" alt="${product.name}" onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">`
                : `<i class="fas fa-box"></i>`;
            return `
            <div class="product-card ${product.color || 'purple'}">
                <div class="product-header">
                    <div class="product-icon-wrap">${iconEl}</div>
                    <div class="product-badges">
                        <span class="badge-discount">${pct}% OFF</span>
                        <button class="badge-wishlist ${wishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id})" title="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
                            <i class="${wishlisted ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-body">
                    <h3>${product.name}</h3>
                    <p class="product-duration"><i class="fas fa-clock"></i> ${product.duration}</p>
                    <div class="product-pricing">
                        <span class="price-current">₹${product.price.toFixed(2)}</span>
                        <span class="price-original">₹${product.originalPrice.toFixed(2)}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id})">
                            <i class="fas fa-shopping-bag"></i> Add to Cart
                        </button>
                        <button class="btn-quickview" onclick="openQuickview(${product.id})" title="Quick View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(c => c.id === productId);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });
    updateCartUI();
    showNotification(`${product.name} added to cart!`, 'success');
    const btn = document.querySelector(`.cart-btn`);
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => btn.style.transform = '', 300);
}

function removeFromCart(productId) {
    cart = cart.filter(c => c.id !== productId);
    updateCartUI();
    showNotification('Item removed', 'info');
}

function updateQuantity(productId, delta) {
    const item = cart.find(c => c.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(productId);
    else updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((s, c) => s + c.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    document.getElementById('cartTotal').textContent = `₹${total.toFixed(2)}`;
    const body = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    if (cart.length === 0) {
        body.innerHTML = `<div class="sidebar-empty"><i class="fas fa-shopping-basket"></i><p>Your cart is empty</p><button class="btn btn-outline" onclick="closeCart()">Browse Products</button></div>`;
        footer.style.display = 'none';
    } else {
        footer.style.display = 'flex';
        body.innerHTML = cart.map(item => {
            const thumb = item.image
                ? `<img src="${item.image}" alt="${item.name}" onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">`
                : `<i class="fas fa-box"></i>`;
            return `<div class="cart-item">
                <div class="cart-item-thumb">${thumb}</div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.duration} — ₹${item.price.toFixed(2)}</p>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                        <span class="qty-num">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
}

function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (isWishlisted(productId)) {
        wishlist = wishlist.filter(w => w.id !== productId);
        showNotification('Removed from wishlist', 'info');
    } else {
        wishlist.push(product);
        showNotification(`${product.name} added to wishlist!`, 'success');
    }
    document.getElementById('wishlistCount').textContent = wishlist.length;
    renderProducts();
    updateWishlistUI();
}

function updateWishlistUI() {
    const body = document.getElementById('wishlistItems');
    if (wishlist.length === 0) {
        body.innerHTML = `<div class="sidebar-empty"><i class="fas fa-heart-broken"></i><p>Your wishlist is empty</p><button class="btn btn-outline" onclick="closeWishlist()">Browse Products</button></div>`;
    } else {
        body.innerHTML = wishlist.map(item => `
            <div class="wishlist-item">
                <div class="wishlist-item-icon"><i class="fas fa-box"></i></div>
                <div class="wishlist-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.duration} — ₹${item.price.toFixed(2)}</p>
                </div>
                <div class="wishlist-item-actions">
                    <button class="action-btn edit" onclick="addToCart(${item.id}); closeWishlist();" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>
                    <button class="action-btn delete" onclick="toggleWishlist(${item.id})" title="Remove"><i class="fas fa-times"></i></button>
                </div>
            </div>`).join('');
    }
}

function openCart() {
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('wishlistSidebar').classList.remove('open');
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
    if (!document.querySelector('.modal.show')) document.getElementById('overlay').classList.remove('show');
}

function openWishlist() {
    updateWishlistUI();
    document.getElementById('wishlistSidebar').classList.add('open');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('cartSidebar').classList.remove('open');
}

function closeWishlist() {
    document.getElementById('wishlistSidebar').classList.remove('open');
    if (!document.querySelector('.modal.show')) document.getElementById('overlay').classList.remove('show');
}

function openQuickview(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const pct = discountPct(product);
    const iconEl = product.image
        ? `<img src="${product.image}" style="width:100%;height:100%;object-fit:contain;border-radius:12px;" onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">`
        : `<i class="fas fa-box" style="font-size:3rem;color:#a5b4fc;"></i>`;
    document.getElementById('quickviewContent').innerHTML = `
        <div class="quickview-grid">
            <div class="quickview-icon ${product.color || 'purple'}">${iconEl}</div>
            <div class="quickview-info">
                <span class="badge-discount">${pct}% OFF</span>
                <h2>${product.name}</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin:8px 0;"><i class="fas fa-clock"></i> ${product.duration}</p>
                <div class="qv-price">₹${product.price.toFixed(2)}</div>
                <div class="qv-original">Was ₹${product.originalPrice.toFixed(2)}</div>
                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button class="btn btn-primary" onclick="addToCart(${product.id}); closeQuickview();" style="flex:1">
                        <i class="fas fa-shopping-bag"></i> Add to Cart
                    </button>
                    <button class="badge-wishlist ${isWishlisted(product.id) ? 'active' : ''}" onclick="toggleWishlist(${product.id})" style="width:44px;height:44px;border:1px solid var(--border);background:var(--surface);border-radius:10px;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">
                        <i class="${isWishlisted(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>`;
    document.getElementById('quickviewModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
}

function closeQuickview() {
    document.getElementById('quickviewModal').classList.remove('show');
    if (!document.querySelector('.cart-sidebar.open, .wishlist-sidebar.open')) {
        document.getElementById('overlay').classList.remove('show');
    }
}

function selectPayment(method) {
    selectedPaymentMethod = method;
    document.getElementById('payUPI').classList.toggle('active', method === 'upi');
    document.getElementById('payLTC').classList.toggle('active', method === 'ltc');
}

function proceedToCheckout() {
    if (cart.length === 0) { showNotification('Your cart is empty!', 'warning'); return; }
    const discord = document.getElementById('checkoutDiscord').value.trim();
    if (!discord) { showNotification('Discord username is required!', 'warning'); return; }
    closeCart();
    document.getElementById('overlay').classList.add('show');
    const modal = document.getElementById('checkoutModal');
    modal.classList.add('show');
    document.getElementById('checkoutStep1').classList.remove('hidden');
    document.getElementById('checkoutStep2').classList.add('hidden');
    const title = document.getElementById('paymentTitle');
    const info = document.getElementById('paymentInfo');
    const qrContainer = document.getElementById('qrContainer');
    const ltcBox = document.getElementById('ltcAddressContainer');
    if (selectedPaymentMethod === 'ltc') {
        title.textContent = 'Pay with LTC';
        info.textContent = 'Send LTC to the address below';
        qrContainer.classList.add('hidden');
        ltcBox.classList.remove('hidden');
        const customLTC = cart.length === 1 && cart[0].ltcAddress ? cart[0].ltcAddress : LTC_ADDRESS;
        document.getElementById('ltcAddress').textContent = customLTC;
    } else {
        title.textContent = 'Scan to Pay';
        info.textContent = 'Scan the QR code with your payment app';
        qrContainer.classList.remove('hidden');
        ltcBox.classList.add('hidden');
        const customQR = cart.length === 1 && cart[0].qr ? cart[0].qr : null;
        if (customQR) {
            qrContainer.innerHTML = `<img src="${customQR}" style="width:200px;height:200px;border-radius:10px;">`;
        } else {
            generateQR();
        }
    }
}

function generateQR() {
    const wrap = document.getElementById('qrCode');
    if (!wrap) return;
    wrap.innerHTML = '';
    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    new QRCode(wrap, {
        text: `legacy-store:pay:${total.toFixed(2)}:${Date.now()}`,
        width: 200, height: 200,
        colorDark: '#6366f1', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

async function confirmPayment() {
    const discord = document.getElementById('checkoutDiscord').value.trim();
    const telegram = document.getElementById('checkoutTelegram').value.trim();
    const instagram = document.getElementById('checkoutInstagram').value.trim();
    const message = document.getElementById('checkoutMessage').value.trim();
    const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0).toFixed(2);
    const orderData = {
        orderId, discord, telegram, instagram, message,
        paymentMethod: selectedPaymentMethod,
        items: cart.map(c => `${c.name} (${c.quantity}x)`).join(', '),
        total
    };
    try {
        await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
    } catch(err) { console.error(err); }
    document.getElementById('checkoutStep1').classList.add('hidden');
    document.getElementById('checkoutStep2').classList.remove('hidden');
    cart = [];
    updateCartUI();
    showNotification('Order placed! Thank you!', 'success');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

function copyLTC() {
    const addr = document.getElementById('ltcAddress').textContent;
    navigator.clipboard.writeText(addr);
    showNotification('LTC address copied!', 'success');
}

function openAdminLogin() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    if (!document.querySelector('.cart-sidebar.open, .wishlist-sidebar.open')) {
        document.getElementById('overlay').classList.remove('show');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            setAdminToken(data.token);
            closeLoginModal();
            openAdminPanel();
            showNotification('Welcome, Admin!', 'success');
        } else {
            document.getElementById('loginError').classList.remove('hidden');
        }
    } catch {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function togglePassword() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('eyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

async function openAdminPanel() {
    const isAuth = await checkAuth();
    if (!isAuth) { openAdminLogin(); return; }
    document.getElementById('adminModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    renderAdminProductList();
}

function closeAdminPanel() {
    document.getElementById('adminModal').classList.remove('show');
    if (!document.querySelector('.cart-sidebar.open, .wishlist-sidebar.open')) {
        document.getElementById('overlay').classList.remove('show');
    }
    resetProductForm();
}

async function handleLogout() {
    try {
        await fetch('/api/admin/logout', {
            method: 'POST',
            headers: { 'X-Admin-Token': getAdminToken() }
        });
    } catch {}
    setAdminToken(null);
    closeAdminPanel();
    showNotification('Logged out successfully', 'info');
}

function switchAdminTab(tab) {
    document.getElementById('tab-add').classList.toggle('active', tab === 'add');
    document.getElementById('tab-manage').classList.toggle('active', tab === 'manage');
    document.getElementById('addProductTab').classList.toggle('hidden', tab !== 'add');
    document.getElementById('manageProductTab').classList.toggle('hidden', tab !== 'manage');
    if (tab === 'manage') renderAdminProductList();
}

function renderAdminProductList() {
    const list = document.getElementById('adminProductList');
    if (products.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">No products yet. Add one!</div>`;
        return;
    }
    list.innerHTML = products.map(p => {
        const iconEl = p.image
            ? `<img src="${p.image}" onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">`
            : `<i class="fas fa-box"></i>`;
        return `<div class="admin-product-item">
            <div class="admin-item-icon">${iconEl}</div>
            <div class="admin-item-info">
                <h4>${p.name}</h4>
                <p>${p.duration} — ₹${p.price.toFixed(2)}</p>
            </div>
            <div class="admin-item-actions">
                <button class="action-btn edit" onclick="editProduct(${p.id})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

async function saveProduct(event) {
    event.preventDefault();
    const token = getAdminToken();
    if (!token) { showNotification('Please login first', 'error'); closeAdminPanel(); openAdminLogin(); return; }
    const productData = {
        name: document.getElementById('productName').value,
        duration: document.getElementById('productDuration').value,
        price: parseFloat(document.getElementById('productPrice').value),
        originalPrice: parseFloat(document.getElementById('productOriginalPrice').value),
        image: document.getElementById('productImage').value,
        qr: document.getElementById('productQR').value,
        ltcAddress: document.getElementById('productLTC').value,
        color: document.getElementById('productColor').value
    };
    try {
        let res;
        if (editingProductId) {
            res = await fetch(`/api/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
                body: JSON.stringify(productData)
            });
        } else {
            res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
                body: JSON.stringify(productData)
            });
        }
        if (res.status === 401) { showNotification('Session expired. Please login again.', 'error'); setAdminToken(null); closeAdminPanel(); openAdminLogin(); return; }
        if (res.ok) {
            showNotification(editingProductId ? 'Product updated!' : 'Product added!', 'success');
            await loadProducts();
            renderProducts();
            renderAdminProductList();
            resetProductForm();
        } else {
            showNotification('Failed to save product', 'error');
        }
    } catch { showNotification('Failed to save product', 'error'); }
    editingProductId = null;
}

async function deleteProduct(productId) {
    const token = getAdminToken();
    if (!token) { showNotification('Please login first', 'error'); return; }
    if (!confirm('Delete this product?')) return;
    try {
        const res = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'X-Admin-Token': token }
        });
        if (res.status === 401) { showNotification('Session expired. Please login again.', 'error'); setAdminToken(null); closeAdminPanel(); openAdminLogin(); return; }
        if (res.ok) {
            await loadProducts();
            renderProducts();
            renderAdminProductList();
            showNotification('Product deleted!', 'info');
        } else {
            showNotification('Failed to delete product', 'error');
        }
    } catch { showNotification('Failed to delete product', 'error'); }
}

function editProduct(productId) {
    const p = products.find(p => p.id === productId);
    if (!p) return;
    editingProductId = productId;
    document.getElementById('productName').value = p.name;
    document.getElementById('productDuration').value = p.duration;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productOriginalPrice').value = p.originalPrice;
    document.getElementById('productImage').value = p.image || '';
    document.getElementById('productQR').value = p.qr || '';
    document.getElementById('productLTC').value = p.ltcAddress || '';
    document.getElementById('productColor').value = p.color || 'purple';
    document.getElementById('submitBtnText').textContent = 'Update Product';
    switchAdminTab('add');
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('submitBtnText').textContent = 'Add Product';
    editingProductId = null;
}

function closeAll() {
    closeCart();
    closeWishlist();
    closeCheckoutModal();
    closeAdminPanel();
    closeLoginModal();
    closeQuickview();
    document.getElementById('overlay').classList.remove('show');
}

function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
}

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) { current = target; clearInterval(timer); }
                el.textContent = Math.floor(current).toLocaleString() + '+';
            }, 16);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
}

function showNotification(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'notifOut 0.3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, 2800);
}

document.addEventListener('DOMContentLoaded', init);
