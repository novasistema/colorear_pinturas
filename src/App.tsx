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
  seedUsersIfEmpty
} from './services/firebase';
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
  AppUser
} from './types';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DesktopModule } from './components/DesktopModule';
import { ProductionModule } from './components/ProductionModule';
import { SalesOrdersModule } from './components/SalesOrdersModule';
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

  const [isLoading, setIsLoading] = useState(true);

  // Initialize and attach Firestore real-time listeners
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const initializeApp = async () => {
      try {
        await testConnection();
        await seedInitialDataIfEmpty();
        await seedUsersIfEmpty();

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
          reference: `${order.orderNumber} - Lote ${order.batchNumber}`,
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

  // Record payment in Customer checking account
  const handleRecordCustomerPayment = async (
    customerId: string, 
    amount: number, 
    method: FinancialTransaction['paymentMethod'], 
    concept: string
  ) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const batch = writeBatch(db);

      // 1. Update customer balance
      const newBalance = Math.max(0, customer.currentBalance - amount);
      const custRef = doc(db, 'customers', customerId);
      batch.update(custRef, { currentBalance: newBalance });

      // 2. Add financial transaction
      const txId = `tx-${Date.now()}`;
      const txRef = doc(db, 'financial_transactions', txId);
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
        receiptNumber: `REC-${Math.floor(Math.random() * 89999 + 10000)}`
      });

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
    setActiveModule('desktop');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('colorear_current_user');
  };

  // Calculations for badges
  const productionActiveCount = productionOrders.filter(o => o.status === 'en_proceso' || o.status === 'planificada').length;
  const pendingDispatchCount = salesOrders.filter(o => o.status === 'preparando_remito' || o.status === 'facturado').length;
  const pendingPaymentCount = customers.filter(c => c.currentBalance > 0).length;

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
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-red-500 selection:text-white">
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
        onLogout={handleLogout}
        onExitPortal={handleLogoutClient}
        onOpenCustomerPortalModal={() => setActiveModule('customer_portal')}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          productionActiveCount={productionActiveCount}
          pendingDispatchCount={pendingDispatchCount}
          pendingPaymentCount={pendingPaymentCount}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
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
              onRecordOrderPayment={async (orderId, amount) => {
                await updateDoc(doc(db, 'sales_orders', orderId), {
                  paymentStatus: 'pagado',
                  paidAmount: amount
                });
              }}
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
              onBulkPriceUpdate={async (increasePct) => {
                const batch = writeBatch(db);
                products.forEach(p => {
                  const factor = 1 + increasePct / 100;
                  const ref = doc(db, 'products', p.id);
                  batch.update(ref, {
                    priceDistributor: Math.round(p.priceDistributor * factor),
                    priceWholesale: Math.round(p.priceWholesale * factor),
                    priceRetail: Math.round(p.priceRetail * factor)
                  });
                });
                await batch.commit();
              }}
              onSyncOfficialCatalog={syncOfficialAugust2026PriceList}
            />
          )}

          {activeModule === 'customers' && (
            <CustomersModule
              customers={customers}
              salesOrders={salesOrders}
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
              onSaveSupplier={async (sup) => {
                await setDoc(doc(db, 'suppliers', sup.id), sup);
              }}
              onCreatePurchaseOrder={async (po) => {
                await setDoc(doc(db, 'purchase_orders', po.id), po);
              }}
              onReceivePurchaseOrder={handleReceivePurchaseOrder}
            />
          )}

          {activeModule === 'finances' && (
            <FinancesModule
              transactions={financialTransactions}
              customers={customers}
              suppliers={suppliers}
              onAddTransaction={async (tx) => {
                await setDoc(doc(db, 'financial_transactions', tx.id), tx);
              }}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule
              productionOrders={productionOrders}
              salesOrders={salesOrders}
              products={products}
              rawMaterials={rawMaterials}
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
        </main>
      </div>
    </div>
  );
}
