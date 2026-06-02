/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Product, CartItem, Sale, SalesSummary, CashRegisterClose } from './types';
import { formatEuro, formatTime, formatDate } from './utils';
import ProductCard from './components/ProductCard';
import CartSection from './components/CartSection';
import CheckoutModal from './components/CheckoutModal';
import {
  Store,
  Receipt,
  Search,
  History,
  TrendingUp,
  CreditCard,
  Banknote,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  User,
  AlertCircle,
  Sliders,
  Edit,
  Plus,
  X,
  UtensilsCrossed,
  Coins,
  Printer,
  Lock,
  Scale
} from 'lucide-react';

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'Patatas Bravas', price: 6.50, category: 'tapas', description: 'Patatas crujientes con salsa brava ligeramente picante y alioli casero.', iconName: 'UtensilsCrossed' },
  { id: '2', name: 'Croquetas de Jamón', price: 8.50, category: 'tapas', description: '6 croquetas cremosas de jamón ibérico de bellota.', iconName: 'Flame' },
  { id: '3', name: 'Tortilla de Patatas', price: 4.50, category: 'tapas', description: 'Porción individual jugosa de tortilla con o sin cebolla según el día.', iconName: 'Egg' },
  { id: '4', name: 'Calamares a la Romana', price: 9.50, category: 'tapas', description: 'Anillas de calamar fresco rebozadas al estilo tradicional con unas gotas de limón.', iconName: 'Fish' },
  { id: '5', name: 'Tabla de Jamón y Queso', price: 14.00, category: 'tapas', description: 'Plato de Jamón Ibérico y Queso Manchego curado con picos caseros.', iconName: 'Beef' },
  { id: '6', name: 'Ensaladilla Rusa', price: 5.50, category: 'tapas', description: 'Patata, atún, zanahoria, huevo y nuestra mayonesa de la casa.', iconName: 'Salad' },
  { id: '7', name: 'Bocadillo de Calamares', price: 6.00, category: 'bocadillos', description: 'Pan candeal crujiente relleno de calamares dorados a la romana.', iconName: 'Sandwich' },
  { id: '8', name: 'Bocadillo Jamón Ibérico', price: 7.50, category: 'bocadillos', description: 'Jamón ibérico, aceite de oliva virgen extra y tomate rallado.', iconName: 'Sandwich' },
  { id: '9', name: 'Sándwich Bikini Mixto', price: 3.50, category: 'bocadillos', description: 'Sándwich clásico tostado con mantequilla, jamón york y queso fundido.', iconName: 'Sparkles' },
  { id: '10', name: 'Pepito de Ternera', price: 8.00, category: 'bocadillos', description: 'Filete de ternera tierno con pimientos verdes fritos en pan de cristal.', iconName: 'Beef' },
  { id: '11', name: 'Caña de Cerveza', price: 2.50, category: 'bebidas', description: 'Cerveza de grifo bien fría servida en copa clásica.', iconName: 'Beer' },
  { id: '12', name: 'Copa de Vino Tinto', price: 3.50, category: 'bebidas', description: 'Copa de vino de la casa con Denominación de Origen Calificada Rioja.', iconName: 'Wine' },
  { id: '13', name: 'Refresco', price: 2.80, category: 'bebidas', description: 'Lata de 33cl (Coca-Cola, Fanta Naranja/Limón, Nestea o Aquarius).', iconName: 'CupSoda' },
  { id: '14', name: 'Agua Mineral', price: 1.85, category: 'bebidas', description: 'Botella de agua mineral de 500ml de las mejores sierras.', iconName: 'CupSoda' },
  { id: '15', name: 'Café con Leche / Solo', price: 1.70, category: 'bebidas', description: 'Café de especialidad arábica tostado artesanalmente.', iconName: 'Coffee' },
  { id: '16', name: 'Crema Catalana', price: 5.00, category: 'postres', description: 'Postre de crema pastelera casera con una fina capa de azúcar quemado.', iconName: 'Cookie' },
  { id: '17', name: 'Tarta de Queso', price: 5.50, category: 'postres', description: 'Tarta horneada súper cremosa con base de galleta maria.', iconName: 'Cake' },
  { id: '18', name: 'Churros con Chocolate', price: 4.00, category: 'postres', description: 'Ración de 4 churros artesanos recién fritos con taza de chocolate caliente.', iconName: 'Sparkles' },
  { id: '19', name: 'Flan de Huevo Casero', price: 3.80, category: 'postres', description: 'Flan tradicional de huevo con caramelo y nata montada.', iconName: 'Cookie' }
];

