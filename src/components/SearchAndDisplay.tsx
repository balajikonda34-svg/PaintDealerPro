import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Upload, Package, ArrowRight } from 'lucide-react';
import { db } from '../lib/db';
import { parsePdfAndStore } from '../utils/pdfParser';
import type { Product } from '../types';

export const SearchAndDisplay = ({ onSelectProduct }: { onSelectProduct: (p: Product) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const products = useLiveQuery(
    async () => {
      if (!searchTerm) return [];
      
      const term = searchTerm.toLowerCase();
      return db.products.filter(p => {
        return p.productCode.toLowerCase().includes(term) ||
               p.productName.toLowerCase().includes(term) ||
               p.skuSize.toLowerCase().includes(term) ||
               p.base.toLowerCase().includes(term);
      }).limit(20).toArray();
    },
    [searchTerm]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Parsing PDF and importing products...');

    try {
      const count = await parsePdfAndStore(file);
      setUploadMessage(`Successfully imported ${count} products.`);
    } catch (err) {
      console.error(err);
      setUploadMessage('Failed to import PDF. Check console for details.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(''), 5000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="text-primary" />
          Product Database
        </h2>
        
        <div className="relative overflow-hidden">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isUploading ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white hover:bg-blue-700'
            }`}
          >
            <Upload size={16} />
            {isUploading ? 'Importing...' : 'Upload Price List (PDF)'}
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className={`p-3 rounded-lg text-sm ${uploadMessage.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {uploadMessage}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by code, name, size, or base... (e.g. 'tractor ace 20')"
          className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-300 rounded-xl shadow-sm text-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {searchTerm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {products === undefined ? (
            <div className="p-8 text-center text-slate-500">Searching...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No products found for "{searchTerm}"</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {products.map(product => (
                <li 
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">{product.productCode}</span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">{product.skuSize}</span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">{product.base}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-lg">{product.productName}</h3>
                    <p className="text-sm text-slate-500">{product.brand}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">DPL</p>
                      <p className="font-bold text-slate-800 text-lg">₹{product.dpl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-colors">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
