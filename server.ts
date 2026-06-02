/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Product, Sale, CashRegisterClose } from './src/types';

// In-memory or persisted DB
const SALES_FILE_PATH = path.join(process.cwd(), 'sales_history.json');
const PRODUCTS_FILE_PATH = path.join(process.cwd(), 'products_catalog.json');
const CIERRES_FILE_PATH = path.join(process.cwd(), 'cierres_history.json');

// Default initial products catalog representing typical Spanish Tapas/Cafeteria
const DEFAULT_PRODUCTS: Product[] = [
  // tapas
  { id: '1', name: 'Patatas Bravas', price: 6.50, category: 'tapas', description: 'Patatas crujientes con salsa brava ligeramente picante y alioli casero.', iconName: 'UtensilsCrossed' },
  { id: '2', name: 'Croquetas de Jamón', price: 8.50, category: 'tapas', description: '6 croquetas cremosas de jamón ibérico de bellota.', iconName: 'Flame' },
  { id: '3', name: 'Tortilla de Patatas', price: 4.50, category: 'tapas', description: 'Porción individual jugosa de tortilla con o sin cebolla según el día.', iconName: 'Egg' },
  { id: '4', name: 'Calamares a la Romana', price: 9.50, category: 'tapas', description: 'Anillas de calamar fresco rebozadas al estilo tradicional con unas gotas de limón.', iconName: 'Fish' },
  { id: '5', name: 'Tabla de Jamón y Queso', price: 14.00, category: 'tapas', description: 'Plato de Jamón Ibérico y Queso Manchego curado con picos caseros.', iconName: 'Beef' },
  { id: '6', name: 'Ensaladilla Rusa', price: 5.50, category: 'tapas', description: 'Patata, atún, zanahoria, huevo y nuestra mayonesa de la casa.', iconName: 'Salad' },
  
  // bocadillos
  { id: '7', name: 'Bocadillo de Calamares', price: 6.00, category: 'bocadillos', description: 'Pan candeal crujiente relleno de calamares dorados a la romana.', iconName: 'Sandwich' },
  { id: '8', name: 'Bocadillo Jamón Ibérico', price: 7.50, category: 'bocadillos', description: 'Jamón ibérico, aceite de oliva virgen extra y tomate rallado.', iconName: 'Sandwich' },
  { id: '9', name: 'Sándwich Bikini Mixto', price: 3.50, category: 'bocadillos', description: 'Sándwich clásico tostado con mantequilla, jamón york y queso fundido.', iconName: 'Square' },
  { id: '10', name: 'Pepito de Ternera', price: 8.00, category: 'bocadillos', description: 'Filete de ternera tierno con pimientos verdes fritos en pan de cristal.', iconName: 'Beef' },
  
  // bebidas
  { id: '11', name: 'Caña de Cerveza', price: 2.50, category: 'bebidas', description: 'Cerveza de grifo bien fría servida en copa clásica.', iconName: 'Beer' },
  { id: '12', name: 'Copa de Vino Tinto', price: 3.50, category: 'bebidas', description: 'Copa de vino de la casa con Denominación de Origen Calificada Rioja.', iconName: 'Wine' },
  { id: '13', name: 'Refresco', price: 2.80, category: 'bebidas', description: 'Lata de 33cl (Coca-Cola, Fanta Naranja/Limón, Nestea o Aquarius).', iconName: 'CupSoda' },
  { id: '14', name: 'Agua Mineral', price: 1.85, category: 'bebidas', description: 'Botella de agua mineral de 500ml de las mejores sierras.', iconName: 'Droplet' },
  { id: '15', name: 'Café con Leche / Solo', price: 1.70, category: 'bebidas', description: 'Café de especialidad arábica tostado artesanalmente.', iconName: 'Coffee' },
  
  // postres
  { id: '16', name: 'Crema Catalana', price: 5.00, category: 'postres', description: 'Postre de crema pastelera casera con una fina capa de azúcar quemado.', iconName: 'Cookie' },
  { id: '17', name: 'Tarta de Queso', price: 5.50, category: 'postres', description: 'Tarta horneada súper cremosa con base de galleta maria.', iconName: 'Cake' },
  { id: '18', name: 'Churros con Chocolate', price: 4.00, category: 'postres', description: 'Ración de 4 churros artesanos recién fritos con taza de chocolate caliente.', iconName: 'Sparkles' },
  { id: '19', name: 'Flan de Huevo Casero', price: 3.80, category: 'postres', description: 'Flan tradicional de huevo con caramelo y nata montada.', iconName: 'Dessert' }
];

// Load of persisted catalog
function loadProducts(): Product[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE_PATH)) {
      const data = fs.readFileSync(PRODUCTS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading products file, using default catalog:', err);
  }
  
  // Initial save of default catalog
  try {
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(DEFAULT_PRODUCTS, null, 2), 'utf-8');
  } catch (err) {
    console.error('Cannot save default product catalog:', err);
  }
  return DEFAULT_PRODUCTS;
}

