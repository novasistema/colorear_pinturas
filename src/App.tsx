import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { 
  db, 
  testConnection, 
  seedInitialDataIfEmpty, 
  handleFirestoreError, 
  OperationType,
  syncOfficialAugust2026PriceList,
  INITIAL_FACTORY_USERS,
  seedUsersIfEmpty,
  seedFinanceAndStaffIfEmpty,
  seedSellersIfEmpty
} from './services/firebase';
import { 
  getStoredBackupConfig, 
  isBackupDue, 
  createFullBackupSnapshot, 
  downloadBackupPackage 
} from './services/backupAndResetService';
import { 
  RawMaterial, 
  Formula, 
  Product, 
  ProductionOrder, 
  SalesOrder, 
  Customer, 
  Transport, 
  Supplier, 
  PurchaseOrder, 
  FinancialTransaction, 
  InventoryMovement, 
  NotificationItem, 
  CompanyConfig, 
  ModuleKey, 
  SalesOrderStatus,
  AppUser,
  CheckItem,
  CheckStatus,
  Cashbox,
  CashMovement,
  Employee,
  SalaryPayment,
  DeliveryOrder,
  Seller,
  RouteSheet
} from './types';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DesktopModule } from './components/DesktopModule';
import { ProductionModule } from './components/ProductionModule';
import { SalesOrdersModule } from './components/SalesOrdersModule';
import { SellersModule } from './components/SellersModule';
import { PriceListModule } from './components/PriceListModule';
import { CustomersModule } from './components/CustomersModule';
import { LogisticsModule } from './components/LogisticsModule';
import { PurchasesModule } from './components/PurchasesModule';
import { FinancesModule } from './components/FinancesModule';
import { ReportsModule } from './components/ReportsModule';
import { CustomerPortal } from './components/CustomerPortal';
import { SettingsModule } from './components/SettingsModule';
import { LoginScreen } from './components/LoginScreen';
import { UsersModule } from './components/UsersModule';
import { ChecksModule } from './components/ChecksModule';
import { CashboxModule } from './components/CashboxModule';
import { AccountingAndProfitabilityModule } from './components/AccountingAndProfitabilityModule';
import { EmployeesModule } from './components/EmployeesModule';
import { DebtsAndReceivablesModule } from './components/DebtsAndReceivablesModule';
import { MobileSellerApp } from './components/MobileSellerApp';
import { exportPriceListToExcel } from './utils/exportUtils';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('desktop');
  const [portalClientTaxId, setPortalClientTaxId] = useState<string | null>(() => {
    return localStorage.getItem('colorear_portal_client_tax_id');
  });
  const [preloadedProductionData, setPreloadedProductionData] = useState<{ formula?: Formula; order?: ProductionOrder } | null>(null);

  // App Users & Current Authenticated Staff
  const [appUsers, setAppUsers] = useState<AppUser[]>(INITIAL_FACTORY_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('colorear_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // State collections synced from Firestore
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [routeSheets, setRouteSheets] = useState<RouteSheet[]>([]);
  const [activeSellerContext, setActiveSellerContext] = useState<Seller | null>(null);
  const [isMobileSellerAppOpen, setIsMobileSellerAppOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Initialize and attach Firestore real-time listeners
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const initializeApp = async () => {
      try {
        await testConnection();
        await seedInitialDataIfEmpty();
        await seedUsersIfEmpty();
        await seedFinanceAndStaffIfEmpty();
        await seedSellersIfEmpty();

        // Check if official August 2026 catalog with SKUs needs to be synchronized
        const prodSnap = await getDocs(collection(db, 'products'));
        if (prodSnap.size < 50) {
          await syncOfficialAugust2026PriceList();
        }

        // 1. Raw Materials
        const unsubRaw = onSnapshot(collection(db, 'raw_materials'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as RawMaterial));
          setRawMaterials(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'raw_materials');
        });
        unsubscribes.push(unsubRaw);

        // 2. Formulas
        const unsubForm = onSnapshot(collection(db, 'formulas'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Formula));
          setFormulas(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'formulas');
        });
        unsubscribes.push(unsubForm);

        // 3. Products
        const unsubProd = onSnapshot(collection(db, 'products'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
          setProducts(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'products');
        });
        unsubscribes.push(unsubProd);

        // 4. Production Orders
        const unsubPO = onSnapshot(collection(db, 'production_orders'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionOrder));
          setProductionOrders(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'production_orders');
        });
        unsubscribes.push(unsubPO);

        // 5. Sales Orders
        const unsubSO = onSnapshot(collection(db, 'sales_orders'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesOrder));
          setSalesOrders(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'sales_orders');
        });
        unsubscribes.push(unsubSO);

        // 6. Customers
        const unsubCust = onSnapshot(collection(db, 'customers'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
          setCustomers(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'customers');
        });
        unsubscribes.push(unsubCust);

        // 7. Transports
        const unsubTrans = onSnapshot(collection(db, 'transports'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transport));
          setTransports(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'transports');
        });
        unsubscribes.push(unsubTrans);

        // 8. Suppliers
        const unsubSup = onSnapshot(collection(db, 'suppliers'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
          setSuppliers(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'suppliers');
        });
        unsubscribes.push(unsubSup);

        // 9. Purchase Orders
        const unsubPurch = onSnapshot(collection(db, 'purchase_orders'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseOrder));
          setPurchaseOrders(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'purchase_orders');
        });
        unsubscribes.push(unsubPurch);

        // 10. Financial Transactions
        const unsubTx = onSnapshot(collection(db, 'financial_transactions'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialTransaction));
          setFinancialTransactions(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'financial_transactions');
        });
        unsubscribes.push(unsubTx);

        // 11. Inventory Movements
        const unsubMov = onSnapshot(collection(db, 'inventory_movements'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryMovement));
          setInventoryMovements(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'inventory_movements');
        });
        unsubscribes.push(unsubMov);

        // 12. Notifications
        const unsubNotif = onSnapshot(collection(db, 'notifications'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
          setNotifications(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        });
        unsubscribes.push(unsubNotif);

        // 13. Company Config
        const unsubConfig = onSnapshot(collection(db, 'company_config'), snap => {
          if (!snap.empty) {
            setCompanyConfig(snap.docs[0].data() as CompanyConfig);
          }
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'company_config');
        });
        unsubscribes.push(unsubConfig);

        // 14. App Users & Factory Staff
        const unsubUsers = onSnapshot(collection(db, 'app_users'), snap => {
          if (!snap.empty) {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
            setAppUsers(items);
          }
        }, error => {
          console.warn('Could not read app_users in real time, using initial list:', error);
        });
        unsubscribes.push(unsubUsers);

        // 15. Checks & E-Cheqs
        const unsubChecks = onSnapshot(collection(db, 'checks'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckItem));
          setChecks(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'checks');
        });
        unsubscribes.push(unsubChecks);

        // 16. Cashboxes & Bank Accounts
        const unsubBoxes = onSnapshot(collection(db, 'cashboxes'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashbox));
          setCashboxes(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'cashboxes');
        });
        unsubscribes.push(unsubBoxes);

        // 17. Cash Movements (Detailed ledger)
        const unsubCashMov = onSnapshot(collection(db, 'cash_movements'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CashMovement));
          setCashMovements(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'cash_movements');
        });
        unsubscribes.push(unsubCashMov);

        // 18. Employees & Staff
        const unsubEmp = onSnapshot(collection(db, 'employees'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
          setEmployees(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'employees');
        });
        unsubscribes.push(unsubEmp);

        // 19. Salary Payments & Advances
        const unsubSal = onSnapshot(collection(db, 'salary_payments'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SalaryPayment));
          setSalaryPayments(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'salary_payments');
        });
        unsubscribes.push(unsubSal);

        // 20. Sellers (Vendedores de calle)
        const unsubSellers = onSnapshot(collection(db, 'sellers'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Seller));
          setSellers(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'sellers');
        });
        unsubscribes.push(unsubSellers);

        // 21. Route Sheets (Hojas de ruta de preventa)
        const unsubRoutes = onSnapshot(collection(db, 'route_sheets'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as RouteSheet));
          setRouteSheets(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'route_sheets');
        });
        unsubscribes.push(unsubRoutes);

        setIsLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Auto-redirect if active seller persona cannot access current module
  useEffect(() => {
    if (activeSellerContext && activeSellerContext.allowedModules && activeSellerContext.allowedModules.length > 0) {
      if (!activeSellerContext.allowedModules.includes(activeModule)) {
        setActiveModule(activeSellerContext.allowedModules[0] || 'sellers');
      }
    }
  }, [activeSellerContext, activeModule]);

  // Automated Backup scheduler check based on configured frequency
  useEffect(() => {
    const checkAutomatedBackup = async () => {
      const backupCfg = getStoredBackupConfig();
      if (isBackupDue(backupCfg)) {
        if (backupCfg.autoDownload) {
          try {
            console.log("Plazo de copia de seguridad alcanzado. Generando backup automático...");
            const pkg = await createFullBackupSnapshot(companyConfig);
            downloadBackupPackage(pkg);
          } catch (e) {
            console.warn("Fallo en la descarga automática del backup:", e);
          }
        }
      }
    };

    // Run 5 seconds after load so initial data is synced
    const timer = setTimeout(checkAutomatedBackup, 5000);
    return () => clearTimeout(timer);
  }, [companyConfig]);

  // --- ACTIONS & AUTOMATIONS ---

  // Complete Production Order: Auto-deduct raw materials & auto-add finished paint to product stock
  const handleCompleteProductionOrder = async (order: ProductionOrder) => {
    try {
      const formula = formulas.find(f => f.id === order.formulaId);
      if (!formula) return;

      const batch = writeBatch(db);

      // 1. Update order status
      const orderRef = doc(db, 'production_orders', order.id);
      batch.update(orderRef, {
        status: 'completada',
        completedAt: new Date().toISOString()
      });

      // 2. Deduct raw materials proportionally
      formula.items.forEach(item => {
        const consumedKg = (item.percentageOrKg / 100) * order.targetKg;
        const mat = rawMaterials.find(m => m.id === item.rawMaterialId);
        if (mat) {
          const newStock = Math.max(0, mat.currentStock - consumedKg);
          const matRef = doc(db, 'raw_materials', mat.id);
          batch.update(matRef, { currentStock: newStock });

          // Kardex entry for material exit
          const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 999)}`;
          const movRef = doc(db, 'inventory_movements', movId);
          batch.set(movRef, {
            id: movId,
            itemType: 'raw_material',
            itemId: mat.id,
            itemName: mat.name,
            movementType: 'salida_produccion',
            quantity: -consumedKg,
            unit: mat.unit,
            reference: order.orderNumber,
            user: order.operatorName,
            date: new Date().toISOString()
          });
        }
      });

      // 3. Add finished paint product stock
      // Find matching product in catalog
      const matchingProduct = products.find(p => 
        p.name.toLowerCase().includes(order.productName.toLowerCase()) ||
        order.productName.toLowerCase().includes(p.name.toLowerCase())
      ) || products[0];

      if (matchingProduct) {
        const prodRef = doc(db, 'products', matchingProduct.id);
        batch.update(prodRef, {
          stock: matchingProduct.stock + order.packageCount
        });

        // Kardex entry for finished product entry
        const movProdId = `mov-${Date.now()}-prod`;
        const movProdRef = doc(db, 'inventory_movements', movProdId);
        batch.set(movProdRef, {
          id: movProdId,
          itemType: 'product',
          itemId: matchingProduct.id,
          itemName: `${matchingProduct.name} (${matchingProduct.presentation})`,
          movementType: 'entrada_produccion',
          quantity: order.packageCount,
          unit: 'unidades',
          reference: `${order.orderNumber} - Lote: ${order.batchNumber} | Partida: ${order.partidaNumber || 'P-01'}`,
          batchNumber: order.batchNumber,
          partidaNumber: order.partidaNumber || '',
          user: order.operatorName,
          date: new Date().toISOString()
        });
      }

      // 4. Create automatic notification: Production finished
      const notifId = `notif-${Date.now()}`;
      const notifRef = doc(db, 'notifications', notifId);
      batch.set(notifRef, {
        id: notifId,
        title: 'Producción Concluida & Stock en Alta',
        message: `Orden ${order.orderNumber} finalizada: Se dieron de alta ${order.packageCount} envases de ${order.productName} y se descontó la materia prima en tiempo real.`,
        type: 'produccion_progreso',
        targetEntityId: order.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: 'production'
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'production_orders');
    }
  };

  // Create new production order
  const handleCreateProductionOrder = async (order: ProductionOrder) => {
    try {
      await setDoc(doc(db, 'production_orders', order.id), order);
      // Automatic notification
      const notifId = `notif-${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        title: 'Nueva Orden de Fabricación Iniciada',
        message: `Orden ${order.orderNumber} en proceso: ${order.targetKg} kg de ${order.productName} a envasar en ${order.packageCount} unidades.`,
        type: 'produccion_progreso',
        targetEntityId: order.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: 'production'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'production_orders');
    }
  };

  // Update sales order stage & notify when ready/dispatched
  const handleUpdateOrderStatus = async (orderId: string, status: SalesOrderStatus, additionalData?: Partial<SalesOrder>) => {
    try {
      const order = salesOrders.find(o => o.id === orderId);
      if (!order) return;

      const orderRef = doc(db, 'sales_orders', orderId);
      await updateDoc(orderRef, {
        status,
        ...additionalData
      });

      // Automatic notifications based on stage
      if (status === 'preparando_remito' || status === 'facturado') {
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          title: 'Pedido Listo para Despacho',
          message: `El pedido ${order.orderNumber} de ${order.customerName} tiene el remito preparado y está listo para ser recogido por ${order.transportName || 'transporte'}.`,
          type: 'pedido_listo',
          targetEntityId: orderId,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: 'sales'
        });
      } else if (status === 'despachado') {
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          title: 'Pedido Despachado al Transporte',
          message: `El pedido ${order.orderNumber} salió de planta con ${order.transportName}. Código de seguimiento: ${order.trackingCode}.`,
          type: 'despacho_en_camino',
          targetEntityId: orderId,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: 'sales'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sales_orders');
    }
  };

  // Emit Delivery Order (Despacho / Remito Parcial) and deduct stock in real time
  const handleDeliverOrderItems = async (orderId: string, delivery: DeliveryOrder) => {
    try {
      const order = salesOrders.find(o => o.id === orderId);
      if (!order) return;

      const batch = writeBatch(db);

      // 1. Deduct finished goods stock for each item delivered
      let totalUnitsDeliveredNow = 0;
      delivery.items.forEach(delItem => {
        if (delItem.quantity <= 0) return;
        totalUnitsDeliveredNow += delItem.quantity;
        const prod = products.find(p => p.id === delItem.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stock - delItem.quantity);
          const pRef = doc(db, 'products', prod.id);
          batch.update(pRef, { stock: newStock });

          // Kardex inventory movement entry with industrial batch and partida traceability
          const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;
          const movRef = doc(db, 'inventory_movements', movId);
          batch.set(movRef, {
            id: movId,
            itemType: 'product',
            itemId: prod.id,
            itemName: `${prod.name} (${prod.presentation})`,
            movementType: 'salida_venta',
            quantity: -delItem.quantity,
            unit: 'unidades',
            reference: `Orden Entrega ${delivery.deliveryNumber} - Factura ${order.invoiceNumber || 'Anticipada'} - ${order.customerName}${delItem.batchNumber ? ` [Lote: ${delItem.batchNumber}${delItem.partidaNumber ? ` / Part: ${delItem.partidaNumber}` : ''}]` : ''}`,
            user: delivery.driverName || 'Depósito Fábrica',
            batchNumber: delItem.batchNumber || undefined,
            partidaNumber: delItem.partidaNumber || undefined,
            date: new Date().toISOString()
          });
        }
      });

      // 2. Update line items delivered quantities
      const updatedItems = order.items.map(it => {
        const deliveredMatch = delivery.items.find(di => di.productId === it.productId);
        const addedQty = deliveredMatch ? deliveredMatch.quantity : 0;
        const totalDelivered = (it.deliveredQuantity || 0) + addedQty;
        return {
          ...it,
          deliveredQuantity: totalDelivered
        };
      });

      // 3. Compute overall delivery status
      const totalOrderedQty = updatedItems.reduce((acc, it) => acc + it.quantity, 0);
      const totalDeliveredQty = updatedItems.reduce((acc, it) => acc + (it.deliveredQuantity || 0), 0);

      let deliveryStatus: 'pendiente_entrega' | 'entrega_parcial' | 'entrega_total' = 'pendiente_entrega';
      let overallStatus = order.status;

      if (totalDeliveredQty >= totalOrderedQty) {
        deliveryStatus = 'entrega_total';
        overallStatus = 'entregado';
      } else if (totalDeliveredQty > 0) {
        deliveryStatus = 'entrega_parcial';
        overallStatus = 'entrega_parcial';
      }

      const existingDeliveries = order.deliveryOrders || [];
      const updatedDeliveries = [...existingDeliveries, delivery];

      // 4. Update sales order in Firestore
      const orderRef = doc(db, 'sales_orders', orderId);
      batch.update(orderRef, {
        items: updatedItems,
        deliveryStatus,
        status: overallStatus,
        deliveryOrders: updatedDeliveries,
        remitoNumber: delivery.deliveryNumber
      });

      // Also record into root collection 'delivery_orders'
      const delRef = doc(db, 'delivery_orders', delivery.id);
      batch.set(delRef, delivery);

      // 5. Automatic Notification for logistics & dispatch
      const notifId = `notif-${Date.now()}`;
      const notifRef = doc(db, 'notifications', notifId);
      batch.set(notifRef, {
        id: notifId,
        title: `Mercadería Despachada (${delivery.deliveryNumber})`,
        message: `Despacho de ${totalUnitsDeliveredNow} unidades para ${order.customerName}. Saldo restante: ${Math.max(0, totalOrderedQty - totalDeliveredQty)} unidades.`,
        type: 'despacho_en_camino',
        targetEntityId: orderId,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: 'sales'
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales_orders');
    }
  };

  // Record payment in Customer checking account
  const handleRecordCustomerPayment = async (
    customerId: string, 
    amount: number, 
    method: FinancialTransaction['paymentMethod'], 
    concept: string,
    receiptNumber?: string,
    bankInfo?: string,
    allocatedOrderIds?: string[]
  ) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const batch = writeBatch(db);

      // 1. Update customer balance
      const newBalance = Math.max(0, customer.currentBalance - amount);
      const custRef = doc(db, 'customers', customerId);
      batch.update(custRef, { currentBalance: newBalance });

      // 2. Add financial transaction with full receipt information
      const txId = `tx-${Date.now()}`;
      const txRef = doc(db, 'financial_transactions', txId);
      const finalReceiptNumber = receiptNumber || `REC-0001-${String(Math.floor(Math.random() * 89999 + 10000)).padStart(8, '0')}`;

      batch.set(txRef, {
        id: txId,
        type: 'cobro_cliente',
        direction: 'ingreso',
        amount,
        date: new Date().toISOString(),
        entityId: customerId,
        entityName: customer.businessName,
        paymentMethod: method,
        concept,
        receiptNumber: finalReceiptNumber,
        notes: bankInfo || ''
      });

      // 3. If allocated to specific orders, mark them as paid in the database
      if (allocatedOrderIds && allocatedOrderIds.length > 0) {
        allocatedOrderIds.forEach(orderId => {
          const oRef = doc(db, 'sales_orders', orderId);
          batch.update(oRef, {
            paymentStatus: 'pagado',
            paidAmount: amount
          });
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
    }
  };

  // Receive purchase order & add raw material stock
  const handleReceivePurchaseOrder = async (po: PurchaseOrder) => {
    try {
      const batch = writeBatch(db);

      // 1. Mark PO as received
      const poRef = doc(db, 'purchase_orders', po.id);
      batch.update(poRef, { status: 'recibido' });

      // 2. Update stock for each item
      po.items.forEach(it => {
        const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
        if (mat) {
          const matRef = doc(db, 'raw_materials', mat.id);
          batch.update(matRef, {
            currentStock: mat.currentStock + it.quantity,
            unitCost: it.unitCost // Update last cost
          });

          // Log movement
          const movId = `mov-${Date.now()}-${it.rawMaterialId}`;
          const movRef = doc(db, 'inventory_movements', movId);
          batch.set(movRef, {
            id: movId,
            itemType: 'raw_material',
            itemId: mat.id,
            itemName: mat.name,
            movementType: 'entrada_compra',
            quantity: it.quantity,
            unit: mat.unit,
            reference: po.orderNumber,
            user: 'Administración Compras',
            date: new Date().toISOString()
          });
        }
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'purchase_orders');
    }
  };

  // Notification mark read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  // --- CHECKS / E-CHEQS HANDLERS ---
  const handleSaveCheck = async (chk: CheckItem) => {
    try {
      await setDoc(doc(db, 'checks', chk.id), chk);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'checks');
    }
  };

  const handleUpdateCheckStatus = async (checkId: string, status: CheckStatus, notes?: string, destinationId?: string) => {
    try {
      const chk = checks.find(c => c.id === checkId);
      if (!chk) return;
      const batch = writeBatch(db);
      const chkRef = doc(db, 'checks', checkId);

      const updateData: Partial<CheckItem> = { status };
      if (notes) updateData.notes = notes;

      if (status === 'depositado' || status === 'cobrado') {
        updateData.depositDate = new Date().toISOString();
        if (destinationId) {
          updateData.cashboxId = destinationId;
          const box = cashboxes.find(b => b.id === destinationId);
          if (box) {
            batch.update(doc(db, 'cashboxes', box.id), {
              currentBalance: box.currentBalance + chk.amount
            });
            // Record cash movement
            const movId = `mov-chk-${Date.now()}`;
            batch.set(doc(db, 'cash_movements', movId), {
              id: movId,
              cashboxId: box.id,
              cashboxName: box.name,
              type: 'ingreso',
              amount: chk.amount,
              category: 'cobranza_clientes',
              concept: `Acreditación Cheque Nº ${chk.checkNumber} (${chk.bankName})`,
              date: new Date().toISOString(),
              referenceNumber: chk.checkNumber,
              user: currentUser?.name || 'Tesorería',
              createdAt: new Date().toISOString()
            });
          }
        }
      } else if (status === 'entregado_proveedor' && destinationId) {
        updateData.deliveredToSupplierId = destinationId;
        const sup = suppliers.find(s => s.id === destinationId);
        if (sup) {
          updateData.deliveredToSupplierName = sup.businessName;
        }
      }

      batch.update(chkRef, updateData);
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'checks');
    }
  };

  // --- CASHBOX & MOVEMENTS HANDLERS ---
  const handleSaveCashbox = async (box: Cashbox) => {
    try {
      await setDoc(doc(db, 'cashboxes', box.id), box);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cashboxes');
    }
  };

  const handleAddCashMovement = async (mov: CashMovement) => {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'cash_movements', mov.id), mov);

      const box = cashboxes.find(b => b.id === mov.cashboxId);
      if (box) {
        const delta = mov.type === 'ingreso' ? mov.amount : -mov.amount;
        batch.update(doc(db, 'cashboxes', box.id), {
          currentBalance: Math.max(0, box.currentBalance + delta)
        });
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cash_movements');
    }
  };

  const handleTransferBetweenCashboxes = async (fromId: string, toId: string, amount: number, concept: string) => {
    try {
      const fromBox = cashboxes.find(b => b.id === fromId);
      const toBox = cashboxes.find(b => b.id === toId);
      if (!fromBox || !toBox) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'cashboxes', fromId), {
        currentBalance: Math.max(0, fromBox.currentBalance - amount)
      });
      batch.update(doc(db, 'cashboxes', toId), {
        currentBalance: toBox.currentBalance + amount
      });

      const movId = `trf-${Date.now()}`;
      batch.set(doc(db, 'cash_movements', movId), {
        id: movId,
        cashboxId: fromId,
        cashboxName: fromBox.name,
        type: 'transferencia',
        amount,
        category: 'transferencia_entre_cajas',
        concept: concept || `Transferencia hacia ${toBox.name}`,
        date: new Date().toISOString(),
        destinationCashboxId: toId,
        destinationCashboxName: toBox.name,
        user: currentUser?.name || 'Administración',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cashboxes');
    }
  };

  const handleRecordSupplierPayment = async (supplierId: string, amount: number, cashboxId: string, notes: string) => {
    try {
      const sup = suppliers.find(s => s.id === supplierId);
      const box = cashboxes.find(b => b.id === cashboxId);
      const batch = writeBatch(db);

      if (box) {
        batch.update(doc(db, 'cashboxes', box.id), {
          currentBalance: Math.max(0, box.currentBalance - amount)
        });
      }

      const txId = `tx-sup-${Date.now()}`;
      batch.set(doc(db, 'financial_transactions', txId), {
        id: txId,
        type: 'pago_proveedor',
        direction: 'egreso',
        amount,
        date: new Date().toISOString(),
        entityId: supplierId,
        entityName: sup?.businessName || 'Proveedor',
        paymentMethod: box?.type === 'banco' ? 'transferencia' : 'efectivo',
        concept: notes || `Pago a proveedor ${sup?.businessName || ''}`,
        receiptNumber: `OP-${Date.now().toString().slice(-6)}`
      });

      const movId = `mov-sup-${Date.now()}`;
      batch.set(doc(db, 'cash_movements', movId), {
        id: movId,
        cashboxId: cashboxId || (cashboxes[0]?.id || 'box-planta'),
        cashboxName: box?.name || 'Caja Planta',
        type: 'egreso',
        amount,
        category: 'materias_primas',
        concept: `Pago a proveedor: ${sup?.businessName || ''}. ${notes}`,
        date: new Date().toISOString(),
        user: currentUser?.name || 'Finanzas',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'suppliers');
    }
  };

  // --- STAFF & SALARY HANDLERS ---
  const handleSaveEmployee = async (emp: Employee) => {
    try {
      await setDoc(doc(db, 'employees', emp.id), emp);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'employees');
    }
  };

  const handleRecordSalaryPayment = async (payment: SalaryPayment) => {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'salary_payments', payment.id), payment);

      const box = cashboxes.find(b => b.id === payment.cashboxId);
      if (box) {
        batch.update(doc(db, 'cashboxes', box.id), {
          currentBalance: Math.max(0, box.currentBalance - payment.netAmount)
        });
      }

      const movId = `mov-sal-${Date.now()}`;
      batch.set(doc(db, 'cash_movements', movId), {
        id: movId,
        cashboxId: payment.cashboxId || 'box-planta',
        cashboxName: box?.name || 'Caja Planta',
        type: 'egreso',
        amount: payment.netAmount,
        category: payment.paymentType === 'adelanto' ? 'adelanto_sueldos' : 'sueldos_jornales',
        concept: `Liquidación ${payment.paymentNumber} - ${payment.employeeName} (${payment.period})`,
        date: payment.date || new Date().toISOString(),
        employeeId: payment.employeeId,
        employeeName: payment.employeeName,
        user: currentUser?.name || 'Recursos Humanos',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'salary_payments');
    }
  };

  // Customer Portal Login / Logout
  const handleLoginClient = (taxId: string) => {
    setPortalClientTaxId(taxId);
    localStorage.setItem('colorear_portal_client_tax_id', taxId);
    setActiveModule('customer_portal');
  };

  const handleLogoutClient = () => {
    setPortalClientTaxId(null);
    localStorage.removeItem('colorear_portal_client_tax_id');
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('colorear_current_user', JSON.stringify(user));
    if (user.role === 'vendedor_calle') {
      const matchSeller = sellers.find(s => 
        (s.email && s.email.toLowerCase() === user.email.toLowerCase()) || 
        s.name.toLowerCase().includes(user.name.toLowerCase())
      );
      if (matchSeller) {
        setActiveSellerContext(matchSeller);
      }
      setIsMobileSellerAppOpen(true);
    } else {
      setActiveModule('desktop');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsMobileSellerAppOpen(false);
    localStorage.removeItem('colorear_current_user');
  };

  // Calculations for badges
  const productionActiveCount = productionOrders.filter(o => o.status === 'en_proceso' || o.status === 'planificada').length;
  const pendingDispatchCount = salesOrders.filter(o => o.status === 'preparando_remito' || o.status === 'facturado').length;
  const pendingPaymentCount = customers.filter(c => c.currentBalance > 0).length;

  const urgentChecksCount = checks.filter(c => {
    if (c.status !== 'en_cartera') return false;
    const dueTime = new Date(c.dueDate).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <img 
          src="/assets/aistudio/colorear-500px_0158e3cb.webp" 
          alt="Colorear Pinturas" 
          className="h-16 w-auto object-contain mb-4 animate-pulse"
        />
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span>Conectando con base de datos en tiempo real Firestore...</span>
        </div>
      </div>
    );
  }

  // Dedicated Mobile App for Street Traveling Salesmen (Preventistas / Vendedores de Calle)
  if (isMobileSellerAppOpen) {
    return (
      <MobileSellerApp
        sellers={sellers}
        routeSheets={routeSheets}
        customers={customers}
        products={products}
        salesOrders={salesOrders}
        financialTransactions={financialTransactions}
        config={companyConfig}
        activeSellerContext={activeSellerContext}
        onSetActiveSellerContext={setActiveSellerContext}
        onCloseMobileApp={() => setIsMobileSellerAppOpen(false)}
        onCreateSalesOrder={async (order) => {
          await setDoc(doc(db, 'sales_orders', order.id), order);
          const cust = customers.find(c => c.id === order.customerId);
          if (cust && order.paymentStatus !== 'pagado') {
            await updateDoc(doc(db, 'customers', cust.id), {
              currentBalance: cust.currentBalance + order.total
            });
          }
        }}
        onRecordCustomerPayment={handleRecordCustomerPayment}
        onSaveRouteSheet={async (sheet) => {
          await setDoc(doc(db, 'route_sheets', sheet.id), sheet);
        }}
      />
    );
  }

  // Not logged in: show LoginScreen or Customer Portal
  if (!currentUser) {
    if (activeModule === 'customer_portal') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <img src="/assets/aistudio/colorear-500px_0158e3cb.webp" alt="Colorear" className="h-6 w-auto brightness-0 invert" />
              <span>Portal Oficial de Clientes & Pinturerías</span>
            </div>
            <button
              onClick={() => setActiveModule('desktop')}
              className="text-slate-300 hover:text-white flex items-center gap-1 font-bold underline"
            >
              ← Volver al Acceso de Personal de Fábrica
            </button>
          </div>
          <CustomerPortal
            customers={customers}
            salesOrders={salesOrders}
            config={companyConfig}
            activeClientTaxId={portalClientTaxId}
            onLoginClient={handleLoginClient}
            onLogoutClient={handleLogoutClient}
          />
        </div>
      );
    }

    return (
      <LoginScreen
        users={appUsers}
        onLogin={handleLogin}
        onOpenCustomerPortal={() => setActiveModule('customer_portal')}
        onOpenMobileSellerApp={() => setIsMobileSellerAppOpen(true)}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearAllNotifications={handleClearAllNotifications}
        config={companyConfig}
        portalClientTaxId={portalClientTaxId}
        currentUser={currentUser}
        activeSellerContext={activeSellerContext}
        onSetActiveSellerContext={setActiveSellerContext}
        onLogout={handleLogout}
        onExitPortal={handleLogoutClient}
        onOpenCustomerPortalModal={() => setActiveModule('customer_portal')}
        onOpenMobileSellerApp={() => setIsMobileSellerAppOpen(true)}
      />

      {/* Main Container - Strict Independent Scrolling */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (Fixed in place, independently scrollable, distinct separation) */}
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          productionActiveCount={productionActiveCount}
          pendingDispatchCount={pendingDispatchCount}
          pendingPaymentCount={pendingPaymentCount}
          urgentChecksCount={urgentChecksCount}
          allowedModules={activeSellerContext ? activeSellerContext.allowedModules : undefined}
        />

        {/* Content View (Independently scrollable, scrolling here does NOT move the sidebar) */}
        <main className="flex-1 h-full overflow-y-auto bg-slate-100/70 relative">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {activeModule === 'desktop' && (
            <DesktopModule
              setActiveModule={setActiveModule}
              productionOrders={productionOrders}
              salesOrders={salesOrders}
              customers={customers}
              rawMaterials={rawMaterials}
              products={products}
              onOpenNewProductionModal={() => setActiveModule('production')}
              onOpenNewSalesModal={() => setActiveModule('sales')}
              onExportPriceListExcel={() => exportPriceListToExcel(products, companyConfig || undefined)}
              onNavigateToCustomer={(cust) => setActiveModule('customers')}
              onOpenMobileSellerApp={() => setIsMobileSellerAppOpen(true)}
            />
          )}

          {activeModule === 'production' && (
            <ProductionModule
              rawMaterials={rawMaterials}
              formulas={formulas}
              productionOrders={productionOrders}
              products={products}
              inventoryMovements={inventoryMovements}
              onSaveRawMaterial={async (mat) => {
                await setDoc(doc(db, 'raw_materials', mat.id), mat);
              }}
              onDeleteRawMaterial={async (id) => {
                await deleteDoc(doc(db, 'raw_materials', id));
              }}
              onSaveFormula={async (formula) => {
                await setDoc(doc(db, 'formulas', formula.id), formula);
              }}
              onDeleteFormula={async (id) => {
                await deleteDoc(doc(db, 'formulas', id));
              }}
              onCreateProductionOrder={handleCreateProductionOrder}
              onCompleteProductionOrder={handleCompleteProductionOrder}
              onUpdateOrderStatus={async (orderId, status) => {
                await updateDoc(doc(db, 'production_orders', orderId), { status });
              }}
              onSendToPriceList={(preloadData) => {
                setPreloadedProductionData(preloadData);
                setActiveModule('prices');
              }}
            />
          )}

          {activeModule === 'sales' && (
            <SalesOrdersModule
              salesOrders={salesOrders}
              customers={customers}
              products={products}
              productionOrders={productionOrders}
              transports={transports}
              config={companyConfig}
              onCreateOrder={async (order) => {
                await setDoc(doc(db, 'sales_orders', order.id), order);
                // Also update customer current balance if not paid
                const cust = customers.find(c => c.id === order.customerId);
                if (cust && order.paymentStatus !== 'pagado') {
                  await updateDoc(doc(db, 'customers', cust.id), {
                    currentBalance: cust.currentBalance + order.total
                  });
                }
              }}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeliverOrderItems={handleDeliverOrderItems}
              onRecordOrderPayment={async (orderId, amount) => {
                await updateDoc(doc(db, 'sales_orders', orderId), {
                  paymentStatus: 'pagado',
                  paidAmount: amount
                });
              }}
            />
          )}

          {activeModule === 'sellers' && (
            <SellersModule
              sellers={sellers}
              routeSheets={routeSheets}
              customers={customers}
              salesOrders={salesOrders}
              financialTransactions={financialTransactions}
              config={companyConfig}
              currentUser={currentUser}
              activeSellerContext={activeSellerContext}
              onSetActiveSellerContext={setActiveSellerContext}
              onSaveSeller={async (seller) => {
                await setDoc(doc(db, 'sellers', seller.id), seller);
              }}
              onDeleteSeller={async (sellerId) => {
                await deleteDoc(doc(db, 'sellers', sellerId));
              }}
              onSaveRouteSheet={async (routeSheet) => {
                await setDoc(doc(db, 'route_sheets', routeSheet.id), routeSheet);
              }}
              onDeleteRouteSheet={async (routeSheetId) => {
                await deleteDoc(doc(db, 'route_sheets', routeSheetId));
              }}
              onOpenMobileSellerApp={() => setIsMobileSellerAppOpen(true)}
            />
          )}

          {activeModule === 'prices' && (
            <PriceListModule
              products={products}
              formulas={formulas}
              productionOrders={productionOrders}
              initialPreload={preloadedProductionData}
              onClearPreload={() => setPreloadedProductionData(null)}
              config={companyConfig}
              onSaveProduct={async (product) => {
                await setDoc(doc(db, 'products', product.id), product);
              }}
              onDeleteProduct={async (id) => {
                await deleteDoc(doc(db, 'products', id));
              }}
              onBulkPriceUpdate={async (increasePct, target, category) => {
                const batch = writeBatch(db);
                const factor = 1 + increasePct / 100;

                const targetProducts = category && category !== 'all'
                  ? products.filter(p => p.category === category)
                  : products;

                targetProducts.forEach(p => {
                  const ref = doc(db, 'products', p.id);
                  const updates: Partial<Product> = {};

                  if (target === 'sale_only' || target === 'cost_and_sale') {
                    updates.priceDistributor = Math.round(p.priceDistributor * factor);
                    updates.priceWholesale = Math.round(p.priceWholesale * factor);
                    updates.priceRetail = Math.round(p.priceRetail * factor);
                  }

                  if (target === 'cost_only' || target === 'cost_and_sale') {
                    updates.unitCost = Math.round(p.unitCost * factor);
                  }

                  batch.update(ref, updates);
                });

                // If updating costs and all categories are targeted, also update raw materials
                if ((target === 'cost_only' || target === 'cost_and_sale') && (!category || category === 'all')) {
                  rawMaterials.forEach(m => {
                    const mRef = doc(db, 'raw_materials', m.id);
                    batch.update(mRef, {
                      unitCost: Math.round(m.unitCost * factor)
                    });
                  });
                }

                await batch.commit();
              }}
              onSyncOfficialCatalog={syncOfficialAugust2026PriceList}
            />
          )}

          {activeModule === 'customers' && (
            <CustomersModule
              customers={customers}
              salesOrders={salesOrders}
              financialTransactions={financialTransactions}
              transports={transports}
              config={companyConfig}
              onSaveCustomer={async (cust) => {
                await setDoc(doc(db, 'customers', cust.id), cust);
              }}
              onRecordPayment={handleRecordCustomerPayment}
            />
          )}

          {activeModule === 'logistics' && (
            <LogisticsModule
              transports={transports}
              salesOrders={salesOrders}
              customers={customers}
              onSaveTransport={async (trans) => {
                await setDoc(doc(db, 'transports', trans.id), trans);
              }}
            />
          )}

          {activeModule === 'purchases' && (
            <PurchasesModule
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              rawMaterials={rawMaterials}
              financialTransactions={financialTransactions}
              cashboxes={cashboxes}
              checks={checks}
              config={companyConfig}
              onSaveSupplier={async (sup) => {
                await setDoc(doc(db, 'suppliers', sup.id), sup);
              }}
              onCreatePurchaseOrder={async (po) => {
                await setDoc(doc(db, 'purchase_orders', po.id), po);
              }}
              onReceivePurchaseOrder={handleReceivePurchaseOrder}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )}

          {activeModule === 'finances' && (
            <DebtsAndReceivablesModule
              customers={customers}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              salesOrders={salesOrders}
              cashboxes={cashboxes}
              config={companyConfig}
              onNavigateToCustomer={(customer) => setActiveModule('customers')}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )}

          {activeModule === 'checks' && (
            <ChecksModule
              checks={checks}
              customers={customers}
              suppliers={suppliers}
              cashboxes={cashboxes}
              onSaveCheck={handleSaveCheck}
              onUpdateCheckStatus={handleUpdateCheckStatus}
            />
          )}

          {activeModule === 'cashboxes' && (
            <CashboxModule
              cashboxes={cashboxes}
              movements={cashMovements}
              onSaveCashbox={handleSaveCashbox}
              onAddMovement={handleAddCashMovement}
              onTransferBetweenCashboxes={handleTransferBetweenCashboxes}
            />
          )}

          {activeModule === 'accounting' && (
            <AccountingAndProfitabilityModule
              salesOrders={salesOrders}
              purchaseOrders={purchaseOrders}
              productionOrders={productionOrders}
              products={products}
              rawMaterials={rawMaterials}
              cashMovements={cashMovements}
              config={companyConfig}
              initialTab="iva_reports"
            />
          )}

          {activeModule === 'profitability' && (
            <AccountingAndProfitabilityModule
              salesOrders={salesOrders}
              purchaseOrders={purchaseOrders}
              productionOrders={productionOrders}
              products={products}
              rawMaterials={rawMaterials}
              cashMovements={cashMovements}
              config={companyConfig}
              initialTab="income_statement"
            />
          )}

          {activeModule === 'employees' && (
            <EmployeesModule
              employees={employees}
              salaryPayments={salaryPayments}
              cashboxes={cashboxes}
              config={companyConfig}
              onSaveEmployee={handleSaveEmployee}
              onRecordSalaryPayment={handleRecordSalaryPayment}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule
              productionOrders={productionOrders}
              salesOrders={salesOrders}
              products={products}
              rawMaterials={rawMaterials}
              customers={customers}
              onNavigateToCustomer={(cust) => setActiveModule('customers')}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'customer_portal' && (
            <CustomerPortal
              customers={customers}
              salesOrders={salesOrders}
              config={companyConfig}
              activeClientTaxId={portalClientTaxId}
              onLoginClient={handleLoginClient}
              onLogoutClient={handleLogoutClient}
            />
          )}

          {activeModule === 'settings' && (
            <SettingsModule
              config={companyConfig}
              onSaveConfig={async (cfg) => {
                await setDoc(doc(db, 'company_config', 'main_config'), cfg);
                setCompanyConfig(cfg);
              }}
              onResetCompleted={() => {
                setSalesOrders([]);
                setProductionOrders([]);
                setPurchaseOrders([]);
                setFinancialTransactions([]);
                setInventoryMovements([]);
                setChecks([]);
                setCashMovements([]);
                setSalaryPayments([]);
              }}
            />
          )}

          {activeModule === 'users' && (
            <UsersModule
              users={appUsers}
              currentUser={currentUser}
              onSaveUser={async (user) => {
                await setDoc(doc(db, 'app_users', user.id), user);
              }}
              onDeleteUser={async (id) => {
                await deleteDoc(doc(db, 'app_users', id));
              }}
            />
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