export default function App() {
  // POS status
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'tapas' | 'bocadillos' | 'bebidas' | 'postres'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout & Customer selections
  const [selectedMesa, setSelectedMesa] = useState('Barra 1');
  const [selectedPayment, setSelectedPayment] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');
  
  // Real historical sales logged in backend Express instance
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  
  // Application view/tab: POS mode, History dashboard, Management panel or Cashier close
  const [currentTab, setCurrentTab] = useState<'pos' | 'history' | 'management' | 'cierre'>('pos');
  
  // Dialog / checkout modal
  const [activeSaleResult, setActiveSaleResult] = useState<Sale | null>(null);
  
  // Process states
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Form states for menu administration module
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState<'tapas' | 'bocadillos' | 'bebidas' | 'postres'>('tapas');
  const [itemPrice, setItemPrice] = useState('');
  const [itemIcon, setItemIcon] = useState('UtensilsCrossed');
  
  const [mgmtSuccessMsg, setMgmtSuccessMsg] = useState<string | null>(null);
  const [mgmtErrorMsg, setMgmtErrorMsg] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Cash Register Close states
  const [cierresHistory, setCierresHistory] = useState<CashRegisterClose[]>([]);
  const [efectivoReal, setEfectivoReal] = useState('');
  const [zReportPrinted, setZReportPrinted] = useState<CashRegisterClose | null>(null);
  const [isCajaLocked, setIsCajaLocked] = useState(false);
  const [cierreSuccessMsg, setCierreSuccessMsg] = useState<string | null>(null);
  const [cierreErrorMsg, setCierreErrorMsg] = useState<string | null>(null);
  const [isRecordingCierre, setIsRecordingCierre] = useState(false);

  // Load products & sales history from server on startup
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorText(null);

    // Auto check if running on static hosts
    const isClientOnly = window.location.hostname.includes('github.io') ||
                         window.location.hostname.includes('github.preview.app') ||
                         !window.location.port;

    if (isClientOnly) {
      let localProdsString = localStorage.getItem('tpv_products');
      let loadedProds: Product[] = [];
      if (localProdsString) {
        try {
          loadedProds = JSON.parse(localProdsString);
        } catch (e) {
          loadedProds = DEFAULT_PRODUCTS;
        }
      } else {
        loadedProds = DEFAULT_PRODUCTS;
        localStorage.setItem('tpv_products', JSON.stringify(DEFAULT_PRODUCTS));
      }

      let localSalesString = localStorage.getItem('tpv_sales');
      let loadedSales: Sale[] = [];
      if (localSalesString) {
        try {
          loadedSales = JSON.parse(localSalesString);
        } catch (e) {
          loadedSales = [];
        }
      }

      let localCierresString = localStorage.getItem('tpv_cierres');
      let loadedCierres: CashRegisterClose[] = [];
      if (localCierresString) {
        try {
          loadedCierres = JSON.parse(localCierresString);
        } catch (e) {
          loadedCierres = [];
        }
      }

      setProducts(loadedProds);
      setSalesHistory(loadedSales);
      setCierresHistory(loadedCierres);
      setLoading(false);
      return;
    }

    try {
      const [productsRes, salesRes, cierresRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/cierres')
      ]);

      if (!productsRes.ok || !salesRes.ok || !cierresRes.ok) {
        throw new Error('API server returned error status.');
      }

      const productsData = await productsRes.json();
      const salesData = await salesRes.json();
      const cierresData = await cierresRes.json();

      setProducts(productsData);
      setSalesHistory(salesData);
      setCierresHistory(cierresData);
      
      localStorage.setItem('tpv_products', JSON.stringify(productsData));
      localStorage.setItem('tpv_sales', JSON.stringify(salesData));
      localStorage.setItem('tpv_cierres', JSON.stringify(cierresData));
    } catch (err: any) {
      console.warn('Could not load data from Node API. Falling back to LocalStorage.', err);
      
      let localProdsString = localStorage.getItem('tpv_products');
      let loadedProds = DEFAULT_PRODUCTS;
      if (localProdsString) {
        try { loadedProds = JSON.parse(localProdsString); } catch(_) {}
      } else {
        localStorage.setItem('tpv_products', JSON.stringify(DEFAULT_PRODUCTS));
      }

      let localSalesString = localStorage.getItem('tpv_sales');
      let loadedSales: Sale[] = [];
      if (localSalesString) {
        try { loadedSales = JSON.parse(localSalesString); } catch(_) {}
      }

      let localCierresString = localStorage.getItem('tpv_cierres');
      let loadedCierres: CashRegisterClose[] = [];
      if (localCierresString) {
        try { loadedCierres = JSON.parse(localCierresString); } catch(_) {}
      }

      setProducts(loadedProds);
      setSalesHistory(loadedSales);
      setCierresHistory(loadedCierres);
    } finally {
      setLoading(false);
    }
  };

  // Add Item to cart
  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  // Update item quantities
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prevItems) => {
      return prevItems
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Remove completely
  const handleRemoveItem = (productId: string) => {
    setCartItems((prevWords) => prevWords.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Submit cart order to backend & register transaction
  const handleProcessPayment = async () => {
    if (cartItems.length === 0) return;
    if (isCajaLocked) {
      setErrorText('La caja está BLOQUEADA temporalmente por arqueo de caja. Por favor, realice un "Reinicio de Turno" en la sección de Cierre de Caja para habilitar nuevas ventas.');
      return;
    }
    setSubmittingOrder(true);
    setErrorText(null);

    const rawTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const total = Math.round(rawTotal * 100) / 100;
    const ivaAmount = Math.round((total * 0.10 / 1.10) * 100) / 100;

    const isClientOnly = window.location.hostname.includes('github.io') ||
                         window.location.hostname.includes('github.preview.app') ||
                         !window.location.port;

    if (isClientOnly) {
      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        ticketNumber: `T-2026-${String(salesHistory.length + 1).padStart(4, '0')}`,
        timestamp: new Date().toISOString(),
        items: cartItems.map(it => ({
          product: it.product,
          quantity: it.quantity,
          subtotal: Math.round(it.product.price * it.quantity * 100) / 100
        })),
        total,
        baseImponible: Math.round((total - ivaAmount) * 100) / 100,
        ivaAmount,
        metodoPago: selectedPayment,
        mesa: selectedMesa
      };

      const updatedSales = [newSale, ...salesHistory];
      setSalesHistory(updatedSales);
      localStorage.setItem('tpv_sales', JSON.stringify(updatedSales));
      
      setCartItems([]);
      setActiveSaleResult(newSale);
      setSubmittingOrder(false);
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cartItems,
          metodoPago: selectedPayment,
          mesa: selectedMesa
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'No se pudo guardar la venta');
      }

      const registeredSale: Sale = await response.json();
      
      // Clear out the checkout cart state
      setCartItems([]);
      
      // Store checkout result to show Simplificated Invoice modal
      setActiveSaleResult(registeredSale);
      
      // Fetch latest history to update stats in frontend
      const updatedHistoryRes = await fetch('/api/sales');
      if (updatedHistoryRes.ok) {
        const freshHistory = await updatedHistoryRes.json();
        setSalesHistory(freshHistory);
        localStorage.setItem('tpv_sales', JSON.stringify(freshHistory));
      }
    } catch (err: any) {
      console.warn('Network error, treating order client-side locally:', err);
      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        ticketNumber: `T-2026-${String(salesHistory.length + 1).padStart(4, '0')}`,
        timestamp: new Date().toISOString(),
        items: cartItems.map(it => ({
          product: it.product,
          quantity: it.quantity,
          subtotal: Math.round(it.product.price * it.quantity * 100) / 100
        })),
        total,
        baseImponible: Math.round((total - ivaAmount) * 100) / 100,
        ivaAmount,
        metodoPago: selectedPayment,
        mesa: selectedMesa
      };

      const updatedSales = [newSale, ...salesHistory];
      setSalesHistory(updatedSales);
      localStorage.setItem('tpv_sales', JSON.stringify(updatedSales));
      
      setCartItems([]);
      setActiveSaleResult(newSale);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Flush backend DB (helpful for testing/restarting the demonstration)
  const handleResetSalesHistory = async () => {
    if (!window.confirm('¿Está seguro de que desea vaciar todo el registro histórico de ventas de este TPV? Esta acción no se puede deshacer.')) {
      return;
    }
    
    const isClientOnly = window.location.hostname.includes('github.io') ||
                         window.location.hostname.includes('github.preview.app') ||
                         !window.location.port;

    if (isClientOnly) {
      setSalesHistory([]);
      localStorage.setItem('tpv_sales', JSON.stringify([]));
      return;
    }

    try {
      const res = await fetch('/api/sales/reset', { method: 'POST' });
      if (res.ok) {
        setSalesHistory([]);
        localStorage.setItem('tpv_sales', JSON.stringify([]));
      }
    } catch (err) {
      console.error('Error resetting sales history:', err);
      setSalesHistory([]);
      localStorage.setItem('tpv_sales', JSON.stringify([]));
    }
  };

  // Product administration handlers
  const handleEditProductClick = (product: Product) => {
    setEditProductId(product.id);
    setItemName(product.name);
    setItemDescription(product.description || '');
    setItemCategory(product.category);
    setItemPrice(String(product.price));
    setItemIcon(product.iconName || 'UtensilsCrossed');
    setMgmtSuccessMsg(null);
    setMgmtErrorMsg(null);

    // Scroll form into view if on small screens
    const formEl = document.getElementById('management-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditProductId(null);
    setItemName('');
    setItemDescription('');
    setItemCategory('tapas');
    setItemPrice('');
    setItemIcon('UtensilsCrossed');
    setMgmtSuccessMsg(null);
    setMgmtErrorMsg(null);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice || !itemCategory) {
      setMgmtErrorMsg('Por favor rellene los campos obligatorios (*).');
      return;
    }

    const parsedPrice = parseFloat(itemPrice.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setMgmtErrorMsg('Por favor introduzca un precio válido (ej: 4.55).');
      return;
    }

    setIsSavingProduct(true);
    setMgmtSuccessMsg(null);
    setMgmtErrorMsg(null);

    const isClientOnly = window.location.hostname.includes('github.io') ||
                         window.location.hostname.includes('github.preview.app') ||
                         !window.location.port;

    if (isClientOnly) {
      let updatedProducts = [...products];
      if (editProductId) {
        updatedProducts = products.map(p => p.id === editProductId ? {
          ...p,
          name: itemName,
          price: Math.round(parsedPrice * 100) / 100,
          category: itemCategory,
          description: itemDescription,
          iconName: itemIcon
        } : p);
        setMgmtSuccessMsg('¡Producto actualizado correctamente en tiempo real!');
      } else {
        const newProd: Product = {
          id: String(Date.now()),
          name: itemName,
          price: Math.round(parsedPrice * 100) / 100,
          category: itemCategory,
          description: itemDescription,
          iconName: itemIcon
        };
        updatedProducts.push(newProd);
        setMgmtSuccessMsg('¡Nuevo producto creado e integrado con éxito!');
      }

      setProducts(updatedProducts);
      localStorage.setItem('tpv_products', JSON.stringify(updatedProducts));
      handleCancelEdit();
      setIsSavingProduct(false);
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editProductId || undefined,
          name: itemName,
          price: parsedPrice,
          category: itemCategory,
          description: itemDescription,
          iconName: itemIcon
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el producto.');
      }

      await response.json();
      
      setMgmtSuccessMsg(editProductId ? '¡Producto actualizado correctamente en tiempo real!' : '¡Nuevo producto creado e integrado con éxito!');
      
      // Reset form fields
      handleCancelEdit();
      
      // Fetch latest catalog
      const freshProductsRes = await fetch('/api/products');
      if (freshProductsRes.ok) {
        const freshProducts = await freshProductsRes.json();
        setProducts(freshProducts);
        localStorage.setItem('tpv_products', JSON.stringify(freshProducts));
      }
    } catch (err: any) {
      console.warn('Network failed, falling back to LocalStorage for product save:', err);
      let updatedProducts = [...products];
      if (editProductId) {
        updatedProducts = products.map(p => p.id === editProductId ? {
          ...p,
          name: itemName,
          price: Math.round(parsedPrice * 100) / 100,
          category: itemCategory,
          description: itemDescription,
          iconName: itemIcon
        } : p);
        setMgmtSuccessMsg('¡Producto actualizado correctamente en tiempo real! (Modo Local)');
      } else {
        const newProd: Product = {
          id: String(Date.now()),
          name: itemName,
          price: Math.round(parsedPrice * 100) / 100,
          category: itemCategory,
          description: itemDescription,
          iconName: itemIcon
        };
        updatedProducts.push(newProd);
        setMgmtSuccessMsg('¡Nuevo producto creado e integrado con éxito! (Modo Local)');
      }

      setProducts(updatedProducts);
      localStorage.setItem('tpv_products', JSON.stringify(updatedProducts));
      handleCancelEdit();
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    if (!window.confirm(`¿Está seguro de que desea eliminar "${target.name}" de la carta? Ya no estará disponible para venta.`)) {
      return;
    }

    setMgmtSuccessMsg(null);
    setMgmtErrorMsg(null);

    const isClientOnly = window.location.hostname.includes('github.io') ||
                         window.location.hostname.includes('github.preview.app') ||
                         !window.location.port;

    if (isClientOnly) {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      localStorage.setItem('tpv_products', JSON.stringify(updatedProducts));
      setCartItems(prev => prev.filter(item => item.product.id !== productId));
      setMgmtSuccessMsg(`"${target.name}" ha sido eliminado correctamente del menú.`);
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('No se pudo borrar el producto del catálogo.');
      }

      setMgmtSuccessMsg(`"${target.name}" ha sido eliminado correctamente del menú.`);
      
      // Fetch latest catalog
      const freshProductsRes = await fetch('/api/products');
      if (freshProductsRes.ok) {
        const freshProducts = await freshProductsRes.json();
        setProducts(freshProducts);
        localStorage.setItem('tpv_products', JSON.stringify(freshProducts));
        
        // Also remove from cart if it was there to prevent state mismatch
        setCartItems(prev => prev.filter(item => item.product.id !== productId));
      }
    } catch (err: any) {
      console.warn('Network error, applying local deletion:', err);
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      localStorage.setItem('tpv_products', JSON.stringify(updatedProducts));
      setCartItems(prev => prev.filter(item => item.product.id !== productId));
      setMgmtSuccessMsg(`"${target.name}" ha sido eliminado correctamente del menú (Modo Local).`);
    }
  };

  // Filter Catalog
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'all' || prod.category === activeCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate cash register expected values based on sales history
  const getCajaExpectedDetails = () => {
    let expectedCash = 0;
    let expectedCard = 0;
    let totalSales = 0;
    let totalIva = 0;
    let ticketCount = salesHistory.length;

    salesHistory.forEach((sale) => {
      totalSales += sale.total;
      totalIva += sale.ivaAmount;
      if (sale.metodoPago === 'Efectivo') {
        expectedCash += sale.total;
      } else if (sale.metodoPago === 'Tarjeta') {
        expectedCard += sale.total;
      }
    });

    return {
      expectedCash: Math.round(expectedCash * 100) / 100,
      expectedCard: Math.round(expectedCard * 100) / 100,
      totalSales: Math.round(totalSales * 100) / 100,
      totalIva: Math.round(totalIva * 100) / 100,
      ticketCount
    };
  };

  const handleDoCierre = async (e: FormEvent) => {
    e.preventDefault();
    setCierreSuccessMsg(null);
    setCierreErrorMsg(null);

    const { expectedCash, expectedCard, totalSales, totalIva, ticketCount } = getCajaExpectedDetails();
    const actualCashNum = parseFloat(efectivoReal.replace(',', '.'));

    if (isNaN(actualCashNum) || actualCashNum < 0) {
      setCierreErrorMsg('Por favor introduce un importe de efectivo real válido (mayor o igual a 0).');
      return;
    }

    const gap = Math.round((actualCashNum - expectedCash) * 100) / 100;

    setIsRecordingCierre(true);
    const isClientOnly = window.location.hostname.includes('github.io') ||
                         window.location.hostname.includes('github.preview.app') ||
                         !window.location.port;

    if (isClientOnly) {
      const lastZNum = cierresHistory.length;
      const zReportNumber = `Z-2026-${String(lastZNum + 1).padStart(4, '0')}`;

      const generatedCierre: CashRegisterClose = {
        id: `cierre-${Date.now()}`,
        timestamp: new Date().toISOString(),
        expectedCash,
        actualCash: actualCashNum,
        expectedCard,
        gap,
        totalSales,
        totalIva,
        ticketCount,
        zReportNumber
      };

      const updatedCierres = [...cierresHistory, generatedCierre];
      setCierresHistory(updatedCierres);
      localStorage.setItem('tpv_cierres', JSON.stringify(updatedCierres));

      setIsCajaLocked(true);
      setZReportPrinted(generatedCierre);
      setCierreSuccessMsg(`¡Arqueo de caja realizado con éxito! Reporte de cierre ${generatedCierre.zReportNumber} generado.`);
      setIsRecordingCierre(false);
      return;
    }

    try {
      const response = await fetch('/api/cierres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expectedCash,
          actualCash: actualCashNum,
          expectedCard,
          gap,
          totalSales,
          totalIva,
          ticketCount
        })
      });

      if (!response.ok) {
        throw new Error('Hubo un error al registrar el cierre de caja en el servidor.');
      }

      const generatedCierre = await response.json();
      
      // Temporarily lock cashier operations
      setIsCajaLocked(true);
      
      // Show "Z-Report Simulado" printed sheet
      setZReportPrinted(generatedCierre);
      
      setCierreSuccessMsg(`¡Arqueo de caja realizado con éxito! Reporte de cierre ${generatedCierre.zReportNumber} generado.`);
      
      // Fetch fresh cierres
      const freshCierresRes = await fetch('/api/cierres');
      if (freshCierresRes.ok) {
        const freshCierres = await freshCierresRes.json();
        setCierresHistory(freshCierres);
        localStorage.setItem('tpv_cierres', JSON.stringify(freshCierres));
      }
    } catch (err: any) {
      console.warn('Network error, saving cierre locally indeed:', err);
      // Fallback
      const lastZNum = cierresHistory.length;
      const zReportNumber = `Z-2026-${String(lastZNum + 1).padStart(4, '0')}`;

      const generatedCierre: CashRegisterClose = {
        id: `cierre-${Date.now()}`,
        timestamp: new Date().toISOString(),
        expectedCash,
        actualCash: actualCashNum,
        expectedCard,
        gap,
        totalSales,
        totalIva,
        ticketCount,
        zReportNumber
      };

      const updatedCierres = [...cierresHistory, generatedCierre];
      setCierresHistory(updatedCierres);
      localStorage.setItem('tpv_cierres', JSON.stringify(updatedCierres));

      setIsCajaLocked(true);
      setZReportPrinted(generatedCierre);
      setCierreSuccessMsg(`¡Arqueo de caja realizado con éxito! Reporte de cierre ${generatedCierre.zReportNumber} generado (Modo Local).`);
    } finally {
      setIsRecordingCierre(false);
    }
  };

  const handleResetTurno = async () => {
    if (!window.confirm('¿Está seguro de que desea reiniciar el turno? Esto vaciará las ventas ordinarias del día y desbloqueará la caja a 0.00€ para continuar vendiendo. El arqueo ya realizado quedará guardado para siempre en el historial de cierres.')) {
      return;
    }

    setCierreSuccessMsg(null);
    setCierreErrorMsg(null);

    const isClientOnly = window.location.hostname.includes('github.io') ||
                         window.location.hostname.includes('github.preview.app') ||
                         !window.location.port;

    if (isClientOnly) {
      setCartItems([]);
      setSalesHistory([]);
      localStorage.setItem('tpv_sales', JSON.stringify([]));
      setEfectivoReal('');
      setIsCajaLocked(false);
      setZReportPrinted(null);
      setCierreSuccessMsg('¡Turno reiniciado! La caja ha quedado a 0.00€ lista para una nueva jornada comercial.');
      return;
    }

    try {
      const response = await fetch('/api/sales/reset', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('No se pudo vaciar la caja en el servidor.');
      }

      // Reset local cash states
      setCartItems([]);
      setSalesHistory([]);
      localStorage.setItem('tpv_sales', JSON.stringify([]));
      setEfectivoReal('');
      setIsCajaLocked(false);
      setZReportPrinted(null);
      setCierreSuccessMsg('¡Turno reiniciado! La caja ha quedado a 0.00€ lista para una nueva jornada comercial.');
    } catch (err: any) {
      console.warn('Network error, resetting turno locally:', err);
      setCartItems([]);
      setSalesHistory([]);
      localStorage.setItem('tpv_sales', JSON.stringify([]));
      setEfectivoReal('');
      setIsCajaLocked(false);
      setZReportPrinted(null);
      setCierreSuccessMsg('¡Turno reiniciado! La caja ha quedado a 0.00€ lista para una nueva jornada comercial (Modo Local).');
    }
  };

  // Calculate live summary indicators for statistics tab
  const getSalesSummary = (): SalesSummary => {
    let totalSales = 0;
    let totalBase = 0;
    let totalIva = 0;
    let efectivoCount = 0;
    let tarjetaCount = 0;
    const itemsSold: { [name: string]: number } = {};

    salesHistory.forEach((sale) => {
      totalSales += sale.total;
      totalBase += sale.baseImponible;
      totalIva += sale.ivaAmount;
      if (sale.metodoPago === 'Efectivo') efectivoCount++;
      if (sale.metodoPago === 'Tarjeta') tarjetaCount++;

      sale.items.forEach((it) => {
        itemsSold[it.name] = (itemsSold[it.name] || 0) + it.quantity;
      });
    });

    return {
      totalSales,
      totalBase,
      totalIva,
      efectivoCount,
      tarjetaCount,
      itemsSold
    };
  };

  const summary = getSalesSummary();

  const sortedTopSellingItems = Object.entries(summary.itemsSold).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans select-none overflow-hidden">
      
      {/* PROFESSIONAL POLISH HIGHLIGHTED HEADER */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl logo-shake">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              Sistema TPV - Sol y Brasa
            </h1>
            <p className="text-2xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
              <span>Caja Principal 01</span>
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-slate-400">Usuario: Admin Colega</span>
            </p>
          </div>
        </div>

        {/* Global Tab Toggles & Clock widget */}
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="tab-pos-view"
              onClick={() => setCurrentTab('pos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'pos'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-550 hover:text-slate-800 hover:bg-white/45'
              }`}
            >
              <Store className="w-4 h-4 text-indigo-500" />
              <span>Caja Registrar TPV</span>
            </button>
            <button
              id="tab-management-view"
              onClick={() => setCurrentTab('management')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'management'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-550 hover:text-slate-800 hover:bg-white/45'
              }`}
            >
              <Sliders className="w-4 h-4 text-rose-550" />
              <span>Gestionar Menú</span>
            </button>
            <button
              id="tab-history-view"
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-550 hover:text-slate-800 hover:bg-white/45'
              }`}
            >
              <History className="w-4 h-4 text-amber-500" />
              <span>Historial e Informes</span>
              {salesHistory.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-3xs font-black min-w-5 h-5 flex items-center justify-center rounded-full leading-none">
                  {salesHistory.length}
                </span>
              )}
            </button>
            <button
              id="tab-cierre-view"
              onClick={() => setCurrentTab('cierre')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'cierre'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-3xs'
                  : 'text-slate-550 hover:text-slate-800 hover:bg-white/45'
              }`}
            >
              <Coins className="w-4 h-4 text-rose-500" />
              <span>Cierre de Caja</span>
              {isCajaLocked && (
                <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider animate-pulse ml-1">
                  Cerrado
                </span>
              )}
            </button>
          </div>

          <div className="text-right hidden sm:block">
            <div id="tpv-live-date" className="text-xs font-semibold text-slate-700">
              {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div id="tpv-live-time" className="text-2xs text-slate-500 font-mono">
              Localización ES • IVA Reducido 10%
            </div>
          </div>
        </div>
      </header>

      {/* Main workspace frame */}
      <main className="flex-1 flex overflow-hidden">
        
        {currentTab === 'pos' ? (
          /* ========================================= */
          /* POS VIEW SCREEN (Left Catalog / Right Cart) */
          /* ========================================= */
          <>
            {/* Catalog list section (Left Side) */}
            <section className="flex-1 flex flex-col p-6 overflow-hidden">
              
              {/* Category selector row & Search box in a single line for maximized workspace height */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-5">
                <nav className="flex flex-wrap gap-2">
                  <button
                    id="cat-tab-all"
                    onClick={() => setActiveCategory('all')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      activeCategory === 'all'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 font-black scale-102'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Todo el Menú
                  </button>
                  <button
                    id="cat-tab-tapas"
                    onClick={() => setActiveCategory('tapas')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      activeCategory === 'tapas'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-100 font-black scale-102'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Tapas 🥘
                  </button>
                  <button
                    id="cat-tab-bocadillos"
                    onClick={() => setActiveCategory('bocadillos')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      activeCategory === 'bocadillos'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-100 font-black scale-102'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Bocadillos 🥪
                  </button>
                  <button
                    id="cat-tab-bebidas"
                    onClick={() => setActiveCategory('bebidas')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      activeCategory === 'bebidas'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-100 font-black scale-102'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Bebidas 🍺
                  </button>
                  <button
                    id="cat-tab-postres"
                    onClick={() => setActiveCategory('postres')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      activeCategory === 'postres'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-100 font-black scale-102'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Postres 🍰
                  </button>
                </nav>

                {/* Seach input filter */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-product-search"
                    type="text"
                    placeholder="Buscar plato o bebida..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Server connection error box */}
              {errorText && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4 text-rose-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-semibold">{errorText}</span>
                  </div>
                  <button
                    onClick={fetchData}
                    className="px-2.5 py-1 bg-white hover:bg-rose-100 rounded text-rose-800 text-2xs uppercase font-extrabold tracking-wider border border-rose-200 cursor-pointer"
                  >
                    Reintentar Conexión
                  </button>
                </div>
              )}

              {/* Grid with visual product buttons */}
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold">Cargando catálogo Sol y Brasa...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-400">
                    <Search className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">No encontramos ningún producto</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Prueba a limpiar la búsqueda o cambiar de categoría para encontrar los artículos de la carta.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-8">
                    {filteredProducts.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Receipt Summary Side Drawers (Right Panel) */}
            <aside className="w-96 p-6 pb-4 bg-white border-l border-slate-200 flex flex-col shadow-xs shrink-0 z-5">
              <CartSection
                cartItems={cartItems}
                selectedMesa={selectedMesa}
                setSelectedMesa={setSelectedMesa}
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onProcessPayment={handleProcessPayment}
                isProcessing={submittingOrder}
              />
            </aside>
          </>
        ) : currentTab === 'history' ? (
          /* ========================================= */
          /* STATISTICS & HISTORIAL REPORTING DASHBOARD */
          /* ========================================= */
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* Upper analytic highlight widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Box 1: Accumulative Income */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <span className="text-2xs font-extrabold text-slate-400 block uppercase tracking-wider">
                  Caja Total (IVA Incluido)
                </span>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {formatEuro(summary.totalSales)}
                  </span>
                  <span className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                    <TrendingUp className="w-5 h-5 stroke-[2.25]" />
                  </span>
                </div>
                <div className="mt-3 text-4xs text-slate-400 uppercase font-mono border-t border-slate-100 pt-2 flex justify-between">
                  <span>Base Neto: {formatEuro(summary.totalBase)}</span>
                  <span>IVA Acumulado: {formatEuro(summary.totalIva)}</span>
                </div>
              </div>

              {/* Box 2: Total Tickets issued */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <span className="text-2xs font-extrabold text-slate-400 block uppercase tracking-wider">
                  Tickets Emitidos
                </span>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {salesHistory.length}
                  </span>
                  <span className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                    <Receipt className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-3 text-4xs text-slate-400 uppercase font-mono border-t border-slate-100 pt-2">
                  <span>Ticket promedio: {salesHistory.length > 0 ? formatEuro(summary.totalSales / salesHistory.length) : '0,00 €'}</span>
                </div>
              </div>

              {/* Box 3: Payment modes */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <span className="text-2xs font-extrabold text-slate-400 block uppercase tracking-wider">
                  Métodos de Pago
                </span>
                <div className="flex justify-between items-end mt-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                      <span>{summary.efectivoCount} en Efectivo</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <span>{summary.tarjetaCount} con Tarjeta</span>
                    </div>
                  </div>
                  <span className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 font-bold text-3xs">
                    {(summary.efectivoCount + summary.tarjetaCount) || 0} pagos
                  </span>
                </div>
              </div>

              {/* Box 4: Top product */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <span className="text-2xs font-extrabold text-slate-400 block uppercase tracking-wider">
                  Producto Estrella
                </span>
                <div className="flex justify-between items-end mt-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-slate-800 block truncate">
                      {sortedTopSellingItems[0]?.[0] || 'Ninguno aún'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {sortedTopSellingItems[0] ? `${sortedTopSellingItems[0][1]} unidades vendidas` : 'Vende productos primero'}
                    </span>
                  </div>
                  <span className="p-2.5 bg-amber-50 rounded-xl text-amber-500 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </span>
                </div>
              </div>

            </div>

            {/* Split layout: tickets log list & top-selling chart list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Detailed Real-Time ticket History Log (Left) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col h-[550px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-sm uppercase">
                      Diario de Facturas Emitidas (Simplificadas)
                    </h2>
                    <p className="text-3xs text-slate-400 mt-0.5">
                      Listado oficial de ventas para la contabilidad del restaurante.
                    </p>
                  </div>
                  {salesHistory.length > 0 && (
                    <button
                      id="btn-purge-logs"
                      onClick={handleResetSalesHistory}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 cursor-pointer transition-colors"
                    >
                      Reiniciar Historial
                    </button>
                  )}
                </div>

                {salesHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Receipt className="w-12 h-12 stroke-[1.25] mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-xs">No hay operaciones archivadas</p>
                    <p className="text-3xs text-slate-400 mt-1">Los tickets generados se registrarán de forma permanente en este diario.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {salesHistory.slice().reverse().map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => setActiveSaleResult(sale)}
                        className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 group"
                        title="Ver ticket de compra simplificado"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 font-mono text-3xs font-extrabold">
                            {sale.metodoPago === 'Tarjeta' ? '💳' : '💶'}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{sale.ticketNumber}</span>
                              <span className="bg-slate-200 px-1 py-0.2 rounded text-[9px] font-mono text-slate-600">{sale.mesa}</span>
                            </div>
                            <div className="text-3xs text-slate-500 font-mono mt-0.5">
                              {formatDate(sale.timestamp)} • {sale.items.length} productos
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-sm text-slate-900 block font-mono">
                              {formatEuro(sale.total)}
                            </span>
                            <span className="text-3xs text-slate-400 block leading-none select-none">
                              Base: {formatEuro(sale.baseImponible)}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Rank: Top-selling items checklist (Right) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[550px]">
                <div className="mb-4 pb-3 border-b border-slate-100">
                  <h2 className="font-extrabold text-slate-900 text-sm uppercase">Ranking de Productos</h2>
                  <p className="text-3xs text-slate-400 mt-0.5">Los platos preferidos por la clientela hoy.</p>
                </div>

                {sortedTopSellingItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Info className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-500">Sin datos de venta</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    {sortedTopSellingItems.map(([name, qty], index) => {
                      // Determine ranks badge values
                      const rank = index + 1;
                      const isTop3 = rank <= 3;
                      const badgeBg = rank === 1 ? 'bg-amber-100 text-amber-800' : rank === 2 ? 'bg-slate-100 text-slate-800' : rank === 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500';

                      return (
                        <div key={name} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-3xs ${badgeBg} shrink-0`}>
                              {rank}
                            </span>
                            <span className="font-bold text-slate-800 text-xs truncate">{name}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-500 font-bold shrink-0 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {qty} {qty === 1 ? 'ud.' : 'uds.'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Legend compliance box */}
                <div className="mt-4 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-4xs text-slate-500 font-medium leading-relaxed">
                  Los cálculos de base imponible e impuesto se sustentan en el régimen tributario del impuesto sobre el valor añadido en España, fijado en un diez por ciento redactado para el gremio de restauración y alimentación.
                </div>
              </div>

            </div>

          </div>
        ) : currentTab === 'management' ? (
          /* ========================================= */
          /* MENU ITEM MANAGEMENT CONFIGURATION PANEL  */
          /* ========================================= */
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-100">
            {/* Header banner/help */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Módulo de Gestión de Ítems del Menú</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Crea, edita o elimina platos y bebidas de la carta en tiempo real. Todos los cambios se integran de forma inmediata en la pantalla de venta TPV.
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentTab('pos')} 
                  className="px-4 py-2 bg-indigo-600 font-extrabold text-white text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Ir a Vender (Caja)</span>
                </button>
              </div>
            </div>

            {/* Status alert banners */}
            {mgmtSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span>{mgmtSuccessMsg}</span>
                <button onClick={() => setMgmtSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">✕</button>
              </div>
            )}

            {mgmtErrorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span>{mgmtErrorMsg}</span>
                <button onClick={() => setMgmtErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-bold">✕</button>
              </div>
            )}

            {/* Left form & Right table list layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Product creator Form (Left - spans 5 columns) */}
              <div id="management-form" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs xl:col-span-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase flex items-center gap-2">
                    <span className="p-1 px-2 text-2xs bg-rose-100 text-rose-700 rounded-md font-bold">
                      {editProductId ? 'Editar' : 'Nuevo'}
                    </span>
                    <span>{editProductId ? 'Editar Producto' : 'Crear Producto'}</span>
                  </h3>
                  {editProductId && (
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Nombre del Plato/Bebida *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Ración de Paella, Croqueta especial, Sidra Asturiana"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Categoría *
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all cursor-pointer font-sans"
                    >
                      <option value="tapas">Tapas 🥘</option>
                      <option value="bocadillos">Bocadillos 🥪</option>
                      <option value="bebidas">Bebidas 🍺</option>
                      <option value="postres">Postres 🍰</option>
                    </select>
                  </div>

                  {/* Short description */}
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Descripción Corta
                    </label>
                    <textarea
                      placeholder="Ej: Servido caliente con cebolla caramelizada o salsa brava ligera."
                      rows={2}
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all resize-none font-sans"
                    />
                  </div>

                  {/* PVP / Price with taxes */}
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      PVP con IVA incluido (€) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ej: 8.50 o 11,20"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-xs">
                        €
                      </span>
                    </div>
                    <span className="text-4xs text-slate-400 block mt-1 uppercase font-semibold">El sistema desgloza automáticamente el 10% IVA en el ticket simplificado.</span>
                  </div>

                  {/* Icon Picker List */}
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      Elegir Icono Ilustrativo
                    </label>
                    <div className="grid grid-cols-7 gap-1.5 p-2 border border-slate-100 bg-slate-50 rounded-xl max-h-40 overflow-y-auto">
                      {[
                        { name: 'UtensilsCrossed', emoji: '🍴' },
                        { name: 'Flame', emoji: '🔥' },
                        { name: 'Egg', emoji: '🍳' },
                        { name: 'Fish', emoji: '🐟' },
                        { name: 'Beef', emoji: '🥩' },
                        { name: 'Salad', emoji: '🥗' },
                        { name: 'Sandwich', emoji: '🥪' },
                        { name: 'Beer', emoji: '🍺' },
                        { name: 'Wine', emoji: '🍷' },
                        { name: 'CupSoda', emoji: '🥤' },
                        { name: 'Coffee', emoji: '☕' },
                        { name: 'Cookie', emoji: '🍪' },
                        { name: 'Cake', emoji: '🍰' },
                        { name: 'Sparkles', emoji: '✨' },
                      ].map((opt) => (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setItemIcon(opt.name)}
                          className={`py-2 rounded-lg text-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                            itemIcon === opt.name 
                              ? 'bg-indigo-600 text-white shadow-xs font-black scale-108' 
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                          title={opt.name}
                        >
                          <span>{opt.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit action buttons */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="w-full py-3 bg-slate-900 text-white text-xs font-extrabold rounded-xl hover:bg-slate-850 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {editProductId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{isSavingProduct ? 'Guardando...' : editProductId ? 'Guardar Cambios' : 'Crear & Guardar Producto'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Product Table List View (Right - spans 7 columns) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs xl:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase">
                      Artículos Actuales ({products.length})
                    </h3>
                    <p className="text-4xs text-slate-400 mt-0.5">Listado completo del catálogo guardado.</p>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[580px] space-y-3.5 pr-1">
                  {products.map((prod) => {
                    // Find matching emoji for item view
                    const iconMap: { [key: string]: string } = {
                      UtensilsCrossed: '🍴',
                      Flame: '🔥',
                      Egg: '🍳',
                      Fish: '🐟',
                      Beef: '🥩',
                      Salad: '🥗',
                      Sandwich: '🥪',
                      Beer: '🍺',
                      Wine: '🍷',
                      CupSoda: '🥤',
                      Coffee: '☕',
                      Cookie: '🍪',
                      Cake: '🍰',
                      Sparkles: '✨'
                    };
                    const emoji = iconMap[prod.iconName || ''] || '🥘';

                    return (
                      <div 
                        key={prod.id}
                        className={`p-3.5 bg-slate-50 border rounded-xl flex items-center justify-between gap-4 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all ${
                          editProductId === prod.id ? 'border-amber-400 bg-amber-50/20' : 'border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-xl shrink-0">
                            {emoji}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">{prod.name}</span>
                              <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded-sm ${
                                prod.category === 'tapas' ? 'bg-amber-100 text-amber-800' :
                                prod.category === 'bocadillos' ? 'bg-orange-100 text-orange-850' :
                                prod.category === 'bebidas' ? 'bg-sky-100 text-sky-850' : 'bg-rose-100 text-rose-850'
                              }`}>
                                {prod.category}
                              </span>
                            </div>
                            {prod.description && (
                              <p className="text-3xs text-slate-400 truncate mt-0.5 max-w-sm">{prod.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Action pricing and edit triggers */}
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xs text-slate-900 font-mono shrink-0">
                            {formatEuro(prod.price)}
                          </span>
                          <div className="flex items-center gap-1.5 font-sans">
                            <button
                              onClick={() => handleEditProductClick(prod)}
                              className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-white rounded-lg border border-slate-200 shadow-xs cursor-pointer transition-colors"
                              title="Editar artículo"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 text-slate-450 hover:text-rose-650 hover:bg-white rounded-lg border border-slate-200 shadow-xs cursor-pointer transition-colors"
                              title="Eliminar artículo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ========================================= */
          /* CASH REGISTER CLOSURE (ARQUEO DE CAJA)      */
          /* ========================================= */
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-100">
            {/* Header banner/help */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Coins className="w-6 h-6 text-rose-600" />
                  <span>Control de Arqueo y Cierre de Caja</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verifica el efectivo recaudado en caja, calcula descuadres, bloquea operaciones y genera el Informe de Cierre Z diario.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleResetTurno} 
                  className="px-4 py-2 hover:bg-slate-200 border border-slate-300 font-extrabold text-slate-700 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  title="Reinicia y pone a cero el TPV para continuar vendiendo en un nuevo turno"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Nuevo Turno (Poner a 0 €)</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('pos')} 
                  className="px-4 py-2 bg-slate-900 font-extrabold text-white text-xs rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Volver a TPV</span>
                </button>
              </div>
            </div>

            {/* Warning if locked */}
            {isCajaLocked && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="font-extrabold">Caja Bloqueada Temporalmente</span> • Se ha realizado el Arqueo Oficial de Venta de hoy. Se impide la emisión de nuevos tickets para evitar descuadres. Si desea abrir un nuevo turno, pulse el botón <strong>"Nuevo Turno (Poner a 0 €)"</strong>.
                </div>
              </div>
            )}

            {/* Status alert banners */}
            {cierreSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                <span>{cierreSuccessMsg}</span>
                <button onClick={() => setCierreSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">✕</button>
              </div>
            )}

            {cierreErrorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                <span>{cierreErrorMsg}</span>
                <button onClick={() => setCierreErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-bold">✕</button>
              </div>
            )}

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Form & Calculations (Left - 7 cols) */}
              <div className="xl:col-span-7 space-y-6">
                
                {/* Expected values review panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                    Cálculo Automático de Ventas del Turno Actual
                  </h3>

                  {/* High Quality Bento Grid for counts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Cash expected */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-4xs font-black text-slate-400 block uppercase tracking-wider">
                        Efectivo Esperado
                      </span>
                      <span className="text-lg font-black text-slate-800 font-mono block mt-1">
                        {formatEuro(getCajaExpectedDetails().expectedCash)}
                      </span>
                      <span className="text-[10px] text-emerald-600 mt-0.5 font-bold flex items-center gap-0.5">
                        <Banknote className="w-3 h-3" />
                        A depositar en cajón
                      </span>
                    </div>

                    {/* Card expected */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-4xs font-black text-slate-400 block uppercase tracking-wider">
                        Tarjeta Realizadas
                      </span>
                      <span className="text-lg font-black text-blue-800 font-mono block mt-1">
                        {formatEuro(getCajaExpectedDetails().expectedCard)}
                      </span>
                      <span className="text-[10px] text-blue-500 mt-0.5 font-bold flex items-center gap-0.5">
                        <CreditCard className="w-3 h-3" />
                        Ingreso en cuenta
                      </span>
                    </div>

                    {/* Total billing */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-4xs font-black text-slate-400 block uppercase tracking-wider">
                        Total Facturado (PVP)
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono block mt-1">
                        {formatEuro(getCajaExpectedDetails().totalSales)}
                      </span>
                      <span className="text-[10px] text-indigo-505 mt-0.5 font-bold flex items-center gap-0.5 bg-indigo-50 px-1 py-0.2 rounded w-fit text-indigo-700">
                        {getCajaExpectedDetails().ticketCount} tickets emitidos
                      </span>
                    </div>

                    {/* Total VAT */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-4xs font-black text-slate-400 block uppercase tracking-wider">
                        IVA Total Recaudado (10%)
                      </span>
                      <span className="text-lg font-black text-slate-700 font-mono block mt-1">
                        {formatEuro(getCajaExpectedDetails().totalIva)}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 font-semibold block">
                        Base: {formatEuro(getCajaExpectedDetails().totalSales - getCajaExpectedDetails().totalIva)}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Audit Input Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
                    Formulario Interactivo de Conciliación
                  </h3>

                  <form onSubmit={handleDoCierre} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Input manual */}
                      <div>
                        <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                          Introducir Efectivo Real en Caja (€) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Ej: 350.50 (Efectivo físico real)"
                            value={efectivoReal}
                            onChange={(e) => setEfectivoReal(e.target.value)}
                            disabled={isCajaLocked}
                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-black focus:outline-hidden focus:bg-white focus:border-rose-500 transition-all font-sans text-slate-900 placeholder:font-normal placeholder:text-xs disabled:opacity-50"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-sm">
                            €
                          </span>
                        </div>
                        <span className="text-4xs text-slate-400 block mt-1.5 uppercase font-medium">
                          Suma el dinero físico en billetes y monedas que poseas en tu cajón TPV.
                        </span>
                      </div>

                      {/* Live discrepancy calculation panel */}
                      <div>
                        <span className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                          Resultado de Descuadre de Caja
                        </span>
                        
                        {(() => {
                          const actualVal = parseFloat(efectivoReal.replace(',', '.'));
                          const expectedVal = getCajaExpectedDetails().expectedCash;
                          
                          if (isNaN(actualVal)) {
                            return (
                              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 h-[52px]">
                                <span className="text-xs font-bold uppercase tracking-wider">Esperando recuento...</span>
                              </div>
                            );
                          }

                          const gap = Math.round((actualVal - expectedVal) * 100) / 100;
                          
                          if (gap === 0) {
                            return (
                              <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl flex items-center justify-between h-[52px] animate-fade-in font-sans">
                                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                  <span>✨ CAJA CUADRADA</span>
                                </span>
                                <span className="text-sm font-black font-mono">0.00 €</span>
                              </div>
                            );
                          } else {
                            const isPositive = gap > 0;
                            return (
                              <div className={`p-4 border rounded-xl flex items-center justify-between h-[52px] animate-fade-in font-sans ${
                                isPositive 
                                  ? 'bg-amber-50 border-amber-300 text-amber-800' 
                                  : 'bg-rose-50 border-rose-300 text-rose-800'
                              }`}>
                                <span className="text-2xs font-black uppercase tracking-wide">
                                  {isPositive ? '⚠️ Sobrante imprevisto:' : '🚨 Pérdidas (Faltante):'}
                                </span>
                                <span className="text-sm font-black font-mono">
                                  {isPositive ? '+' : ''}{gap.toFixed(2)} €
                                </span>
                              </div>
                            );
                          }
                        })()}
                        <span className="text-4xs text-slate-400 block mt-1.5 uppercase font-medium">
                          Cálculo: Efectivo Real introducido - Efectivo Esperado matemático.
                        </span>
                      </div>
                    </div>

                    {/* Record Closure action trigger */}
                    <div>
                      <button
                        type="submit"
                        disabled={isRecordingCierre || isCajaLocked || getCajaExpectedDetails().ticketCount === 0}
                        className="w-full py-4 bg-rose-600 font-extrabold text-white text-xs rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-xs shadow-rose-100 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{isRecordingCierre ? 'Transmitiendo Arqueo...' : 'Efectuar Cierre y Bloquear Caja'}</span>
                      </button>
                      {getCajaExpectedDetails().ticketCount === 0 && (
                        <span className="text-4xs text-slate-400 block text-center mt-2 font-bold uppercase">
                          Debe haber al menos 1 ticket emitido en el turno actual para realizar un Arqueo de Caja.
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* simulated machine printer or closing history (Right - 5 cols) */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Simulated Z-Report receipt paper representation */}
                {zReportPrinted ? (
                  <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl font-mono border-4 border-double border-slate-700 shadow-xl space-y-5 select-none relative animate-fade-in text-xs max-w-sm mx-auto">
                    {/* Visual paper feed notch circles */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-850 rounded-full"></span>
                      <span className="w-1.5 h-1.5 bg-slate-850 rounded-full"></span>
                      <span className="w-1.5 h-1.5 bg-slate-850 rounded-full"></span>
                    </div>

                    <div className="text-center pt-2 space-y-1">
                      <h4 className="font-black tracking-widest uppercase text-white">** INFORME DE CIERRE Z **</h4>
                      <p className="text-3xs text-slate-400">TPV RESTAURANTE ESPAÑOL</p>
                      <p className="text-4xs text-slate-500">Documento de Carácter Tributario Oficial</p>
                    </div>

                    <div className="border-b border-dashed border-slate-700 pb-3 space-y-1 text-3xs">
                      <div>Nº CIERRE Z: <span className="font-bold text-amber-400">{zReportPrinted.zReportNumber}</span></div>
                      <div>PROCESADO: <span className="font-bold">{new Date(zReportPrinted.timestamp).toLocaleString('es-ES')}</span></div>
                      <div>SISTEMA TPV: <span className="font-bold">Cloud Ingress Port 3000 Node</span></div>
                      <div>OPERADOR: <span className="font-bold">Supervisor Caja Central</span></div>
                    </div>

                    <div className="space-y-2 border-b border-dashed border-slate-700 pb-3">
                      <span className="block font-black uppercase text-4xs text-slate-400 tracking-wider">--- HISTÓRICO DE FACTURACIÓN ---</span>
                      <div className="flex justify-between">
                        <span>Tickets de Venta emitidos:</span>
                        <span className="font-bold">{zReportPrinted.ticketCount} uds.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Bruto Facturado:</span>
                        <span className="font-bold text-white">{formatEuro(zReportPrinted.totalSales)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-3xs">
                        <span>Base Imponible (Sin Imp.):</span>
                        <span>{formatEuro(zReportPrinted.totalSales - zReportPrinted.totalIva)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-3xs">
                        <span>IVA Soportado Desglosado:</span>
                        <span>{formatEuro(zReportPrinted.totalIva)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-b border-dashed border-slate-700 pb-3">
                      <span className="block font-black uppercase text-4xs text-slate-400 tracking-wider">--- MÉTODOS DE PAGO ESPERADOS ---</span>
                      <div className="flex justify-between text-slate-350">
                        <span>Pago Tarjeta Electrónica:</span>
                        <span>{formatEuro(zReportPrinted.expectedCard)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-450">
                        <span>Pago Efectivo Esperado:</span>
                        <span>{formatEuro(zReportPrinted.expectedCash)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pb-2">
                      <span className="block font-black uppercase text-4xs text-slate-400 tracking-wider">--- ARQUEO Y CONCILIACIÓN ---</span>
                      <div className="flex justify-between text-white">
                        <span>Efectivo Declarado:</span>
                        <span className="font-black text-amber-300">{formatEuro(zReportPrinted.actualCash)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Descuadre Caja detectado:</span>
                        <span className={`font-black ${zReportPrinted.gap === 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                          {zReportPrinted.gap === 0 ? '0.00 € (CUADRADO)' : `${zReportPrinted.gap.toFixed(2)} €`}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-700 pt-4 text-center">
                      <div className="bg-white/10 text-[9px] font-black tracking-widest px-2.5 py-1 text-white border border-white/20 uppercase rounded-lg">
                        Caja Bloqueada - Turno Cerrado
                      </div>
                      <button 
                        onClick={() => window.print()}
                        className="mt-4 text-4xs text-slate-400 hover:text-white flex items-center gap-1 mx-auto underline cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir ticket de cierre físico</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-3">
                    <Printer className="w-12 h-12 stroke-[1.2] text-slate-300" />
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs">Simulador de Ticket de Informe Z</h4>
                      <p className="text-3xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Al efectuar el Cierre de Caja se generará e imprimirá de manera simulada el ticket contable legal del día en este panel con la firma de auditoría.
                      </p>
                    </div>
                  </div>
                )}

                {/* Closing Reports History (Persistent logs) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      Historial de Arqueos Guardados ({cierresHistory.length})
                    </h3>
                    <p className="text-4xs text-slate-400 mt-0.5 uppercase font-medium">Histórico digital persistente en servidor.</p>
                  </div>

                  {cierresHistory.length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-3xs text-slate-400 uppercase font-semibold">No hay cierres anteriores registrados.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {cierresHistory.map((cl) => (
                        <div key={cl.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-3 text-3xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-805 text-amber-700 font-mono text-2xs">{cl.zReportNumber}</span>
                              <span className="text-[9px] text-slate-400 font-semibold">{new Date(cl.timestamp).toLocaleDateString('es-ES')}</span>
                            </div>
                            <p className="text-slate-500 mt-0.5">Tickets procesados: {cl.ticketCount} uds.</p>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-slate-900 font-mono">{formatEuro(cl.totalSales)}</div>
                            <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded mt-0.5 font-bold ${
                              cl.gap === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {cl.gap === 0 ? 'Cuadrada' : `Descuadre: ${cl.gap.toFixed(2)} €`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* Visual Overlay for Touch Friendliness hints */}
      <footer className="fixed bottom-3.5 left-6 gap-5 text-4xs text-slate-450 uppercase font-black tracking-wider hidden sm:flex pointer-events-none select-none z-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Bucle Servidor: Activo en Puerto 3000</span>
        </div>
        <div>Canal de Datos: Memoria Compartida Localizable</div>
        <div>Código de Impuesto: IVA 10% (REDUCI-1)</div>
      </footer>

      {/* Checkout simplified invoice modal */}
      {activeSaleResult && (
        <CheckoutModal
          sale={activeSaleResult}
          onClose={() => setActiveSaleResult(null)}
        />
      )}

    </div>
  );
}
