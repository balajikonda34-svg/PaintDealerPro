import React, { useState } from 'react';
import type { QuotationItem } from '../types';
import { ShoppingCart, Trash2, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../lib/db';

const generateId = () => {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
};

interface QuotationCartProps {
  items: QuotationItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export const QuotationCart: React.FC<QuotationCartProps> = ({ items, onRemoveItem, onClearCart }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.totalFinalPrice, 0);

  // Keep generation outside component body entirely to satisfy strict React compiler rules

  const generatePDF = (saveToDb: boolean = false) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    const qNumber = `QT-${generateId()}`;

    doc.setFontSize(20);
    doc.text('QUOTATION', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Date: ${dateStr}`, 14, 30);
    doc.text(`Quotation #: ${qNumber}`, 14, 35);
    
    doc.text(`Customer Name: ${customerName || 'Cash Customer'}`, 120, 30);
    if (customerMobile) doc.text(`Mobile: ${customerMobile}`, 120, 35);

    const tableData = items.map((item, idx) => [
      idx + 1,
      `${item.productName}\n(${item.productCode} - ${item.base})`,
      item.skuSize,
      item.quantity,
      `Rs. ${item.unitFinalPrice.toFixed(0)}`,
      `Rs. ${item.totalFinalPrice.toFixed(0)}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['#', 'Product Details', 'Size', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [29, 78, 216] } 
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 45;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: Rs. ${totalAmount.toFixed(0)}`, 140, finalY + 15);

    if (remarks) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Remarks: ${remarks}`, 14, finalY + 25);
    }

    if (!saveToDb) {
       doc.save(`${qNumber}_${customerName || 'Customer'}.pdf`);
    } else {
       return { qNumber, dateStr };
    }
  };

  const handleSaveQuotation = async () => {
    if (items.length === 0) return;
    setIsSaving(true);
    
    try {
      const qNumber = `QT-${generateId()}`;
      
      await db.quotations.add({
        quotationNumber: qNumber,
        date: new Date(),
        customerName: customerName || 'Cash Customer',
        customerMobile,
        items,
        totalAmount,
        remarks
      });

      if (customerName || customerMobile) {
        const existing = await db.customers.where('mobile').equals(customerMobile).first();
        if (!existing) {
          await db.customers.add({
            name: customerName,
            mobile: customerMobile,
            address: '',
            preferredDiscountType: 'NONE',
            preferredProfitType: 'PERCENT',
            preferredProfitValue: 8
          });
        }
      }

      generatePDF(false); 
      onClearCart();
      alert('Quotation saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-4xl mx-auto mt-8">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <ShoppingCart className="text-primary" />
        <h2 className="text-xl font-bold text-slate-800">Current Quotation</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full ml-2">{items.length} Items</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Customer Name</label>
          <input 
            type="text" 
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full mt-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Mobile Number</label>
          <input 
            type="text" 
            value={customerMobile}
            onChange={e => setCustomerMobile(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full mt-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 mb-6">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Size</th>
              <th className="p-3">Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-semibold text-slate-800">{item.productName}</div>
                  <div className="text-xs text-slate-500">{item.productCode} • {item.base}</div>
                </td>
                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.skuSize}</span></td>
                <td className="p-3 font-medium">{item.quantity}</td>
                <td className="p-3 text-right">₹{item.unitFinalPrice.toFixed(0)}</td>
                <td className="p-3 text-right font-bold text-slate-800">₹{item.totalFinalPrice.toFixed(0)}</td>
                <td className="p-3 text-center">
                  <button onClick={() => onRemoveItem(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="w-full md:w-1/2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Remarks (Optional)</label>
          <input 
            type="text" 
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Special instructions or notes..."
            className="w-full mt-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
          />
        </div>
        
        <div className="w-full md:w-auto text-right">
          <div className="text-sm text-slate-500 mb-1">Grand Total</div>
          <div className="text-3xl font-bold text-slate-800 mb-4">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => generatePDF(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
            >
              <Download size={18} /> PDF
            </button>
            <button 
              onClick={handleSaveQuotation}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md disabled:opacity-50"
            >
              <FileText size={18} /> {isSaving ? 'Saving...' : 'Save & Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
