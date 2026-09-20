// js/api.js
const API_BASE_URL = 'https://fakestoreapi.com/products';

async function fetchDashboardData() {
  const [productsRes, categoriesRes] = await Promise.all([
    fetch(API_BASE_URL),
    fetch(`${API_BASE_URL}/categories`)
  ]);

  if (!productsRes.ok || !categoriesRes.ok) {
    throw new Error('Failed to fetch data from API');
  }

  const products = await productsRes.json();
  const categories = await categoriesRes.json();

  return { products, categories: ['all', ...categories] };
}
