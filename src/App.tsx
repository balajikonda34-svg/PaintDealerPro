import { useState } from 'react';
import { SearchAndDisplay } from './components/SearchAndDisplay';
import { PricingCalculator } from './components/PricingCalculator';
import { QuotationCart } from './components/QuotationCart';
import type { Product, QuotationItem } from './types';
import { PaintBucket, Users, FileText, Settings, DatabaseBackup, Package } from 'lucide-react';
import { db } from './lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const App = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<QuotationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing');

  const stats = useLiveQuery(async () => {
    const productsCount = await db.products.count();
    const quotesCount = await db.quotations.count();
    const customersCount = await db.customers.count();
    return { productsCount, quotesCount, customersCount };
  });

  const recentQuotes = useLiveQuery(
    () => db.quotations.orderBy('date').reverse().limit(10).toArray()
  );

  const handleAddToCart = (item: QuotationItem) => {
    setCartItems([...cartItems, item]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-primary text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <PaintBucket className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">PaintDealer<span className="font-light opacity-90">Pro</span></h1>
          </div>
          
          <nav className="flex gap-1">
            <button 
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'billing' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'}`}
            >
              Billing Desk
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'}`}
            >
              History & Stats
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'billing' ? (
          <div className="space-y-8 relative">
            <SearchAndDisplay onSelectProduct={setSelectedProduct} />
            
            <QuotationCart 
              items={cartItems} 
              onRemoveItem={(idx) => setCartItems(items => items.filter((_, i) => i !== idx))} 
              onClearCart={() => setCartItems([])} 
            />

            {selectedProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                <div className="my-auto w-full max-w-2xl">
                   <PricingCalculator 
                     product={selectedProduct} 
                     onClose={() => setSelectedProduct(null)} 
                     onAddToCart={handleAddToCart}
                   />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg text-primary"><Package size={24}/></div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Products</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.productsCount || 0}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600"><FileText size={24}/></div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Quotations</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.quotesCount || 0}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><Users size={24}/></div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Customers</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.customersCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Recent Quotations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Quote #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Items</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentQuotes?.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No recent quotations found.</td></tr>
                    ) : (
                      recentQuotes?.map(quote => (
                        <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-slate-600">{new Date(quote.date).toLocaleDateString()}</td>
                          <td className="p-4 font-mono font-medium text-primary">{quote.quotationNumber}</td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{quote.customerName}</div>
                            <div className="text-xs text-slate-500">{quote.customerMobile}</div>
                          </td>
                          <td className="p-4">{quote.items.length} items</td>
                          <td className="p-4 text-right font-bold text-slate-800">₹{quote.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={18} /> System Tools</h3>
                <div className="flex gap-4">
                  <button onClick={async () => {
                      if(window.confirm("Clear all product database?")) {
                          await db.products.clear();
                          alert("Database cleared.");
                      }
                  }} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                    <DatabaseBackup size={16} /> Clear Product Database
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
