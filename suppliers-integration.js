const SUPPLIERS = {
  'ferreteria-central': {
    name: 'Ferretería Central',
    location: 'Buenos Aires',
    rating: 4.5,
    categories: ['herramientas', 'cemento', 'acero', 'tuberías'],
    priceMultiplier: 1.0
  },
  'acero-estructuras': {
    name: 'Acero y Estructuras SA',
    location: 'Córdoba',
    rating: 4.8,
    categories: ['acero', 'hierro', 'estructuras'],
    priceMultiplier: 0.95
  },
  'azulejos-premium': {
    name: 'Azulejos Premium',
    location: 'CABA',
    rating: 4.3,
    categories: ['azulejos', 'cerámicos', 'pisos'],
    priceMultiplier: 1.15
  },
  'cables-electricos': {
    name: 'Cables Eléctricos y Más',
    location: 'La Plata',
    rating: 4.6,
    categories: ['electricidad', 'cableado', 'iluminación'],
    priceMultiplier: 1.02
  },
  'pinturas-decorativas': {
    name: 'Pinturas Decorativas Pro',
    location: 'Rosario',
    rating: 4.4,
    categories: ['pintura', 'revestimientos', 'acabados'],
    priceMultiplier: 1.08
  }
};

const BASE_PRICES = {
  'Cemento Portland': 250, // por bolsa
  'Tuberías PVC': 45, // por metro
  'Acero estructural': 850, // por kilo
  'Ladrillos': 4, // por unidad
  'Azulejos': 120, // por m²
  'Pintura': 85, // por lata
  'Cableado eléctrico': 12, // por metro
  'Hormigón': 350, // por m³
  'Madera': 400, // por m³
  'Vidrio': 200, // por m²
};

/**
 * Compare prices across suppliers for a material
 * @param {String} material - Material name
 * @param {Number} quantity - Quantity needed
 * @returns {Array} Sorted list of suppliers with prices
 */
async function compareSuppliers(material, quantity = 1) {
  const basePrice = BASE_PRICES[material];
  
  if (!basePrice) {
    return {
      error: `Material "${material}" not found`,
      suggestions: Object.keys(BASE_PRICES).slice(0, 5)
    };
  }

  const results = [];

  for (const [supplierId, supplier] of Object.entries(SUPPLIERS)) {
    if (!supplier.categories.some(cat => material.toLowerCase().includes(cat))) {
      continue; // Skip if supplier doesn't carry this category
    }

    const unitPrice = basePrice * supplier.priceMultiplier;
    const totalPrice = unitPrice * quantity;
    const deliveryDays = Math.floor(Math.random() * 5) + 2; // 2-7 days
    const inStock = Math.random() > 0.1; // 90% in stock

    results.push({
      supplier: supplier.name,
      supplier_id: supplierId,
      location: supplier.location,
      unit_price: Math.round(unitPrice * 100) / 100,
      total_price: Math.round(totalPrice * 100) / 100,
      quantity,
      material,
      delivery_days: deliveryDays,
      delivery_date: formatDeliveryDate(deliveryDays),
      in_stock: inStock,
      rating: supplier.rating,
      discount_percent: getDiscount(quantity)
    });
  }

  // Sort by total price
  results.sort((a, b) => a.total_price - b.total_price);

  // Add rank
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  return {
    material,
    quantity,
    results,
    best_price: results[0]?.total_price || 0,
    best_delivery: results.reduce((prev, curr) => 
      curr.delivery_days < prev.delivery_days ? curr : prev
    )
  };
}

/**
 * Get real-time price for multiple materials
 * @param {Array} materials - Array of {name, quantity}
 * @returns {Array} Price list
 */
async function getPriceList(materials) {
  const list = [];
  
  for (const item of materials) {
    const comparison = await compareSuppliers(item.name, item.quantity);
    if (comparison.results) {
      list.push({
        material: item.name,
        quantity: item.quantity,
        best_supplier: comparison.results[0],
        total_cost: comparison.results[0]?.total_price || 0
      });
    }
  }

  return {
    materials: list,
    total_budget: Math.round(list.reduce((sum, item) => sum + item.total_cost, 0) * 100) / 100,
    timestamp: new Date().toISOString()
  };
}

/**
 * Auto-reorder when stock is low
 * @param {String} material - Material to reorder
 * @param {Number} quantity - Quantity to order
 * @returns {Object} Order confirmation
 */
async function autoReorder(material, quantity) {
  const comparison = await compareSuppliers(material, quantity);
  
  if (!comparison.results || comparison.results.length === 0) {
    return { error: 'No suppliers found' };
  }

  const bestSupplier = comparison.results[0];

  return {
    order_id: `ORD_${Date.now()}`,
    material,
    quantity,
    supplier: bestSupplier.supplier,
    unit_price: bestSupplier.unit_price,
    total_price: bestSupplier.total_price,
    delivery_days: bestSupplier.delivery_days,
    status: 'confirmed',
    created_at: new Date().toISOString()
  };
}

/**
 * Monitor price changes over time
 * @param {String} material - Material to monitor
 * @param {Number} days - Days to monitor
 * @returns {Object} Price trend
 */
function getPriceTrend(material, days = 30) {
  // Mock trend data
  const trend = [];
  const basePrice = BASE_PRICES[material] || 1000;
  
  for (let i = 0; i < days; i++) {
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    trend.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
      price: Math.round(basePrice * (1 + variation) * 100) / 100
    });
  }

  const minPrice = Math.min(...trend.map(t => t.price));
  const maxPrice = Math.max(...trend.map(t => t.price));
  const avgPrice = Math.round(trend.reduce((sum, t) => sum + t.price, 0) / trend.length * 100) / 100;

  return {
    material,
    period_days: days,
    trend,
    min_price: minPrice,
    max_price: maxPrice,
    avg_price: avgPrice,
    recommendation: maxPrice > avgPrice * 1.05 ? 'buy_now' : 'wait'
  };
}

// ========== HELPERS ==========

function getDiscount(quantity) {
  if (quantity >= 100) return 15;
  if (quantity >= 50) return 10;
  if (quantity >= 20) return 5;
  return 0;
}

function formatDeliveryDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

module.exports = {
  compareSuppliers,
  getPriceList,
  autoReorder,
  getPriceTrend
};
