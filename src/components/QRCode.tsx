import { QRCode as KendoQRCode } from '@progress/kendo-react-barcodes';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCode({ url, size = 120, className = '' }: QRCodeProps) {
  return (
    <div className={className}>
      <KendoQRCode
        value={url}
        size={size}
        errorCorrection="M"
        color="#000000"
        background="#ffffff"
      />
    </div>
  );
}
