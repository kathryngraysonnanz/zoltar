import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCode({ url, size = 120, className = '' }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function generateQR() {
      try {
        const qrDataUrl = await QRCodeLib.toDataURL(url, {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (!cancelled) {
          setDataUrl(qrDataUrl);
          setError(false);
        }
      } catch (err) {
        console.error('QR code generation failed:', err);
        if (!cancelled) {
          setError(true);
        }
      }
    }

    generateQR();
    return () => { cancelled = true; };
  }, [url, size]);

  if (error) {
    return null; // Gracefully hide on error
  }

  if (!dataUrl) {
    return (
      <div 
        className={`qr-placeholder ${className}`}
        style={{ width: size, height: size }}
        aria-label="Generating QR code..."
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR code linking to ${url}`}
      width={size}
      height={size}
      className={className}
    />
  );
}
