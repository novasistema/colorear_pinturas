import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  CircleDollarSign, 
  AlertTriangle, 
  MessageSquare, 
  Mail, 
  FileText, 
  CheckCircle, 
  Clock, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  Send,
  Building
} from 'lucide-react';
import { Customer, SalesOrder, FinancialTransaction, CompanyConfig, Transport } from '../types';
import { generatePaymentReminderWhatsApp } from '../utils/exportUtils';

interface CustomersModuleProps {
  customers: Customer[];
  salesOrders: SalesOrder[];
  transports: Transport[];
  config: CompanyConfig | null;
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onRecordPayment: (customerId: string, amount: number, method: FinancialTransaction['paymentMethod'], concept: string) => Promise<void>;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({
  customers,
  salesOrders,
  transports,
  config,
  onSaveCustomer,
  onRecordPayment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // New/Edit Customer form
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    taxId: '',
    businessName: '',
    tradeName: '',
    taxCategory: 'responsable_inscripto',
    email: '',
    phone: '',
    address: '',
    city: 'Buenos Aires',
    province: 'Buenos Aires',
    priceList: 'mayorista',
    creditLimit: 1500000,
    currentBalance: 0,
    status: 'activo'
  });

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<FinancialTransaction['paymentMethod']>('transferencia');
  const [paymentConcept, setPaymentConcept] = useState('Cancelación parcial factura / cuenta corriente');

  const filteredCustomers = customers.filter(c => 
    c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.taxId.includes(searchQuery) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.taxId || !customerForm.businessName) return;

    const newCust: Customer = {
      id: customerForm.id || `cust-${Date.now()}`,
      taxId: customerForm.taxId.trim(),
      businessName: customerForm.businessName,
      tradeName: customerForm.tradeName,
      taxCategory: customerForm.taxCategory || 'responsable_inscripto',
      email: customerForm.email || '',
      phone: customerForm.phone || '',
      address: customerForm.address || '',
      city: customerForm.city || '',
      province: customerForm.province || '',
      transportId: customerForm.transportId,
      transportName: transports.find(t => t.id === customerForm.transportId)?.name,
      priceList: customerForm.priceList || 'mayorista',
      creditLimit: Number(customerForm.creditLimit) || 0,
      currentBalance: Number(customerForm.currentBalance) || 0,
      status: customerForm.status || 'activo'
    };

    await onSaveCustomer(newCust);
    setShowCustomerModal(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || paymentAmount <= 0) return;

