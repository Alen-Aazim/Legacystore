let products = [];
let cart = [];
let wishlist = [];
let compareList = [];
let editingProductId = null;
let adminToken = null;
let activeFilter = 'all';
let searchQuery = '';
let sortMode = 'default';
let selectedPaymentMethod = 'upi';
const LTC_ADDRESS = 'LYx1zNfX7zH7v8Vz1v1v1v1v1v1v1v1v1v';

const LIVE_FEED_MESSAGES = [
    'ShadowX just bought Discord Nitro Basic',
    'NeonRider purchased Discord Nitro 1Y',
    'GhostlyK added Server Boost to cart',
    'CyberWolf just bought Discord Nitro',
    'Phantom_99 purchased Nitro Basic 3M',
    'VoidHunter just bought Server Boost',
    'QuantumZ purchased Discord Nitro 1M',
    'StormCore just bought Nitro Basic',
    'NightByte purchased Discord Nitro',
    'DataPunk just bought Server Boost'
];

async function init() {
    drawBgCanvas();
    initScrollBehaviors();
    animateCounters();
    startDealTimer();
    startLiveFeed();
    await loadProducts();
    renderProducts();
    animateSpecBars();
    updateCartUI();
}

function drawBgCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.4 + 0.1
    }));

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#020408';
        ctx.fillRect(0, 0, w, h);
        const grad = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.5);
        grad.addColorStop(0, 'rgba(0,255,136,0.04)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        const grad2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, w * 0.4);
        grad2.addColorStop(0, 'rgba(0,212,255,0.04)');
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,255,136,${p.opacity})`;
            ctx.fill();
        });
        particles.forEach((p, i) => {
            particles.slice(i + 1).forEach(q => {
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = `rgba(0,255,136,${0.06 * (1 - d / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });
        requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
}

function initScrollBehaviors() {
    const header = document.getElementById('cyberHeader');
    const scrollBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.style.boxShadow = '0 4px 40px rgba(0,255,136,0.08)';
        else header.style.boxShadow = '';
        if (window.scrollY > 400) scrollBtn.classList.add('visible');
        else scrollBtn.classList.remove('visible');
    });
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function toggleMobileMenu() {
    document.getElementById('cyberNav').classList.toggle('open');
    document.getElementById('hamburger').classList.toggle('active');
}

function closeMobileMenu() {
    document.getElementById('cyberNav').classList.remove('open');
    document.getElementById('hamburger').classList.remove('active');
}

function startDealTimer() {
    const end = new Date();
    end.setHours(end.getHours() + 5, end.getMinutes() + 43, end.getSeconds() + 22);
    function tick() {
        const now = new Date();
        const diff = Math.max(0, end - now);
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        const th = document.getElementById('timerH');
        const tm = document.getElementById('timerM');
        const ts = document.getElementById('timerS');
        if (th) th.textContent = h;
        if (tm) tm.textContent = m;
        if (ts) ts.textContent = s;
    }
    tick();
    setInterval(tick, 1000);
}

function startLiveFeed() {
    function showFeed() {
        const msg = LIVE_FEED_MESSAGES[Math.floor(Math.random() * LIVE_FEED_MESSAGES.length)];
        const toast = document.createElement('div');
        toast.className = 'live-toast';
        toast.innerHTML = `<i class="fas fa-circle" style="color:var(--neon);font-size:0.5rem;"></i> ${msg}`;
        document.getElementById('liveFeed').appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
    setTimeout(() => {
        showFeed();
        setInterval(showFeed, 8000);
    }, 3000);
}

function animateSpecBars() {
    const fills = document.querySelectorAll('.spec-fill');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; obs.unobserve(e.target); }
        });
    }, { threshold: 0.5 });
    fills.forEach(f => obs.observe(f));
}

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const target = parseInt(el.dataset.target);
            const step = target / 100;
            let cur = 0;
            const t = setInterval(() => {
                cur += step;
                if (cur >= target) { cur = target; clearInterval(t); }
                el.textContent = Math.floor(cur).toLocaleString();
            }, 16);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
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
    } catch (err) { console.error(err); }
}

