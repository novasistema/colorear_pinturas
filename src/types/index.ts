export type RawMaterialCategory = 'resina' | 'pigmento' | 'carga' | 'aditivo' | 'solvente' | 'envase' | 'otro';
export type UnitType = 'kg' | 'litro' | 'unidad';

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: RawMaterialCategory;
  unit: UnitType;
  currentStock: number;
  minStock: number;
  unitCost: number; // Cost in ARS or USD per unit
  supplierId?: string;
  supplierName?: string;
  updatedAt: string;
}

export interface FormulaItem {
  rawMaterialId: string;
  rawMaterialName: string;
  percentageOrKg: number; // For 100 kg base formula
  unit: UnitType;
}

export interface Formula {
  id: string;
  code: string;
  name: string;
  paintType: string; // Látex Interior, Látex Exterior, Esmalte Sintético, Impermeabilizante, etc.
  density: number; // kg/L (e.g., 1.35)
  theoreticalCostPerKg: number;
  baseQuantity: number; // Usually 100 kg
  items: FormulaItem[];
  notes?: string;
  createdAt: string;
}

export type PackagingType = 'balde_20l' | 'lata_10l' | 'lata_4l' | 'lata_1l' | 'tambor_200l';

export type ProductionStatus = 'planificada' | 'en_proceso' | 'control_calidad' | 'completada' | 'cancelada';

export interface ProductionOrder {
  id: string;
  orderNumber: string; // e.g. OP-2026-001
  formulaId: string;
  productName: string;
  batchNumber: string;
  targetKg: number; // Kilograms to manufacture
  packagingType: PackagingType;
  packageCount: number; // Number of buckets/cans calculated or produced
  status: ProductionStatus;
  materialCost: number;
  operatorName: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  presentation: string; // 1L, 4L, 10L, 20L
  volumeOrWeight: string;
  color: string;
  stock: number;
  minStock: number;
  priceWholesale: number; // Mayorista
  priceRetail: number; // Minorista
  priceDistributor: number; // Pinturerías / Distribuidores
  unitCost: number;
}

export type InventoryMovementType = 
  | 'entrada_produccion' 
  | 'salida_produccion' 
  | 'entrada_compra' 
  | 'salida_venta' 
  | 'ajuste_manual';

export interface InventoryMovement {
  id: string;
  itemType: 'raw_material' | 'product';
  itemId: string;
  itemName: string;
  movementType: InventoryMovementType;
  quantity: number;
  unit: string;
  reference: string; // e.g. OP-001, PED-102, FAC-0004
  user: string;
  date: string;
}

export type TaxCategory = 'responsable_inscripto' | 'monotributo' | 'consumidor_final' | 'exento';
export type PriceListType = 'mayorista' | 'minorista' | 'distribuidor';

export interface Customer {
  id: string;
  taxId: string; // DNI or CUIT (without dashes or formatted)
  businessName: string;
  tradeName?: string;
  taxCategory: TaxCategory;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  transportId?: string;
  transportName?: string;
  priceList: PriceListType;
  creditLimit: number;
  currentBalance: number; // Positive = owes money, Negative = credit in favor
  status: 'activo' | 'suspendido' | 'bloqueado';
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  code: string;
  presentation: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export type SalesOrderStatus = 
  | 'ingresado' 
  | 'preparando_remito' 
  | 'facturado' 
  | 'despachado' 
  | 'entregado' 
  | 'cancelado';

export type BillingType = 'arca' | 'no_arca';
export type InvoiceType = 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'RECIBO_X_NO_ARCA';

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  billingType: BillingType;
  invoiceType?: InvoiceType;
  date: string;
  status: SalesOrderStatus;
  paymentStatus: 'pendiente' | 'parcial' | 'pagado';
  transportId?: string;
  transportName?: string;
  trackingCode?: string;
  remitoNumber?: string;
  remitoDate?: string;
  invoiceNumber?: string;
  cae?: string;
  caeVto?: string;
  items: SalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paidAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  customerId: string;
  customerTaxId: string;
  customerName: string;
  type: InvoiceType;
  cae?: string;
  caeVto?: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: 'emitida' | 'anulada' | 'pagada';
  itemsSummary?: string;
}

export interface Transport {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  serviceArea: string;
  vehicleType: string;
  capacityKg: number;
  address: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  businessName: string;
  taxId: string;
  email: string;
  phone: string;
  category: string;
  paymentTerms: string;
}

export interface PurchaseOrderItem {
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  status: 'solicitado' | 'aprobado' | 'recibido' | 'cancelado';
  total: number;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'cobro_cliente' | 'pago_proveedor' | 'gasto_operativo' | 'sueldos' | 'mantenimiento';
  direction: 'ingreso' | 'egreso';
  amount: number;
  date: string;
  entityId?: string;
  entityName?: string;
  paymentMethod: 'efectivo' | 'transferencia' | 'cheque' | 'echeq';
  concept: string;
  receiptNumber?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'pago_pendiente' | 'pedido_listo' | 'produccion_progreso' | 'despacho_en_camino' | 'stock_bajo';
  targetEntityId?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface CompanyConfig {
  id: string;
  companyName: string;
  tradeName: string;
  cuit: string;
  arcaPointOfSale: number;
  arcaEnvironment: 'homologacion' | 'produccion';
  grossIncomeNumber: string;
  activityStartDate: string;
  fiscalAddress: string;
  plantAddress: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  notificationWhatsappTemplate: string;
  paymentReminderTemplate: string;
}

export type ModuleKey = 
  | 'desktop'
  | 'production'
  | 'sales'
  | 'prices'
  | 'customers'
  | 'logistics'
  | 'purchases'
  | 'finances'
  | 'reports'
  | 'customer_portal'
  | 'settings'
  | 'users';

export type UserRole = 'admin' | 'produccion' | 'ventas' | 'logistica' | 'finanzas';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  password?: string;
  avatarColor?: string;
  active: boolean;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
}
