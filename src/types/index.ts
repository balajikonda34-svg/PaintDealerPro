export interface Product {
  id?: number;
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  skuSize: string;
  base: string;
  dpl: number;
  colorantCost: number; // default to 0
  gstPercent: number; // usually 18
  lastUpdated: Date;
}

export interface Customer {
  id?: number;
  name: string;
  mobile: string;
  address: string;
  preferredDiscountType: 'RPPD' | 'CD' | 'NONE';
  preferredDiscountValue?: number;
  preferredProfitType: 'PERCENT' | 'FLAT';
  preferredProfitValue: number;
}

export interface QuotationItem {
  productId: number;
  productName: string;
  productCode: string;
  skuSize: string;
  base: string;
  quantity: number;
  dpl: number;
  discountType: 'RPPD' | 'CD' | 'NONE';
  discountPercent: number;
  additionalDiscountType: 'PERCENT' | 'FLAT';
  additionalDiscountValue: number;
  colorantCost: number;
  profitType: 'PERCENT' | 'FLAT';
  profitValue: number;
  gstPercent: number;
  
  // Calculated fields (stored for historical accuracy if pricing logic changes)
  unitPriceExclGst: number;
  unitGstAmount: number;
  unitFinalPrice: number;
  totalFinalPrice: number;
}

export interface Quotation {
  id?: number;
  quotationNumber: string;
  date: Date;
  customerId?: number;
  customerName: string;
  customerMobile: string;
  items: QuotationItem[];
  totalAmount: number;
  remarks: string;
}
