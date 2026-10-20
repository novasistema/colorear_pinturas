import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Menu,
  ExternalLink,
  X,
  LogOut,
  Users
} from 'lucide-react';
import { NotificationItem, ModuleKey, CompanyConfig, AppUser } from '../types';

interface HeaderProps {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  config: CompanyConfig | null;
  portalClientTaxId: string | null;
  currentUser: AppUser | null;
  onLogout: () => void;
  onExitPortal: () => void;
  onOpenCustomerPortalModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  setActiveModule,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  config,
  portalClientTaxId,
  currentUser,
  onLogout,
  onExitPortal,
  onOpenCustomerPortalModal
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Colorear Spectrum Top Strip matching brand logo */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#4b0082]"></div>
        <div className="flex-1 bg-[#003399]"></div>
        <div className="flex-1 bg-[#0099cc]"></div>
        <div className="flex-1 bg-[#33cc33]"></div>
        <div className="flex-1 bg-[#f5c800]"></div>
        <div className="flex-1 bg-[#ff7800]"></div>
        <div className="flex-1 bg-[#d31627]"></div>
      </div>

      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Factory title */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveModule('desktop')}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <img 
              src="/assets/aistudio/colorear-500px_0158e3cb.webp" 
              alt="Colorear Pinturas" 
              className="h-9 w-auto object-contain transition-transform group-hover:scale-102"
            />
            <div className="hidden md:block pl-2 border-l border-slate-200">
              <span className="text-xs font-bold tracking-wider text-slate-800 uppercase block">
                Planta Industrial & CRM
              </span>
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Firestore Sincronizado en Vivo
              </span>
            </div>
          </div>
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-3">
          {portalClientTaxId ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-800">Sesión Cliente: </span>
                <span className="font-mono text-emerald-900 font-bold">{portalClientTaxId}</span>
              </div>
              <button 
                onClick={onExitPortal}
                className="ml-2 text-xs text-red-600 hover:text-red-800 font-bold px-2 py-0.5 rounded-md hover:bg-red-50 border border-red-200"
              >
                Cerrar Portal
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCustomerPortalModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-700 hover:text-[#d31627] hover:bg-red-50/70 border border-slate-200 hover:border-red-200 transition-colors"
              title="Acceder como cliente con DNI o CUIT"
            >
              <UserCheck className="w-4 h-4 text-[#d31627]" />
              <span className="hidden sm:inline">Portal Clientes</span>
              <span className="text-[10px] text-slate-500">(DNI/CUIT)</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notificaciones automáticas"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d31627] text-[10px] font-bold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#d31627]" /> Notificaciones Automáticas
                    </h3>
                    <p className="text-[11px] text-slate-500">Cobranzas, producción, pedidos y despachos</p>
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={onClearAllNotifications}
                      className="text-[11px] text-slate-400 hover:text-slate-700 font-medium"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No hay notificaciones pendientes.
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const getIcon = () => {
                        switch (notif.type) {
                          case 'pago_pendiente':
                            return <DollarSign className="w-4 h-4 text-amber-500" />;
                          case 'pedido_listo':
                            return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                          case 'produccion_progreso':
                            return <Boxes className="w-4 h-4 text-blue-500" />;
                          case 'despacho_en_camino':
                            return <Truck className="w-4 h-4 text-indigo-500" />;
                          default:
                            return <AlertTriangle className="w-4 h-4 text-red-500" />;
                        }
                      };

                      return (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            onMarkNotificationRead(notif.id);
                            if (notif.actionUrl) {
                              setActiveModule(notif.actionUrl as ModuleKey);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                            !notif.isRead ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-slate-100 self-start shrink-0">
                            {getIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#d31627] shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick factory info badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Pilar, Bs. As.</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-mono text-slate-500">P.Vta 0004</span>
          </div>

          {/* Current User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                style={{ backgroundColor: currentUser.avatarColor || '#d31627' }}
                title={`${currentUser.name} - ${currentUser.roleLabel}`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold leading-tight">
                  {currentUser.roleLabel}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
