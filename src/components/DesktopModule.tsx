import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  ShoppingCart, 
  Tag, 
  Users, 
  Truck, 
  PackageSearch, 
  CircleDollarSign, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  Pin,
  Move
} from 'lucide-react';
import { ModuleKey, ProductionOrder, SalesOrder, Customer, RawMaterial, Product } from '../types';

interface DesktopModuleProps {
  setActiveModule: (module: ModuleKey) => void;
  productionOrders: ProductionOrder[];
  salesOrders: SalesOrder[];
  customers: Customer[];
  rawMaterials: RawMaterial[];
  products: Product[];
  onOpenNewProductionModal: () => void;
  onOpenNewSalesModal: () => void;
  onExportPriceListExcel: () => void;
}

interface DesktopShortcut {
  id: ModuleKey;
  name: string;
  category: string;
  iconName: string;
  color: string;
  pinned: boolean;
  order: number;
  description: string;
}

export const DesktopModule: React.FC<DesktopModuleProps> = ({
  setActiveModule,
  productionOrders,
  salesOrders,
  customers,
  rawMaterials,
  products,
  onOpenNewProductionModal,
  onOpenNewSalesModal,
  onExportPriceListExcel
}) => {
  const defaultShortcuts: DesktopShortcut[] = [
    { id: 'production', name: 'Producción & Fórmulas', category: 'Fábrica', iconName: 'Factory', color: 'bg-red-600 text-white', pinned: true, order: 1, description: 'Lotes de pintura, materias primas y recetas' },
    { id: 'sales', name: 'Ventas, Remitos & Despacho', category: 'Comercial', iconName: 'ShoppingCart', color: 'bg-blue-600 text-white', pinned: true, order: 2, description: 'Pedidos, ARCA / no-ARCA y entrega' },
    { id: 'prices', name: 'Lista de Precios (PDF/Excel)', category: 'Comercial', iconName: 'Tag', color: 'bg-emerald-600 text-white', pinned: true, order: 3, description: 'Mayorista, minorista y distribuidores' },
    { id: 'customers', name: 'Cuentas Corrientes', category: 'Clientes', iconName: 'Users', color: 'bg-purple-600 text-white', pinned: true, order: 4, description: 'Saldos, cobranzas y recordatorios WhatsApp' },
    { id: 'logistics', name: 'Transportes & Logística', category: 'Despacho', iconName: 'Truck', color: 'bg-amber-600 text-white', pinned: true, order: 5, description: 'Flota de fábrica y expresos tercerizados' },
    { id: 'finances', name: 'Finanzas & Flujo Diario', category: 'Administración', iconName: 'CircleDollarSign', color: 'bg-teal-600 text-white', pinned: true, order: 6, description: 'Cobranzas, pagos a proveedores y caja' },
    { id: 'purchases', name: 'Compras & Proveedores', category: 'Insumos', iconName: 'PackageSearch', color: 'bg-slate-700 text-white', pinned: false, order: 7, description: 'Resinas, pigmentos, baldes y latas' },
    { id: 'customer_portal', name: 'Portal de Clientes (DNI/CUIT)', category: 'Clientes', iconName: 'ShieldCheck', color: 'bg-indigo-600 text-white', pinned: true, order: 8, description: 'Autogestión de facturas y envíos' },
    { id: 'reports', name: 'Reportes Gerenciales', category: 'Gerencia', iconName: 'BarChart3', color: 'bg-cyan-700 text-white', pinned: false, order: 9, description: 'Producción vs ventas y rentabilidad' },
    { id: 'settings', name: 'Configuración & ARCA', category: 'Sistema', iconName: 'Settings', color: 'bg-zinc-700 text-white', pinned: false, order: 10, description: 'Punto de venta, CUIT y datos de planta' },
    { id: 'users', name: 'Usuarios & Personal', category: 'Sistema', iconName: 'Users', color: 'bg-rose-700 text-white', pinned: false, order: 11, description: 'Listado de personal, roles y contraseñas' },
  ];

  const [shortcuts, setShortcuts] = useState<DesktopShortcut[]>(() => {
    const saved = localStorage.getItem('colorear_desktop_shortcuts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultShortcuts;
      }
    }
    return defaultShortcuts;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem('colorear_desktop_shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const togglePin = (id: ModuleKey) => {
    setShortcuts(prev =>
      prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s)
    );
  };

  const moveShortcut = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shortcuts.length) return;
    const newItems = [...shortcuts];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setShortcuts(newItems);
  };

  const resetToDefault = () => {
    setShortcuts(defaultShortcuts);
    setIsCustomizing(false);
  };

  // KPIs
  const activeProduction = productionOrders.filter(o => o.status === 'en_proceso' || o.status === 'planificada');
  const totalProductionKg = activeProduction.reduce((acc, o) => acc + o.targetKg, 0);

  const pendingDispatchOrders = salesOrders.filter(o => o.status === 'preparando_remito' || o.status === 'facturado');
  
  const totalReceivables = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  const criticalRawMaterials = rawMaterials.filter(rm => rm.currentStock <= rm.minStock);

  // ARCA vs No-ARCA sales comparison
  const arcaSalesTotal = salesOrders
    .filter(o => o.billingType === 'arca' && o.status !== 'cancelado')
    .reduce((acc, o) => acc + o.total, 0);

  const noArcaSalesTotal = salesOrders
    .filter(o => o.billingType === 'no_arca' && o.status !== 'cancelado')
    .reduce((acc, o) => acc + o.total, 0);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Factory': return <Factory className="w-6 h-6" />;
      case 'ShoppingCart': return <ShoppingCart className="w-6 h-6" />;
      case 'Tag': return <Tag className="w-6 h-6" />;
      case 'Users': return <Users className="w-6 h-6" />;
      case 'Truck': return <Truck className="w-6 h-6" />;
      case 'CircleDollarSign': return <CircleDollarSign className="w-6 h-6" />;
      case 'PackageSearch': return <PackageSearch className="w-6 h-6" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6" />;
      case 'BarChart3': return <BarChart3 className="w-6 h-6" />;
      case 'Settings': return <Settings className="w-6 h-6" />;
      default: return <Factory className="w-6 h-6" />;
    }
  };

  const displayedShortcuts = isCustomizing 
    ? shortcuts 
    : shortcuts.filter(s => s.pinned);

  return (
    <div className="space-y-6">
      {/* Top Banner with Brand Identity and Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white">
                Fábrica de Pinturas Colorear
              </span>
              <span className="text-xs text-slate-300">
                Escritorio Operativo Personalizado
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Centro de Control & Gestión Fabril
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Monitoreo en tiempo real de lotes en formulación, pedidos por despachar, facturación oficial ARCA y saldos de cuentas corrientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewProductionModal}
              className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nueva Orden Producción
            </button>
            <button
              onClick={onOpenNewSalesModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" /> Nuevo Pedido
            </button>
            <button
              onClick={onExportPriceListExcel}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs px-3 py-2.5 rounded-xl transition-colors"
              title="Descargar lista de precios vigente en formato Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel Precios
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Production Active */}
        <div 
          onClick={() => setActiveModule('production')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Producción en Planta
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {totalProductionKg.toLocaleString('es-AR')}
            </span>
            <span className="text-xs font-bold text-slate-500">kg activos</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>{activeProduction.length} órdenes en proceso</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Pending Dispatches */}
        <div 
          onClick={() => setActiveModule('sales')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Envíos por Despachar
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {pendingDispatchOrders.length}
            </span>
            <span className="text-xs font-bold text-slate-500">pedidos listos</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>Remitos preparados</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Accounts Receivable */}
        <div 
          onClick={() => setActiveModule('customers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Cuentas por Cobrar
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-slate-400 font-bold">$</span>
            <span className="text-2xl font-black text-slate-900">
              {totalReceivables.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>En cuentas corrientes</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Critical Raw Materials */}
        <div 
          onClick={() => setActiveModule('production')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Stock Insumos Críticos
            </span>
            <div className={`p-2 rounded-lg ${criticalRawMaterials.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} group-hover:scale-110 transition-transform`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${criticalRawMaterials.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {criticalRawMaterials.length}
            </span>
            <span className="text-xs font-bold text-slate-500">bajo stock mínimo</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>{criticalRawMaterials.length > 0 ? 'Requiere reabastecimiento' : 'Niveles óptimos'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Customizable Desktop Modules Grid Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Escritorio Operativo
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {displayedShortcuts.length} Módulos {isCustomizing ? 'Totales' : 'Favoritos Anclados'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier módulo para acceder de inmediato. Configura tus favoritos para trabajar más rápido.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                isCustomizing 
                  ? 'bg-[#d31627] text-white shadow-md' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {isCustomizing ? 'Guardar Escritorio' : 'Personalizar Módulos'}
            </button>
            {isCustomizing && (
              <button
                onClick={resetToDefault}
                className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1 font-semibold"
              >
                Restablecer
              </button>
            )}
          </div>
        </div>

        {/* Customization Helper Bar */}
        {isCustomizing && (
          <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Edición Activado:</strong> Marca el icono de la chincheta (pin) para mostrar u ocultar módulos en tu escritorio diario, o reordénalos con las flechas.
              </span>
            </div>
          </div>
        )}

        {/* Icons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {displayedShortcuts.map((shortcut, index) => {
            return (
              <div
                key={shortcut.id}
                className={`relative group rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  shortcut.pinned 
                    ? 'bg-slate-50/70 border-slate-200 hover:border-red-400 hover:shadow-md hover:bg-white' 
                    : 'bg-slate-100/50 border-dashed border-slate-300 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Customization controls on top */}
                {isCustomizing && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveShortcut(index, 'up');
                      }}
                      disabled={index === 0}
                      className="p-1 rounded-md bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      title="Mover antes"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveShortcut(index, 'down');
                      }}
                      disabled={index === shortcuts.length - 1}
                      className="p-1 rounded-md bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      title="Mover después"
                    >
                      ▼
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(shortcut.id);
                      }}
                      className={`p-1 rounded-md border ${shortcut.pinned ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-400 border-slate-300 hover:text-slate-700'}`}
                      title={shortcut.pinned ? 'Quitar del escritorio' : 'Anclar al escritorio'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div 
                  onClick={() => !isCustomizing && setActiveModule(shortcut.id)}
                  className={`cursor-pointer ${isCustomizing ? 'pointer-events-none' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${shortcut.color}`}>
                      {getIcon(shortcut.iconName)}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600">
                      {shortcut.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#d31627] transition-colors leading-tight">
                    {shortcut.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                    {shortcut.description}
                  </p>
                </div>

                <div 
                  onClick={() => !isCustomizing && setActiveModule(shortcut.id)}
                  className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-[#d31627] cursor-pointer"
                >
                  <span>Abrir módulo</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ARCA vs No-ARCA Quick Comparison Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ARCA Official Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Ventas Fiscales ARCA
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                Facturación Electrónica Oficial
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
              P.V. 0004
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              $ {arcaSalesTotal.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-slate-500">acumulado en ventas</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprobantes con Código de Autorización Electrónico (CAE), Facturas A y B con IVA discriminado.
          </p>
        </div>

        {/* Non-ARCA Internal Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Ingresos de Venta No-ARCA
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                Gestión Interna de Ventas
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
              Recibo X / Interno
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              $ {noArcaSalesTotal.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-slate-500">acumulado en ventas</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprobantes y remitos de control interno para operaciones directas de planta y mostrador sin impacto en web service fiscal.
          </p>
        </div>
      </div>
    </div>
  );
};
