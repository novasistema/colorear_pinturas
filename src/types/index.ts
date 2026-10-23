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
  productId?: string;
  productName: string;
  batchNumber: string; // Lote de fabricación (ej: LOT-2026-042)
  partidaNumber?: string; // Partida de fabricación (ej: PAR-2610-042 o PART-01)
  manufacturingTank?: string; // Tina / Reactor / Dispersor (ej: Dispersor Cowles #1, Mezclador #2)
  manufacturingDate?: string; // Fecha de elaboración / fraccionamiento
  expirationDate?: string; // Fecha de vencimiento
  viscosityKU?: number; // Viscosidad Krebs (KU)
  ph?: number; // pH de la mezcla
  densityReal?: number; // Densidad real medida (kg/L)
  qcStatus?: 'pendiente' | 'aprobado' | 'rechazado' | 'ajustado';
  qcInspector?: string; // Responsable de Control de Calidad
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
  batchNumber?: string; // Lote
  partidaNumber?: string; // Partida de fabricación
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
  sellerId?: string;
  sellerName?: string;
  status: 'activo' | 'suspendido' | 'bloqueado';
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  code: string;
  presentation: string;
  quantity: number; // Cantidad facturada en la orden
  deliveredQuantity?: number; // Cantidad ya entregada físicamente
  unitPrice: number;
  discount: number;
  subtotal: number;
  batchNumber?: string; // Lote asignado
  partidaNumber?: string; // Partida de fabricación asignada
}

export type SalesOrderStatus = 
  | 'ingresado' 
  | 'preparando_remito' 
  | 'facturado' 
  | 'entrega_parcial'
  | 'despachado' 
  | 'entregado' 
  | 'cancelado';

export type BillingType = 'arca' | 'no_arca';
export type InvoiceType = 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'RECIBO_X_NO_ARCA';

export interface DeliveryOrderItem {
  productId: string;
  productName: string;
  code: string;
  presentation: string;
  quantity: number; // Cantidad entregada en esta remesa
  batchNumber?: string; // Lote entregado
  partidaNumber?: string; // Partida de fabricación entregada
}

export interface DeliveryOrder {
  id: string;
  deliveryNumber: string; // Ej: OE-2026-0045 o REM-0001-00001920
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  date: string;
  items: DeliveryOrderItem[];
  transportName?: string;
  driverName?: string;
  driverDniOrPlate?: string;
  receiverName?: string;
  receiverDni?: string;
  notes?: string;
  createdAt: string;
}

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
  deliveryStatus?: 'pendiente_entrega' | 'entrega_parcial' | 'entrega_total';
  deliveryOrders?: DeliveryOrder[];
  sellerId?: string;
  sellerName?: string;
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
  name?: string;
  taxId: string;
  email: string;
  phone: string;
  category: string;
  paymentTerms: string;
  address?: string;
  discountPercentage?: number; // % de descuento acordado que el proveedor nos otorga
  discountConcept?: string; // Concepto o condición del descuento (ej: Pronto pago, Volumen)
  currentBalance?: number; // Saldo adeudado al proveedor
  cbuOrAlias?: string;
  bankName?: string;
  notes?: string;
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
  subtotalBeforeDiscount?: number;
  discountPercentage?: number;
  discountAmount?: number;
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
  | 'sellers'
  | 'prices'
  | 'customers'
  | 'checks'
  | 'cashboxes'
  | 'accounting'
  | 'profitability'
  | 'employees'
  | 'logistics'
  | 'purchases'
  | 'finances'
  | 'reports'
  | 'customer_portal'
  | 'settings'
  | 'users';

// --- CHEQUES & E-CHEQS ---
export type CheckType = 'cheque_fisico' | 'echeq';
export type CheckStatus = 'en_cartera' | 'depositado' | 'cobrado' | 'entregado_proveedor' | 'rechazado';

export interface CheckItem {
  id: string;
  checkNumber: string;
  type: CheckType;
  bankName: string;
  issuerTaxId: string;
  issuerName: string;
  amount: number;
  issueDate: string;
  dueDate: string; // Fecha de cobro / vencimiento
  status: CheckStatus;
  receivedFromType: 'cliente' | 'propio' | 'otro';
  customerId?: string;
  customerName?: string;
  deliveredToSupplierId?: string;
  deliveredToSupplierName?: string;
  cashboxId?: string;
  notes?: string;
  depositDate?: string;
  createdAt: string;
}

// --- CAJAS DE DINERO & MOVIMIENTOS ---
export type CashboxType = 'efectivo' | 'banco' | 'digital' | 'caja_chica';

export interface Cashbox {
  id: string;
  name: string;
  type: CashboxType;
  currency: 'ARS' | 'USD';
  currentBalance: number;
  accountNumberOrCbu?: string;
  bankName?: string;
  responsiblePerson: string;
  isDefault?: boolean;
  updatedAt: string;
}

export type CashMovementCategory =
  | 'materias_primas'
  | 'envases_embalajes'
  | 'sueldos_jornales'
  | 'adelanto_sueldos'
  | 'fletes_logistica'
  | 'mantenimiento_maquinaria'
  | 'servicios_luz_gas'
  | 'impuestos_tasas'
  | 'alquiler_planta'
  | 'cobranza_clientes'
  | 'venta_mostrador'
  | 'transferencia_entre_cajas'
  | 'gastos_oficina'
  | 'otros_ingresos'
  | 'otros_egresos';

