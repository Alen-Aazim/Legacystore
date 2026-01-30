let products = [];
let cart = [];
let editingProductId = null;
let adminToken = null;

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (response.ok) {
            products = await response.json();
        }
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

function getAdminToken() {
    if (!adminToken) {
        adminToken = sessionStorage.getItem('adminToken');
    }
    return adminToken;
}

function setAdminToken(token) {
    adminToken = token;
    if (token) {
        sessionStorage.setItem('adminToken', token);
    } else {
        sessionStorage.removeItem('adminToken');
    }
}

async function checkAuth() {
    const token = getAdminToken();
    if (!token) return false;
    
    try {
        const response = await fetch('/api/admin/verify', {
            headers: { 'X-Admin-Token': token }
        });
        const data = await response.json();
        return data.authenticated;
    } catch (err) {
        return false;
    }
}

function openAdminLogin() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            setAdminToken(data.token);
            closeLoginModal();
            openAdminPanel();
            showNotification('Welcome, Admin!', 'success');
        } else {
            document.getElementById('loginError').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/admin/logout', {
            method: 'POST',
            headers: { 'X-Admin-Token': getAdminToken() }
        });
    } catch (err) {
        console.error('Logout error:', err);
    }
    
    setAdminToken(null);
    closeAdminPanel();
    showNotification('Logged out successfully', 'info');
}

function togglePassword() {
    const input = document.getElementById('loginPassword');
    const icon = document.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

async function saveProduct(event) {
    event.preventDefault();
    
    const token = getAdminToken();
    if (!token) {
        showNotification('Please login first', 'error');
        closeAdminPanel();
        openAdminLogin();
        return;
    }
    
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
        let response;
        if (editingProductId) {
            response = await fetch(`/api/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Admin-Token': token
                },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Admin-Token': token
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.status === 401) {
            showNotification('Session expired. Please login again.', 'error');
            setAdminToken(null);
            closeAdminPanel();
            openAdminLogin();
            return;
        }
        
        if (response.ok) {
            showNotification(editingProductId ? 'Product updated!' : 'Product added!', 'success');
            await loadProducts();
            renderProducts();
            renderAdminProductList();
            resetProductForm();
        } else {
            showNotification('Failed to save product', 'error');
        }
    } catch (err) {
        console.error('Error saving product:', err);
        showNotification('Failed to save product', 'error');
    }
    
    editingProductId = null;
}

async function deleteProduct(productId) {
    const token = getAdminToken();
    if (!token) {
        showNotification('Please login first', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Token': token }
            });
            
            if (response.status === 401) {
                showNotification('Session expired. Please login again.', 'error');
                setAdminToken(null);
                closeAdminPanel();
                openAdminLogin();
                return;
            }
            
            if (response.ok) {
                await loadProducts();
                renderProducts();
                renderAdminProductList();
                showNotification('Product deleted!', 'info');
            } else {
                showNotification('Failed to delete product', 'error');
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            showNotification('Failed to delete product', 'error');
        }
    }
}

function getDiscountPercent(price, originalPrice) {
    return Math.round((1 - price / originalPrice) * 100);
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = products.map(product => `
        <div class="product-card ${product.color || 'purple'}">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas ${product.icon || 'fa-box'} placeholder-icon\\'></i><span class=\\'discount-badge\\'>${getDiscountPercent(product.price, product.originalPrice)}% OFF</span>'">` : 
                    `<i class="fas ${product.icon || 'fa-box'} placeholder-icon"></i>`
                }
                <span class="discount-badge">${getDiscountPercent(product.price, product.originalPrice)}% OFF</span>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="duration"><i class="fas fa-clock"></i> ${product.duration}</p>
                <div class="product-pricing">
                    <span class="price">₹${product.price.toFixed(2)}</span>
                    <span class="original-price">₹${product.originalPrice.toFixed(2)}</span>
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-bag"></i>
                    <span>Add to Cart</span>
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    showNotification(`${product.name} added to cart!`, 'success');
    
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.classList.add('pulse-animation');
    setTimeout(() => cartIcon.classList.remove('pulse-animation'), 500);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    showNotification('Item removed from cart', 'info');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas ${item.icon || 'fa-box'}\\'></i>'">` : 
                        `<i class="fas ${item.icon || 'fa-box'}"></i>`
                    }
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.duration} - ₹${item.price.toFixed(2)}</p>
                    <div class="cart-item-actions">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;
}

function openCart() {
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('overlay').classList.add('show');
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}

function closeAll() {
    closeCart();
    closeCheckoutModal();
    closeAdminPanel();
    closeLoginModal();
}

let selectedPaymentMethod = 'upi';
const LTC_ADDRESS = 'LYx1zNfX7zH7v8Vz1v1v1v1v1v1v1v1v1v'; // Replace with actual address

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-opt').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase() === method);
    });
}

