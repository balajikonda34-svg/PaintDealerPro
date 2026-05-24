import React, { useState } from 'react';
import type { Product, QuotationItem } from '../types';
import { Calculator, X, Plus, Minus } from 'lucide-react';

interface PricingCalculatorProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: QuotationItem) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [discountType, setDiscountType] = useState<'RPPD' | 'CD' | 'NONE'>('RPPD');
  const [additionalDiscountType, setAdditionalDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [additionalDiscountValue, setAdditionalDiscountValue] = useState<number>(0);
  const [colorantCost, setColorantCost] = useState<number>(product.colorantCost || 0);
  const [profitType, setProfitType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [profitValue, setProfitValue] = useState<number>(8);

  const dpl = product.dpl;
  const primaryDiscountPercent = discountType === 'RPPD' ? 3.5 : (discountType === 'CD' ? 5 : 0);
  const primaryDiscountAmount = dpl * (primaryDiscountPercent / 100);
  
  const additionalDiscountAmount = additionalDiscountType === 'PERCENT' 
    ? (dpl * (additionalDiscountValue / 100))
    : additionalDiscountValue;
    
  const totalDiscount = primaryDiscountAmount + additionalDiscountAmount;
  const postDiscountPrice = dpl - totalDiscount;

  const profitAmount = profitType === 'PERCENT'
    ? (postDiscountPrice + colorantCost) * (profitValue / 100)
    : profitValue;

  const subtotal = postDiscountPrice + colorantCost + profitAmount;
  const gstAmount = subtotal * (product.gstPercent / 100);
  const finalPrice = subtotal + gstAmount;

  const handleAddToCart = () => {
    const item: QuotationItem = {
      productId: product.id!,
      productName: product.productName,
      productCode: product.productCode,
      skuSize: product.skuSize,
      base: product.base,
      quantity,
      dpl,
      discountType,
      discountPercent: primaryDiscountPercent,
      additionalDiscountType,
      additionalDiscountValue,
      colorantCost,
      profitType,
      profitValue,
      gstPercent: product.gstPercent,
      unitPriceExclGst: subtotal,
      unitGstAmount: gstAmount,
      unitFinalPrice: finalPrice,
      totalFinalPrice: finalPrice * quantity
    };
    onAddToCart(item);
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-2xl mx-auto flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-start">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-mono shadow-sm">{product.productCode}</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold shadow-sm">{product.skuSize}</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs shadow-sm">{product.base}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">{product.productName}</h2>
          <p className="text-sm text-slate-500">Base DPL: ₹{dpl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Company Scheme</label>
            <div className="flex gap-2">
              {(['RPPD', 'CD', 'NONE'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setDiscountType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    discountType === type 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {type === 'NONE' ? 'None' : `${type} ${type === 'RPPD' ? '(3.5%)' : '(5%)'}`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Additional Discount</label>
            <div className="flex gap-2">
              <select 
                value={additionalDiscountType}
                onChange={(e) => setAdditionalDiscountType(e.target.value as 'PERCENT' | 'FLAT')}
                className="p-2 border border-slate-300 rounded-lg bg-white focus:ring-primary focus:border-primary outline-none"
              >
                <option value="PERCENT">%</option>
                <option value="FLAT">₹</option>
              </select>
              <input 
                type="number" 
                min="0"
                step="any"
                value={additionalDiscountValue === 0 ? '' : additionalDiscountValue}
                onChange={(e) => setAdditionalDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="flex-1 p-2 border border-slate-300 rounded-lg bg-white focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Colorant Cost (₹)</label>
            <input 
              type="number" 
              min="0"
              step="any"
              value={colorantCost === 0 ? '' : colorantCost}
              onChange={(e) => setColorantCost(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-primary focus:border-primary outline-none text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>Profit Margin</span>
              <div className="flex gap-2 text-xs">
                {[5, 8, 10].map(val => (
                  <button 
                    key={val} 
                    onClick={() => { setProfitType('PERCENT'); setProfitValue(val); }}
                    className="text-primary hover:underline"
                  >
                    +{val}%
                  </button>
                ))}
              </div>
            </label>
            <div className="flex gap-2">
              <select 
                value={profitType}
                onChange={(e) => setProfitType(e.target.value as 'PERCENT' | 'FLAT')}
                className="p-2 border border-slate-300 rounded-lg bg-white focus:ring-primary focus:border-primary outline-none"
              >
                <option value="PERCENT">%</option>
                <option value="FLAT">₹</option>
              </select>
              <input 
                type="number" 
                min="0"
                step="any"
                value={profitValue === 0 ? '' : profitValue}
                onChange={(e) => setProfitValue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="flex-1 p-2 border border-slate-300 rounded-lg bg-white focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 text-white shadow-inner flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calculator size={14} /> Price Breakdown
            </h3>
            
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-300">DPL:</span>
                <span>₹ {dpl.toFixed(2)}</span>
              </div>
              
              {primaryDiscountAmount > 0 && (
                <div className="flex justify-between text-red-300">
                  <span>Less {discountType} ({primaryDiscountPercent}%):</span>
                  <span>- ₹ {primaryDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {additionalDiscountAmount > 0 && (
                <div className="flex justify-between text-red-300">
                  <span>Less Addl. Discount:</span>
                  <span>- ₹ {additionalDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {colorantCost > 0 && (
                <div className="flex justify-between text-blue-300 pt-2 border-t border-slate-700/50">
                  <span>Add Colorant:</span>
                  <span>+ ₹ {colorantCost.toFixed(2)}</span>
                </div>
              )}

              {profitAmount > 0 && (
                <div className="flex justify-between text-green-300">
                  <span>Add Profit:</span>
                  <span>+ ₹ {profitAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-slate-700">
                <span className="text-slate-300">Subtotal:</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>GST ({product.gstPercent}%):</span>
                <span>+ ₹ {gstAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <div className="flex justify-between items-end mb-4">
              <span className="text-slate-300 text-sm">Final Unit Price</span>
              <span className="text-3xl font-bold text-emerald-400">₹ {finalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex items-center bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-slate-600 transition-colors"><Minus size={16} /></button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 bg-transparent text-center font-bold text-white outline-none"
                  />
                  <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-slate-600 transition-colors"><Plus size={16} /></button>
               </div>
               <button 
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg transition-colors flex justify-center items-center gap-2"
               >
                 Add to Quote (₹ {(finalPrice * quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
