# Logo and QR Code Setup Guide

## Where to Place Your Images

Place your logo and QR code images in the `assets` folder at the root of the project:

```
gst-billing-app/
  └── assets/
      ├── logo.png      (or logo.jpg)
      └── qrcode.png    (or qrcode.jpg)
```

## Image Requirements

### Logo (`logo.png` or `logo.jpg`)
- **Location**: Top left of the PDF, next to the company name
- **Recommended size**: 120x120 pixels (or similar square dimensions)
- **Format**: PNG or JPG
- **File name**: Must be exactly `logo.png` or `logo.jpg`

### QR Code (`qrcode.png` or `qrcode.jpg`)
- **Location**: Bottom left of the PDF, next to the bank details
- **Recommended size**: 120x120 pixels (or similar square dimensions)
- **Format**: PNG or JPG
- **File name**: Must be exactly `qrcode.png` or `qrcode.jpg`

## How It Works

1. The PDF service will automatically look for these images in the `assets` folder
2. If the images are found, they will be included in the PDF
3. If the images are not found, the PDF will be generated without them (no errors)

## Testing

After adding your images:
1. Restart the app if it's running
2. Generate a new invoice PDF
3. Check that the logo appears at the top left and QR code at the bottom left

## Notes

- The images will be automatically resized to fit (max 120x120 pixels)
- The images are embedded directly in the PDF as base64 data
- You can use PNG (recommended for logos with transparency) or JPG format