function discountPct(p) { return Math.round((1 - p.price / p.originalPrice) * 100); }
function savings(p) { return (p.originalPrice - p.price).toFixed(2); }

function getFiltered() {
    let list = [...products];
    if (activeFilter !== 'all') list = list.filter(p => p.name.toLowerCase().includes(activeFilter.toLowerCase()));
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.duration.toLowerCase().includes(q));
    }
    if (sortMode === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortMode === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortMode === 'discount') list.sort((a, b) => discountPct(b) - discountPct(a));
    return list;
}

function filterProducts() {
    searchQuery = document.getElementById('productSearch').value.trim();
    sortMode = document.getElementById('productSort').value;
    const clr = document.getElementById('clearSearch');
    if (searchQuery) clr.classList.add('visible'); else clr.classList.remove('visible');
    renderProducts();
}

function setFilter(filter, el) {
    activeFilter = filter;
    document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
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
    activeFilter = 'all'; searchQuery = ''; sortMode = 'default';
    document.getElementById('productSearch').value = '';
    document.getElementById('productSort').value = 'default';
    document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
    document.querySelector('.ftab[data-filter="all"]').classList.add('active');
    renderProducts();
}

function isWishlisted(id) { return wishlist.some(w => w.id === id); }
function isCompared(id) { return compareList.some(c => c.id === id); }

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('emptyProducts');
    const list = getFiltered();
    if (list.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        grid.innerHTML = list.map(p => {
            const pct = discountPct(p);
            const save = savings(p);
            const wishlisted = isWishlisted(p.id);
            const compared = isCompared(p.id);
            const iconEl = p.image
                ? `<img src="${p.image}" onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">`
                : `<i class="fas fa-box"></i>`;
            return `
            <div class="product-card-cyber ${p.color || 'purple'}">
                <div class="pcard-corner-tl"></div>
                <div class="pcard-corner-br"></div>
                <div class="pcard-theme-line"></div>
                <div class="pcard-header">
                    <div class="pcard-icon">${iconEl}</div>
                    <div class="pcard-meta">
                        <div class="pcard-discount">${pct}% OFF</div>
                        <div class="pcard-actions-top">
                            <button class="pcard-small-btn ${wishlisted ? 'wish-active' : ''}" onclick="toggleWishlist(${p.id})" title="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
                                <i class="${wishlisted ? 'fas' : 'far'} fa-heart"></i>
                            </button>
                            <button class="pcard-small-btn ${compared ? 'compare-active' : ''}" onclick="toggleCompare(${p.id})" title="${compared ? 'Remove from compare' : 'Add to compare'}">
                                <i class="fas fa-balance-scale"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="pcard-body">
                    <div class="pcard-name">${p.name}</div>
                    <div class="pcard-duration"><i class="fas fa-clock"></i> ${p.duration}</div>
                    <div class="pcard-price-row">
                        <span class="pcard-price">₹${p.price.toFixed(2)}</span>
                        <span class="pcard-orig">₹${p.originalPrice.toFixed(2)}</span>
                    </div>
                    <div class="pcard-savings">YOU SAVE ₹${save}</div>
                    <div class="pcard-btns">
                        <button class="pcard-add" onclick="addToCart(${p.id})">
                            <i class="fas fa-shopping-bag"></i> ADD TO CART
                        </button>
                        <button class="pcard-qv" onclick="openQuickview(${p.id})" title="Quick View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
}

function addToCart(productId) {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const existing = cart.find(x => x.id === productId);
    if (existing) existing.quantity++;
    else cart.push({ ...p, quantity: 1 });
    updateCartUI();
    showNotification(`${p.name} ADDED TO CART`, 'success');
    const btn = document.querySelector('.cart-trigger');
    btn.style.transform = 'scale(1.3)';
    btn.style.boxShadow = '0 0 30px rgba(0,255,136,0.6)';
    setTimeout(() => { btn.style.transform = ''; btn.style.boxShadow = ''; }, 300);
}

function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    updateCartUI();
    showNotification('ITEM REMOVED', 'info');
}

function updateQty(id, delta) {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(id);
    else updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((s, c) => s + c.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    document.getElementById('cartTotal').textContent = `₹${total.toFixed(2)}`;
    const body = document.getElementById('cartItems');
    const foot = document.getElementById('cartFoot');
    if (cart.length === 0) {
        body.innerHTML = `<div class="panel-empty"><i class="fas fa-database"></i><p>// CART EMPTY</p></div>`;
        if (foot) foot.style.display = 'none';
    } else {
        if (foot) foot.style.display = 'flex';
        body.innerHTML = cart.map(item => {
            const thumb = item.image
                ? `<img src="${item.image}" onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">`
                : `<i class="fas fa-box"></i>`;
            return `<div class="cart-item-cyber">
                <div class="citem-icon">${thumb}</div>
                <div class="citem-info">
                    <div class="citem-name">${item.name}</div>
                    <div class="citem-sub">${item.duration} — ₹${item.price.toFixed(2)}</div>
                    <div class="citem-controls">
                        <button class="cqty-btn" onclick="updateQty(${item.id},-1)">−</button>
                        <span class="cqty-num">${item.quantity}</span>
                        <button class="cqty-btn" onclick="updateQty(${item.id},1)">+</button>
                        <button class="citem-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
}

function toggleWishlist(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (isWishlisted(id)) {
        wishlist = wishlist.filter(x => x.id !== id);
        showNotification('REMOVED FROM WISHLIST', 'info');
    } else {
        wishlist.push(p);
        showNotification(`${p.name} → WISHLIST`, 'success');
    }
    document.getElementById('wishlistCount').textContent = wishlist.length;
    updateWishlistUI();
    renderProducts();
}

function updateWishlistUI() {
    const body = document.getElementById('wishlistItems');
    if (wishlist.length === 0) {
        body.innerHTML = `<div class="panel-empty"><i class="fas fa-heart-broken"></i><p>// WISHLIST EMPTY</p></div>`;
    } else {
        body.innerHTML = wishlist.map(item => `
            <div class="wishlist-item-cyber">
                <div class="wi-icon"><i class="fas fa-box"></i></div>
                <div class="wi-info">
                    <div class="wi-name">${item.name}</div>
                    <div class="wi-price">₹${item.price.toFixed(2)}</div>
                </div>
                <div class="wi-actions">
                    <button class="wi-btn" onclick="addToCart(${item.id}); closeWishlist();" title="Add to Cart"><i class="fas fa-shopping-bag"></i></button>
                    <button class="wi-btn del" onclick="toggleWishlist(${item.id})" title="Remove"><i class="fas fa-times"></i></button>
                </div>
            </div>`).join('');
    }
}

function toggleCompare(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (isCompared(id)) {
        compareList = compareList.filter(x => x.id !== id);
        showNotification('REMOVED FROM COMPARE', 'info');
    } else {
        if (compareList.length >= 2) { showNotification('MAX 2 PRODUCTS TO COMPARE', 'warning'); return; }
        compareList.push(p);
        showNotification(`${p.name} → COMPARE LIST`, 'success');
    }
    updateCompareBar();
    renderProducts();
}

function updateCompareBar() {
    const bar = document.getElementById('compareBar');
    const items = document.getElementById('compareItems');
    if (compareList.length === 0) {
        bar.classList.add('hidden');
    } else {
        bar.classList.remove('hidden');
        if (compareList.length < 2) {
            items.innerHTML = compareList.map(p => `<div class="compare-chip"><i class="fas fa-box"></i>${p.name}</div>`).join('') + `<span class="compare-placeholder">+ ADD 1 MORE</span>`;
        } else {
            items.innerHTML = compareList.map(p => `<div class="compare-chip"><i class="fas fa-box"></i>${p.name}</div>`).join('');
        }
    }
}

function clearCompare() {
    compareList = [];
    updateCompareBar();
    renderProducts();
}

function openCompare() {
    if (compareList.length < 2) { showNotification('ADD 2 PRODUCTS TO COMPARE', 'warning'); return; }
    const [a, b] = compareList;
    document.getElementById('compareContent').innerHTML = `
        <div class="compare-grid">
            ${[a, b].map(p => {
                const pct = discountPct(p);
                const save = savings(p);
                return `<div class="compare-col">
                    <div class="compare-col-header">
                        <div class="compare-col-icon"><i class="fas fa-box"></i></div>
                        <h3>${p.name}</h3>
                    </div>
                    <div class="compare-row"><span class="compare-row-label">DURATION</span><span class="compare-row-val">${p.duration}</span></div>
                    <div class="compare-row"><span class="compare-row-label">PRICE</span><span class="compare-row-val price">₹${p.price.toFixed(2)}</span></div>
                    <div class="compare-row"><span class="compare-row-label">ORIGINAL</span><span class="compare-row-val">₹${p.originalPrice.toFixed(2)}</span></div>
                    <div class="compare-row"><span class="compare-row-label">DISCOUNT</span><span class="compare-row-val">${pct}%</span></div>
                    <div class="compare-row"><span class="compare-row-label">YOU SAVE</span><span class="compare-row-val save">₹${save}</span></div>
                    <div style="margin-top:20px">
                        <button class="cbtn cbtn-primary btn-full" onclick="addToCart(${p.id}); closeCompareModal();"><i class="fas fa-shopping-bag"></i> ADD TO CART</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    document.getElementById('compareModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
}

function closeCompareModal() {
    document.getElementById('compareModal').classList.remove('show');
    if (!document.querySelector('.cart-panel.open, .wishlist-panel.open')) {
        document.getElementById('overlay').classList.remove('show');
    }
}

function openQuickview(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const pct = discountPct(p);
    const save = savings(p);
    document.getElementById('quickviewContent').innerHTML = `
        <div style="text-align:center;margin-bottom:24px;">
            <div class="cmodal-icon"><i class="fas fa-box"></i></div>
            <h2 style="margin-bottom:8px;">${p.name}</h2>
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.75rem;color:var(--text-dim);letter-spacing:2px;">${p.duration}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
            <div style="border:1px solid var(--border);padding:16px;text-align:center;">
                <div style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:8px;">SALE PRICE</div>
                <div style="font-family:'Orbitron',sans-serif;font-size:1.8rem;font-weight:900;color:var(--neon);text-shadow:0 0 15px var(--neon);">₹${p.price.toFixed(2)}</div>
            </div>
            <div style="border:1px solid var(--border);padding:16px;text-align:center;">
                <div style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:8px;">YOU SAVE</div>
                <div style="font-family:'Orbitron',sans-serif;font-size:1.8rem;font-weight:900;color:var(--cyan);">₹${save}</div>
            </div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:12px;">
            <span style="background:var(--pink);color:white;padding:4px 12px;font-family:'Orbitron',sans-serif;font-size:0.65rem;letter-spacing:1px;">${pct}% OFF</span>
            <span style="border:1px solid var(--neon-border);color:var(--neon);padding:4px 12px;font-family:'Share Tech Mono',monospace;font-size:0.65rem;letter-spacing:1px;">INSTANT DELIVERY</span>
            <span style="border:1px solid var(--neon-border);color:var(--neon);padding:4px 12px;font-family:'Share Tech Mono',monospace;font-size:0.65rem;letter-spacing:1px;">SECURE</span>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px;">
            <button class="cbtn cbtn-primary" style="flex:1" onclick="addToCart(${p.id}); closeQuickview();"><i class="fas fa-shopping-bag"></i> ADD TO CART</button>
            <button class="cbtn cbtn-ghost" onclick="toggleWishlist(${p.id})" style="padding:12px 16px;"><i class="${isWishlisted(p.id) ? 'fas' : 'far'} fa-heart"></i></button>
        </div>`;
    document.getElementById('quickviewModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
}

function closeQuickview() {
    document.getElementById('quickviewModal').classList.remove('show');
    if (!document.querySelector('.cart-panel.open, .wishlist-panel.open')) {
        document.getElementById('overlay').classList.remove('show');
    }
}

function openCart() {
    document.getElementById('cartPanel').classList.add('open');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('wishlistPanel').classList.remove('open');
}

function closeCart() {
    document.getElementById('cartPanel').classList.remove('open');
    if (!document.querySelector('.cyber-modal.show')) {
        document.getElementById('overlay').classList.remove('show');
    }
}

function openWishlist() {
    updateWishlistUI();
    document.getElementById('wishlistPanel').classList.add('open');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('cartPanel').classList.remove('open');
}

function closeWishlist() {
    document.getElementById('wishlistPanel').classList.remove('open');
    if (!document.querySelector('.cyber-modal.show')) {
        document.getElementById('overlay').classList.remove('show');
    }
}

function selectPayment(method) {
    selectedPaymentMethod = method;
    document.getElementById('payUPI').classList.toggle('active', method === 'upi');
    document.getElementById('payLTC').classList.toggle('active', method === 'ltc');
}

function proceedToCheckout() {
    if (cart.length === 0) { showNotification('CART IS EMPTY', 'warning'); return; }
    const discord = document.getElementById('checkoutDiscord').value.trim();
    if (!discord) { showNotification('DISCORD USERNAME REQUIRED', 'warning'); return; }
    closeCart();
    document.getElementById('overlay').classList.add('show');
    document.getElementById('checkoutModal').classList.add('show');
    document.getElementById('checkoutStep1').classList.remove('hidden');
    document.getElementById('checkoutStep2').classList.add('hidden');

    if (selectedPaymentMethod === 'ltc') {
        document.getElementById('paymentTitle').textContent = 'PAY WITH LITECOIN';
        document.getElementById('paymentInfo').textContent = 'Send LTC to the address below';
        document.getElementById('qrContainer').classList.add('hidden');
        document.getElementById('ltcBox').classList.remove('hidden');
        const addr = cart.length === 1 && cart[0].ltcAddress ? cart[0].ltcAddress : LTC_ADDRESS;
        document.getElementById('ltcAddress').textContent = addr;
    } else {
        document.getElementById('paymentTitle').textContent = 'SCAN TO PAY';
        document.getElementById('paymentInfo').textContent = 'Scan QR code with your payment app';
        document.getElementById('qrContainer').classList.remove('hidden');
        document.getElementById('ltcBox').classList.add('hidden');
        const customQR = cart.length === 1 && cart[0].qr ? cart[0].qr : null;
        if (customQR) {
            document.getElementById('qrContainer').innerHTML = `<img src="${customQR}" style="width:200px;height:200px;">`;
        } else {
            generateQR();
        }
    }
}

function generateQR() {
    const el = document.getElementById('qrCode');
    if (!el) return;
    el.innerHTML = '';
    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    new QRCode(el, {
        text: `legacy-store:pay:${total.toFixed(2)}:${Date.now()}`,
        width: 200, height: 200,
        colorDark: '#00ff88', colorLight: '#ffffff',
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
    try {
        await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, discord, telegram, instagram, message, paymentMethod: selectedPaymentMethod, items: cart.map(c => `${c.name} (${c.quantity}x)`).join(', '), total })
        });
    } catch(err) { console.error(err); }
    document.getElementById('checkoutStep1').classList.add('hidden');
    document.getElementById('checkoutStep2').classList.remove('hidden');
    cart = [];
    updateCartUI();
    showNotification('ORDER TRANSMITTED — THANK YOU', 'success');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

function copyLTC() {
    navigator.clipboard.writeText(document.getElementById('ltcAddress').textContent);
    showNotification('LTC ADDRESS COPIED', 'success');
}

function openAdminLogin() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    if (!document.querySelector('.cart-panel.open, .wishlist-panel.open')) {
        document.getElementById('overlay').classList.remove('show');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (data.success) {
            setAdminToken(data.token);
            closeLoginModal();
            openAdminPanel();
            showNotification('ACCESS GRANTED', 'success');
        } else {
            document.getElementById('loginError').classList.remove('hidden');
        }
    } catch { document.getElementById('loginError').classList.remove('hidden'); }
}

function togglePassword() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('eyeIcon');
    if (input.type === 'password') { input.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { input.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

async function openAdminPanel() {
    const ok = await checkAuth();
    if (!ok) { openAdminLogin(); return; }
    document.getElementById('adminModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    renderAdminProductList();
}

function closeAdminPanel() {
    document.getElementById('adminModal').classList.remove('show');
    if (!document.querySelector('.cart-panel.open, .wishlist-panel.open')) {
        document.getElementById('overlay').classList.remove('show');
    }
    resetProductForm();
}

async function handleLogout() {
    try { await fetch('/api/admin/logout', { method: 'POST', headers: { 'X-Admin-Token': getAdminToken() } }); } catch {}
    setAdminToken(null);
    closeAdminPanel();
    showNotification('SESSION TERMINATED', 'info');
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
        list.innerHTML = `<div style="text-align:center;padding:40px;font-family:'Share Tech Mono',monospace;font-size:0.75rem;color:var(--text-dim);letter-spacing:2px;">// NO PRODUCTS IN DATABASE</div>`;
        return;
    }
    list.innerHTML = products.map(p => {
        const iconEl = p.image ? `<img src="${p.image}" onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">` : `<i class="fas fa-box"></i>`;
        return `<div class="admin-product-item">
            <div class="admin-item-icon">${iconEl}</div>
            <div class="admin-item-info">
                <h4>${p.name}</h4>
                <p>${p.duration} — ₹${p.price.toFixed(2)}</p>
            </div>
            <div class="admin-item-actions">
                <button class="aaction edit" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="aaction delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

async function saveProduct(event) {
    event.preventDefault();
    const token = getAdminToken();
    if (!token) { showNotification('AUTHENTICATION REQUIRED', 'error'); closeAdminPanel(); openAdminLogin(); return; }
    const data = {
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
            res = await fetch(`/api/products/${editingProductId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token }, body: JSON.stringify(data) });
        } else {
            res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token }, body: JSON.stringify(data) });
        }
        if (res.status === 401) { showNotification('SESSION EXPIRED', 'error'); setAdminToken(null); closeAdminPanel(); openAdminLogin(); return; }
        if (res.ok) {
            showNotification(editingProductId ? 'PRODUCT UPDATED' : 'PRODUCT ADDED', 'success');
            await loadProducts(); renderProducts(); renderAdminProductList(); resetProductForm();
        } else { showNotification('SAVE FAILED', 'error'); }
    } catch { showNotification('SAVE FAILED', 'error'); }
    editingProductId = null;
}

