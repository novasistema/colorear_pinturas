import React, { useState } from 'react';
import { 
  Factory, 
  Plus, 
  FlaskConical, 
  Layers, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  FileText, 
  Trash2, 
  Edit3, 
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  X,
  History,
  Scale,
  RefreshCw,
  Tag
} from 'lucide-react';
import { 
  RawMaterial, 
  Formula, 
  ProductionOrder, 
  PackagingType, 
  Product, 
  InventoryMovement,
  RawMaterialCategory,
  UnitType,
  FormulaItem
} from '../types';

interface ProductionModuleProps {
  rawMaterials: RawMaterial[];
  formulas: Formula[];
  productionOrders: ProductionOrder[];
  products: Product[];
  inventoryMovements: InventoryMovement[];
  onSaveRawMaterial: (mat: RawMaterial) => Promise<void>;
  onDeleteRawMaterial: (id: string) => Promise<void>;
  onSaveFormula: (formula: Formula) => Promise<void>;
  onDeleteFormula: (id: string) => Promise<void>;
  onCreateProductionOrder: (order: ProductionOrder) => Promise<void>;
  onCompleteProductionOrder: (order: ProductionOrder) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: ProductionOrder['status']) => Promise<void>;
  onSendToPriceList?: (preload: { formula?: Formula; order?: ProductionOrder }) => void;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  rawMaterials,
  formulas,
  productionOrders,
  products,
  inventoryMovements,
  onSaveRawMaterial,
  onDeleteRawMaterial,
  onSaveFormula,
  onDeleteFormula,
  onCreateProductionOrder,
  onCompleteProductionOrder,
  onUpdateOrderStatus,
  onSendToPriceList
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'formulas' | 'materials' | 'kardex'>('orders');

  // Modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<ProductionOrder | null>(null);

  // New Material form state
  const [materialForm, setMaterialForm] = useState<Partial<RawMaterial>>({
    code: '',
    name: '',
    category: 'resina',
    unit: 'kg',
    currentStock: 100,
    minStock: 50,
    unitCost: 1000,
    supplierName: ''
  });

  // New Formula form state
  const [formulaForm, setFormulaForm] = useState<{
    code: string;
    name: string;
    paintType: string;
    density: number;
    baseQuantity: number;
    notes: string;
    items: { rawMaterialId: string; percentageOrKg: number }[];
  }>({
    code: '',
    name: '',
    paintType: 'Látex Interior',
    density: 1.35,
    baseQuantity: 100,
    notes: '',
    items: []
  });

  // New Production Order (Hoja de Producción) form state
  const [orderForm, setOrderForm] = useState<{
    formulaId: string;
    targetKg: number;
    packagingType: PackagingType;
    operatorName: string;
    batchNumber: string;
    notes: string;
  }>({
    formulaId: formulas[0]?.id || '',
    targetKg: 1000,
    packagingType: 'balde_20l',
    operatorName: 'Martín Ibarra',
    batchNumber: `LOTE-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 899 + 100))}`,
    notes: ''
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchMaterial, setSearchMaterial] = useState('');

  // Helpers for packaging units
  const getPackagingVolume = (type: PackagingType) => {
    switch (type) {
      case 'balde_20l': return 20;
      case 'lata_10l': return 10;
      case 'lata_4l': return 4;
      case 'lata_1l': return 1;
      case 'tambor_200l': return 200;
    }
  };

  const getPackagingLabel = (type: PackagingType) => {
    switch (type) {
      case 'balde_20l': return 'Balde 20 Litros';
      case 'lata_10l': return 'Balde / Lata 10 Litros';
      case 'lata_4l': return 'Lata 4 Litros';
      case 'lata_1l': return 'Lata 1 Litro';
      case 'tambor_200l': return 'Tambor 200 Litros';
    }
  };

  // Selected formula calculations in Order Modal
  const selectedFormula = formulas.find(f => f.id === orderForm.formulaId) || formulas[0];
  const calculatedLiters = selectedFormula && selectedFormula.density > 0 
    ? orderForm.targetKg / selectedFormula.density 
    : orderForm.targetKg / 1.35;
  const packageVolume = getPackagingVolume(orderForm.packagingType);
  const calculatedPackageCount = Math.round(calculatedLiters / packageVolume);
  const calculatedTheoreticalCost = selectedFormula 
    ? (selectedFormula.theoreticalCostPerKg * orderForm.targetKg)
    : 0;

  // Handle Material Submit
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.name || !materialForm.code) return;

    const newMaterial: RawMaterial = {
      id: materialForm.id || `rm-${Date.now()}`,
      code: materialForm.code.toUpperCase(),
      name: materialForm.name,
      category: (materialForm.category as RawMaterialCategory) || 'resina',
      unit: (materialForm.unit as UnitType) || 'kg',
      currentStock: Number(materialForm.currentStock) || 0,
      minStock: Number(materialForm.minStock) || 0,
      unitCost: Number(materialForm.unitCost) || 0,
      supplierName: materialForm.supplierName || 'Proveedor General',
      updatedAt: new Date().toISOString()
    };

    await onSaveRawMaterial(newMaterial);
    setShowMaterialModal(false);
    setMaterialForm({
      code: '',
      name: '',
      category: 'resina',
      unit: 'kg',
      currentStock: 100,
      minStock: 50,
      unitCost: 1000,
      supplierName: ''
    });
  };

  // Add ingredient to formula
  const addFormulaItem = () => {
    if (rawMaterials.length === 0) return;
    setFormulaForm(prev => ({
      ...prev,
      items: [...prev.items, { rawMaterialId: rawMaterials[0].id, percentageOrKg: 10 }]
    }));
  };

  const removeFormulaItem = (index: number) => {
    setFormulaForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateFormulaItem = (index: number, rawMaterialId: string, percentageOrKg: number) => {
    setFormulaForm(prev => {
      const items = [...prev.items];
      items[index] = { rawMaterialId, percentageOrKg };
      return { ...prev, items };
    });
  };

  // Calculate theoretical cost of formula
  const currentFormulaCost = formulaForm.items.reduce((acc, it) => {
    const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
    if (!mat) return acc;
    return acc + (mat.unitCost * (it.percentageOrKg / 100));
  }, 0);

  const totalFormulaPercentage = formulaForm.items.reduce((acc, it) => acc + (Number(it.percentageOrKg) || 0), 0);

  // Handle Formula Submit
  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaForm.name || !formulaForm.code || formulaForm.items.length === 0) return;

    const formattedItems: FormulaItem[] = formulaForm.items.map(it => {
      const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
      return {
        rawMaterialId: it.rawMaterialId,
        rawMaterialName: mat?.name || 'Materia Prima',
        percentageOrKg: Number(it.percentageOrKg),
        unit: mat?.unit || 'kg'
      };
    });

    const newFormula: Formula = {
      id: `form-${Date.now()}`,
      code: formulaForm.code.toUpperCase(),
      name: formulaForm.name,
      paintType: formulaForm.paintType,
      density: Number(formulaForm.density) || 1.35,
      theoreticalCostPerKg: currentFormulaCost,
      baseQuantity: 100,
      items: formattedItems,
      notes: formulaForm.notes,
      createdAt: new Date().toISOString()
    };

    await onSaveFormula(newFormula);
    setShowFormulaModal(false);
    setFormulaForm({
      code: '',
      name: '',
      paintType: 'Látex Interior',
      density: 1.35,
      baseQuantity: 100,
      notes: '',
      items: []
    });
  };

  // Handle Production Order Submit
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormula) return;

    const orderNumber = `OP-${new Date().getFullYear()}-${String(productionOrders.length + 1).padStart(4, '0')}`;

    const newOrder: ProductionOrder = {
      id: `po-${Date.now()}`,
      orderNumber,
      formulaId: selectedFormula.id,
      productName: selectedFormula.name,
      batchNumber: orderForm.batchNumber,
      targetKg: Number(orderForm.targetKg),
      packagingType: orderForm.packagingType,
      packageCount: calculatedPackageCount,
      status: 'en_proceso',
      materialCost: calculatedTheoreticalCost,
      operatorName: orderForm.operatorName,
      notes: orderForm.notes,
      createdAt: new Date().toISOString()
    };

    await onCreateProductionOrder(newOrder);
    setShowOrderModal(false);
  };

  // Filtered materials
  const filteredMaterials = rawMaterials.filter(m => {
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesSearch = searchMaterial === '' || 
      m.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      m.code.toLowerCase().includes(searchMaterial.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-[#d31627]">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Módulo de Producción Industrial
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800">
                  Fórmulas x 100 & Kardex
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Carga de materias primas con costos, recetas estandarizadas, hojas de fabricación y baja/alta automática de inventario.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (formulas.length === 0) {
                  alert('Por favor crea una fórmula primero.');
                  return;
                }
                setShowOrderModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Generar Hoja de Producción
            </button>
            <button
              onClick={() => {
                setShowFormulaModal(true);
                if (formulaForm.items.length === 0 && rawMaterials.length > 0) {
                  setFormulaForm(prev => ({
                    ...prev,
                    items: [
                      { rawMaterialId: rawMaterials[0].id, percentageOrKg: 30 },
                      { rawMaterialId: rawMaterials[1]?.id || rawMaterials[0].id, percentageOrKg: 20 }
                    ]
                  }));
                }
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors"
            >
              <FlaskConical className="w-4 h-4 text-emerald-400" /> Nueva Fórmula x 100
            </button>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              <Plus className="w-4 h-4" /> Cargar Materia Prima
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'orders'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Órdenes de Fabricación ({productionOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'formulas'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Fórmulas & Recetas x 100 ({formulas.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'materials'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            Materias Primas & Costos ({rawMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab('kardex')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'kardex'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Kardex / Movimientos en Tiempo Real ({inventoryMovements.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCTION ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productionOrders.map(order => {
              const formula = formulas.find(f => f.id === order.formulaId);
              const isCompleted = order.status === 'completada';
              const isInProcess = order.status === 'en_proceso';

              return (
                <div 
                  key={order.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                    isCompleted 
                      ? 'border-emerald-200 bg-emerald-50/10' 
                      : isInProcess 
                      ? 'border-amber-300 bg-amber-50/10' 
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {order.orderNumber}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isCompleted 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isInProcess 
                          ? 'bg-amber-100 text-amber-800 animate-pulse' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base mt-2.5">
                      {order.productName}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Lote: <strong className="text-slate-800">{order.batchNumber}</strong> | Op: {order.operatorName}
                    </div>

                    {/* Batch specifications */}
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Masa a Fabricar:</span>
                        <strong className="text-slate-900 font-mono">{order.targetKg.toLocaleString('es-AR')} kg</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Tipo de Envasado:</span>
                        <strong className="text-slate-900">{getPackagingLabel(order.packagingType)}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Unidades Envasadas:</span>
                        <strong className="text-red-700 font-extrabold font-mono text-sm">
                          {order.packageCount} envases
                        </strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Costo Materias Primas:</span>
                        <strong className="text-emerald-700 font-mono">
                          $ {order.materialCost.toLocaleString('es-AR')}
                        </strong>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-2.5 line-clamp-2">
                        "{order.notes}"
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setViewingOrder(order)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Hoja de Fábrica
                    </button>

                    {!isCompleted && (
                      <button
                        onClick={() => onCompleteProductionOrder(order)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-transform active:scale-95"
                        title="Baja automática de materias primas y alta a producto terminado"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Finalizar & Dar de Alta
                      </button>
                    )}
                    {isCompleted && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Stock Actualizado
                        </span>
                        {onSendToPriceList && (
                          <button
                            onClick={() => onSendToPriceList({ order })}
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition-colors"
                            title="Crear o verificar este producto en Lista de Precios"
                          >
                            <Tag className="w-3 h-3" /> Enviar a Lista Precios
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FORMULAS X 100 */}
      {activeTab === 'formulas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {formulas.map(formula => (
              <div key={formula.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {formula.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Costo Teórico: $ {formula.theoreticalCostPerKg.toFixed(2)} / kg
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                    {formula.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Tipo: <strong>{formula.paintType}</strong></span>
                    <span>•</span>
                    <span>Densidad: <strong>{formula.density} kg/L</strong></span>
                    <span>•</span>
                    <span>Base: <strong>{formula.baseQuantity} kg</strong></span>
                  </div>

                  {formula.notes && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {formula.notes}
                    </p>
                  )}

                  {/* Breakdown of ingredients */}
                  <div className="mt-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">
                      Composición por 100 kg de Producto:
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {formula.items.map((item, idx) => {
                        const mat = rawMaterials.find(m => m.id === item.rawMaterialId);
                        const costContribution = mat ? (mat.unitCost * (item.percentageOrKg / 100)) : 0;
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors">
                            <span className="font-medium text-slate-800 truncate mr-2">
                              {item.rawMaterialName}
                            </span>
                            <div className="flex items-center gap-3 shrink-0 font-mono">
                              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {item.percentageOrKg} %
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                ($ {costContribution.toFixed(1)})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setOrderForm(prev => ({
                          ...prev,
                          formulaId: formula.id
                        }));
                        setShowOrderModal(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#d31627] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Fabricar Lote
                    </button>

                    {onSendToPriceList && (
                      <button
                        onClick={() => onSendToPriceList({ formula })}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                        title="Crear producto en Lista de Precios a partir de esta fórmula"
                      >
                        <Tag className="w-3.5 h-3.5" /> Enviar a Lista Precios
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteFormula(formula.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded"
                    title="Eliminar fórmula"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RAW MATERIALS & COSTS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar químico, resina, pigmento o envase..."
                value={searchMaterial}
                onChange={e => setSearchMaterial(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 w-full sm:w-72 focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-400 mr-1">Filtrar:</span>
              {['all', 'resina', 'pigmento', 'carga', 'aditivo', 'solvente', 'envase'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg capitalize transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Código</th>
                    <th className="p-3.5">Materia Prima / Insumo</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5 text-right">Stock Actual</th>
                    <th className="p-3.5 text-right">Stock Mínimo</th>
                    <th className="p-3.5 text-right">Costo Unitario ($)</th>
                    <th className="p-3.5 text-right">Valorizado ($)</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map(mat => {
                    const isLowStock = mat.currentStock <= mat.minStock;
                    const totalValued = mat.currentStock * mat.unitCost;

                    return (
                      <tr key={mat.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
                        <td className="p-3.5 font-mono font-bold text-slate-700">{mat.code}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{mat.name}</div>
                          <div className="text-[11px] text-slate-400">{mat.supplierName}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {mat.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900">
                          {mat.currentStock.toLocaleString('es-AR')} {mat.unit}
                          {isLowStock && (
                            <span className="block text-[10px] text-red-600 font-bold">
                              Stock Crítico
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          {mat.minStock.toLocaleString('es-AR')} {mat.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                          $ {mat.unitCost.toLocaleString('es-AR')} /{mat.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                          $ {totalValued.toLocaleString('es-AR')}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setMaterialForm(mat);
                              setShowMaterialModal(true);
                            }}
                            className="text-slate-400 hover:text-slate-800 p-1 mr-1"
                            title="Editar materia prima"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRawMaterial(mat.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Eliminar materia prima"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KARDEX / MOVEMENTS LOG */}
      {activeTab === 'kardex' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Registro Histórico de Movimientos de Inventario (Kardex)
              </h3>
              <p className="text-xs text-slate-500">
                Auditoría en tiempo real de entradas por producción, compras, consumos en planta y despachos.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
              {inventoryMovements.length} Registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Fecha y Hora</th>
                  <th className="p-3.5">Tipo Movimiento</th>
                  <th className="p-3.5">Ítem (Materia Prima / Producto)</th>
                  <th className="p-3.5 text-right">Cantidad</th>
                  <th className="p-3.5">Referencia</th>
                  <th className="p-3.5">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryMovements.map(mov => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(mov.date).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                          mov.movementType.includes('entrada')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {mov.itemName}
                      </td>
                      <td className={`p-3.5 text-right font-mono font-extrabold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{mov.quantity} {mov.unit}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 font-bold">
                        {mov.reference}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {mov.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE PRODUCTION ORDER (HOJA DE PRODUCCIÓN) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-[#d31627]" /> Generar Hoja de Producción
                </h3>
                <p className="text-xs text-slate-500">
                  Cálculo automático de materias primas por kg a fabricar y tipo de envasado
                </p>
              </div>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              {/* Formula selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Fórmula Base (Receta x 100 kg)
                </label>
                <select
                  value={orderForm.formulaId}
                  onChange={e => setOrderForm({ ...orderForm, formulaId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50"
                  required
                >
                  {formulas.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} - (Densidad: {f.density} kg/L | Costo Teórico: ${f.theoreticalCostPerKg.toFixed(1)}/kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturing parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kilogramos a Fabricar (kg)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={orderForm.targetKg}
                    onChange={e => setOrderForm({ ...orderForm, targetKg: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Equivale a aprox. <strong>{Math.round(calculatedLiters)} Litros</strong> de pintura.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo de Envasado
                  </label>
                  <select
                    value={orderForm.packagingType}
                    onChange={e => setOrderForm({ ...orderForm, packagingType: e.target.value as PackagingType })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                    required
                  >
                    <option value="balde_20l">Balde Plástico 20 Litros</option>
                    <option value="lata_10l">Balde / Lata 10 Litros</option>
                    <option value="lata_4l">Lata Litografiada 4 Litros</option>
                    <option value="lata_1l">Lata Litografiada 1 Litro</option>
                    <option value="tambor_200l">Tambor Industrial 200 Litros</option>
                  </select>
                  <span className="text-[11px] text-[#d31627] font-bold mt-0.5 block">
                    Se producirán <strong>{calculatedPackageCount} unidades</strong>.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Número de Lote (Batch)
                  </label>
                  <input
                    type="text"
                    value={orderForm.batchNumber}
                    onChange={e => setOrderForm({ ...orderForm, batchNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jefe / Operador de Planta
                  </label>
                  <input
                    type="text"
                    value={orderForm.operatorName}
                    onChange={e => setOrderForm({ ...orderForm, operatorName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Theoretical Raw Material Requirements Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 flex items-center justify-between">
                  <span>Insumos Necesarios para {orderForm.targetKg} kg:</span>
                  <span className="text-emerald-700 font-mono">
                    Costo Estimado: $ {calculatedTheoreticalCost.toLocaleString('es-AR')}
                  </span>
                </h4>
                <div className="space-y-1 text-xs max-h-36 overflow-y-auto">
                  {selectedFormula?.items.map((item, idx) => {
                    const requiredKg = (item.percentageOrKg / 100) * orderForm.targetKg;
                    const mat = rawMaterials.find(m => m.id === item.rawMaterialId);
                    const isEnough = mat ? mat.currentStock >= requiredKg : false;

                    return (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                        <span className="text-slate-700 truncate pr-2">
                          {item.rawMaterialName}
                        </span>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <strong className="text-slate-900">{requiredKg.toFixed(1)} kg</strong>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isEnough ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {isEnough ? 'Stock OK' : 'Stock Insuficiente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas / Parámetros de Control (Viscosidad, Brillo, Molienda)
                </label>
                <textarea
                  rows={2}
                  value={orderForm.notes}
                  onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                  placeholder="Ej: Control de viscosidad Krebs entre 98 y 104 KU, Hegman mínimo 6..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  <Factory className="w-4 h-4" /> Lanzar Orden a Fabricación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT RAW MATERIAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Cargar / Editar Materia Prima
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código</label>
                  <input
                    type="text"
                    value={materialForm.code || ''}
                    onChange={e => setMaterialForm({ ...materialForm, code: e.target.value })}
                    placeholder="MP-RES-03"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                  <select
                    value={materialForm.category}
                    onChange={e => setMaterialForm({ ...materialForm, category: e.target.value as RawMaterialCategory })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 capitalize"
                  >
                    <option value="resina">Resina</option>
                    <option value="pigmento">Pigmento</option>
                    <option value="carga">Carga / Mineral</option>
                    <option value="aditivo">Aditivo</option>
                    <option value="solvente">Solvente</option>
                    <option value="envase">Envase</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  value={materialForm.name || ''}
                  onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="Resina Alquídica Larga en Aceite..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unidad</label>
                  <select
                    value={materialForm.unit}
                    onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value as UnitType })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  >
                    <option value="kg">kg</option>
                    <option value="litro">litro</option>
                    <option value="unidad">unidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={materialForm.currentStock ?? 0}
                    onChange={e => setMaterialForm({ ...materialForm, currentStock: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={materialForm.minStock ?? 0}
                    onChange={e => setMaterialForm({ ...materialForm, minStock: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialForm.unitCost ?? 0}
                    onChange={e => setMaterialForm({ ...materialForm, unitCost: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proveedor Habitual</label>
                  <input
                    type="text"
                    value={materialForm.supplierName || ''}
                    onChange={e => setMaterialForm({ ...materialForm, supplierName: e.target.value })}
                    placeholder="Química del Plata..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Guardar Materia Prima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FORMULA X 100 */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-emerald-600" /> Cargar Nueva Fórmula (Base 100 kg)
                </h3>
                <p className="text-xs text-slate-500">
                  Define la receta estándar por cada 100 kg. El costo teórico se calcula automáticamente.
                </p>
              </div>
              <button onClick={() => setShowFormulaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormula} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código</label>
                  <input
                    type="text"
                    value={formulaForm.code}
                    onChange={e => setFormulaForm({ ...formulaForm, code: e.target.value })}
                    placeholder="FOR-LAT-03"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Pintura</label>
                  <input
                    type="text"
                    value={formulaForm.name}
                    onChange={e => setFormulaForm({ ...formulaForm, name: e.target.value })}
                    placeholder="Látex Exterior Frentes Super Blanco..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Pintura</label>
                  <input
                    type="text"
                    value={formulaForm.paintType}
                    onChange={e => setFormulaForm({ ...formulaForm, paintType: e.target.value })}
                    placeholder="Látex Interior / Exterior / Esmalte"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Densidad (kg/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulaForm.density}
                    onChange={e => setFormulaForm({ ...formulaForm, density: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Ingredients list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Composición de Ingredientes (% por cada 100 kg)
                  </label>
                  <button
                    type="button"
                    onClick={addFormulaItem}
                    className="text-xs font-bold text-[#d31627] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Materia Prima
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formulaForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <select
                        value={item.rawMaterialId}
                        onChange={e => updateFormulaItem(idx, e.target.value, item.percentageOrKg)}
                        className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        {rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} (${m.unitCost}/{m.unit})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="100"
                          value={item.percentageOrKg}
                          onChange={e => updateFormulaItem(idx, item.rawMaterialId, Number(e.target.value))}
                          className="w-20 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFormulaItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-slate-100 text-xs font-bold">
                  <span>Suma Total de Porcentajes:</span>
                  <span className={`font-mono ${totalFormulaPercentage === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {totalFormulaPercentage.toFixed(1)} % / 100%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200">
                  <span>Costo Teórico Calculado:</span>
                  <span className="font-mono text-sm">
                    $ {currentFormulaCost.toFixed(2)} por Kilogramo
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instrucciones de Molienda y Dispersión
                </label>
                <textarea
                  rows={2}
                  value={formulaForm.notes}
                  onChange={e => setFormulaForm({ ...formulaForm, notes: e.target.value })}
                  placeholder="Cargar agua y dispersante, incorporar pigmentos a 1.500 RPM durante 25 min..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Guardar Fórmula Maestra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PRINTABLE HOJA DE PRODUCCIÓN */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/assets/aistudio/colorear-500px_0158e3cb.webp" alt="Colorear" className="h-7 w-auto" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    HOJA DE FABRICACIÓN #{viewingOrder.orderNumber}
                  </h3>
                  <span className="text-[11px] text-slate-500">Colorear Pinturas S.R.L. - Planta Pilar</span>
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Producto:</span>
                  <strong className="text-slate-900 text-sm">{viewingOrder.productName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Lote / Batch:</span>
                  <strong className="font-mono text-red-700">{viewingOrder.batchNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Kilogramos Totales:</span>
                  <strong className="font-mono text-slate-900">{viewingOrder.targetKg} kg</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Envasado & Bultos:</span>
                  <strong className="text-slate-900">{getPackagingLabel(viewingOrder.packagingType)} ({viewingOrder.packageCount} un)</strong>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold uppercase text-[11px] text-slate-700 mb-1">
                  Desglose de Dosificación de Materias Primas:
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 text-[10px]">
                      <tr>
                        <th className="p-2">Ingrediente</th>
                        <th className="p-2 text-right">Dosificación</th>
                        <th className="p-2 text-center">Check Operario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formulas.find(f => f.id === viewingOrder.formulaId)?.items.map((it, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{it.rawMaterialName}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {((it.percentageOrKg / 100) * viewingOrder.targetKg).toFixed(1)} kg
                          </td>
                          <td className="p-2 text-center">
                            <span className="w-4 h-4 inline-block border border-slate-300 rounded"></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingOrder.notes && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <strong>Control de Calidad:</strong> {viewingOrder.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500">Operador: {viewingOrder.operatorName}</span>
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Imprimir Hoja de Planta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
