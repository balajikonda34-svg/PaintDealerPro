import * as pdfjsLib from 'pdfjs-dist';
import type { Product } from '../types';
import { db } from '../lib/db';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const SKIP = 'Price List,Internal Circulation,Checked by,Approved by,NOT to be given,W.E.F,Restricted,Product Name,Shade Code,All India,effective,Consolidated,Page '.split(',');
const RE1 = /^([0-9A-Z]{4})\s+(.*?)\s{2,}(\d{1,3})\s{2,}(\d{1,3}\.\d{3})\s{2,}(\d{2,4})\s{2,}(\d{1,6}\.\d{2})\s*$/;
const RE2 = /^([0-9A-Z]{4})\s{2,}(\d{1,3})\s{2,}(\d{1,3}\.\d{3})\s{2,}(\d{2,4})\s{2,}(\d{1,6}\.\d{2})\s*$/;
const RE3 = /^([0-9A-Z]{4})\s+([A-Z].+?)\s*$/;
const SHADE = /\s+[A-Z]{0,2}\d{2,5}[A-Z]?\s*$/;

export const parsePdfAndStore = async (file: File, brand: string = 'Asian Paints', category: string = 'General'): Promise<number> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let text = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let byY: { [y: number]: any[] } = {};
      for (let j = 0; j < textContent.items.length; j++) {
        let it = textContent.items[j];
        if ('transform' in it && 'str' in it) {
            let y = Math.round((it as any).transform[5]);
            if (!byY[y]) byY[y] = [];
            byY[y].push({x: Math.round((it as any).transform[4]), s: (it as any).str});
        }
      }
      
      let ys = Object.keys(byY).map(Number).sort((a,b) => b-a);
      for (let yi = 0; yi < ys.length; yi++) {
        let row = byY[ys[yi]].sort((a,b) => a.x - b.x);
        let line = '', lx = 0;
        for (let ri = 0; ri < row.length; ri++) {
          let gap = Math.max(1, Math.round((row[ri].x - lx) / 5.5));
          for (let gi = 0; gi < gap; gi++) line += ' ';
          line += row[ri].s;
          lx = row[ri].x + row[ri].s.length * 5.5;
        }
        text += line.trim() + '\n';
      }
      text += '\f';
    }

    let nm: { [code: string]: string } = {};
    let gr: { [key: string]: any } = {};
    let lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      let s = lines[i].trim();
      if (!s || s.length < 5) continue;
      let skip = false;
      for (let si = 0; si < SKIP.length; si++) {
        if (s.indexOf(SKIP[si]) >= 0) { skip = true; break; }
      }
      if (skip) continue;
      if (!/^[0-9A-Z]{4}[\s]/.test(s)) continue;

      let hp = /\d{1,6}\.\d{2}\s*$/.test(s);
      if (!hp) {
        let m3 = RE3.exec(s);
        if (m3) {
          let c3 = m3[1], n3 = m3[2].replace(/\s+\d+\s*$/, '').trim();
          if (n3.length >= 3) {
            let ac = (n3 === n3.toUpperCase() && n3.indexOf(' ') >= 0);
            if (!nm[c3] || (ac && n3.length > nm[c3].length)) nm[c3] = n3;
          }
        }
        continue;
      }

      let m1 = RE1.exec(s);
      if (m1) {
        let c = m1[1];
        let vn = m1[2].replace(SHADE, '').replace(/\s{2,}/g, ' ').trim();
        let g = parseInt(m1[3]);
        let sz = parseFloat(m1[4]);
        let pr = parseFloat(m1[6]);
        let k = c + '|' + g;

        if (!gr[k]) gr[k] = { c: c, g: g, ns: [], sz: {} };
        if (vn) gr[k].ns.push(vn);
        let sk = sz.toFixed(3);
        if (!gr[k].sz[sk] || pr > gr[k].sz[sk]) gr[k].sz[sk] = pr;
        continue;
      }

      let m2 = RE2.exec(s);
      if (m2) {
        let c = m2[1];
        let g = parseInt(m2[2]);
        let sz = parseFloat(m2[3]);
        let pr = parseFloat(m2[5]);
        let k = c + '|' + g;

        if (!gr[k]) gr[k] = { c: c, g: g, ns: [], sz: {} };
        let sk = sz.toFixed(3);
        if (!gr[k].sz[sk] || pr > gr[k].sz[sk]) gr[k].sz[sk] = pr;
      }
    }

    let out: any = {};
    let gkeys = Object.keys(gr);
    for (let gi = 0; gi < gkeys.length; gi++) {
      let gg = gr[gkeys[gi]], cc = gg.c;
      if (!out[cc]) out[cc] = { name: nm[cc] || ('Product ' + cc), groups: {} };
      let sizes = [];
      let szks = Object.keys(gg.sz);
      for (let si = 0; si < szks.length; si++) sizes.push({ size: parseFloat(szks[si]), price: gg.sz[szks[si]] });
      sizes.sort((a, b) => a.size - b.size);
      let uns = [];
      for (let ni = 0; ni < gg.ns.length; ni++) { if (gg.ns[ni] && uns.indexOf(gg.ns[ni]) < 0) uns.push(gg.ns[ni]); }
      uns.sort((a, b) => b.length - a.length);
      
      out[cc].groups[String(gg.g)] = { name: uns[0] ? uns[0].substring(0, 60) : 'Standard', sizes: sizes };
    }

    let productsToAdd: Product[] = [];
    let now = new Date();
    let ckeys = Object.keys(out);
    for (let ci = 0; ci < ckeys.length; ci++) {
        let cc = ckeys[ci];
        let p = out[cc];
        let gKeysInner = Object.keys(p.groups);
        
        for(let gi = 0; gi < gKeysInner.length; gi++) {
            let gid = gKeysInner[gi];
            let g = p.groups[gid];
            let base = g.name;
            
            for (let si = 0; si < g.sizes.length; si++) {
                let sku = g.sizes[si];
                let sizeNum = sku.size;
                let sizeStr = sizeNum < 1 ? (sizeNum * 1000).toFixed(0) + "ml/gm" : sizeNum.toFixed(0) + "L/Kg";
                
                productsToAdd.push({
                    productCode: cc + "-" + gid,
                    productName: p.name,
                    brand: brand,
                    category: category,
                    skuSize: sizeStr,
                    base: base,
                    dpl: sku.price, 
                    colorantCost: 0,
                    gstPercent: 18,
                    lastUpdated: now
                });
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
