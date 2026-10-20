import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Factory, 
  ShoppingCart, 
  Scale, 
  Layers, 
  FileSpreadsheet, 
  DollarSign,
  PieChart
} from 'lucide-react';
import { ProductionOrder, SalesOrder, Product, RawMaterial } from '../types';

interface ReportsModuleProps {
  productionOrders: ProductionOrder[];
  salesOrders: SalesOrder[];
  products: Product[];
  rawMaterials: RawMaterial[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  productionOrders,
  salesOrders,
  products,
  rawMaterials
}) => {
  // Production stats
  const totalKgProduced = productionOrders
    .filter(o => o.status === 'completada')
    .reduce((acc, o) => acc + o.targetKg, 0);

  const totalKgInProcess = productionOrders
    .filter(o => o.status === 'en_proceso' || o.status === 'planificada')
    .reduce((acc, o) => acc + o.targetKg, 0);

  // Sales stats
  const arcaSales = salesOrders
    .filter(o => o.billingType === 'arca' && o.status !== 'cancelado')
    .reduce((acc, o) => acc + o.total, 0);

  const noArcaSales = salesOrders
    .filter(o => o.billingType === 'no_arca' && o.status !== 'cancelado')
    .reduce((acc, o) => acc + o.total, 0);

  const totalSales = arcaSales + noArcaSales;
  const arcaPercentage = totalSales > 0 ? (arcaSales / totalSales) * 100 : 0;
  const noArcaPercentage = totalSales > 0 ? (noArcaSales / totalSales) * 100 : 0;

  // Best selling products count
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  salesOrders.forEach(order => {
    order.items.forEach(it => {
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = { name: it.productName, quantity: 0, revenue: 0 };
      }
      productSalesMap[it.productId].quantity += it.quantity;
      productSalesMap[it.productId].revenue += it.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 rounded-xl bg-cyan-50 text-cyan-700">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                Reportes Gerenciales & Toma de Decisiones
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800">
                Planta & Finanzas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Métricas estratégicas: Kilogramos fabricados, desagregación ARCA vs No-ARCA y rotación de insumos.
            </p>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Total Kilos Fabricados</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalKgProduced.toLocaleString('es-AR')} kg
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">Lotes aprobados</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Kilos en Fabricación Activa</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {totalKgInProcess.toLocaleString('es-AR')} kg
            </div>
            <span className="text-[10px] text-slate-500">En reactores y tanques</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Ventas Fiscales ARCA</span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              $ {arcaSales.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-blue-600 font-bold font-mono">
              {arcaPercentage.toFixed(1)}% del total
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Ingresos Venta No-ARCA</span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              $ {noArcaSales.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-amber-600 font-bold font-mono">
              {noArcaPercentage.toFixed(1)}% del total
            </span>
          </div>
        </div>
      </div>

      {/* Visual Comparison: ARCA vs No-ARCA distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ARCA vs No-ARCA bar card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Distribución de Facturación Comercial
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total: $ {totalSales.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-700">Ventas ARCA (Factura A / B):</span>
                <span className="font-mono text-slate-900">$ {arcaSales.toLocaleString('es-AR')} ({arcaPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${arcaPercentage}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-700">Ingresos No-ARCA (Recibo X / Interno):</span>
                <span className="font-mono text-slate-900">$ {noArcaSales.toLocaleString('es-AR')} ({noArcaPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${noArcaPercentage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100">
            * Cumple con la exigencia de trazabilidad contable para auditoría interna y conciliación fiscal en ARCA.
          </div>
        </div>

        {/* Top Selling Paints */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">
            Productos Más Vendidos (Líneas Estrella)
          </h3>

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 truncate max-w-xs">{p.name}</span>
                </div>
                <div className="text-right font-mono">
                  <strong className="text-red-700">{p.quantity} unidades</strong>
                  <span className="text-slate-400 text-[10px] block">($ {p.revenue.toLocaleString('es-AR')})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
