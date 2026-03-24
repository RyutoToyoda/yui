const fs = require('fs');

let code = fs.readFileSync('src/components/HelpAdvisor.tsx', 'utf8');

const scrollLockEffect = `  // スクロール制御 (オーバーレイ時の背景スクロール防止)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // iOS Safari用のハック
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

`;

code = code.replace(
  '  // メッセージが増えたら一番下までスクロール',
  scrollLockEffect + '  // メッセージが増えたら一番下までスクロール'
);

// To fix overlay height on mobile browsers, use `h-[100dvh]` rather than just `inset-0` because inset-0 stretches behind browser bars differently sometimes. Also add `overscroll-none`.
// Existing: className="fixed inset-0 z-[60] flex flex-col w-full max-w-full overflow-x-hidden bg-yui-earth-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
code = code.replace(
  /className="fixed inset-0 z-\[60\] flex flex-col w-full max-w-full overflow-x-hidden bg-yui-earth-50 animate-in fade-in slide-in-from-bottom-4 duration-300"/,
  'className="fixed inset-0 z-[60] flex flex-col h-[100dvh] w-full max-w-full overflow-x-hidden bg-yui-earth-50 animate-in fade-in slide-in-from-bottom-4 duration-300 overscroll-none"'
);

// We should also make sure the scrolling container (`flex-1 overflow-y-auto`) itself handles touch properly, overriding touch-none if needed. 
// "fixed inset-0 z-[60] flex flex-col h-[100dvh] ..." -> Since body has `touchAction = 'none'`, the overlay itself can still override. But wait, `touch-action: none` on BODY disables ALL touching. We need the chat to scroll!
// Actually, using `touchAction = "none"` on body kills scrolling globally. It's better to NOT mess with `touch-action` globally if we want a sub-div to scroll, or we have to add `touch-action: pan-y` locally, but `overflow: hidden` on body is usually enough for the background.
// Let's modify the script to remove the touchAction hack to avoid breaking scrolling in the chat modal itself.

fs.writeFileSync('src/components/HelpAdvisor.tsx', code, 'utf8');
