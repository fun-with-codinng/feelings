// Main JavaScript for Feelings Gift Shop Website
// Handles categories, products, search, filter, and sort functionality

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentCategoryFilter = '';
let currentSort = '';

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Always load from products.js first (fresh data)
    // localStorage is only used if admin panel has made changes
    allProducts = products || [];

    // Check if admin has updated products (only use if products.js is empty)
    if (allProducts.length === 0) {
        const storedProducts = localStorage.getItem('feelingsProducts');
        if (storedProducts) {
            try {
                allProducts = JSON.parse(storedProducts);
            } catch (e) {
                console.error('Error loading products from localStorage:', e);
            }
        }
    }

    console.log('Total products loaded:', allProducts.length);

    filteredProducts = [...allProducts];

    // Initialize categories
    initializeCategories();

    // Initialize products
    renderProducts();

    // Setup event listeners
    setupEventListeners();

    // Setup category slider animation
    setupCategorySlider();

    // Initialize modal
    initializeModal();

    // Initialize scroll enhancements
    initScrollProgress();
    initBackToTop();
    initStickyHeader();
});

// ============================================
// SCROLL PROGRESS INDICATOR (Fallback for older browsers)
// ============================================
function initScrollProgress() {
    // Check if browser supports CSS scroll-driven animations
    if (CSS.supports && CSS.supports('animation-timeline', 'scroll()')) {
        return; // CSS handles it
    }

    const progressBar = document.getElementById('scrollProgressBar');
    if (!progressBar) return;

    let ticking = false;

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = (scrollTop / docHeight) * 100;
                progressBar.style.width = progress + '%';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    // Scroll to top on click
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// STICKY HEADER WITH SCROLL BEHAVIOR
// ============================================
function initStickyHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const scrollY = window.scrollY;

                // Add scrolled class after 50px
                header.classList.toggle('scrolled', scrollY > 50);

                // Compact mode after 150px
                header.classList.toggle('compact', scrollY > 150);

                lastScrollY = scrollY;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// Initialize categories section
function initializeCategories() {
    const categoriesSlider = document.getElementById('categoriesSlider');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!categoriesSlider || !categoryFilter) return;
    
    // Clear existing content
    categoriesSlider.innerHTML = '';
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    // Create category cards and filter options
    categories.forEach(category => {
        // Count products in this category
        const productCount = allProducts.filter(p => p.category === category.key).length;
        
        // Create category card
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.setAttribute('data-category', category.key);
        categoryCard.onclick = () => filterByCategory(category.key);
        
        // Encode category image path to handle spaces and special characters
        const categoryImagePath = category.img.split('/').map(part => encodeURIComponent(part)).join('/');
        
        categoryCard.innerHTML = `
            <div class="category-image-wrapper">
                <img src="${categoryImagePath}" alt="${category.name}" 
                     onerror="this.onerror=null; this.style.background='#f0f0f0'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center';">
                <div class="category-overlay">
                    <span class="category-overlay-text">View Items</span>
                </div>
                ${productCount > 0 ? `<div class="category-badge">${productCount}+</div>` : ''}
            </div>
            <div class="category-name">${category.name}</div>
        `;
        
        categoriesSlider.appendChild(categoryCard);
        
        // Add to filter dropdown
        const option = document.createElement('option');
        option.value = category.key;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
    
    // Duplicate category cards for seamless infinite scroll
    const categoryCards = categoriesSlider.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        const clonedCard = card.cloneNode(true);
        // Re-attach click handler using data attribute
        const categoryKey = clonedCard.getAttribute('data-category');
        if (categoryKey) {
            clonedCard.onclick = () => filterByCategory(categoryKey);
        }
        categoriesSlider.appendChild(clonedCard);
    });
}

// Setup category slider for infinite scroll
function setupCategorySlider() {
    const slider = document.getElementById('categoriesSlider');
    if (!slider) return;
    
    // Calculate total width for proper animation
    const totalWidth = slider.scrollWidth / 2; // Divide by 2 since we duplicated
    
    // Reset animation
    slider.style.animation = 'none';
    setTimeout(() => {
        slider.style.animation = `scroll 30s linear infinite`;
    }, 10);
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
}

// Handle search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    applyFilters(searchTerm, currentCategoryFilter, currentSort);
}

// Handle category filter
function handleCategoryFilter(event) {
    currentCategoryFilter = event.target.value;
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    applyFilters(searchTerm, currentCategoryFilter, currentSort);
}

// Handle sort
function handleSort(event) {
    currentSort = event.target.value;
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    applyFilters(searchTerm, currentCategoryFilter, currentSort);
}

// Filter by category (from category card click)
function filterByCategory(categoryKey) {
    currentCategoryFilter = categoryKey;
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = categoryKey;
    }
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    applyFilters(searchTerm, currentCategoryFilter, currentSort);
    
    // Scroll to products section
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
}

