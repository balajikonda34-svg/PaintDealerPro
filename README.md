# PaintDealerPro

A modern, serverless Progressive Web App (PWA) designed for paint dealers to manage product databases, calculate live pricing, and generate professional PDF quotations completely offline.

## Features
- **Serverless Architecture**: Runs entirely in the browser using React and IndexedDB (via Dexie.js). No backend required.
- **Offline Capable**: Works without an internet connection once loaded.
- **Smart PDF Parsing**: Upload your company price list (PDF) directly in the browser. The custom parser extracts product codes, names, SKUs, and prices automatically.
- **Ultra-Fast Search**: Instantly filter through 10,000+ products by code, name, size, or base.
- **Live Pricing Engine**: Accurately calculates final prices based on the formula: `((DPL - Discounts) + Profit + Colorant Cost) + 18% GST`. Includes toggles for RPPD/CD schemes.
- **Professional Quotations**: Add calculated items to a cart, attach customer details, and download a beautifully formatted PDF quotation instantly.

## How to use (Developers)

1. Ensure Node.js is installed.
2. Clone the repository and run `npm install`.
3. Run `npm run dev` to start the local development server.
4. Run `npm run build` to create a production bundle.