let productsCatalog: Product[] = loadProducts();

// Load initial sales or default historical ones
function loadSales(): Sale[] {
  try {
    if (fs.existsSync(SALES_FILE_PATH)) {
      const data = fs.readFileSync(SALES_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading sales file, using default mock sales:', err);
  }

  // Generate some high-quality mock sales for Spain restaurant on startup
  const firstTicketTime = new Date();
  firstTicketTime.setHours(firstTicketTime.getHours() - 3);
  
  const secondTicketTime = new Date();
  secondTicketTime.setHours(secondTicketTime.getHours() - 1);

  const mockSales: Sale[] = [
    {
      id: 'sale-1',
      ticketNumber: 'FS-2026/0001',
      timestamp: firstTicketTime.toISOString(),
      items: [
        { productId: '1', name: 'Patatas Bravas', price: 6.50, quantity: 2, total: 13.00 },
        { productId: '11', name: 'Caña de Cerveza', price: 2.50, quantity: 2, total: 5.00 },
        { productId: '8', name: 'Bocadillo Jamón Ibérico', price: 7.50, quantity: 1, total: 7.50 }
      ],
      total: 25.50,
      baseImponible: Math.round((25.50 / 1.10) * 100) / 100,
      ivaAmount: Math.round((25.50 - (25.50 / 1.10)) * 100) / 100,
      metodoPago: 'Tarjeta',
      mesa: 'Mesa 4'
    },
    {
      id: 'sale-2',
      ticketNumber: 'FS-2026/0002',
      timestamp: secondTicketTime.toISOString(),
      items: [
        { productId: '3', name: 'Tortilla de Patatas', price: 4.50, quantity: 1, total: 4.50 },
        { productId: '15', name: 'Café con Leche / Solo', price: 1.70, quantity: 1, total: 1.70 },
        { productId: '17', name: 'Tarta de Queso', price: 5.50, quantity: 1, total: 5.50 }
      ],
      total: 11.70,
      baseImponible: Math.round((11.70 / 1.10) * 100) / 100,
      ivaAmount: Math.round((11.70 - (11.70 / 1.10)) * 100) / 100,
      metodoPago: 'Efectivo',
      mesa: 'Barra 2'
    }
  ];

  try {
    fs.writeFileSync(SALES_FILE_PATH, JSON.stringify(mockSales, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not save initial mock sales:', err);
  }

  return mockSales;
}

let salesHistory: Sale[] = loadSales();

// Load cierres history
function loadCierres(): CashRegisterClose[] {
  try {
    if (fs.existsSync(CIERRES_FILE_PATH)) {
      const data = fs.readFileSync(CIERRES_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading cierres file, returning empty:', err);
  }
  return [];
}

let cierresHistory: CashRegisterClose[] = loadCierres();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Get Products
  app.get('/api/products', (req, res) => {
    res.json(productsCatalog);
  });

  // API Route - Create or Update Product
  app.post('/api/products', (req, res) => {
    try {
      const { id, name, price, category, description, iconName } = req.body;
      
      if (!name || price === undefined || !category) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, precio y categoría.' });
      }

      const formattedPrice = parseFloat(price);
      if (isNaN(formattedPrice) || formattedPrice < 0) {
        return res.status(400).json({ error: 'El precio debe ser un número válido mayor o igual a cero.' });
      }

      let targetProduct: Product;

      if (id) {
        // Update existing item
        const index = productsCatalog.findIndex(p => p.id === id);
        if (index === -1) {
          return res.status(404).json({ error: 'El producto a editar no existe.' });
        }
        
        targetProduct = {
          ...productsCatalog[index],
          name,
          price: Math.round(formattedPrice * 100) / 100,
          category,
          description: description || '',
          iconName: iconName || productsCatalog[index].iconName || 'UtensilsCrossed'
        };
        productsCatalog[index] = targetProduct;
      } else {
        // Create new item
        targetProduct = {
          id: String(Date.now()),
          name,
          price: Math.round(formattedPrice * 100) / 100,
          category,
          description: description || '',
          iconName: iconName || 'UtensilsCrossed'
        };
        productsCatalog.push(targetProduct);
      }

      // Save updated catalog to disk
      try {
        fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(productsCatalog, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error saving updated product catalog to disk:', err);
      }

      res.status(200).json(targetProduct);
    } catch (error: any) {
      console.error('Error in POST /api/products:', error);
      res.status(550).json({ error: 'Error interno de servidor al guardar producto.' });
    }
  });

  // API Route - Delete Product
  app.delete('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const index = productsCatalog.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'El producto no existe.' });
      }
      
      const deleted = productsCatalog.splice(index, 1);

      // Save updated catalog to disk
      try {
        fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(productsCatalog, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error saving products collection after deletion:', err);
      }

      res.json({ message: 'Producto eliminado con éxito.', product: deleted[0] });
    } catch (error: any) {
      console.error('Error in DELETE /api/products:', error);
      res.status(500).json({ error: 'Error interno al eliminar el producto.' });
    }
  });

  // API Route - Get Sales History
  app.get('/api/sales', (req, res) => {
    res.json(salesHistory);
  });

  // API Route - Register Sale
  app.post('/api/sales', (req, res) => {
    try {
      const { items, metodoPago, mesa } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'El carrito de compras no puede estar vacío.' });
      }

      // Re-verify calculations server side for security
      let total = 0;
      const checkoutItems = items.map((cartItem: any) => {
        const catalogProd = productsCatalog.find(p => p.id === cartItem.product.id);
        if (!catalogProd) {
          throw new Error(`Producto no encontrado: ${cartItem.product.name}`);
        }
        const itemTotal = catalogProd.price * cartItem.quantity;
        total += itemTotal;
        return {
          productId: catalogProd.id,
          name: catalogProd.name,
          price: catalogProd.price,
          quantity: cartItem.quantity,
          total: Math.round(itemTotal * 100) / 100
        };
      });

      // Round final totals to 2 decimal places
      total = Math.round(total * 100) / 100;
      
      // In Spain, total includes 10% IVA.
      // We calculate the taxable base (base imponible): Total / 1.10
      const baseImponible = Math.round((total / 1.10) * 100) / 100;
      // IVA is Total - Base Imponible
      const ivaAmount = Math.round((total - baseImponible) * 100) / 100;

      // Autoincrement ticket number for Spanish simplistic invoice (Factura Simplificada)
      const currentYear = new Date().getFullYear();
      const lastTicketOfDay = salesHistory.length;
      const formattedNum = String(lastTicketOfDay + 1).padStart(4, '0');
      const ticketNumber = `FS-${currentYear}/${formattedNum}`;

      const newSale: Sale = {
        id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticketNumber,
        timestamp: new Date().toISOString(),
        items: checkoutItems,
        total,
        baseImponible,
        ivaAmount,
        metodoPago: metodoPago || 'Efectivo',
        mesa: mesa || 'Barra'
      };

      salesHistory.push(newSale);

      // Save to disk
      try {
        fs.writeFileSync(SALES_FILE_PATH, JSON.stringify(salesHistory, null, 2), 'utf-8');
      } catch (err) {
        console.error('Cannot save registered sale to disk:', err);
      }

      res.status(201).json(newSale);
    } catch (error: any) {
      console.error('Error processing sale:', error);
      res.status(500).json({ error: error.message || 'Error interno al procesar la venta.' });
    }
  });

  // API Route - Clear sales history (for supervisor reset)
  app.post('/api/sales/reset', (req, res) => {
    salesHistory = [];
    try {
      fs.writeFileSync(SALES_FILE_PATH, JSON.stringify(salesHistory, null, 2), 'utf-8');
    } catch (err) {
      console.error('Cannot reset sales catalog:', err);
    }
    res.json({ message: 'Historial de ventas vaciado con éxito.' });
  });

  // API Route - Get Cierres History
  app.get('/api/cierres', (req, res) => {
    res.json(cierresHistory);
  });

  // API Route - Record a cash register close
  app.post('/api/cierres', (req, res) => {
    try {
      const { expectedCash, actualCash, expectedCard, gap, totalSales, totalIva, ticketCount } = req.body;

      if (expectedCash === undefined || actualCash === undefined || expectedCard === undefined || totalSales === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el arqueo de caja.' });
      }

      // Generate a Z-Report Number
      const lastZNum = cierresHistory.length;
      const zReportNumber = `Z-${new Date().getFullYear()}-${String(lastZNum + 1).padStart(4, '0')}`;

      const newCierre: CashRegisterClose = {
        id: `cierre-${Date.now()}`,
        timestamp: new Date().toISOString(),
        expectedCash: parseFloat(expectedCash),
        actualCash: parseFloat(actualCash),
        expectedCard: parseFloat(expectedCard),
        gap: parseFloat(gap),
        totalSales: parseFloat(totalSales),
        totalIva: parseFloat(totalIva),
        ticketCount: parseInt(ticketCount, 10),
        zReportNumber
      };

      cierresHistory.push(newCierre);

      // Save to disk
      try {
        fs.writeFileSync(CIERRES_FILE_PATH, JSON.stringify(cierresHistory, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error saving cierres list to disk:', err);
      }

      res.status(201).json(newCierre);
    } catch (err: any) {
      console.error('Error processing closure:', err);
      res.status(500).json({ error: 'Error interno al procesar el cierre de caja.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TPV Restaurante server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
