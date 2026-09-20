/**
 * Dynamic JavaScript DOM Logic & RESTful API Client
 * 100% Mapped with index.html IDs and Classes
 */

// 1. STATE MANAGEMENT & LOCAL STORAGE
const API_BASE_URL = 'https://fakestoreapi.com/products';
const STORAGE_KEYS = {
  CART: 'dashboard_cart_items',
};

const state = {
  products: [],
  filteredProducts: [],
  categories: [],
  activeCategory: 'all',
  searchQuery: '',
  sortOrder: 'default',
  isLoading: false,
  cart: JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [],
};

// 2. DOM ELEMENTS SELECTION (Exact Match with index.html)
const elements = {
  productContainer: document.getElementById('product-grid'),
  categoryTabsContainer: document.getElementById('category-tabs'),
  searchInput: document.getElementById('search-input'),
  sortSelect: document.getElementById('sort-select'),
  errorBanner: document.getElementById('error-banner'),
  errorMessage: document.getElementById('error-message'),
  cartCountBadge: document.getElementById('cart-count'),
};

// 3. API FETCHING LOGIC
async function fetchDashboardData() {
  setLoadingState(true);
  clearError();

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(API_BASE_URL),
      fetch(`${API_BASE_URL}/categories`)
    ]);

    if (!productsRes.ok || !categoriesRes.ok) {
      throw new Error('API server response was not OK');
    }

    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();

    state.products = productsData;
    state.filteredProducts = [...productsData];
    state.categories = ['all', ...categoriesData];

    renderCategoryTabs();
    applyFiltersAndRender();
  } catch (err) {
    console.error('Fetch Error:', err);
    showError('Unable to load products from API. Please check internet connection.');
  } finally {
    setLoadingState(false);
  }
}

// 4. FILTERING & SORTING LOGIC
function applyFiltersAndRender() {
  let result = [...state.products];

  // Category Filter
  if (state.activeCategory !== 'all') {
    result = result.filter(item => item.category === state.activeCategory);
  }

  // Search Filter
  if (state.searchQuery.trim() !== '') {
    const query = state.searchQuery.toLowerCase().trim();
    result = result.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }

  // Sorting
  if (state.sortOrder === 'price-asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (state.sortOrder === 'price-desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (state.sortOrder === 'rating') {
    result.sort((a, b) => b.rating.rate - a.rating.rate);
  }

  state.filteredProducts = result;
  renderProducts();
}

// 5. DOM RENDERING LOGIC
function renderSkeletons() {
  if (!elements.productContainer) return;
  
  const skeletonHTML = Array(4)
    .fill(0)
    .map(
      () => `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-text title"></div>
        <div class="skeleton-text price"></div>
        <div class="skeleton-text btn"></div>
      </div>
    `
    )
    .join('');

  elements.productContainer.innerHTML = skeletonHTML;
}

function renderProducts() {
  if (!elements.productContainer) return;

  if (state.filteredProducts.length === 0) {
    elements.productContainer.innerHTML = `
      <div class="empty-state">
        <h3>No Products Found</h3>
        <p>Try searching for another item.</p>
      </div>
    `;
    return;
  }

  const cardsHTML = state.filteredProducts
    .map(product => {
      const isProductInCart = state.cart.some(item => item.id === product.id);
      return `
        <article class="product-card">
          <img src="${product.image}" alt="${product.title}" class="product-image" />
          <div class="product-details">
            <span class="product-category">${product.category}</span>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-meta">
              <span class="product-price">$${product.price.toFixed(2)}</span>
              <span class="product-rating">★ ${product.rating.rate}</span>
            </div>
            <button 
              class="btn-cart ${isProductInCart ? 'btn-active' : ''}" 
              data-cart-id="${product.id}">
              ${isProductInCart ? 'Remove from Cart' : 'Add to Cart'}
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  elements.productContainer.innerHTML = cardsHTML;
}

function renderCategoryTabs() {
  if (!elements.categoryTabsContainer) return;

  const tabsHTML = state.categories
    .map(
      cat => `
      <button 
        class="tab-btn ${state.activeCategory === cat ? 'active' : ''}" 
        data-category="${cat}">
        ${cat.toUpperCase()}
      </button>
    `
    )
    .join('');

  elements.categoryTabsContainer.innerHTML = tabsHTML;
}

// 6. LOCAL STORAGE & CART
function toggleCartItem(productId) {
  const targetId = Number(productId);
  const existingIndex = state.cart.findIndex(item => item.id === targetId);

  if (existingIndex > -1) {
    state.cart.splice(existingIndex, 1);
  } else {
    const productToAdd = state.products.find(p => p.id === targetId);
    if (productToAdd) state.cart.push(productToAdd);
  }

  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  updateCartBadge();
  renderProducts();
}

function updateCartBadge() {
  if (elements.cartCountBadge) {
    elements.cartCountBadge.textContent = state.cart.length;
  }
}

// 7. ERROR & LOADING HELPERS
function setLoadingState(loading) {
  state.isLoading = loading;
  if (loading) renderSkeletons();
}

function showError(message) {
  if (elements.errorBanner && elements.errorMessage) {
    elements.errorMessage.textContent = message;
    elements.errorBanner.classList.remove('hidden');
  }
}

function clearError() {
  if (elements.errorBanner) {
    elements.errorBanner.classList.add('hidden');
  }
}

// 8. EVENT LISTENERS
function setupEventListeners() {
  // Search Bar
  if (elements.searchInput) {
    let timer;
    elements.searchInput.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.searchQuery = e.target.value;
        applyFiltersAndRender();
      }, 300);
    });
  }

  // Category Tabs
  if (elements.categoryTabsContainer) {
    elements.categoryTabsContainer.addEventListener('click', e => {
      if (e.target.classList.contains('tab-btn')) {
        state.activeCategory = e.target.dataset.category;
        renderCategoryTabs();
        applyFiltersAndRender();
      }
    });
  }

  // Sort Dropdown
  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', e => {
      state.sortOrder = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Add/Remove Cart Event
  if (elements.productContainer) {
    elements.productContainer.addEventListener('click', e => {
      if (e.target.classList.contains('btn-cart')) {
        const id = e.target.dataset.cartId;
        toggleCartItem(id);
      }
    });
  }
}

// INITIALIZE APP
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateCartBadge();
  fetchDashboardData();
});