function copyLTC() {
    const addr = document.getElementById('ltcAddress').innerText;
    navigator.clipboard.writeText(addr);
    showNotification('LTC Address copied!', 'success');
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'warning');
        return;
    }

    const discord = document.getElementById('checkoutDiscord').value;
    if (!discord) {
        showNotification('Discord username is required!', 'warning');
        return;
    }

    closeCart();
    document.getElementById('checkoutModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('checkoutStep1').classList.remove('hidden');
    document.getElementById('checkoutStep2').classList.add('hidden');

    const paymentTitle = document.getElementById('paymentTitle');
    const qrContainer = document.getElementById('qrContainer');
    const ltcContainer = document.getElementById('ltcAddressContainer');
    const paymentInfo = document.getElementById('paymentInfo');

    if (selectedPaymentMethod === 'ltc') {
        paymentTitle.innerText = 'Pay with LTC';
        qrContainer.classList.add('hidden');
        ltcContainer.classList.remove('hidden');
        
        // Custom LTC logic
        const customLTC = cart.length === 1 && cart[0].ltcAddress ? cart[0].ltcAddress : LTC_ADDRESS;
        document.getElementById('ltcAddress').innerText = customLTC;
        paymentInfo.innerText = 'Send LTC to the address below';
    } else {
        paymentTitle.innerText = 'Scan to Pay';
        qrContainer.classList.remove('hidden');
        ltcContainer.classList.add('hidden');
        paymentInfo.innerText = 'Scan the QR code with your payment app';
        
        // Custom QR logic
        const customQR = cart.length === 1 && cart[0].qr ? cart[0].qr : null;
        if (customQR) {
            qrContainer.innerHTML = `<img src="${customQR}" style="width: 200px; height: 200px; border-radius: 10px;">`;
        } else {
            generateQRCode();
        }
    }
}

function generateQRCode() {
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = '';
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const paymentData = `legacy-store:pay:${total.toFixed(2)}:${Date.now()}`;
    
    new QRCode(qrContainer, {
        text: paymentData,
        width: 200,
        height: 200,
        colorDark: "#7c3aed",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

async function confirmPayment() {
    const discord = document.getElementById('checkoutDiscord').value;
    const telegram = document.getElementById('checkoutTelegram').value;
    const instagram = document.getElementById('checkoutInstagram').value;
    const message = document.getElementById('checkoutMessage').value;
    const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const orderData = {
        orderId,
        discord,
        telegram,
        instagram,
        message,
        paymentMethod: selectedPaymentMethod,
        items: cart.map(item => `${item.name} (${item.quantity}x)`).join(', '),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
    };

    try {
        await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
    } catch (err) {
        console.error('Checkout error:', err);
    }

    document.getElementById('checkoutStep1').classList.add('hidden');
    document.getElementById('checkoutStep2').classList.remove('hidden');
    
    cart = [];
    updateCartUI();
    showNotification('Payment confirmed! Thank you!', 'success');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

async function openAdminPanel() {
    const isAuth = await checkAuth();
    if (!isAuth) {
        openAdminLogin();
        return;
    }
    
    document.getElementById('adminModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    renderAdminProductList();
}

function closeAdminPanel() {
    document.getElementById('adminModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
    resetProductForm();
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    event.target.closest('.admin-tab').classList.add('active');
    
    if (tab === 'add') {
        document.getElementById('addProductTab').classList.remove('hidden');
        document.getElementById('manageProductTab').classList.add('hidden');
    } else {
        document.getElementById('addProductTab').classList.add('hidden');
        document.getElementById('manageProductTab').classList.remove('hidden');
        renderAdminProductList();
    }
}

function renderAdminProductList() {
    const list = document.getElementById('adminProductList');
    list.innerHTML = products.map(product => `
        <div class="product-list-item">
            <div class="item-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas ${product.icon || 'fa-box'}\\'></i>'">` : 
                    `<i class="fas ${product.icon || 'fa-box'}"></i>`
                }
            </div>
            <div class="item-info">
                <h4>${product.name}</h4>
                <p>${product.duration} - $${product.price.toFixed(2)}</p>
            </div>
            <div class="item-actions">
                <button class="action-btn edit" onclick="editProduct(${product.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteProduct(${product.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    
    document.getElementById('productName').value = product.name;
    document.getElementById('productDuration').value = product.duration;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOriginalPrice').value = product.originalPrice;
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productQR').value = product.qr || '';
    document.getElementById('productLTC').value = product.ltcAddress || '';
    document.getElementById('productColor').value = product.color || 'purple';
    
    document.getElementById('submitBtnText').textContent = 'Update Product';
    
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.admin-tab').classList.add('active');
    document.getElementById('addProductTab').classList.remove('hidden');
    document.getElementById('manageProductTab').classList.add('hidden');
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('submitBtnText').textContent = 'Add Product';
    editingProductId = null;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    let bgColor, icon;
    switch(type) {
        case 'success':
            bgColor = 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))';
            icon = 'fa-check-circle';
            break;
        case 'warning':
            bgColor = 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))';
            icon = 'fa-exclamation-triangle';
            break;
        case 'error':
            bgColor = 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))';
            icon = 'fa-times-circle';
            break;
        default:
            bgColor = 'linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(236, 72, 153, 0.95))';
            icon = 'fa-info-circle';
    }
    
    notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 35px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        backdrop-filter: blur(20px);
        color: white;
        padding: 18px 35px;
        border-radius: 18px;
        font-weight: 600;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 14px;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
        animation: slideUpFade 0.4s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.2 + 0.05});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 15 + 10}s infinite ease-in-out;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString() + '+';
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString() + '+';
            }
        };
        
        updateCounter();
    });
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideUpFade {
        from {
            opacity: 0;
            transform: translate(-50%, 30px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes particleFloat {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(25px, -25px); }
        50% { transform: translate(-15px, 15px); }
        75% { transform: translate(20px, 20px); }
    }
    .pulse-animation {
        animation: cartPulse 0.5s ease;
    }
    @keyframes cartPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    renderProducts();
    updateCartUI();
    createParticles();
    
    setTimeout(animateCounters, 500);
});
