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
  Move,
  Database,
  Receipt,
  Compass,
  MapPin
} from 'lucide-react';
import { ModuleKey, ProductionOrder, SalesOrder, Customer, RawMaterial, Product } from '../types';
import { DataDashboardWithBars } from './DataDashboardWithBars';

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
  onNavigateToCustomer?: (customer: Customer) => void;
  onOpenMobileSellerApp?: () => void;
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
  onExportPriceListExcel,
  onNavigateToCustomer,
  onOpenMobileSellerApp
}) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'bars_dashboard'>('shortcuts');

  const defaultShortcuts: DesktopShortcut[] = [
    { id: 'production', name: 'Producción & Fórmulas', category: 'Fábrica', iconName: 'Factory', color: 'bg-red-600 text-white', pinned: true, order: 1, description: 'Lotes de pintura, materias primas y recetas' },
    { id: 'sales', name: 'Ventas, Remitos & Despacho', category: 'Comercial', iconName: 'ShoppingCart', color: 'bg-blue-600 text-white', pinned: true, order: 2, description: 'Pedidos, ARCA / no-ARCA y entrega' },
    { id: 'sellers', name: 'Vendedores & Hoja de Ruta', category: 'Comercial', iconName: 'Compass', color: 'bg-emerald-600 text-white', pinned: true, order: 3, description: 'Rutas de calle, visitas y comisiones' },
    { id: 'prices', name: 'Lista de Precios (PDF/Excel)', category: 'Comercial', iconName: 'Tag', color: 'bg-emerald-600 text-white', pinned: true, order: 4, description: 'Mayorista, minorista y distribuidores' },
    { id: 'customers', name: 'Cuentas Corrientes', category: 'Clientes', iconName: 'Users', color: 'bg-purple-600 text-white', pinned: true, order: 5, description: 'Saldos, cobranzas y recordatorios WhatsApp' },
    { id: 'finances', name: 'Saldos A Cobrar vs A Pagar', category: 'Cobranzas', iconName: 'Scale', color: 'bg-purple-700 text-white', pinned: true, order: 5, description: 'Avisos WhatsApp/Email a clientes y pagos' },
    { id: 'checks', name: 'Cartelera Cheques & E-Cheqs', category: 'Tesorería', iconName: 'CreditCard', color: 'bg-indigo-600 text-white', pinned: true, order: 6, description: 'Cartera, vencimientos y endosos' },
    { id: 'cashboxes', name: 'Cajas de Dinero & Cuentas', category: 'Tesorería', iconName: 'Wallet', color: 'bg-teal-600 text-white', pinned: true, order: 7, description: 'Gastos por categoría y transferencias' },
    { id: 'accounting', name: 'Contabilidad & Libro IVA', category: 'Administración', iconName: 'Calculator', color: 'bg-blue-700 text-white', pinned: true, order: 8, description: 'IVA Ventas, Compras y F.2002 ARCA' },
    { id: 'profitability', name: 'Estado de Resultados', category: 'Gerencia', iconName: 'TrendingUp', color: 'bg-emerald-700 text-white', pinned: true, order: 9, description: 'CMV, EBITDA y rentabilidad por línea' },
    { id: 'employees', name: 'Personal, Sueldos & Recibos', category: 'RRHH', iconName: 'Receipt', color: 'bg-rose-600 text-white', pinned: true, order: 10, description: 'Sueldos acordados, adelantos y duplicados' },
    { id: 'reports', name: 'Dashboard de Datos con Barras', category: 'Gerencia', iconName: 'BarChart3', color: 'bg-cyan-700 text-white', pinned: true, order: 11, description: 'Ventas mensuales, top productos y producción' },
    { id: 'logistics', name: 'Transportes & Logística', category: 'Despacho', iconName: 'Truck', color: 'bg-amber-600 text-white', pinned: false, order: 12, description: 'Flota de fábrica y expresos tercerizados' },
    { id: 'purchases', name: 'Compras & Proveedores', category: 'Insumos', iconName: 'PackageSearch', color: 'bg-slate-700 text-white', pinned: false, order: 13, description: 'Resinas, pigmentos, baldes y latas' },
    { id: 'customer_portal', name: 'Portal de Clientes (DNI/CUIT)', category: 'Clientes', iconName: 'ShieldCheck', color: 'bg-indigo-600 text-white', pinned: true, order: 14, description: 'Autogestión de facturas y envíos' },
    { id: 'settings', name: 'Configuración, Backup & Fábrica', category: 'Sistema', iconName: 'Settings', color: 'bg-zinc-700 text-white', pinned: false, order: 15, description: 'ARCA, copias de seguridad y reset a fábrica' },
    { id: 'users', name: 'Usuarios & Personal', category: 'Sistema', iconName: 'Users', color: 'bg-rose-700 text-white', pinned: false, order: 16, description: 'Listado de personal, roles y contraseñas' },
  ];

  const [shortcuts, setShortcuts] = useState<DesktopShortcut[]>(() => {
    const saved = localStorage.getItem('colorear_desktop_shortcuts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.some((s: DesktopShortcut) => s.id === 'sellers')) {
          const sellerShortcut: DesktopShortcut = { 
            id: 'sellers', 
            name: 'Vendedores & Hoja de Ruta', 
            category: 'Comercial', 
            iconName: 'Compass', 
            color: 'bg-emerald-600 text-white', 
            pinned: true, 
            order: 3, 
            description: 'Rutas de calle, visitas y comisiones' 
          };
          return [...parsed, sellerShortcut];
        }
        return parsed;
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
      case 'PackageSearch': return <PackageSearch className="w-6 h-6" />;
      case 'CircleDollarSign': return <CircleDollarSign className="w-6 h-6" />;
      case 'BarChart3': return <BarChart3 className="w-6 h-6" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6" />;
      case 'Settings': return <Settings className="w-6 h-6" />;
      case 'Compass': return <Compass className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const displayedShortcuts = isCustomizing 
    ? shortcuts 
    : shortcuts.filter(s => s.pinned);

  return (
    <div className="space-y-6">
      {/* Top Banner with Colorear Factory Brand & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Factory className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#d31627] text-white">
                Colorear PINTURAS
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Planta Industrial Pilar • Vigencia Agosto 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Centro de Control & Gestión Fabril
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Monitoreo en tiempo real de lotes en formulación, pedidos por despachar, facturación oficial ARCA y saldos de cuentas corrientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab(activeTab === 'shortcuts' ? 'bars_dashboard' : 'shortcuts')}
              className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 ${
                activeTab === 'bars_dashboard' 
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black'
                  : 'bg-cyan-700 hover:bg-cyan-800 text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> 
              {activeTab === 'bars_dashboard' ? 'Ver Accesos de Escritorio' : 'Ver Dashboard con Barras'}
            </button>
            <button
              onClick={() => setActiveModule('sellers')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Compass className="w-4 h-4" /> Hoja de Ruta & Vendedores
            </button>
            {onOpenMobileSellerApp && (
              <button
                onClick={onOpenMobileSellerApp}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 border border-emerald-400/40"
                title="Abrir vista simplificada para teléfono celular de preventistas"
              >
                <Compass className="w-4 h-4 text-emerald-200" />
                <span>📱 App Móvil Celular</span>
              </button>
            )}
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

      {/* IF USER SELECTED BARS DASHBOARD TAB, RENDER IT HERE */}
      {activeTab === 'bars_dashboard' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-700" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Dashboard de Datos & Gráficos con Barras en Vivo
              </span>
            </div>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              ← Volver a Vista de Escritorio
            </button>
          </div>

          <DataDashboardWithBars
            productionOrders={productionOrders}
            salesOrders={salesOrders}
            customers={customers}
            products={products}
            rawMaterials={rawMaterials}
            onNavigateToCustomer={onNavigateToCustomer}
            onNavigateModule={setActiveModule}
          />
        </div>
      ) : (
        <>
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
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Materias Primas Críticas
                </span>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                  <PackageSearch className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {criticalRawMaterials.length}
                </span>
                <span className="text-xs font-bold text-slate-500">bajo punto pedido</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                <span>Resinas y aditivos</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Customizable Desktop Modules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Escritorio Personalizable de Planta
                  </h2>
                  <p className="text-xs text-slate-500">
                    Accesos directos a los módulos operativos de la fábrica. Puedes anclar o reorganizar según tu puesto.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    isCustomizing 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isCustomizing ? 'Listo (Guardar)' : 'Personalizar Escritorio'}
                </button>
                {isCustomizing && (
                  <button
                    onClick={resetToDefault}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold px-2"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>

            {/* Customization active banner */}
            {isCustomizing && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-amber-600" />
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

          {/* Quick Comparison Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <span className="text-2xl font-black text-slate-900 font-mono">
                  $ {arcaSalesTotal.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-500">acumulado en ventas</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Comprobantes con Código de Autorización Electrónico (CAE), Facturas A y B con IVA discriminado.
              </p>
            </div>

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
                <span className="text-2xl font-black text-slate-900 font-mono">
                  $ {noArcaSalesTotal.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-500">acumulado en ventas</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Comprobantes y remitos de control interno para operaciones directas de planta y mostrador sin impacto en web service fiscal.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
