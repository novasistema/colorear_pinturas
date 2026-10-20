import React from 'react';
import { 
  LayoutDashboard, 
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
  ChevronRight
} from 'lucide-react';
import { ModuleKey } from '../types';

interface SidebarProps {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
  productionActiveCount: number;
  pendingDispatchCount: number;
  pendingPaymentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  productionActiveCount,
  pendingDispatchCount,
  pendingPaymentCount
}) => {
  const menuItems = [
    {
      key: 'desktop' as ModuleKey,
      label: 'Escritorio Personalizable',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Accesos rápidos y widgets'
    },
    {
      key: 'production' as ModuleKey,
      label: 'Módulo de Producción',
      icon: Factory,
      badge: productionActiveCount > 0 ? `${productionActiveCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      desc: 'Materias primas, fórmulas y lotes'
    },
    {
      key: 'sales' as ModuleKey,
      label: 'Ventas & Despacho',
      icon: ShoppingCart,
      badge: pendingDispatchCount > 0 ? `${pendingDispatchCount}` : null,
      badgeColor: 'bg-blue-100 text-blue-800',
      desc: 'Remitos, ARCA / no-ARCA y envíos'
    },
    {
      key: 'prices' as ModuleKey,
      label: 'Lista de Precios',
      icon: Tag,
      badge: 'Excel / PDF',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      desc: 'Catálogo de pinturas y exportación'
    },
    {
      key: 'customers' as ModuleKey,
      label: 'Cuentas Corrientes & Clientes',
      icon: Users,
      badge: pendingPaymentCount > 0 ? `${pendingPaymentCount} alertas` : null,
      badgeColor: 'bg-red-100 text-red-800',
      desc: 'Saldos, cobros y WhatsApp'
    },
    {
      key: 'logistics' as ModuleKey,
      label: 'Transportes & Logística',
      icon: Truck,
      badge: null,
      desc: 'Expresos, camiones y seguimiento'
    },
    {
      key: 'purchases' as ModuleKey,
      label: 'Compras & Proveedores',
      icon: PackageSearch,
      badge: null,
      desc: 'Insumos químicos y envases'
    },
    {
      key: 'finances' as ModuleKey,
      label: 'Finanzas & Flujo Diario',
      icon: CircleDollarSign,
      badge: null,
      desc: 'Cuentas por cobrar y pagar'
    },
    {
      key: 'reports' as ModuleKey,
      label: 'Reportes Gerenciales',
      icon: BarChart3,
      badge: null,
      desc: 'Kilos producidos y rentabilidad'
    },
    {
      key: 'customer_portal' as ModuleKey,
      label: 'Portal de Clientes',
      icon: ShieldCheck,
      badge: 'DNI/CUIT',
      badgeColor: 'bg-purple-100 text-purple-800',
      desc: 'Autogestión de comprobantes'
    },
    {
      key: 'settings' as ModuleKey,
      label: 'Configuración & ARCA',
      icon: Settings,
      badge: null,
      desc: 'Datos fiscales y plantillas'
    },
    {
      key: 'users' as ModuleKey,
      label: 'Usuarios & Accesos',
      icon: Users,
      badge: 'Personal',
      badgeColor: 'bg-blue-100 text-blue-800',
      desc: 'Gestión de usuarios y contraseñas'
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col justify-between hidden md:flex border-r border-slate-800">
      <div className="p-3">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Módulos del Sistema
        </div>
        <nav className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveModule(item.key)}
                className={`w-full group text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs font-semibold ${
                  isActive
                    ? 'bg-[#d31627] text-white shadow-md shadow-red-950/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom factory status card */}
      <div className="p-3 m-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between font-bold text-white mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Planta Operativa
          </span>
          <span className="text-[10px] font-mono text-slate-400">v2.6</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Base de datos Firebase Firestore conectada en tiempo real.
        </p>
      </div>
    </aside>
  );
};
