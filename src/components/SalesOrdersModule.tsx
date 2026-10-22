import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  FileText, 
  Truck, 
  CheckCircle, 
  Clock, 
  Send, 
  Mail, 
  MessageSquare, 
  ArrowRight, 
  Printer, 
  Eye, 
  ShieldCheck, 
  Filter,
  DollarSign,
  PackageCheck,
  Building,
  Check,
  X,
  Package,
  Layers,
  AlertTriangle,
  History,
  FileCheck2,
  Calendar,
  User,
  BadgeAlert
} from 'lucide-react';
import { 
  SalesOrder, 
  SalesOrderStatus, 
  BillingType, 
  Customer, 
  Product, 
  Transport, 
  CompanyConfig, 
  SalesOrderItem,
  InvoiceType,
  DeliveryOrder,
  DeliveryOrderItem
} from '../types';
import { generateWhatsAppMessage } from '../utils/exportUtils';

interface SalesOrdersModuleProps {
  salesOrders: SalesOrder[];
  customers: Customer[];
  products: Product[];
  transports: Transport[];
  config: CompanyConfig | null;
  onCreateOrder: (order: SalesOrder) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: SalesOrderStatus, additionalData?: Partial<SalesOrder>) => Promise<void>;
  onDeliverOrderItems: (orderId: string, delivery: DeliveryOrder) => Promise<void>;
  onRecordOrderPayment: (orderId: string, amount: number) => Promise<void>;
}

