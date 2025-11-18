const fs = require('fs');
const path = require('path');

function imageToBase64(imagePath) {
  try {
    const image = fs.readFileSync(imagePath);
    const base64 = image.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error reading ${imagePath}:`, error.message);
    return null;
  }
}

// Try to load logo (try logo.png first, then logo_fixed.png, then logo.jpg)
let logoPath = path.join(__dirname, '../assets/logo.png');
if (!fs.existsSync(logoPath)) {
  logoPath = path.join(__dirname, '../assets/logo_fixed.png');
}
if (!fs.existsSync(logoPath)) {
  logoPath = path.join(__dirname, '../assets/logo.jpg');
}

// Try to load QR code (try qrcode.png first, then qrcode.jpg)
let qrPath = path.join(__dirname, '../assets/qrcode.png');
if (!fs.existsSync(qrPath)) {
  qrPath = path.join(__dirname, '../assets/qrcode.jpg');
}

// Try to load seal (try seal.png first, then seal.jpg)
let sealPath = path.join(__dirname, '../assets/seal.png');
if (!fs.existsSync(sealPath)) {
  sealPath = path.join(__dirname, '../assets/seal.jpg');
}

const logoBase64 = imageToBase64(logoPath);
const qrBase64 = imageToBase64(qrPath);
const sealBase64 = imageToBase64(sealPath);

// Generate the TypeScript file
const tsContent = `// Auto-generated file - do not edit manually
// Generated from assets/logo.png, assets/qrcode.png, and assets/seal.png
// To regenerate, run: node scripts/convert-images.js

export const LOGO_BASE64 = ${logoBase64 ? `'${logoBase64}'` : `''`};

export const QRCODE_BASE64 = ${qrBase64 ? `'${qrBase64}'` : `''`};

export const SEAL_BASE64 = ${sealBase64 ? `'${sealBase64}'` : `''`};
`;

const outputPath = path.join(__dirname, '../src/constants/assets.ts');
const outputDir = path.dirname(outputPath);

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, tsContent);

console.log('✅ Images converted successfully!');
console.log(`📁 Output: ${outputPath}`);
console.log(`🖼️  Logo: ${logoBase64 ? `${Math.round(logoBase64.length / 1024)} KB` : 'Not found'}`);
console.log(`📱 QR Code: ${qrBase64 ? `${Math.round(qrBase64.length / 1024)} KB` : 'Not found'}`);
console.log(`🔖 Seal: ${sealBase64 ? `${Math.round(sealBase64.length / 1024)} KB` : 'Not found'}`);