async function deleteProduct(id) {
    const token = getAdminToken();
    if (!token) { showNotification('AUTHENTICATION REQUIRED', 'error'); return; }
    if (!confirm('Delete this product?')) return;
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'X-Admin-Token': token } });
        if (res.status === 401) { showNotification('SESSION EXPIRED', 'error'); setAdminToken(null); closeAdminPanel(); openAdminLogin(); return; }
        if (res.ok) { await loadProducts(); renderProducts(); renderAdminProductList(); showNotification('PRODUCT DELETED', 'info'); }
        else showNotification('DELETE FAILED', 'error');
    } catch { showNotification('DELETE FAILED', 'error'); }
}

function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    editingProductId = id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productDuration').value = p.duration;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productOriginalPrice').value = p.originalPrice;
    document.getElementById('productImage').value = p.image || '';
    document.getElementById('productQR').value = p.qr || '';
    document.getElementById('productLTC').value = p.ltcAddress || '';
    document.getElementById('productColor').value = p.color || 'purple';
    document.getElementById('submitBtnText').textContent = 'UPDATE PRODUCT';
    switchAdminTab('add');
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('submitBtnText').textContent = 'SAVE PRODUCT';
    editingProductId = null;
}

function toggleFaq(el) {
    const wasOpen = el.classList.contains('open');
    document.querySelectorAll('.faq-c').forEach(c => c.classList.remove('open'));
    if (!wasOpen) el.classList.add('open');
}

function closeAll() {
    closeCart(); closeWishlist(); closeCheckoutModal();
    closeAdminPanel(); closeLoginModal(); closeQuickview(); closeCompareModal();
    document.getElementById('overlay').classList.remove('show');
}

let notifTop = 90;
let notifStack = 0;

function showNotification(message, type = 'info') {
    notifStack++;
    const el = document.createElement('div');
    el.className = `notification-cyber ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    el.style.top = `${notifTop + (notifStack - 1) * 60}px`;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'notifOut 0.3s ease forwards';
        setTimeout(() => { el.remove(); notifStack = Math.max(0, notifStack - 1); }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