export const SalesOrdersModule: React.FC<SalesOrdersModuleProps> = ({
  salesOrders,
  customers,
  products,
  transports,
  config,
  onCreateOrder,
  onUpdateOrderStatus,
  onDeliverOrderItems,
  onRecordOrderPayment
}) => {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'pendientes' | 'remitos'>('pedidos');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<SalesOrder | null>(null);
  const [viewDeliveriesOrder, setViewDeliveriesOrder] = useState<SalesOrder | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ 
    order: SalesOrder; 
    type: 'remito' | 'factura' | 'orden_entrega'; 
    delivery?: DeliveryOrder;
  } | null>(null);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [billingType, setBillingType] = useState<BillingType>('arca');
  const [selectedTransportId, setSelectedTransportId] = useState<string>(customers[0]?.transportId || transports[0]?.id || '');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; discount: number }[]>([
    { productId: products[0]?.id || '', quantity: 10, discount: 0 }
  ]);
  const [orderNotes, setOrderNotes] = useState('');

  // Delivery Modal Form state
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTransportName, setDeliveryTransportName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPlateOrDni, setDriverPlateOrDni] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverDni, setReceiverDni] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [dispatchItems, setDispatchItems] = useState<{ [productId: string]: number }>({});
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Helper: compute order delivery statistics
  const getOrderDeliveryStats = (order: SalesOrder) => {
    const totalOrdered = order.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const totalDelivered = order.items.reduce((acc, it) => acc + (it.deliveredQuantity || 0), 0);
    const pending = Math.max(0, totalOrdered - totalDelivered);
    const percentage = totalOrdered > 0 ? Math.min(100, Math.round((totalDelivered / totalOrdered) * 100)) : 0;
    return { totalOrdered, totalDelivered, pending, percentage };
  };

  // Price determination based on customer's price list
  const getProductPriceForCustomer = (product: Product, cust?: Customer) => {
    if (!cust) return product.priceWholesale;
    switch (cust.priceList) {
      case 'distribuidor': return product.priceDistributor;
      case 'minorista': return product.priceRetail;
      case 'mayorista':
      default:
        return product.priceWholesale;
    }
  };

  // Calculate order totals
  const calculatedItems: SalesOrderItem[] = orderItems.map(item => {
    const prod = products.find(p => p.id === item.productId);
    const unitPrice = prod ? getProductPriceForCustomer(prod, selectedCustomer) : 0;
    const subtotal = (unitPrice * item.quantity) * (1 - item.discount / 100);
    return {
      productId: item.productId,
      productName: prod ? `${prod.name} (${prod.presentation})` : 'Pintura',
      code: prod?.code || '',
      presentation: prod?.presentation || '',
      quantity: Number(item.quantity) || 1,
      deliveredQuantity: 0,
      unitPrice,
      discount: Number(item.discount) || 0,
      subtotal
    };
  });

  const subtotal = calculatedItems.reduce((acc, it) => acc + it.subtotal, 0);
  const taxAmount = billingType === 'arca' ? subtotal * 0.21 : 0; // 21% IVA if ARCA
  const total = subtotal + taxAmount;

  // Add line item
  const addItemRow = () => {
    if (products.length === 0) return;
    setOrderItems([...orderItems, { productId: products[0].id, quantity: 5, discount: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  // Submit order (Factura Anticipada)
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || calculatedItems.length === 0) return;

    const orderNumber = `PED-${new Date().getFullYear()}-${String(salesOrders.length + 85).padStart(3, '0')}`;
    const transport = transports.find(t => t.id === selectedTransportId);

    // Default invoice type
    let invoiceType: InvoiceType = 'FACTURA_A';
    if (billingType === 'no_arca') {
      invoiceType = 'RECIBO_X_NO_ARCA';
    } else {
      if (selectedCustomer.taxCategory === 'consumidor_final' || selectedCustomer.taxCategory === 'monotributo') {
        invoiceType = 'FACTURA_B';
      }
    }

    // Auto-generate invoice number and CAE directly since it's an advance invoice (Factura Anticipada)
    const invoiceNumber = billingType === 'arca' 
      ? `FAC-${invoiceType === 'FACTURA_A' ? 'A' : 'B'}-0004-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`
      : `REC-X-0001-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`;
    const cae = billingType === 'arca' ? String(Math.floor(Math.random() * 89999999999999 + 10000000000000)) : undefined;
    const caeVto = billingType === 'arca' ? new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0] : undefined;

    const newOrder: SalesOrder = {
      id: `order-${Date.now()}`,
      orderNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.businessName,
      customerTaxId: selectedCustomer.taxId,
      customerPhone: selectedCustomer.phone,
      customerEmail: selectedCustomer.email,
      customerAddress: `${selectedCustomer.address}, ${selectedCustomer.city}`,
      billingType,
      invoiceType,
      invoiceNumber,
      cae,
      caeVto,
      date: new Date().toISOString(),
      status: 'facturado', // En facturación anticipada se emite facturado de entrada
      deliveryStatus: 'pendiente_entrega',
      deliveryOrders: [],
      paymentStatus: 'pendiente',
      transportId: selectedTransportId,
      transportName: transport?.name || 'A coordinar con fábrica',
      trackingCode: `TRK-COL-${Math.floor(Math.random() * 89999 + 10000)}`,
      items: calculatedItems,
      subtotal,
      taxAmount,
      total,
      paidAmount: 0,
      notes: orderNotes
    };

    await onCreateOrder(newOrder);
    setShowNewOrderModal(false);
    setOrderNotes('');
  };

  // Open delivery modal for an order
  const handleOpenDeliveryModal = (order: SalesOrder) => {
    setDeliveryModalOrder(order);
    const nextDeliveryNum = `OE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(4, '0')}`;
    setDeliveryNumber(nextDeliveryNum);
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setDeliveryTransportName(order.transportName || 'Retiro en Planta / Propio');
    setDriverName('');
    setDriverPlateOrDni('');
    setReceiverName(order.customerName);
    setReceiverDni('');
    setDeliveryNotes('');

    // Pre-populate with remaining pending quantities
    const initialDispatches: { [productId: string]: number } = {};
    order.items.forEach(it => {
      const delivered = it.deliveredQuantity || 0;
      const pending = Math.max(0, it.quantity - delivered);
      initialDispatches[it.productId] = pending; // default to delivering remaining
    });
    setDispatchItems(initialDispatches);
  };

  // Fill all remaining pending items
  const handleFillAllPending = () => {
    if (!deliveryModalOrder) return;
    const allPending: { [productId: string]: number } = {};
    deliveryModalOrder.items.forEach(it => {
      const delivered = it.deliveredQuantity || 0;
      allPending[it.productId] = Math.max(0, it.quantity - delivered);
    });
    setDispatchItems(allPending);
  };

  // Clear all items to 0
  const handleClearAllQuantities = () => {
    if (!deliveryModalOrder) return;
    const cleared: { [productId: string]: number } = {};
    deliveryModalOrder.items.forEach(it => {
      cleared[it.productId] = 0;
    });
    setDispatchItems(cleared);
  };

  // Submit Delivery Order & Deduct Stock
  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModalOrder) return;

    // Build delivery items list
    const itemsToDeliver: DeliveryOrderItem[] = [];
    let totalQty = 0;

    deliveryModalOrder.items.forEach(it => {
      const qty = Number(dispatchItems[it.productId]) || 0;
      if (qty > 0) {
        itemsToDeliver.push({
          productId: it.productId,
          productName: it.productName,
          code: it.code,
          presentation: it.presentation,
          quantity: qty
        });
        totalQty += qty;
      }
    });

    if (itemsToDeliver.length === 0 || totalQty <= 0) {
      alert('Debes indicar al menos un producto y una cantidad mayor a 0 para generar la Orden de Entrega.');
      return;
    }

    setIsSubmittingDelivery(true);
    try {
      const newDelivery: DeliveryOrder = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        deliveryNumber: deliveryNumber.trim() || `OE-${Date.now()}`,
        salesOrderId: deliveryModalOrder.id,
        salesOrderNumber: deliveryModalOrder.orderNumber,
        customerId: deliveryModalOrder.customerId,
        customerName: deliveryModalOrder.customerName,
        customerAddress: deliveryModalOrder.customerAddress,
        date: deliveryDate,
        items: itemsToDeliver,
        transportName: deliveryTransportName,
        driverName: driverName.trim() || 'Depósito Fábrica',
        driverDniOrPlate: driverPlateOrDni.trim() || undefined,
        receiverName: receiverName.trim() || deliveryModalOrder.customerName,
        receiverDni: receiverDni.trim() || undefined,
        notes: deliveryNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      await onDeliverOrderItems(deliveryModalOrder.id, newDelivery);

      // Open print preview immediately for the emitted delivery note
      const updatedOrder = salesOrders.find(o => o.id === deliveryModalOrder.id) || deliveryModalOrder;
      setViewingDoc({
        order: updatedOrder,
        type: 'orden_entrega',
        delivery: newDelivery
      });

      setDeliveryModalOrder(null);
    } catch (err) {
      console.error('Error emitting delivery order:', err);
      alert('Error al generar la orden de entrega. Por favor intenta nuevamente.');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  // Progression through stages
  const advanceOrderStage = async (order: SalesOrder) => {
    if (order.status === 'ingresado') {
      const invoiceNumber = order.billingType === 'arca' 
        ? `FAC-${order.invoiceType === 'FACTURA_A' ? 'A' : 'B'}-0004-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`
        : `REC-X-0001-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`;
      const cae = order.billingType === 'arca' ? String(Math.floor(Math.random() * 89999999999999 + 10000000000000)) : undefined;
      const caeVto = order.billingType === 'arca' ? new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0] : undefined;
      
      await onUpdateOrderStatus(order.id, 'facturado', {
        invoiceNumber,
        cae,
        caeVto
      });
    } else if (order.status === 'facturado' || order.status === 'entrega_parcial') {
      // Open delivery modal
      handleOpenDeliveryModal(order);
    }
  };

  // Consolidated delivery orders across all sales orders
  const allConsolidatedDeliveries: { delivery: DeliveryOrder; order: SalesOrder }[] = [];
  salesOrders.forEach(o => {
    if (o.deliveryOrders && o.deliveryOrders.length > 0) {
      o.deliveryOrders.forEach(del => {
        allConsolidatedDeliveries.push({ delivery: del, order: o });
      });
    }
  });
  allConsolidatedDeliveries.sort((a, b) => new Date(b.delivery.date).getTime() - new Date(a.delivery.date).getTime());

  // Filter orders
  const filteredOrders = salesOrders.filter(order => {
    const { pending, totalDelivered, totalOrdered } = getOrderDeliveryStats(order);
    
    // Tab filter
    if (activeTab === 'pendientes' && pending === 0) return false;

    // Delivery status filter
    if (deliveryFilter === 'pendiente' && totalDelivered > 0) return false;
    if (deliveryFilter === 'parcial' && (totalDelivered === 0 || pending === 0)) return false;
    if (deliveryFilter === 'total' && pending > 0) return false;

    // Regular filters
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesBilling = billingFilter === 'all' || order.billingType === billingFilter;
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerTaxId.includes(searchQuery) ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.deliveryOrders && order.deliveryOrders.some(d => d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase())));
      
    return matchesStatus && matchesBilling && matchesSearch;
  });

  // Global counts
  const totalInvoicedOrders = salesOrders.length;
  const totalUnitsInvoiced = salesOrders.reduce((acc, o) => acc + o.items.reduce((s, it) => s + (it.quantity || 0), 0), 0);
  const totalUnitsDelivered = salesOrders.reduce((acc, o) => acc + o.items.reduce((s, it) => s + (it.deliveredQuantity || 0), 0), 0);
  const totalUnitsPending = Math.max(0, totalUnitsInvoiced - totalUnitsDelivered);
  const ordersPendingDeliveryCount = salesOrders.filter(o => getOrderDeliveryStats(o).pending > 0).length;

  const getStatusBadge = (order: SalesOrder) => {
    const stats = getOrderDeliveryStats(order);

    if (stats.pending === 0 && stats.totalOrdered > 0) {
      return (
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-600" /> Entrega Total (100%)
        </span>
      );
    }

    if (stats.totalDelivered > 0) {
      return (
        <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
          <Clock className="w-3 h-3 text-purple-600" /> Entrega Parcial ({stats.percentage}%)
        </span>
      );
    }

    return (
      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
        <Package className="w-3 h-3 text-amber-600" /> Pendiente Despacho
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Informative Workflow Banner: Facturas Anticipadas */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Truck className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-blue-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider">
              Modelo Fábrica: Factura Anticipada & Remitos Parciales
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
              Descuento de Stock Real en Remito
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Ventas, Facturación Anticipada & Órdenes de Entrega
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Las ventas se facturan anticipadamente para registrar la deuda y el comprobante fiscal del cliente 
            <strong> sin descontar stock físico</strong>. El inventario se da de baja únicamente al emitir cada 
            <strong> Orden de Entrega / Remito de Salida</strong>, permitiendo entregas fraccionadas según la conveniencia de obra o retiro del cliente.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Pedidos</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{totalInvoicedOrders}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ventas facturadas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unidades Facturadas</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {totalUnitsInvoiced.toLocaleString('es-AR')} un
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">En facturas anticipadas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Despachadas Físico</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {totalUnitsDelivered.toLocaleString('es-AR')} un
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Descontadas de stock</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Saldo por Entregar</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-900 font-mono">
            {totalUnitsPending.toLocaleString('es-AR')} un
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
            {ordersPendingDeliveryCount} pedidos con saldo
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'pedidos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Todos los Pedidos y Facturas</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === 'pedidos' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {salesOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pendientes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'pendientes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes de Despacho</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === 'pendientes' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900 font-bold'
            }`}>
              {ordersPendingDeliveryCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('remitos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'remitos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Historial de Órdenes de Entrega</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === 'remitos' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-900 font-bold'
            }`}>
              {allConsolidatedDeliveries.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" /> Facturar Pedido Anticipado
        </button>
      </div>

      {/* VIEW: HISTORIAL GLOBAL DE REMITOS / ORDENES DE ENTREGA */}
      {activeTab === 'remitos' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                Historial de Órdenes de Entrega Emitidas (Remitos de Salida)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro de cada despacho físico realizado con firma de chofer y receptor. Cada orden descontó stock automáticamente.
              </p>
            </div>
          </div>

          {allConsolidatedDeliveries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Aún no se han emitido órdenes de entrega parciales o totales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase border-y border-slate-200">
                  <tr>
                    <th className="p-3">N° Remito / Orden</th>
                    <th className="p-3">Fecha Despacho</th>
                    <th className="p-3">Pedido & Factura</th>
                    <th className="p-3">Cliente Destinatario</th>
                    <th className="p-3">Transporte & Chofer</th>
                    <th className="p-3 text-center">Bultos Entregados</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allConsolidatedDeliveries.map(({ delivery, order }) => {
                    const totalItemsInDelivery = delivery.items.reduce((s, it) => s + it.quantity, 0);
                    return (
                      <tr key={delivery.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                            {delivery.deliveryNumber}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {new Date(delivery.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-900">{delivery.salesOrderNumber}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{order.invoiceNumber || 'Factura Anticipada'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{delivery.customerName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{delivery.customerAddress || 'Planta'}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800 font-semibold">{delivery.driverName || 'Depósito'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {delivery.transportName || 'Propio'} {delivery.driverDniOrPlate ? `(${delivery.driverDniOrPlate})` : ''}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-900">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                            {totalItemsInDelivery} un.
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setViewingDoc({ order, type: 'orden_entrega', delivery })}
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ver / Imprimir Remito</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* VIEW: PEDIDOS / VENTAS ANTICIPADAS (CON FILTROS) */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Buscar cliente, N° pedido, factura, CUIT..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Delivery status filter */}
              <select
                value={deliveryFilter}
                onChange={e => setDeliveryFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white"
              >
                <option value="all">Todas las entregas</option>
                <option value="pendiente">Solo Pendientes de Entrega</option>
                <option value="parcial">Solo Entregas Parciales</option>
                <option value="total">Solo Entregas Completas (100%)</option>
              </select>

              {/* ARCA vs No-ARCA filter */}
              <select
                value={billingFilter}
                onChange={e => setBillingFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white"
              >
                <option value="all">Todas las ventas</option>
                <option value="arca">Solo ARCA (Fiscal)</option>
                <option value="no_arca">Solo No-ARCA (Interno)</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200 text-xs">
              No se encontraron ventas que coincidan con los filtros seleccionados.
            </div>
          ) : (
            filteredOrders.map(order => {
              const stats = getOrderDeliveryStats(order);
              const isArca = order.billingType === 'arca';
              const deliveriesCount = order.deliveryOrders?.length || 0;
              const clientPhoneClean = order.customerPhone?.replace(/[^0-9]/g, '') || '';

              // Custom WhatsApp message that includes delivery progress
              const baseMsg = generateWhatsAppMessage(order, config || undefined);
              const customWhatsAppMsg = `${baseMsg}\n📦 *Estado de Entrega Física:* ${stats.totalDelivered}/${stats.totalOrdered} unidades entregadas (${stats.pending > 0 ? `Saldo pendiente: ${stats.pending} un.` : 'Totalmente entregado'}).`;

              return (
                <div 
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Top Row: Order Number, Badges, Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order)}
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        isArca ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isArca ? 'Venta ARCA (Fiscal)' : 'Venta No-ARCA (Interno)'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Factura Anticipada
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {new Date(order.date).toLocaleDateString('es-AR')}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        $ {order.total.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Customer */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Cliente / Destino
                      </span>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {order.customerName}
                      </div>
                      <div className="font-mono text-slate-600 font-bold">
                        {order.customerTaxId}
                      </div>
                      {order.customerAddress && (
                        <div className="text-slate-500 text-[11px] truncate">
                          {order.customerAddress}
                        </div>
                      )}
                    </div>

                    {/* Fiscal Invoice (Factura Anticipada) */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Factura Anticipada Emitida
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Comprobante:</span>
                        <strong className="font-mono text-slate-900">
                          {order.invoiceNumber || 'Pendiente'}
                        </strong>
                      </div>
                      {order.cae && (
                        <div className="flex items-center justify-between text-blue-700 font-bold">
                          <span>CAE Fiscal:</span>
                          <span className="font-mono">{order.cae}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Pago:</span>
                        <span className={`font-bold uppercase text-[10px] ${
                          order.paymentStatus === 'pagado' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Physical Progress */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Despacho Físico de Mercadería
                        </span>
                        <span className="font-mono font-black text-slate-800 text-xs">
                          {stats.totalDelivered} / {stats.totalOrdered} un.
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            stats.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {deliveriesCount > 0 ? `${deliveriesCount} remito(s) emitido(s)` : 'Sin despachos aún'}
                        </span>
                        <span className={`font-bold ${stats.pending > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {stats.pending > 0 ? `Pendiente: ${stats.pending} un.` : 'Completado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items List Breakdown: Facturado vs Entregado vs Pendiente */}
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 flex items-center justify-between">
                      <span>Detalle de Pinturas (Control de Entrega Parcial):</span>
                      <span className="text-slate-500 font-normal">Cant. Facturada | Ya Entregada | Saldo Pendiente</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {order.items.map((it, idx) => {
                        const delivered = it.deliveredQuantity || 0;
                        const pending = Math.max(0, it.quantity - delivered);
                        const isComplete = pending === 0;

                        return (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-200/50 last:border-0 gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="font-semibold text-slate-800">{it.productName}</span>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono">
                              <span className="text-slate-500">
                                Facturado: <strong className="text-slate-800">{it.quantity} un</strong>
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-emerald-700 font-bold">
                                Entregado: {delivered} un
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className={`font-bold px-1.5 py-0.5 rounded-md ${
                                pending > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-800'
                              }`}>
                                Pendiente: {pending} un
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    {/* Share & Document preview buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* WhatsApp with progress */}
                      <a
                        href={`https://wa.me/${clientPhoneClean}?text=${encodeURIComponent(customWhatsAppMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                        title="Enviar estado de factura y entregas por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Email */}
                      <a
                        href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Colorear Pinturas - Estado de Pedido y Entrega ${order.orderNumber}`)}&body=${encodeURIComponent(customWhatsAppMsg)}`}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>

                      {/* View Factura Anticipada */}
                      {order.invoiceNumber && (
                        <button
                          onClick={() => setViewingDoc({ order, type: 'factura' })}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Factura ({order.invoiceType || 'Oficial'})</span>
                        </button>
                      )}

                      {/* View Delivery History */}
                      {deliveriesCount > 0 && (
                        <button
                          onClick={() => setViewDeliveriesOrder(order)}
                          className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Remitos Emitidos ({deliveriesCount})</span>
                        </button>
                      )}
                    </div>

                    {/* Operational Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {order.status === 'ingresado' && (
                        <button
                          onClick={() => advanceOrderStage(order)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Emitir Factura Anticipada</span>
                        </button>
                      )}

                      {stats.pending > 0 ? (
                        <button
                          onClick={() => handleOpenDeliveryModal(order)}
                          className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-transform active:scale-95"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Emitir Orden de Entrega / Despacho</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Mercadería Totalmente Entregada</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: NUEVA ORDEN DE ENTREGA (DESPACHO PARCIAL / TOTAL) */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Nueva Orden de Entrega / Despacho Parcial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pedido: <strong>{deliveryModalOrder.orderNumber}</strong> | Factura Anticipada: <strong>{deliveryModalOrder.invoiceNumber || 'Emitida'}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDeliveryModalOrder(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="mt-4 space-y-4">
              {/* Warehouse & Customer summary */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cliente:</span>
                  <div className="font-extrabold text-slate-900 text-sm">{deliveryModalOrder.customerName}</div>
                  <div className="text-slate-500 text-[11px]">{deliveryModalOrder.customerAddress}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Transporte Acordado:</span>
                  <div className="font-bold text-slate-800">{deliveryModalOrder.transportName || 'A coordinar'}</div>
                  <div className="text-slate-500 text-[11px]">Tracking: {deliveryModalOrder.trackingCode}</div>
                </div>
              </div>

              {/* Delivery Note Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    N° de Orden de Entrega / Remito
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryNumber}
                    onChange={e => setDeliveryNumber(e.target.value)}
                    placeholder="Ej: OE-2026-0045"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fecha de Despacho
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Driver and Transport details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Chofer / Responsable de Retiro
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Nombre y apellido del chofer"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Patente Vehículo / DNI Chofer
                  </label>
                  <input
                    type="text"
                    value={driverPlateOrDni}
                    onChange={e => setDriverPlateOrDni(e.target.value)}
                    placeholder="Ej: AF 123 CD - DNI 34.567.890"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Receptor en Destino / Obra
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    placeholder="Persona que recibe conforme"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    DNI Receptor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={receiverDni}
                    onChange={e => setReceiverDni(e.target.value)}
                    placeholder="DNI del receptor"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Products to Deliver Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Cantidades a Despachar en este Remito
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFillAllPending}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Cargar todo el saldo pendiente
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllQuantities}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                    >
                      Limpiar a 0
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Pintura / Presentación</th>
                        <th className="p-2.5 text-center">Facturado</th>
                        <th className="p-2.5 text-center">Ya Entregado</th>
                        <th className="p-2.5 text-center">Pendiente</th>
                        <th className="p-2.5 text-center">Stock Planta</th>
                        <th className="p-2.5 text-right w-32">A Despachar Hoy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deliveryModalOrder.items.map(it => {
                        const delivered = it.deliveredQuantity || 0;
                        const pending = Math.max(0, it.quantity - delivered);
                        const currentProd = products.find(p => p.id === it.productId);
                        const availableStock = currentProd?.stock || 0;
                        const currentInput = dispatchItems[it.productId] ?? 0;

                        return (
                          <tr key={it.productId} className={pending === 0 ? 'bg-slate-50/50 opacity-60' : ''}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{it.productName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{it.code}</div>
                            </td>
                            <td className="p-2.5 text-center font-mono font-semibold text-slate-700">
                              {it.quantity} un
                            </td>
                            <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">
                              {delivered} un
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-amber-700">
                              {pending} un
                            </td>
                            <td className="p-2.5 text-center font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                availableStock >= pending ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                              }`}>
                                {availableStock} un
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                max={pending}
                                disabled={pending === 0}
                                value={currentInput}
                                onChange={e => {
                                  const val = Math.min(pending, Math.max(0, Number(e.target.value)));
                                  setDispatchItems({
                                    ...dispatchItems,
                                    [it.productId]: val
                                  });
                                }}
                                className="w-20 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time deduction warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso de Movimiento de Inventario:</strong> Al confirmar esta Orden de Entrega, 
                  las cantidades especificadas se descontarán <strong>de inmediato</strong> del stock físico en tiempo real y 
                  se creará el movimiento de salida en el Kardex.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observaciones del Despacho (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="Detalles del viaje, precinto de seguridad, horario de entrega en obra..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOrder(null)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDelivery}
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{isSubmittingDelivery ? 'Generando...' : 'Confirmar Despacho y Descontar Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER HISTORIAL DE ENTREGAS DE UNA ORDEN ESPECÍFICA */}
      {viewDeliveriesOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Historial de Remitos de Entrega: {viewDeliveriesOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cliente: <strong>{viewDeliveriesOrder.customerName}</strong> | Factura: <strong>{viewDeliveriesOrder.invoiceNumber || 'Factura Anticipada'}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setViewDeliveriesOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {!viewDeliveriesOrder.deliveryOrders || viewDeliveriesOrder.deliveryOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No hay órdenes de entrega registradas para este pedido.
                </div>
              ) : (
                viewDeliveriesOrder.deliveryOrders.map(del => {
                  const totalInDel = del.items.reduce((s, it) => s + it.quantity, 0);
                  return (
                    <div key={del.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-xs">
                            {del.deliveryNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {new Date(del.date).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setViewingDoc({ order: viewDeliveriesOrder, type: 'orden_entrega', delivery: del });
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ver / Imprimir Remito</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>Chofer: <strong>{del.driverName}</strong> {del.driverDniOrPlate ? `(${del.driverDniOrPlate})` : ''}</div>
                        <div>Receptor: <strong>{del.receiverName}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 text-xs">
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Mercadería Entregada ({totalInDel} un):</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px]">
                          {del.items.map((it, idx) => (
                            <div key={idx} className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-800 truncate mr-2">{it.productName}</span>
                              <strong className="text-blue-700 shrink-0">{it.quantity} un</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewDeliveriesOrder(null)}
                className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PEDIDO / FACTURA ANTICIPADA */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" /> Facturar Pedido Anticipado
                </h3>
                <p className="text-xs text-slate-500">
                  Emite la factura comercial/fiscal anticipada. <strong>No descuenta stock físico</strong> hasta emitir remitos de entrega.
                </p>
              </div>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="mt-4 space-y-4">
              {/* Customer selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cliente / Pinturería
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => {
                      setSelectedCustomerId(e.target.value);
                      const cust = customers.find(c => c.id === e.target.value);
                      if (cust?.transportId) {
                        setSelectedTransportId(cust.transportId);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50"
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.businessName} ({c.taxId}) - Lista: {c.priceList.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing type choice: ARCA vs No-ARCA */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo de Venta / Facturación
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBillingType('arca')}
                      className={`text-xs font-bold py-2 rounded-xl border transition-all ${
                        billingType === 'arca'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Oficial ARCA
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingType('no_arca')}
                      className={`text-xs font-bold py-2 rounded-xl border transition-all ${
                        billingType === 'no_arca'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      No-ARCA (Interno)
                    </button>
                  </div>
                </div>
              </div>

              {/* Transport selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Transporte Asignado para Envíos
                </label>
                <select
                  value={selectedTransportId}
                  onChange={e => setSelectedTransportId(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                >
                  {transports.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} - Zona: {t.serviceArea}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Productos del Pedido
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Pintura
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    const unitPrice = prod ? getProductPriceForCustomer(prod, selectedCustomer) : 0;
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                        <select
                          value={item.productId}
                          onChange={e => {
                            const newItems = [...orderItems];
                            newItems[idx].productId = e.target.value;
                            setOrderItems(newItems);
                          }}
                          className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300 font-semibold"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.presentation}) - Stock: {p.stock}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...orderItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setOrderItems(newItems);
                            }}
                            className="w-16 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                          />
                          <span className="text-[11px] text-slate-400">un</span>
                        </div>
                        <div className="w-24 text-right font-mono font-bold text-slate-800">
                          $ {(unitPrice * item.quantity).toLocaleString('es-AR')}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subtotal Neto:</span>
                  <strong className="font-mono">$ {subtotal.toLocaleString('es-AR')}</strong>
                </div>
                {billingType === 'arca' && (
                  <div className="flex items-center justify-between text-blue-700">
                    <span>IVA 21% (Factura Oficial):</span>
                    <strong className="font-mono">$ {taxAmount.toLocaleString('es-AR')}</strong>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>TOTAL DEL PEDIDO:</span>
                  <span className="font-mono text-red-700">$ {total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas de Entrega / Despacho
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Horario de recepción, persona autorizada en obra, etc..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Registrar y Facturar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PRINTABLE DOCUMENT (FACTURA O REMITO / ORDEN DE ENTREGA) */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/assets/aistudio/colorear-500px_0158e3cb.webp" alt="Colorear" className="h-8 w-auto" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                    {viewingDoc.type === 'orden_entrega' 
                      ? 'REMITO OFICIAL DE ENTREGA DE MERCADERÍA' 
                      : (viewingDoc.type === 'remito' ? 'REMITO DE SALIDA' : `FACTURA ELECTRÓNICA (${viewingDoc.order.invoiceType || 'ANTICIPADA'})`)}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {viewingDoc.type === 'orden_entrega' 
                      ? viewingDoc.delivery?.deliveryNumber 
                      : (viewingDoc.type === 'remito' ? viewingDoc.order.remitoNumber : viewingDoc.order.invoiceNumber)}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Header Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Emisor:</span>
                  <strong className="text-slate-900 block">{config?.companyName || 'Colorear Pinturas S.R.L.'}</strong>
                  <span className="text-slate-500 text-[11px]">CUIT: {config?.cuit || '30-71489234-8'}</span>
                  <span className="text-slate-500 text-[11px] block">{config?.plantAddress || 'Parque Industrial Pilar'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Destinatario / Cliente:</span>
                  <strong className="text-slate-900 block">{viewingDoc.order.customerName}</strong>
                  <span className="text-slate-500 text-[11px]">CUIT/DNI: {viewingDoc.order.customerTaxId}</span>
                  <span className="text-slate-500 text-[11px] block">{viewingDoc.order.customerAddress}</span>
                </div>
              </div>

              {/* If Orden de Entrega: show driver & receiver details */}
              {viewingDoc.type === 'orden_entrega' && viewingDoc.delivery && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">Datos de Transporte y Chofer:</span>
                    <strong className="text-slate-900 block">{viewingDoc.delivery.driverName || 'Depósito'}</strong>
                    <span className="text-slate-600 text-[11px]">
                      Patente/DNI: {viewingDoc.delivery.driverDniOrPlate || 'Sin especificar'}
                    </span>
                    <span className="text-slate-600 text-[11px] block">
                      Empresa: {viewingDoc.delivery.transportName || 'Propio'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">Recepción en Destino:</span>
                    <strong className="text-slate-900 block">{viewingDoc.delivery.receiverName || viewingDoc.order.customerName}</strong>
                    <span className="text-slate-600 text-[11px]">
                      DNI Receptor: {viewingDoc.delivery.receiverDni || 'A consignar'}
                    </span>
                    <span className="text-slate-600 text-[11px] block font-mono">
                      Ref Factura: {viewingDoc.order.invoiceNumber || 'Factura Anticipada'}
                    </span>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5 text-center">Cant Entregada</th>
                      {viewingDoc.type !== 'orden_entrega' && (
                        <>
                          <th className="p-2.5 text-right">P. Unit</th>
                          <th className="p-2.5 text-right">Total</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingDoc.type === 'orden_entrega' && viewingDoc.delivery ? (
                      viewingDoc.delivery.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium">{it.productName} ({it.presentation})</td>
                          <td className="p-2.5 text-center font-mono font-black text-slate-900">{it.quantity} un</td>
                        </tr>
                      ))
                    ) : (
                      viewingDoc.order.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium">{it.productName}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{it.quantity} un</td>
                          <td className="p-2.5 text-right font-mono">$ {it.unitPrice.toLocaleString('es-AR')}</td>
                          <td className="p-2.5 text-right font-mono font-bold">$ {it.subtotal.toLocaleString('es-AR')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals / Remito stats */}
              {viewingDoc.type === 'orden_entrega' && viewingDoc.delivery ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span>Total Bultos / Envases en este Remito:</span>
                    <span className="font-mono text-sm text-blue-700">
                      {viewingDoc.delivery.items.reduce((s, it) => s + it.quantity, 0)} unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    <span>Pedido Comercial de Origen:</span>
                    <span className="font-mono">{viewingDoc.order.orderNumber}</span>
                  </div>
                  {viewingDoc.delivery.notes && (
                    <div className="text-[11px] text-slate-600 pt-1">
                      <strong>Observaciones:</strong> {viewingDoc.delivery.notes}
                    </div>
                  )}

                  {/* Signatures for Remito */}
                  <div className="grid grid-cols-2 gap-4 pt-8 mt-4 border-t border-dashed border-slate-300 text-center">
                    <div>
                      <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">
                        Firma y Aclaración Chofer / Transportista
                        <div className="text-[10px] text-slate-400">Retira conforme de fábrica</div>
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">
                        Firma, Aclaración y DNI Receptor
                        <div className="text-[10px] text-slate-400">Recibe conforme en destino / obra</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-right space-y-1 font-mono text-xs pr-2">
                  <div>Subtotal: $ {viewingDoc.order.subtotal.toLocaleString('es-AR')}</div>
                  {viewingDoc.order.taxAmount > 0 && (
                    <div>IVA 21%: $ {viewingDoc.order.taxAmount.toLocaleString('es-AR')}</div>
                  )}
                  <div className="text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    TOTAL COMPROBANTE: $ {viewingDoc.order.total.toLocaleString('es-AR')}
                  </div>
                </div>
              )}

              {/* Fiscal footer if ARCA */}
              {viewingDoc.order.cae && viewingDoc.type !== 'orden_entrega' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">Comprobante Autorizado por ARCA</span>
                    <span className="font-mono text-blue-800 font-bold">CAE: {viewingDoc.order.cae}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-blue-600 block">Vto. CAE:</span>
                    <span className="font-mono text-blue-800 font-bold">{viewingDoc.order.caeVto}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500">
                Transporte: {viewingDoc.delivery?.transportName || viewingDoc.order.transportName || 'Propio'}
              </span>
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
