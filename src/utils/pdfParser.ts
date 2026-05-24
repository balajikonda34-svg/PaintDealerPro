import * as pdfjsLib from 'pdfjs-dist';
import type { Product } from '../types';
import { db } from '../lib/db';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const parsePdfAndStore = async (file: File, brand: string = 'Asian Paints', category: string = 'General'): Promise<number> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let currentProductName = '';
    const productsToAdd: Product[] = [];
    const now = new Date();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const rows: { [y: number]: string[] } = {};
      const MARGIN_OF_ERROR = 5;

      for (const item of textContent.items) {
        if ('str' in item && 'transform' in item) {
          const text = item.str.trim();
          if (!text) continue;

          const y = item.transform[5];
          const foundRowY = Object.keys(rows).find(ry => Math.abs(parseFloat(ry) - y) < MARGIN_OF_ERROR);
          
          if (foundRowY) {
            rows[parseFloat(foundRowY)].push(text);
          } else {
            rows[y] = [text];
          }
        }
      }

      const sortedY = Object.keys(rows).map(parseFloat).sort((a, b) => b - a);

      for (const y of sortedY) {
        const rowItems = rows[y];
        
        if (rowItems.length >= 3) {
           const code = rowItems[0];
           const possibleName = rowItems.length > 4 ? rowItems[1] : '';
           
           if (possibleName && possibleName.length > 2 && !possibleName.match(/^[0-9LmlKg]+$/i)) {
               currentProductName = possibleName;
           }

           const dplStr = rowItems.find(i => i.match(/^[0-9,]+(\.[0-9]{1,2})?$/));
           const dpl = dplStr ? parseFloat(dplStr.replace(/,/g, '')) : 0;

           const size = rowItems.find(i => i.match(/[0-9]+[ ]*(L|ml|Kg|ltr)/i)) || '1L';

           const base = rowItems.find(i => i.match(/Base/i)) || 'Base 1';

           if (dpl > 0) {
             productsToAdd.push({
               productCode: code,
               productName: currentProductName || 'Unknown Product',
               brand: brand,
               category: category,
               skuSize: size,
               base: base,
               dpl: dpl,
               colorantCost: 0,
               gstPercent: 18,
               lastUpdated: now
             });
           }
        }
      }
    }

    if (productsToAdd.length > 0) {
       await db.products.bulkAdd(productsToAdd);
    }
    
    return productsToAdd.length;

  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw error;
  }
};
