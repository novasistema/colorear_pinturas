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
  X
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
  InvoiceType
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
  onRecordOrderPayment
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ order: SalesOrder; type: 'remito' | 'factura' } | null>(null);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [billingType, setBillingType] = useState<BillingType>('arca');
  const [selectedTransportId, setSelectedTransportId] = useState<string>(customers[0]?.transportId || transports[0]?.id || '');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; discount: number }[]>([
    { productId: products[0]?.id || '', quantity: 10, discount: 0 }
  ]);
  const [orderNotes, setOrderNotes] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

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

  // Submit order
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
      date: new Date().toISOString(),
      status: 'ingresado',
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
  };

  // Progression through stages
  const advanceOrderStage = async (order: SalesOrder) => {
    if (order.status === 'ingresado') {
      // Advance to Preparando Remito
      const remitoNumber = `REM-R0001-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`;
      await onUpdateOrderStatus(order.id, 'preparando_remito', {
        remitoNumber,
        remitoDate: new Date().toISOString()
      });
    } else if (order.status === 'preparando_remito') {
      // Advance to Facturado
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
    } else if (order.status === 'facturado') {
      // Advance to Despachado
      await onUpdateOrderStatus(order.id, 'despachado');
    } else if (order.status === 'despachado') {
      // Advance to Entregado
      await onUpdateOrderStatus(order.id, 'entregado');
    }
  };

  // Filter orders
  const filteredOrders = salesOrders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesBilling = billingFilter === 'all' || order.billingType === billingFilter;
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerTaxId.includes(searchQuery);
    return matchesStatus && matchesBilling && matchesSearch;
  });

  const getStatusBadge = (status: SalesOrderStatus) => {
    switch (status) {
      case 'ingresado':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">1. Ingresado</span>;
      case 'preparando_remito':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">2. Preparando Remito</span>;
      case 'facturado':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">3. Facturado</span>;
      case 'despachado':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">4. Despachado</span>;
      case 'entregado':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">5. Entregado</span>;
      default:
        return <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Cancelado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Ventas, Remitos & Ciclo de Despacho
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Flujo Trazable & WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ciclo completo: Pedido &gt; Remito &gt; Factura ARCA/No-ARCA &gt; Despacho &gt; Envío automático por WhatsApp y Email.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewOrderModal(true)}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido Comercial
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por cliente, pedido, CUIT o remito..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({salesOrders.length})
              </button>
              <button
                onClick={() => setStatusFilter('ingresado')}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'ingresado' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ingresados
              </button>
              <button
                onClick={() => setStatusFilter('preparando_remito')}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'preparando_remito' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Remitos
              </button>
              <button
                onClick={() => setStatusFilter('despachado')}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'despachado' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                Despachados
              </button>
            </div>

            {/* ARCA vs No-ARCA filter */}
            <select
              value={billingFilter}
              onChange={e => setBillingFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 font-semibold text-slate-700 bg-white"
            >
              <option value="all">Todas las ventas</option>
              <option value="arca">Solo ARCA (Fiscal)</option>
              <option value="no_arca">Solo No-ARCA (Interno)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200 text-sm">
            No se encontraron pedidos con los filtros seleccionados.
          </div>
        ) : (
          filteredOrders.map(order => {
            const isArca = order.billingType === 'arca';
            const whatsappMsg = generateWhatsAppMessage(order, config || undefined);
            const clientPhoneClean = order.customerPhone?.replace(/[^0-9]/g, '') || '';

            return (
              <div 
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      isArca ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isArca ? 'Venta ARCA (Fiscal)' : 'Venta No-ARCA (Interno)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {new Date(order.date).toLocaleDateString('es-AR')}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm font-black text-slate-900">
                      $ {order.total.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Main Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer info */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Cliente & CUIT/DNI
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

                  {/* Documents & CAE */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Comprobantes Oficiales
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Remito:</span>
                      <strong className="font-mono text-slate-800">
                        {order.remitoNumber || 'Pendiente de emisión'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Factura:</span>
                      <strong className="font-mono text-slate-800">
                        {order.invoiceNumber || 'Pendiente'}
                      </strong>
                    </div>
                    {order.cae && (
                      <div className="flex items-center justify-between text-emerald-700 font-bold">
                        <span>CAE Fiscal:</span>
                        <span className="font-mono">{order.cae}</span>
                      </div>
                    )}
                  </div>

                  {/* Transport & Tracking */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Transporte & Despacho
                    </span>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      {order.transportName || 'A coordinar'}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Código Seguimiento:</span>
                      <strong className="font-mono text-indigo-700">{order.trackingCode}</strong>
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                    Detalle de Pinturas Pedidas:
                  </div>
                  <div className="space-y-1 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between py-0.5">
                        <span className="text-slate-800">
                          {it.quantity}x {it.productName}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          $ {it.subtotal.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions: Lifecycle Stepper & Share buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  {/* Share buttons */}
                  <div className="flex items-center gap-2">
                    {/* WhatsApp button */}
                    <a
                      href={`https://wa.me/${clientPhoneClean}?text=${encodeURIComponent(whatsappMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                      title="Enviar estado por WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Email button */}
                    <a
                      href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Colorear Pinturas - Actualización Pedido ${order.orderNumber}`)}&body=${encodeURIComponent(whatsappMsg)}`}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      title="Enviar por Correo Electrónico"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>

                    {/* View Remito */}
                    {order.remitoNumber && (
                      <button
                        onClick={() => setViewingDoc({ order, type: 'remito' })}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Remito
                      </button>
                    )}

                    {/* View Factura */}
                    {order.invoiceNumber && (
                      <button
                        onClick={() => setViewingDoc({ order, type: 'factura' })}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Factura
                      </button>
                    )}
                  </div>

                  {/* Stage Progress button */}
                  {order.status !== 'entregado' && (
                    <button
                      onClick={() => advanceOrderStage(order)}
                      className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-transform active:scale-95"
                    >
                      <span>
                        {order.status === 'ingresado' && 'Emitir Remito de Preparado'}
                        {order.status === 'preparando_remito' && 'Facturar Pedido'}
                        {order.status === 'facturado' && 'Despachar al Transporte'}
                        {order.status === 'despachado' && 'Confirmar Entrega al Cliente'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {order.status === 'entregado' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Entregado & Concluido
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: NUEVO PEDIDO */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" /> Crear Pedido de Pinturas
                </h3>
                <p className="text-xs text-slate-500">
                  Selecciona cliente, lista de precios automática y tipo de facturación ARCA o interna.
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
                  Registrar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PRINTABLE REMITO / FACTURA */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/assets/aistudio/colorear-500px_0158e3cb.webp" alt="Colorear" className="h-8 w-auto" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                    {viewingDoc.type === 'remito' ? 'REMITO DE ENTREGA DE MERCADERÍA' : `FACTURA ELECTRÓNICA (${viewingDoc.order.invoiceType})`}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {viewingDoc.type === 'remito' ? viewingDoc.order.remitoNumber : viewingDoc.order.invoiceNumber}
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

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5 text-center">Cant</th>
                      <th className="p-2.5 text-right">P. Unit</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingDoc.order.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{it.productName}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono">$ {it.unitPrice.toLocaleString('es-AR')}</td>
                        <td className="p-2.5 text-right font-mono font-bold">$ {it.subtotal.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="text-right space-y-1 font-mono text-xs pr-2">
                <div>Subtotal: $ {viewingDoc.order.subtotal.toLocaleString('es-AR')}</div>
                {viewingDoc.order.taxAmount > 0 && (
                  <div>IVA 21%: $ {viewingDoc.order.taxAmount.toLocaleString('es-AR')}</div>
                )}
                <div className="text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  TOTAL COMPROBANTE: $ {viewingDoc.order.total.toLocaleString('es-AR')}
                </div>
              </div>

              {/* Fiscal footer if ARCA */}
              {viewingDoc.order.cae && (
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
              <span className="text-xs text-slate-500">Transporte: {viewingDoc.order.transportName}</span>
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