// Apply all filters and sorting
function applyFilters(searchTerm, categoryFilter, sort) {
    filteredProducts = allProducts.filter(product => {
        // Search filter
        const matchesSearch = !searchTerm || 
            product.id.toLowerCase().includes(searchTerm) ||
            product.name.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    // Apply sorting
    if (sort === 'low-high') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'high-low') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
    
    // Render filtered products
    renderProducts();
}

// Render products grid
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!productsGrid) return;
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    // Show/hide no results message
    if (filteredProducts.length === 0) {
        if (noResults) noResults.style.display = 'block';
        console.log('No products to display');
        return;
    } else {
        if (noResults) noResults.style.display = 'none';
    }
    
    console.log('Rendering', filteredProducts.length, 'products');
    
    // Create product cards
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Generate WhatsApp message with product details
function generateWhatsAppMessage(product) {
    // Create absolute image URL using location.origin
    let imagePath = product.img;
    
    // If path doesn't start with http or /, add leading slash
    if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
    }
    
    // Encode each part of the path (except protocol if present)
    let imageUrl;
    if (imagePath.startsWith('http')) {
        // Already absolute URL, use as is
        imageUrl = imagePath;
    } else {
        // Build absolute URL from origin + encoded path
        const pathParts = imagePath.split('/').filter(part => part.length > 0);
        const encodedParts = pathParts.map(part => encodeURIComponent(part));
        imageUrl = `${location.origin}/${encodedParts.join('/')}`;
    }
    
    // Format message exactly as required
    const message = `Hello, I want to order this product:

Product Name: ${product.name}
Product Code: ${product.id}
Image: ${imageUrl}`;
    
    return encodeURIComponent(message);
}

// Create a product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Make card clickable to open modal
    card.addEventListener('click', function(e) {
        // Don't open modal if clicking the WhatsApp button
        if (e.target.closest('.btn-order')) {
            return;
        }
        openProductModal(product);
    });
    
    // Get category name for display
    const category = categories.find(c => c.key === product.category);
    const categoryName = category ? category.name : product.category;
    
    // Generate WhatsApp message with product details
    const whatsappMessage = generateWhatsAppMessage(product);
    const whatsappUrl = `https://wa.me/919039540994?text=${whatsappMessage}`;
    
    // Encode image path to handle spaces and special characters
    // Split path and encode each part, then join with /
    const imagePath = product.img.split('/').map(part => encodeURIComponent(part)).join('/');
    
    card.innerHTML = `
        <img src="${imagePath}" alt="${product.name}" class="product-image" 
             onerror="this.onerror=null; this.style.background='#f0f0f0 url(\\'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'100%25\\' height=\\'100%25\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\' font-size=\\'14\\'%3ENo Image%3C/text%3E%3C/svg\\') no-repeat center; this.style.backgroundSize='contain';">
        <div class="product-info">
            <div class="product-code">Code: ${product.id}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
            <a href="${whatsappUrl}" class="btn btn-order" target="_blank" onclick="event.stopPropagation();">
                Order on WhatsApp
            </a>
        </div>
    `;
    
    return card;
}

// Open product detail modal
function openProductModal(product) {
    const modal = document.getElementById('productModal');
    const category = categories.find(c => c.key === product.category);
    const categoryName = category ? category.name : product.category;
    
    // Encode image path
    const imagePath = product.img.split('/').map(part => encodeURIComponent(part)).join('/');
    
    // Get description and usage with fallbacks
    const description = product.description || `Premium quality ${product.name.toLowerCase()} perfect for event decoration and wholesale supply.`;
    const usage = product.usage || "Wedding, Entry Decor, Stage Decor, Festival Decoration";
    
    // Generate WhatsApp message with product details
    const whatsappMessage = generateWhatsAppMessage(product);
    const whatsappUrl = `https://wa.me/919039540994?text=${whatsappMessage}`;
    
    // Populate modal content
    document.getElementById('modalProductImage').src = imagePath;
    document.getElementById('modalProductImage').alt = product.name;
    document.getElementById('modalProductCode').textContent = product.id;
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductCategory').textContent = categoryName;
    document.getElementById('modalProductPrice').textContent = `₹${product.price.toLocaleString('en-IN')}`;
    document.getElementById('modalProductDescription').textContent = description;
    document.getElementById('modalProductUsage').innerHTML = `<strong>Usage:</strong> ${usage}`;
    document.getElementById('modalWhatsAppBtn').href = whatsappUrl;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close product detail modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Initialize modal functionality
function initializeModal() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.getElementById('modalClose');
    
    // Close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProductModal);
    }
    
    // Click outside modal to close
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeProductModal();
            }
        });
    }
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeProductModal();
        }
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

