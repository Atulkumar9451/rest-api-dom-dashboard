// js/app.js

// 1. Application State
const state = {
  products: [],
  filteredProducts: [],
  categories: [],
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  cart: JSON.parse(localStorage.getItem('dashboard_cart_items')) || []
};

// 2. DOM Elements Mapping
const elements = {
  productGrid: document.getElementById('product-grid'),
  categoryTabs: document.getElementById('category-tabs'),
  searchInput: document.getElementById('search-input'),
  sortSelect: document.getElementById('sort-select'),
  cartCountBadge: document.getElementById('cart-count'),
  errorBanner: document.getElementById('error-banner'),
  errorMessage: document.getElementById('error-message')
};

// 3. Helper Functions
function debounce(func, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

function showError(msg) {
  if (elements.errorBanner && elements.errorMessage) {
    elements.errorMessage.textContent = msg;
    elements.errorBanner.classList.remove('hidden');
    elements.errorBanner.setAttribute('aria-hidden', 'false');
  }
}

function clearError() {
  if (elements.errorBanner) {
    elements.errorBanner.classList.add('hidden');
    elements.errorBanner.setAttribute('aria-hidden', 'true');
  }
}

function setLoadingState(isLoading) {
  if (isLoading) {
    renderSkeletons();
  }
}

// 4. Skeleton Loading State
function renderSkeletons() {
  if (!elements.productGrid) return;
  const skeletonHTML = Array(8).fill(`
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-text title"></div>
      <div class="skeleton-text price"></div>
      <div class="skeleton-text btn"></div>
    </div>
  `).join('');
  elements.productGrid.innerHTML = skeletonHTML;
}

// 5. Render Category Filter Tabs
function renderCategoryTabs() {
  if (!elements.categoryTabs) return;
  elements.categoryTabs.innerHTML = state.categories.map(category => `
    <button 
      class="tab-btn ${state.activeCategory === category ? 'active' : ''}" 
      data-category="${category}"
      role="tab"
      aria-selected="${state.activeCategory === category}"
    >
      ${category.charAt(0).toUpperCase() + category.slice(1)}
    </button>
  `).join('');
}

// 6. Filter & Sort Logic
function applyFiltersAndRender() {
  let result = [...state.products];

  // Category Filter
  if (state.activeCategory !== 'all') {
    result = result.filter(item => item.category === state.activeCategory);
  }

  // Search Filter
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase();
    result = result.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q)
    );
  }

  // Sorting Logic
  if (state.sortBy === 'price-asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'rating') {
    result.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
  }

  state.filteredProducts = result;
  renderProductGrid();
}

// 7. Render Products
function renderProductGrid() {
  if (!elements.productGrid) return;

  if (state.filteredProducts.length === 0) {
    elements.productGrid.innerHTML = '<p class="empty-state">No products found matching your criteria.</p>';
    return;
  }

  elements.productGrid.innerHTML = state.filteredProducts.map(product => {
    const isInCart = state.cart.some(item => item.id === product.id);
    return `
      <article class="product-card">
        <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy" />
        <div class="product-details">
          <span class="product-category">${product.category}</span>
          <h2 class="product-title">${product.title}</h2>
          <div class="product-meta">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <span class="product-rating">★ ${product.rating?.rate || 'N/A'}</span>
          </div>
          <button 
            class="btn-cart ${isInCart ? 'btn-active' : ''}" 
            onclick="toggleCartItem(${product.id})"
          >
            ${isInCart ? 'Remove from Cart' : 'Add to Cart'}
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// 8. State Caching & Cart Toggle Logic
window.toggleCartItem = function(productId) {
  const index = state.cart.findIndex(item => item.id === productId);
  if (index > -1) {
    state.cart.splice(index, 1);
  } else {
    const productToAdd = state.products.find(item => item.id === productId);
    if (productToAdd) state.cart.push(productToAdd);
  }

  // localStorage me persistence save karna
  localStorage.setItem('dashboard_cart_items', JSON.stringify(state.cart));
  
  updateCartBadge();
  renderProductGrid();
};

function updateCartBadge() {
  if (elements.cartCountBadge) {
    elements.cartCountBadge.textContent = state.cart.length;
  }
}

// 9. Event Listeners Setup
function setupEventListeners() {
  // Live Search with Debounce
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', debounce((e) => {
      state.searchQuery = e.target.value;
      applyFiltersAndRender();
    }, 300));
  }

  // Sort Dropdown
  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Category Tabs Delegation
  if (elements.categoryTabs) {
    elements.categoryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      state.activeCategory = btn.dataset.category;
      renderCategoryTabs();
      applyFiltersAndRender();
    });
  }
}

// 10. Application Initialization
async function initApp() {
  setLoadingState(true);
  clearError();
  try {
    const data = await fetchDashboardData();
    state.products = data.products;
    state.filteredProducts = [...data.products];
    state.categories = data.categories;

    renderCategoryTabs();
    applyFiltersAndRender();
  } catch (err) {
    console.error(err);
    showError('Unable to load products from API. Please check internet connection.');
  } finally {
    setLoadingState(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateCartBadge();
  initApp();
});
