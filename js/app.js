// ========================================
// Online Book Store - Main JavaScript
// ========================================

// ---- Generate Book Cover SVG (No External URLs!) ----
function generateBookCover(title, author, colorIndex) {
    const colors = [
        ['#2C3E50', '#3498DB'], ['#8E44AD', '#9B59B6'], ['#C0392B', '#E74C3C'],
        ['#27AE60', '#2ECC71'], ['#D35400', '#E67E22'], ['#2980B9', '#3498DB'],
        ['#8B0000', '#DC143C'], ['#006400', '#228B22'], ['#4A148C', '#7B1FA2'],
        ['#1A237E', '#3F51B5'], ['#BF360C', '#FF5722'], ['#004D40', '#009688']
    ];
    const [bg, accent] = colors[colorIndex % colors.length];
    const shortTitle = title.length > 25 ? title.substring(0, 22) + '...' : title;
    
    // Split title into lines for better display
    const words = shortTitle.split(' ');
    let lines = [];
    let currentLine = '';
    words.forEach(word => {
        if ((currentLine + ' ' + word).length > 14) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        }
    });
    if (currentLine) lines.push(currentLine);

    const titleY = 100 - (lines.length * 12);
    const titleSvg = lines.map((line, i) => 
        `<text x="90" y="${titleY + i * 28}" font-family="Georgia,serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">${escapeXml(line)}</text>`
    ).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="250" viewBox="0 0 180 250">
        <defs>
            <linearGradient id="bg${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${bg}"/>
                <stop offset="100%" style="stop-color:${accent}"/>
            </linearGradient>
        </defs>
        <rect width="180" height="250" rx="4" fill="url(#bg${colorIndex})"/>
        <rect x="10" y="10" width="160" height="230" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <line x1="20" y1="60" x2="160" y2="60" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        <text x="90" y="40" font-family="Georgia,serif" font-size="10" fill="rgba(255,255,255,0.6)" text-anchor="middle" letter-spacing="3">BOOK</text>
        ${titleSvg}
        <line x1="50" y1="${titleY + lines.length * 28 + 5}" x2="130" y2="${titleY + lines.length * 28 + 5}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
        <text x="90" y="${titleY + lines.length * 28 + 30}" font-family="Arial,sans-serif" font-size="12" fill="rgba(255,255,255,0.7)" text-anchor="middle">${escapeXml(author)}</text>
        <rect x="0" y="0" width="12" height="250" rx="4" fill="rgba(0,0,0,0.2)"/>
    </svg>`;
    
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ---- User Authentication (localStorage) ----
const Auth = {
    getUsers() {
        return JSON.parse(localStorage.getItem('bookstore_users') || '[]');
    },
    saveUsers(users) {
        localStorage.setItem('bookstore_users', JSON.stringify(users));
    },
    register(userData) {
        const users = this.getUsers();
        if (users.find(u => u.uname === userData.uname)) {
            return { success: false, message: 'Username already exists!' };
        }
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Email already registered!' };
        }
        userData.id = users.length + 1;
        users.push(userData);
        this.saveUsers(users);
        return { success: true, message: 'Registration successful!' };
    },
    login(uname, pwd) {
        const users = this.getUsers();
        const user = users.find(u => u.uname === uname && u.pwd === pwd);
        if (user) {
            sessionStorage.setItem('bookstore_session', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid username or password!' };
    },
    logout() {
        sessionStorage.removeItem('bookstore_session');
        window.location.href = 'login.html';
    },
    getCurrentUser() {
        const data = sessionStorage.getItem('bookstore_session');
        return data ? JSON.parse(data) : null;
    },
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
};

// ---- Cart Management ----
const Cart = {
    getCart() {
        return JSON.parse(localStorage.getItem('bookstore_cart') || '[]');
    },
    saveCart(cart) {
        localStorage.setItem('bookstore_cart', JSON.stringify(cart));
        this.updateBadge();
    },
    addItem(book) {
        const cart = this.getCart();
        const existing = cart.find(item => item.id === book.id);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ ...book, qty: 1 });
        }
        this.saveCart(cart);
        showToast(`"${book.title}" added to cart!`);
    },
    removeItem(bookId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== bookId);
        this.saveCart(cart);
    },
    getTotal() {
        return this.getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
    },
    getCount() {
        return this.getCart().reduce((sum, item) => sum + item.qty, 0);
    },
    clear() {
        this.saveCart([]);
    },
    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            const count = this.getCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
};

// ---- Book Data (All local - no external URLs!) ----
const BOOKS = [
    { id: 1,  title: "The Great Gatsby",        author: "F. Scott Fitzgerald", price: 299, genre: "Classic" },
    { id: 2,  title: "To Kill a Mockingbird",    author: "Harper Lee",          price: 350, genre: "Fiction" },
    { id: 3,  title: "1984",                     author: "George Orwell",       price: 275, genre: "Dystopian" },
    { id: 4,  title: "Pride and Prejudice",      author: "Jane Austen",         price: 199, genre: "Romance" },
    { id: 5,  title: "The Catcher in the Rye",   author: "J.D. Salinger",       price: 320, genre: "Fiction" },
    { id: 6,  title: "Harry Potter",             author: "J.K. Rowling",        price: 450, genre: "Fantasy" },
    { id: 7,  title: "The Lord of the Rings",    author: "J.R.R. Tolkien",      price: 599, genre: "Fantasy" },
    { id: 8,  title: "The Alchemist",            author: "Paulo Coelho",        price: 250, genre: "Fiction" },
    { id: 9,  title: "Sapiens",                  author: "Yuval Noah Harari",   price: 499, genre: "Non-Fiction" },
    { id: 10, title: "Atomic Habits",            author: "James Clear",         price: 399, genre: "Self-Help" },
    { id: 11, title: "The Silent Patient",       author: "Alex Michaelides",    price: 375, genre: "Thriller" },
    { id: 12, title: "Educated",                 author: "Tara Westover",       price: 425, genre: "Memoir" }
];

// Generate covers for all books (SVG - fully local, never expires!)
BOOKS.forEach((book, i) => {
    book.image = generateBookCover(book.title, book.author, i);
});

// ---- Toast Notification ----
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// ---- Form Validation ----
function validateLoginForm(e) {
    e.preventDefault();
    const uname = document.getElementById('uname').value.trim();
    const pwd = document.getElementById('pwd').value.trim();
    const errorDiv = document.getElementById('error-msg');

    if (!uname || !pwd) {
        errorDiv.textContent = 'Please fill in all fields.';
        return false;
    }

    const result = Auth.login(uname, pwd);
    if (result.success) {
        showToast('Login successful!');
        setTimeout(() => window.location.href = 'home.html', 500);
    } else {
        errorDiv.textContent = result.message;
    }
    return false;
}

function validateRegisterForm(e) {
    e.preventDefault();
    const form = e.target;
    const errorDiv = document.getElementById('error-msg');

    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const uname = form.querySelector('#uname').value.trim();
    const pwd = form.querySelector('#pwd').value.trim();
    const confirmPwd = form.querySelector('#confirm-pwd').value.trim();
    const genderEl = form.querySelector('input[name="gender"]:checked');
    const age = form.querySelector('#age').value;
    const addr = form.querySelector('#addr').value.trim();
    const languages = form.querySelector('#languages').value;

    if (!name || !email || !uname || !pwd || !confirmPwd || !genderEl || !age || !addr || !languages) {
        errorDiv.textContent = 'Please fill in all fields.';
        return false;
    }

    if (pwd !== confirmPwd) {
        errorDiv.textContent = 'Passwords do not match!';
        return false;
    }

    if (pwd.length < 4) {
        errorDiv.textContent = 'Password must be at least 4 characters.';
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorDiv.textContent = 'Please enter a valid email address.';
        return false;
    }

    const result = Auth.register({
        name, email, uname, pwd,
        gender: genderEl.value,
        age: parseInt(age),
        addr,
        languages
    });

    if (result.success) {
        showToast('Registration successful!');
        setTimeout(() => window.location.href = 'login.html', 1000);
    } else {
        errorDiv.textContent = result.message;
    }
    return false;
}

// ---- Render Functions ----
function renderBooks(books, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (books.length === 0) {
        container.innerHTML = '<p style="color:#fff; text-align:center; width:100%; padding:40px; font-size:1.1rem;">No books found matching your search.</p>';
        return;
    }

    container.innerHTML = books.map(book => `
        <div class="book-card">
            <img src="${book.image}" alt="${book.title}">
            <h3>${book.title}</h3>
            <p class="author">by ${book.author}</p>
            <p class="price">₹${book.price}</p>
            <button class="btn" onclick="Cart.addItem(BOOKS.find(b=>b.id===${book.id}))">
                🛒 Add to Cart
            </button>
        </div>
    `).join('');
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    const cart = Cart.getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <p>🛒 Your cart is empty!</p>
                <br>
                <a href="shop.html" class="btn">Browse Books</a>
            </div>
        `;
        if (totalEl) totalEl.style.display = 'none';
        const checkoutSection = document.getElementById('checkout-section');
        if (checkoutSection) checkoutSection.style.display = 'none';
        return;
    }

    // Regenerate images for cart items
    cart.forEach(item => {
        const bookData = BOOKS.find(b => b.id === item.id);
        if (bookData) item.image = bookData.image;
    });

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}">
            <div class="cart-info">
                <h3>${item.title}</h3>
                <p>by ${item.author}</p>
                <p class="price">₹${item.price} × ${item.qty} = ₹${item.price * item.qty}</p>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">✕ Remove</button>
        </div>
    `).join('');

    if (totalEl) {
        totalEl.style.display = 'block';
        totalEl.innerHTML = `Total: <span>₹${Cart.getTotal()}</span>`;
    }
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) checkoutSection.style.display = 'block';
}

function removeFromCart(bookId) {
    Cart.removeItem(bookId);
    renderCart();
    showToast('Item removed from cart.');
}

function renderProfile() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    const user = Auth.getCurrentUser();
    if (!user) {
        container.innerHTML = `
            <p style="color:#fff; text-align:center; padding:30px;">
                Please <a href="login.html" style="color:#4CAF50;">login</a> to view your profile.
            </p>
        `;
        return;
    }

    container.innerHTML = `
        <table class="profile-table">
            <tr><th>ID</th><td>${user.id}</td></tr>
            <tr><th>Full Name</th><td>${user.name}</td></tr>
            <tr><th>Email</th><td>${user.email}</td></tr>
            <tr><th>Username</th><td>${user.uname}</td></tr>
            <tr><th>Gender</th><td>${user.gender}</td></tr>
            <tr><th>Age</th><td>${user.age}</td></tr>
            <tr><th>Address</th><td>${user.addr}</td></tr>
            <tr><th>Languages</th><td>${user.languages}</td></tr>
        </table>
    `;
}

// ---- Search ----
function searchBooks(query) {
    const q = query.toLowerCase();
    return BOOKS.filter(book =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.genre.toLowerCase().includes(q)
    );
}

// ---- Init on page load ----
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateBadge();

    const user = Auth.getCurrentUser();
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        if (link.href.includes('logout') || link.href.includes('profile')) {
            if (!user) link.parentElement.style.display = 'none';
        }
        if (link.href.includes('login') || link.href.includes('register')) {
            if (user) link.parentElement.style.display = 'none';
        }
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const results = searchBooks(e.target.value);
            renderBooks(results, 'books-container');
        });
    }
});
