import { Button } from '@progress/kendo-react-buttons';
import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  text: string;
}

export function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
        handleCopyLink();
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="share-buttons">
      {canNativeShare && (
        <Button
          themeColor="primary"
          size="large"
          className="fortune-btn share-btn-native"
          onClick={handleNativeShare}
        >
          📤 Share Fortune
        </Button>
      )}
      <Button
        fillMode={canNativeShare ? "flat" : "solid"}
        themeColor="primary"
        size="large"
        className={canNativeShare ? "fortune-btn-secondary share-btn-copy" : "fortune-btn share-btn-copy"}
        onClick={handleCopyLink}
      >
        {copied ? '✓ Link Copied!' : '🔗 Copy Link'}
      </Button>
    </div>
  );
}
