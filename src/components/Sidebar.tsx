import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Factory, 
  ShoppingCart, 
  Tag, 
  Users, 
  Truck, 
  PackageSearch, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  CreditCard,
  Wallet,
  Calculator,
  TrendingUp,
  Receipt,
  Scale,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Layers
} from 'lucide-react';
import { ModuleKey } from '../types';

interface SidebarProps {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
  productionActiveCount: number;
  pendingDispatchCount: number;
  pendingPaymentCount: number;
  urgentChecksCount?: number;
}

interface MenuItem {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
  badge?: string | null;
  badgeColor?: string;
  desc: string;
}

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  accentColor: string;
  badgeCount?: number;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  productionActiveCount,
  pendingDispatchCount,
  pendingPaymentCount,
  urgentChecksCount = 0
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  
  // Requirement: ALL groupings always start collapsed / contracted by default!
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    return {
      general: true,
      factory: true,
      sales_crm: true,
      finances_treasury: true,
      staff_system: true
    };
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Structured Functional Groups
  const groups: MenuGroup[] = useMemo(() => [
    {
      id: 'general',
      title: 'Panel de Control',
      icon: LayoutDashboard,
      accentColor: 'text-sky-400',
      items: [
        {
          key: 'desktop',
          label: 'Escritorio & KPIs',
          icon: LayoutDashboard,
          badge: null,
          desc: 'Accesos rápidos y alertas del día'
        },
        {
          key: 'reports',
          label: 'Dashboard con Barras',
          icon: BarChart3,
          badge: 'Gráficos',
          badgeColor: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50',
          desc: 'Ventas, producción y stock en barra'
        }
      ]
    },
    {
      id: 'factory',
      title: 'Planta & Producción',
      icon: Factory,
      accentColor: 'text-amber-400',
      badgeCount: productionActiveCount,
      items: [
        {
          key: 'production',
          label: 'Producción & Fórmulas',
          icon: Factory,
          badge: productionActiveCount > 0 ? `${productionActiveCount}` : null,
          badgeColor: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
          desc: 'Lotes de pintura y materias primas'
        },
        {
          key: 'purchases',
          label: 'Compras & Proveedores',
          icon: PackageSearch,
          badge: null,
          desc: 'Insumos químicos, resinas y envases'
        },
        {
          key: 'prices',
          label: 'Lista de Precios & SKUs',
          icon: Tag,
          badge: 'Excel/PDF',
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          desc: 'Catálogo de látex y esmaltes 2026'
        }
      ]
    },
    {
      id: 'sales_crm',
      title: 'Ventas & Clientes',
      icon: ShoppingCart,
      accentColor: 'text-blue-400',
      badgeCount: pendingDispatchCount + (pendingPaymentCount > 0 ? pendingPaymentCount : 0),
      items: [
        {
          key: 'sales',
          label: 'Ventas & Despachos',
          icon: ShoppingCart,
          badge: pendingDispatchCount > 0 ? `${pendingDispatchCount}` : null,
          badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          desc: 'Pedidos, remitos y facturación'
        },
        {
          key: 'customers',
          label: 'Cuentas Corrientes',
          icon: Users,
          badge: pendingPaymentCount > 0 ? `${pendingPaymentCount} alertas` : null,
          badgeColor: 'bg-rose-900/60 text-rose-300 border border-rose-700/50',
          desc: 'Fichas, deuda y recibos de pago'
        },
        {
          key: 'logistics',
          label: 'Transportes & Logística',
          icon: Truck,
          badge: null,
          desc: 'Expresos y camiones de fábrica'
        },
        {
          key: 'customer_portal',
          label: 'Portal de Clientes',
          icon: ShieldCheck,
          badge: 'DNI/CUIT',
          badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
          desc: 'Autogestión externa de comprobantes'
        }
      ]
    },
    {
      id: 'finances_treasury',
      title: 'Tesorería & Finanzas',
      icon: Wallet,
      accentColor: 'text-teal-400',
      badgeCount: urgentChecksCount,
      items: [
        {
          key: 'finances',
          label: 'Saldos Cobrar vs Pagar',
          icon: Scale,
          badge: 'WhatsApp/Email',
          badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
          desc: 'Recordatorios a clientes y deuda'
        },
        {
          key: 'checks',
          label: 'Cartelera Cheques & E-Cheqs',
          icon: CreditCard,
          badge: urgentChecksCount > 0 ? `${urgentChecksCount} por vencer` : 'Vencimientos',
          badgeColor: urgentChecksCount > 0 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse font-bold' 
            : 'bg-amber-900/50 text-amber-300 border border-amber-700/40',
          desc: 'Cartera, alertas y endosos'
        },
        {
          key: 'cashboxes',
          label: 'Cajas de Dinero & Cuentas',
          icon: Wallet,
          badge: 'Tesorería',
          badgeColor: 'bg-teal-900/60 text-teal-300 border border-teal-700/50',
          desc: 'Efectivo, bancos y transferencias'
        },
        {
          key: 'accounting',
          label: 'Contabilidad & Libro IVA',
          icon: Calculator,
          badge: 'ARCA',
          badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          desc: 'IVA Ventas, Compras y F.2002'
        },
        {
          key: 'profitability',
          label: 'Estado de Resultados',
          icon: TrendingUp,
          badge: 'Rentabilidad',
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          desc: 'CMV, EBITDA y margen por línea'
        }
      ]
    },
    {
      id: 'staff_system',
      title: 'Personal & Sistema',
      icon: Settings,
      accentColor: 'text-violet-400',
      items: [
        {
          key: 'employees',
          label: 'Personal, Sueldos & Recibos',
          icon: Receipt,
          badge: 'Duplicado',
          badgeColor: 'bg-rose-900/60 text-rose-300 border border-rose-700/50',
          desc: 'Legajos, adelantos y haberes'
        },
        {
          key: 'users',
          label: 'Usuarios & Permisos',
          icon: UserCheck,
          badge: 'Personal',
          badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          desc: 'Operarios, choferes y admin'
        },
        {
          key: 'settings',
          label: 'Configuración & Backup',
          icon: Settings,
          badge: 'Fábrica',
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
          desc: 'Copias automáticas y reset a cero'
        }
      ]
    }
  ], [productionActiveCount, pendingDispatchCount, pendingPaymentCount, urgentChecksCount]);

  // Filter items if user types in search
  const filteredGroups = useMemo(() => {
    if (!searchFilter.trim()) return groups;
    const query = searchFilter.toLowerCase();
    return groups
      .map(group => {
        const matchingItems = group.items.filter(item => 
          item.label.toLowerCase().includes(query) ||
          item.desc.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query)
        );
        return {
          ...group,
          items: matchingItems
        };
      })
      .filter(group => group.items.length > 0);
  }, [groups, searchFilter]);

  const expandAll = () => {
    setCollapsedGroups({
      general: false,
      factory: false,
      sales_crm: false,
      finances_treasury: false,
      staff_system: false
    });
  };

  const collapseAll = () => {
    setCollapsedGroups({
      general: true,
      factory: true,
      sales_crm: true,
      finances_treasury: true,
      staff_system: true
    });
  };

  return (
    <aside 
      className="w-72 shrink-0 h-full bg-[#0a0f1d] text-slate-300 flex flex-col justify-between hidden md:flex border-r-2 border-slate-700/90 shadow-[6px_0_30px_rgba(0,0,0,0.35)] select-none z-20 relative"
      aria-label="Barra de Navegación de Módulos"
    >
      {/* Right separation groove with subtle brand accent border */}
      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#d31627] via-slate-600/50 to-slate-700 pointer-events-none"></div>

      {/* Top Filter and Actions */}
      <div className="p-3 border-b border-slate-800 bg-[#080d1a] shrink-0">
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar módulo..."
            className="w-full bg-slate-900 border border-slate-700/90 rounded-lg pl-8 pr-6 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d31627] shadow-xs shadow-red-500"></span>
            Menú de Módulos
          </span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <button
              onClick={expandAll}
              title="Abrir todas las secciones"
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              Abrir
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={collapseAll}
              title="Contraer todas las secciones"
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors font-medium text-amber-300/80"
            >
              Contraer
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Modules List - Independent scroll container */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2.5 custom-scrollbar">
        {filteredGroups.map(group => {
          // If searching, keep groups open. Otherwise, respect user contracted state.
          const isCollapsed = !searchFilter && Boolean(collapsedGroups[group.id]);
          const GroupIcon = group.icon;
          
          // Check if the currently active module is inside this group
          const activeItemInGroup = group.items.find(it => it.key === activeModule);

          return (
            <div 
              key={group.id} 
              className={`rounded-xl transition-all duration-200 border ${
                activeItemInGroup 
                  ? 'border-red-500/40 bg-slate-900/90 shadow-md shadow-black/20' 
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              {/* Group Header Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full px-2.5 py-2.5 flex items-center justify-between text-left group rounded-xl transition-colors cursor-pointer ${
                  activeItemInGroup && isCollapsed ? 'bg-red-950/20' : 'hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 shrink-0 ${group.accentColor}`}>
                    <GroupIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 truncate block">
                      {group.title}
                    </span>
                    {/* When collapsed and contains active module, inform the user */}
                    {isCollapsed && activeItemInGroup && (
                      <span className="text-[10px] text-red-400 font-bold truncate block">
                        • {activeItemInGroup.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {/* Badge count if any inside this group */}
                  {group.badgeCount !== undefined && group.badgeCount > 0 && isCollapsed && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/25 text-red-400 border border-red-500/40 animate-pulse">
                      {group.badgeCount}
                    </span>
                  )}
                  <div className="p-0.5 rounded text-slate-400 group-hover:text-white transition-colors">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-200" />
                    )}
                  </div>
                </div>
              </button>

              {/* Group Items (Revealed upon clicking) */}
              {!isCollapsed && (
                <div className="p-1.5 pt-0.5 space-y-1 border-t border-slate-800/60 mt-0.5">
                  {group.items.map(item => {
                    const ItemIcon = item.icon;
                    const isActive = activeModule === item.key;

                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveModule(item.key)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all group ${
                          isActive
                            ? 'bg-[#d31627] text-white shadow-md font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ItemIcon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs truncate block font-bold leading-tight">
                              {item.label}
                            </span>
                            <span className={`text-[10px] truncate block leading-tight mt-0.5 ${
                              isActive ? 'text-red-100' : 'text-slate-400 group-hover:text-slate-300'
                            }`}>
                              {item.desc}
                            </span>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ml-1.5 ${
                            isActive 
                              ? 'bg-white/20 text-white border border-white/30' 
                              : item.badgeColor || 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400">
            No se encontraron módulos con "{searchFilter}"
          </div>
        )}
      </div>

      {/* Bottom Factory Info Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070b16] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Planta Pilar Conectada</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono border border-slate-700/60">
            Agosto 2026
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Colorear Pinturas S.R.L.</span>
          <span className="text-[9px] text-slate-400">17 Módulos</span>
        </div>
      </div>
    </aside>
  );
};
