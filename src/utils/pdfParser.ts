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
          const text = (item as any).str.trim();
          if (!text) continue;

          const y = (item as any).transform[5];
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
        
        if (rowItems.length >= 2) {
           const code = rowItems[0];
           
           if (rowItems.length === 2 && code.match(/^[0-9]+$/)) {
               currentProductName = rowItems[1];
               continue; 
           }
           
           if (rowItems.length === 2 && rowItems[1].match(/[A-Za-z\(\)]+/)) {
               currentProductName = rowItems[1];
           }

           let possibleName = '';
           if (rowItems.length >= 5) {
               if (!rowItems[1].match(/^[0-9\.]+$/)) {
                   possibleName = rowItems[1];
               }
           }
           
           if (possibleName && possibleName.length > 2) {
               currentProductName = possibleName;
           }

           const lastItem = rowItems[rowItems.length - 1];
           const dplStr = lastItem.match(/^[0-9,]+(\.[0-9]{1,2})?$/) ? lastItem : null;
           const dpl = dplStr ? parseFloat(dplStr.replace(/,/g, '')) : 0;

           let sizeNumStr = rowItems.find(i => i.match(/^[0-9]+\.[0-9]+$/));
           let size = sizeNumStr ? sizeNumStr + "L/Kg" : '1L';
           
           if (sizeNumStr) {
               let n = parseFloat(sizeNumStr);
               if (n < 1) {
                   size = (n * 1000).toFixed(0) + "ml";
               } else {
                   size = n.toFixed(0) + "L/Kg";
               }
           }

           let base = 'Base/White';
           if (rowItems.length >= 6) {
               base = rowItems[2];
               if (base.match(/^[0-9\.]+$/)) base = 'Base/White';
           } else if (currentProductName && currentProductName !== 'ASIAN PAINTS APCOLITE PREMIUM GLOSS ENAMEL (W)' && currentProductName !== 'ASIAN PAINTS APCOLITE PREMIUM GLOSS ENAMEL (C)') {
               if(currentProductName.length < 20) base = currentProductName;
           }

           if (dpl > 0 && code.match(/^[0-9]+$/)) {
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
