import React, { useState } from 'react';
import { 
  PackageSearch, 
  Plus, 
  Truck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText, 
  Layers, 
  Building2,
  X,
  Check
} from 'lucide-react';
import { Supplier, PurchaseOrder, RawMaterial } from '../types';

interface PurchasesModuleProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  rawMaterials: RawMaterial[];
  onSaveSupplier: (supplier: Supplier) => Promise<void>;
  onCreatePurchaseOrder: (po: PurchaseOrder) => Promise<void>;
  onReceivePurchaseOrder: (po: PurchaseOrder) => Promise<void>;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  suppliers,
  purchaseOrders,
  rawMaterials,
  onSaveSupplier,
  onCreatePurchaseOrder,
  onReceivePurchaseOrder
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Supplier form
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    businessName: '',
    taxId: '',
    email: '',
    phone: '',
    category: 'Resinas & Polímeros',
    paymentTerms: '30 días F.F.'
  });

  // Purchase Order form
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ rawMaterialId: string; quantity: number; unitCost: number }[]>([
    { rawMaterialId: rawMaterials[0]?.id || '', quantity: 1000, unitCost: rawMaterials[0]?.unitCost || 2500 }
  ]);
  const [poNotes, setPoNotes] = useState('');

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  const calculatedItems = poItems.map(it => {
    const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
    return {
      rawMaterialId: it.rawMaterialId,
      rawMaterialName: mat?.name || 'Insumo Químico',
      quantity: Number(it.quantity) || 1,
      unitCost: Number(it.unitCost) || 0,
      subtotal: (Number(it.quantity) || 1) * (Number(it.unitCost) || 0)
    };
  });

  const total = calculatedItems.reduce((acc, it) => acc + it.subtotal, 0);

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.businessName || !supplierForm.taxId) return;

    const newSupplier: Supplier = {
      id: supplierForm.id || `sup-${Date.now()}`,
      businessName: supplierForm.businessName,
      taxId: supplierForm.taxId,
      email: supplierForm.email || '',
      phone: supplierForm.phone || '',
      category: supplierForm.category || 'Materia Prima',
      paymentTerms: supplierForm.paymentTerms || 'Contado'
    };

    await onSaveSupplier(newSupplier);
    setShowSupplierModal(false);
  };

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || calculatedItems.length === 0) return;

    const orderNumber = `OC-${new Date().getFullYear()}-${String(purchaseOrders.length + 15).padStart(3, '0')}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.businessName,
      date: new Date().toISOString(),
      items: calculatedItems,
      status: 'solicitado',
      total,
      notes: poNotes
    };

    await onCreatePurchaseOrder(newPO);
    setShowPOModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-800">
              <PackageSearch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Módulo de Compras & Proveedores
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  Insumos & Recepción
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión de pedidos a proveedores de químicos, pigmentos y envases con ingreso automático a stock al recepcionar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPOModal(true)}
              className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Emitir Orden de Compra
            </button>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors"
            >
              <Building2 className="w-4 h-4" /> Nuevo Proveedor
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Órdenes de Compra ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'suppliers' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Directorio de Proveedores ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map(po => {
              const isReceived = po.status === 'recibido';
              return (
                <div key={po.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {po.orderNumber}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {po.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm mt-2">
                      {po.supplierName}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Fecha: {new Date(po.date).toLocaleDateString('es-AR')}
                    </div>

                    <div className="mt-3 space-y-1 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {po.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-slate-800">{it.quantity} un x {it.rawMaterialName}</span>
                          <span className="font-mono font-bold">$ {it.subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Insumos</span>
                      <strong className="font-mono text-sm text-slate-900">$ {po.total.toLocaleString('es-AR')}</strong>
                    </div>

                    {!isReceived ? (
                      <button
                        onClick={() => onReceivePurchaseOrder(po)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recepcionar & Aumentar Stock
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Ingresado a Stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {s.category}
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm mt-1">{s.businessName}</h3>
              <div className="text-xs text-slate-600 space-y-1">
                <div>CUIT: <strong className="font-mono">{s.taxId}</strong></div>
                <div>Tel: {s.phone}</div>
                <div>Email: {s.email}</div>
                <div>Condición Pago: <strong>{s.paymentTerms}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EMITIR OC */}
      {showPOModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900">
              Emitir Orden de Compra de Materias Primas
            </h3>

            <form onSubmit={handlePOSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proveedor</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.businessName} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Insumos Solicitados</label>
                  <button
                    type="button"
                    onClick={() => setPoItems([...poItems, { rawMaterialId: rawMaterials[0]?.id || '', quantity: 500, unitCost: rawMaterials[0]?.unitCost || 1000 }])}
                    className="text-xs font-bold text-[#d31627] hover:underline"
                  >
                    + Agregar Insumo
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {poItems.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                      <select
                        value={it.rawMaterialId}
                        onChange={e => {
                          const items = [...poItems];
                          const mat = rawMaterials.find(m => m.id === e.target.value);
                          items[idx].rawMaterialId = e.target.value;
                          if (mat) items[idx].unitCost = mat.unitCost;
                          setPoItems(items);
                        }}
                        className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300"
                      >
                        {rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={e => {
                          const items = [...poItems];
                          items[idx].quantity = Number(e.target.value);
                          setPoItems(items);
                        }}
                        className="w-20 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                      />
                      <input
                        type="number"
                        min="1"
                        value={it.unitCost}
                        onChange={e => {
                          const items = [...poItems];
                          items[idx].unitCost = Number(e.target.value);
                          setPoItems(items);
                        }}
                        className="w-24 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                      />
                      <button
                        type="button"
                        onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-right font-black text-sm text-slate-900 border border-slate-200">
                Total Estimado: $ {total.toLocaleString('es-AR')}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Generar Orden de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PROVEEDOR */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">
              Registrar Proveedor de Materias Primas
            </h3>

            <form onSubmit={handleSupplierSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  value={supplierForm.businessName}
                  onChange={e => setSupplierForm({ ...supplierForm, businessName: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CUIT</label>
                  <input
                    type="text"
                    value={supplierForm.taxId}
                    onChange={e => setSupplierForm({ ...supplierForm, taxId: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                  <input
                    type="text"
                    value={supplierForm.category}
                    onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Condición Pago</label>
                  <input
                    type="text"
                    value={supplierForm.paymentTerms}
                    onChange={e => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