    await onRecordPayment(selectedCustomer.id, paymentAmount, paymentMethod, paymentConcept);
    setShowPaymentModal(false);
    setPaymentAmount(0);
  };

  // Customer order history
  const customerOrders = selectedCustomer 
    ? salesOrders.filter(o => o.customerId === selectedCustomer.id || o.customerTaxId === selectedCustomer.taxId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Cuentas Corrientes & Clientes
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  Límites de Crédito & Cobranzas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de saldos, historial de facturas, cobranzas y recordatorios automáticos por WhatsApp con CBU.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCustomerForm({
                taxId: '',
                businessName: '',
                tradeName: '',
                taxCategory: 'responsable_inscripto',
                email: '',
                phone: '',
                address: '',
                city: 'Buenos Aires',
                province: 'Buenos Aires',
                priceList: 'mayorista',
                creditLimit: 1500000,
                currentBalance: 0,
                status: 'activo'
              });
              setShowCustomerModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Alta de Cliente / Pinturería
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar por Razón Social, CUIT, DNI, localidad..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 w-full sm:w-80 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Cliente / Razón Social</th>
                <th className="p-3.5">CUIT / DNI</th>
                <th className="p-3.5">Lista</th>
                <th className="p-3.5">Transporte Asignado</th>
                <th className="p-3.5 text-right">Límite Crédito</th>
                <th className="p-3.5 text-right">Saldo Cuenta Corriente</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => {
                const hasDebt = c.currentBalance > 0;
                const isOverLimit = c.currentBalance > c.creditLimit;
                const whatsappMsg = generatePaymentReminderWhatsApp(c, config || undefined);
                const phoneClean = c.phone.replace(/[^0-9]/g, '');

                return (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${isOverLimit ? 'bg-red-50/20' : ''}`}>
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900">{c.businessName}</div>
                      <div className="text-[11px] text-slate-500">{c.city}, {c.province} • {c.phone}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {c.taxId}
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c.priceList}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 truncate max-w-xs">
                      {c.transportName || 'A designar'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      $ {c.creditLimit.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      <div className={`font-black text-sm ${hasDebt ? 'text-red-600' : 'text-emerald-700'}`}>
                        $ {c.currentBalance.toLocaleString('es-AR')}
                      </div>
                      {isOverLimit && (
                        <span className="text-[10px] text-red-600 font-extrabold uppercase block">
                          Excede Límite
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors"
                        >
                          Cta. Cte.
                        </button>
                        {hasDebt && (
                          <a
                            href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg transition-colors"
                            title="Enviar recordatorio de pago por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setCustomerForm(c);
                            setShowCustomerModal(true);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Editar datos cliente"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER / MODAL: CUENTA CORRIENTE DETAIL */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Estado de Cuenta Corriente
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedCustomer.businessName}
                </h3>
                <span className="text-xs text-slate-500 font-mono">CUIT/DNI: {selectedCustomer.taxId}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balances summary */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 block">Límite de Crédito:</span>
                <strong className="text-slate-900 font-mono text-sm">
                  $ {selectedCustomer.creditLimit.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs">
                <span className="text-red-700 block font-semibold">Saldo Deudor Actual:</span>
                <strong className="text-red-700 font-mono text-base font-black">
                  $ {selectedCustomer.currentBalance.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="text-emerald-700 block font-semibold">Crédito Disponible:</span>
                <strong className="text-emerald-700 font-mono text-sm font-bold">
                  $ {Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentBalance).toLocaleString('es-AR')}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold uppercase text-slate-500">
                Historial de Comprobantes & Pedidos Personalizados
              </h4>
              <button
                onClick={() => {
                  setPaymentAmount(selectedCustomer.currentBalance > 0 ? selectedCustomer.currentBalance : 0);
                  setShowPaymentModal(true);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs"
              >
                <CircleDollarSign className="w-3.5 h-3.5" /> Registrar Cobranza
              </button>
            </div>

            {/* Orders Ledger */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {customerOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No se registran comprobantes previos para este cliente.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Pedido / Factura</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5 text-center">Estado Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerOrders.map(o => (
                      <tr key={o.id}>
                        <td className="p-2.5 font-mono text-slate-500">
                          {new Date(o.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {o.orderNumber}
                          {o.invoiceNumber && <span className="block text-[10px] font-mono text-slate-500">{o.invoiceNumber}</span>}
                        </td>
                        <td className="p-2.5 uppercase font-mono text-[10px]">
                          {o.billingType === 'arca' ? 'ARCA' : 'No-ARCA'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          $ {o.total.toLocaleString('es-AR')}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            o.paymentStatus === 'pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Transporte habitual: <strong>{selectedCustomer.transportName || 'Directo fábrica'}</strong>
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR COBRANZA */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-600" /> Registrar Cobranza
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingreso de fondos a cuenta corriente de {selectedCustomer.businessName}.
            </p>

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monto Cobrado ($)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-base p-2.5 rounded-xl border border-slate-300 font-mono font-black text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medio de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="echeq">E-Cheq</option>
                  <option value="cheque">Cheque Físico</option>
                  <option value="efectivo">Efectivo en Mostrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Concepto / Referencia</label>
                <input
                  type="text"
                  value={paymentConcept}
                  onChange={e => setPaymentConcept(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Confirmar Cobranza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALTA / EDITAR CLIENTE */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">
              {customerForm.id ? 'Editar Cliente' : 'Alta de Cliente / Pinturería'}
            </h3>

            <form onSubmit={handleCustomerSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CUIT o DNI</label>
                  <input
                    type="text"
                    value={customerForm.taxId}
                    onChange={e => setCustomerForm({ ...customerForm, taxId: e.target.value })}
                    placeholder="30-71234567-9 o 28945612"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Usado para acceso al portal</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Condición Fiscal</label>
                  <select
                    value={customerForm.taxCategory}
                    onChange={e => setCustomerForm({ ...customerForm, taxCategory: e.target.value as any })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  >
                    <option value="responsable_inscripto">Responsable Inscripto</option>
                    <option value="monotributo">Monotributo</option>
                    <option value="consumidor_final">Consumidor Final</option>
                    <option value="exento">Exento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  value={customerForm.businessName}
                  onChange={e => setCustomerForm({ ...customerForm, businessName: e.target.value })}
                  placeholder="Pinturerías del Centro S.R.L."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="+54 11 4321-7890"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="compras@cliente.com"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección de Entrega</label>
                  <input
                    type="text"
                    value={customerForm.address}
                    onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                    placeholder="Av. Corrientes 4520"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={customerForm.city}
                    onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                    placeholder="CABA"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lista de Precios</label>
                  <select
                    value={customerForm.priceList}
                    onChange={e => setCustomerForm({ ...customerForm, priceList: e.target.value as any })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  >
                    <option value="distribuidor">Distribuidor / Pinturería</option>
                    <option value="mayorista">Mayorista General</option>
                    <option value="minorista">Minorista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Límite de Crédito ($)</label>
                  <input
                    type="number"
                    value={customerForm.creditLimit}
                    onChange={e => setCustomerForm({ ...customerForm, creditLimit: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transporte Asignado</label>
                <select
                  value={customerForm.transportId || ''}
                  onChange={e => setCustomerForm({ ...customerForm, transportId: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                >
                  <option value="">Seleccionar transporte habitual...</option>
                  {transports.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.serviceArea})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
