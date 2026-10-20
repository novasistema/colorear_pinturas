import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  MessageSquare, 
  Save, 
  CheckCircle, 
  FileText, 
  Globe, 
  Mail, 
  Phone,
  Server
} from 'lucide-react';
import { CompanyConfig } from '../types';

interface SettingsModuleProps {
  config: CompanyConfig | null;
  onSaveConfig: (config: CompanyConfig) => Promise<void>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  config,
  onSaveConfig
}) => {
  const [formData, setFormData] = useState<CompanyConfig>(() => {
    return config || {
      id: 'main_config',
      companyName: 'Colorear Pinturas S.R.L.',
      tradeName: 'Colorear PINTURAS',
      cuit: '30-71489234-8',
      arcaPointOfSale: 4,
      arcaEnvironment: 'homologacion',
      grossIncomeNumber: '901-294812-3',
      activityStartDate: '01/03/2012',
      fiscalAddress: 'Av. Industria Química 4520, Parque Industrial Pilar, Buenos Aires',
      plantAddress: 'Ruta 8 Km 58, Parque Industrial Pilar, Buenos Aires',
      phone: '+54 11 4890-7000',
      whatsappNumber: '5491148907000',
      email: 'administracion@colorearpinturas.com.ar',
      notificationWhatsappTemplate: 'Hola {cliente}, le informamos desde Colorear Pinturas que su pedido {pedido} se encuentra {estado}. Transporte: {transporte}. Seguimiento: {tracking}. Total: ${total}. Muchas gracias.',
      paymentReminderTemplate: 'Estimado/a {cliente}, le recordamos desde el área de administración de Colorear Pinturas que registra un saldo pendiente de ${monto}. Agradecemos coordinar la cancelación correspondiente. Datos de cuenta CBU: 0720045620000012345678.'
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 rounded-xl bg-zinc-100 text-zinc-700">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                Configuración de Empresa & ARCA
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
                Parámetros Fiscales
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Datos societarios de la fábrica, punto de venta ARCA para facturación electrónica y plantillas de notificación.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Data */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#d31627]" /> Datos Corporativos de la Fábrica
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Comercial / Marca</label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CUIT Empresa</label>
              <input
                type="text"
                value={formData.cuit}
                onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ingresos Brutos (IIBB)</label>
              <input
                type="text"
                value={formData.grossIncomeNumber}
                onChange={e => setFormData({ ...formData, grossIncomeNumber: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inicio de Actividades</label>
              <input
                type="text"
                value={formData.activityStartDate}
                onChange={e => setFormData({ ...formData, activityStartDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Domicilio Fiscal</label>
              <input
                type="text"
                value={formData.fiscalAddress}
                onChange={e => setFormData({ ...formData, fiscalAddress: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección Planta Industrial & Despacho</label>
              <input
                type="text"
                value={formData.plantAddress}
                onChange={e => setFormData({ ...formData, plantAddress: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono Central</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Notificaciones</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* ARCA Parameters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Parámetros para Facturación Electrónica ARCA
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Punto de Venta Habilitado (P.V.)</label>
              <input
                type="number"
                value={formData.arcaPointOfSale}
                onChange={e => setFormData({ ...formData, arcaPointOfSale: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                required
              />
              <span className="text-[10px] text-slate-500">Ejemplo: 0004 para Facturación Web Services</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Entorno de Facturación</label>
              <select
                value={formData.arcaEnvironment}
                onChange={e => setFormData({ ...formData, arcaEnvironment: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="homologacion">Homologación (Entorno de Pruebas / Testing)</option>
                <option value="produccion">Producción (ARCA Oficial en Vivo)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <strong>Certificado Digital Fiscal:</strong> Conectado y validado para emisión de comprobantes A, B y C con CAE automático.
          </div>
        </div>

        {/* WhatsApp & Email Templates */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Plantillas de Mensajes Automáticos (WhatsApp & Email)
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Plantilla: Pedido Listo / Despacho en Viaje
            </label>
            <textarea
              rows={3}
              value={formData.notificationWhatsappTemplate}
              onChange={e => setFormData({ ...formData, notificationWhatsappTemplate: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 font-sans"
            />
            <span className="text-[11px] text-slate-400">
              Variables disponibles: {'{cliente}'}, {'{pedido}'}, {'{estado}'}, {'{transporte}'}, {'{tracking}'}, {'{total}'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Plantilla: Recordatorio Automático de Pago Pendiente
            </label>
            <textarea
              rows={3}
              value={formData.paymentReminderTemplate}
              onChange={e => setFormData({ ...formData, paymentReminderTemplate: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 font-sans"
            />
            <span className="text-[11px] text-slate-400">
              Variables disponibles: {'{cliente}'}, {'{monto}'}
            </span>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle className="w-4 h-4" /> Configuración guardada exitosamente en Firebase.
              </span>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" /> Guardar Parámetros de Fábrica
          </button>
        </div>
      </form>
    </div>
  );
};
