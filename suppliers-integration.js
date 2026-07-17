// Supplier Integration v2.0
const suppliers = {
  'ferreteria-central': { name: 'Ferretería Central', score: 100, delivery_days: 2 },
  'acero-estructuras': { name: 'Acero y Estructuras', score: 85, delivery_days: 5 },
  'azulejos-premium': { name: 'Azulejos Premium', score: 92, delivery_days: 3 },
  'cables-electricos': { name: 'Cables Eléctricos SA', score: 88, delivery_days: 4 },
  'pinturas-decorativas': { name: 'Pinturas Decorativas', score: 78, delivery_days: 6 }
};

function getSupplierPrice(supplier_id, material, quantity) {
  // Real-time price lookup
  const base_prices = {
    'tuberias-pvc': 2.50,
    'cemento-portland': 8.00,
    'ladrillos': 0.45,
    'acero-estructural': 120.00,
    'azulejos-ceramica': 45.00
  };
  return (base_prices[material] || 10.00) * quantity;
}

function compareSuppliers(material, quantity) {
  const results = [];
  for (const [id, supplier] of Object.entries(suppliers)) {
    results.push({
      supplier: supplier.name,
      price: getSupplierPrice(id, material, quantity),
      delivery: supplier.delivery_days,
      score: supplier.score
    });
  }
  return results.sort((a, b) => a.price - b.price);
}

module.exports = { compareSuppliers, getSupplierPrice };
