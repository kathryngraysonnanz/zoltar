import { Button } from '@progress/kendo-react-buttons';

interface ShareButtonsProps {
  url: string;
  title: string;
  text: string;
}

export function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
    } catch (err) {
      // User cancelled or share failed - silently ignore
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', `${title}: ${text}`);
    twitterUrl.searchParams.set('url', url);
    window.open(twitterUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleFacebookShare = () => {
    const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
    facebookUrl.searchParams.set('u', url);
    window.open(facebookUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
    linkedInUrl.searchParams.set('url', url);
    window.open(linkedInUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // Could add toast notification here in future
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Mobile: Show native share button
  if (canNativeShare) {
    return (
      <div className="share-buttons">
        <Button
          themeColor="primary"
          className="fortune-btn share-btn-native"
          onClick={handleNativeShare}
        >
          📤 Share Fortune
        </Button>
        <Button
          themeColor="primary"
          className="fortune-btn-secondary share-btn-copy"
          onClick={handleCopyLink}
        >
          🔗 Copy Link
        </Button>
      </div>
    );
  }

  // Desktop: Show individual share buttons
  return (
    <div className="share-buttons">
      <Button
        themeColor="primary"
        className="fortune-btn share-btn-twitter"
        onClick={handleTwitterShare}
      >
        𝕏 Share
      </Button>
      <Button
        themeColor="primary"
        className="fortune-btn share-btn-facebook"
        onClick={handleFacebookShare}
      >
        Share
      </Button>
      <Button
        themeColor="primary"
        className="fortune-btn share-btn-linkedin"
        onClick={handleLinkedInShare}
      >
        in Share
      </Button>
      <Button
        themeColor="primary"
        className="fortune-btn-secondary share-btn-copy"
        onClick={handleCopyLink}
      >
        🔗 Copy Link
      </Button>
    </div>
  );
}