export interface CashMovement {
  id: string;
  cashboxId: string;
  cashboxName: string;
  type: 'ingreso' | 'egreso' | 'transferencia';
  amount: number;
  category: CashMovementCategory;
  concept: string;
  date: string;
  referenceNumber?: string;
  destinationCashboxId?: string;
  destinationCashboxName?: string;
  employeeId?: string;
  employeeName?: string;
  receiptUrl?: string;
  user: string;
  createdAt: string;
}

// --- PERSONAL, EMPLEADOS & SUELDOS ---
export type EmployeeSector = 
  | 'dispersion_fabricacion'
  | 'control_calidad_laboratorio'
  | 'envasado_fraccionamiento'
  | 'logistica_chofer'
  | 'mantenimiento_taller'
  | 'administracion_finanzas'
  | 'ventas_mostrador';

export interface Employee {
  id: string;
  cuil: string;
  firstName: string;
  lastName: string;
  fullName: string;
  sector: EmployeeSector;
  position: string;
  hireDate: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  contractType: 'mensualizado' | 'jornal' | 'quincenal';
  baseSalary: number; // Importe de sueldo básico acordado
  hourlyRate?: number;
  bankName?: string;
  cbuOrAlias?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export type SalaryPaymentType = 'sueldo_mensual' | 'quincena' | 'adelanto' | 'aguinaldo_sac' | 'bono';

export interface SalaryPaymentItem {
  concept: string;
  amount: number;
  type: 'haber' | 'descuento';
}

export interface SalaryPayment {
  id: string;
  paymentNumber: string; // e.g. REC-SUEL-2026-001
  employeeId: string;
  employeeName: string;
  employeeCuil: string;
  employeePosition: string;
  paymentType: SalaryPaymentType;
  period: string; // e.g. "Agosto 2026", "1º Quincena Agosto 2026"
  date: string;
  grossAmount: number;
  deductionsAmount: number; // e.g. adelantos previos
  netAmount: number;
  paymentMethod: 'efectivo' | 'transferencia';
  cashboxId?: string;
  cashboxName?: string;
  bankRef?: string;
  items: SalaryPaymentItem[];
  notes?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'produccion' | 'ventas' | 'vendedor_calle' | 'logistica' | 'finanzas';

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
  sellerId?: string; // Si está vinculado a un vendedor de calle
  allowedModules?: ModuleKey[]; // Módulos permitidos asignados desde administración
  lastLogin?: string;
  createdAt: string;
}

// --- VENDEDORES DE CALLE & COMISIONES ---
export interface Seller {
  id: string;
  name: string;
  code: string; // ej: VEN-01
  phone: string;
  email: string;
  zone: string; // ej: "GBA Norte", "CABA", "Zona Oeste", etc.
  dniOrTaxId?: string;
  salesCommissionPct: number; // e.g. 3.5 (%) Comisión por venta
  collectionCommissionPct: number; // e.g. 1.5 (%) Comisión por cobranza
  active: boolean;
  allowedModules: ModuleKey[]; // Módulos permitidos asignados desde administración
  notes?: string;
  createdAt: string;
}

// --- HOJA DE RUTA & PARADAS DE VISITA ---
export type VisitStatus = 
  | 'pendiente' 
  | 'visitado_con_venta' 
  | 'visitado_sin_venta' 
  | 'visitado_cobranza' 
  | 'no_encontrado_ausente' 
  | 'reprogramado';

export interface RouteSheetStop {
  id: string;
  orderIndex: number;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  customerCity?: string;
  currentBalance?: number; // Saldo deudor en cuenta corriente para gestión de cobro
  estimatedTime?: string; // ej: "09:30" o "Mañana"
  status: VisitStatus;
  checkInTime?: string; // Hora en que el vendedor registró la visita
  notes?: string; // Observaciones del vendedor en la visita
  salesOrderId?: string; // Si se concretó una venta
  salesAmount?: number; // Monto vendido en la parada
  collectedAmount?: number; // Monto cobrado en la parada
  receiptNumber?: string; // Comprobante o cheque recibido
  // --- Geotagging & Auditoría GPS de Visita para Validación Gerencial ---
  latitude?: number; // Latitud GPS capturada al marcar la visita
  longitude?: number; // Longitud GPS capturada al marcar la visita
  accuracyMeters?: number; // Precisión satelital en metros (ej: 8.5m)
  geotaggedAt?: string; // Timestamp ISO exacto de captura satelital
  geotagStatus?: 'verificado_gps' | 'sin_gps_manual' | 'permiso_denegado';
  geotagAddress?: string; // Referencia de dirección geográfica
  deviceInfo?: string; // Datos del dispositivo móvil o navegador
}

export interface RouteSheet {
  id: string;
  code: string; // ej: HDR-2026-001
  sellerId: string;
  sellerName: string;
  date: string; // YYYY-MM-DD
  zone: string;
  title: string; // ej: "Ruta San Martín - Circuito Pinturerías"
  status: 'borrador' | 'en_progreso' | 'completada' | 'cancelada';
  stops: RouteSheetStop[];
  totalStops: number;
  visitedStops: number;
  totalSalesGenerated: number;
  totalCollectionsGenerated: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

// --- LIQUIDACIÓN DE COMISIONES ---
export interface SellerCommissionSettlement {
  id: string;
  settlementNumber: string; // ej: LIQ-VEN-2026-001
  sellerId: string;
  sellerName: string;
  period: string; // ej: "Octubre 2026"
  date: string;
  totalSales: number;
  salesCommissionPct: number;
  salesCommissionAmount: number;
  totalCollections: number;
  collectionCommissionPct: number;
  collectionCommissionAmount: number;
  totalCommissionToPay: number;
  status: 'pendiente' | 'pagada';
  paidDate?: string;
  cashboxId?: string;
  notes?: string;
  createdAt: string;
}

