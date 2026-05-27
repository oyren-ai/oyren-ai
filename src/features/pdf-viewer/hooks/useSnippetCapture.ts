import html2canvas from 'html2canvas';

interface CaptureAreaParams {
  element: HTMLElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useSnippetCapture() {
  const captureArea = async ({ element, x, y, width, height }: CaptureAreaParams): Promise<string> => {
    const canvas = await html2canvas(element, {
      x,
      y,
      width,
      height,
      backgroundColor: '#ffffff',
      logging: false,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      onclone: (clonedDoc) => {
        // Sanitize oklch colors implementation to prevent html2canvas crash
        // This is necessary because html2canvas doesn't support modern CSS color functions like oklch
        // typically found in newer frameworks (like Tailwind v4).
        const sanitize = (el: HTMLElement) => {
          if (el.style) {
            // Check specific properties that might cause features
            ['backgroundColor', 'color', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'].forEach(prop => {
              // @ts-ignore
              const value = el.style[prop];
              if (value && (value.includes('oklch') || value.includes('oklab') || value.includes('lch') || value.includes('lab'))) {
                // @ts-ignore
                el.style[prop] = prop.includes('background') ? '#ffffff' : '#000000';
              }
            });
          }
        };

        // Aggressively sanitize body and html to prevent background lookup crashes
        if (clonedDoc.documentElement) {
          clonedDoc.documentElement.style.backgroundColor = '#ffffff';
          sanitize(clonedDoc.documentElement);
        }
        if (clonedDoc.body) {
          clonedDoc.body.style.backgroundColor = '#ffffff';
          sanitize(clonedDoc.body);
        }

        // Walk the entire tree to sanitize all elements
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            sanitize(el);
          }
        });
      },
    });

    return canvas.toDataURL('image/png');
  };

  const dispatchImageEvent = (imageData: string, width: number, height: number) => {
    console.log(`[dispatchImageEvent] 📸 Dispatching image: size=${width}x${height}, dataLength=${imageData.length}, startsWithData:=${imageData.startsWith('data:')}`);
    const event = new CustomEvent('add-image-to-chat', {
      detail: {
        imageData,
        width,
        height,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  };

  const captureCanvas = (canvas: HTMLCanvasElement, x: number, y: number, width: number, height: number): string => {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const ctx = outputCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get 2d context for snippet capture');
    }

    // Draw the cropped area from source canvas
    ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

    return outputCanvas.toDataURL('image/png');
  };

  return {
    captureArea,
    captureCanvas,
    dispatchImageEvent
  };
}