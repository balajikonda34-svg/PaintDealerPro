import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Quotation } from '../types';

export class AppDatabase extends Dexie {
  products!: Table<Product, number>;
  customers!: Table<Customer, number>;
  quotations!: Table<Quotation, number>;

  constructor() {
    super('PaintDealerERPDB');
    this.version(1).stores({
      products: '++id, productCode, productName, skuSize, base, brand',
      customers: '++id, name, mobile',
      quotations: '++id, quotationNumber, date, customerName, customerMobile',
    });
  }
}

export const db = new AppDatabase();
