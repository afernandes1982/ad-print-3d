/**
 * Helper utility to remove background and checkered (gray/white pixel grids) backgrounds
 * and replace them with standard transparent pixels for 3D printed store catalog items.
 */
export function cleanPngCheckersAndSetWhite(imgSrc: string): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a base64 image or web image, return as-is
    if (!imgSrc || (!imgSrc.startsWith('data:image/') && !imgSrc.startsWith('http') && !imgSrc.startsWith('/'))) {
      resolve(imgSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imgSrc);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Step 1: Initialize flood fill from corners and edges
        const width = canvas.width;
        const height = canvas.height;
        const visited = new Uint8Array(width * height);
        
        // Sample edges to determine background color
        const corners = [
          0,
          (width - 1) * 4,
          (height - 1) * width * 4,
          ((height - 1) * width + width - 1) * 4
        ];

        // Check if corners are roughly the same color to determine if we have a solid background
        let isSolidBg = true;
        const refR = data[corners[0]], refG = data[corners[0]+1], refB = data[corners[0]+2];
        for (const idx of corners) {
           if (Math.abs(data[idx] - refR) > 20 || Math.abs(data[idx+1] - refG) > 20 || Math.abs(data[idx+2] - refB) > 20) {
             isSolidBg = false;
             break;
           }
        }

        if (isSolidBg) {
          const bgR = refR, bgG = refG, bgB = refB;
          const tolerance = 25; // Lower tolerance to prevent bleeding into object
          const visited = new Uint8Array(width * height);
          
          for (const startNode of [0, width - 1, (height - 1) * width, height * width - 1]) {
            const stack = [startNode];
            visited[startNode] = 1;
            
            while (stack.length > 0) {
              const current = stack.pop()!;
              const cx = current % width;
              const cy = Math.floor(current / width);
              
              const pIdx = current * 4;
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const a = data[pIdx + 3];

              if (a === 0) continue;
              
              if (Math.abs(r - bgR) <= tolerance && Math.abs(g - bgG) <= tolerance && Math.abs(b - bgB) <= tolerance) {
                  data[pIdx + 3] = 0;
                  
                  if (cx > 0 && !visited[current - 1]) { visited[current - 1] = 1; stack.push(current - 1); }
                  if (cx < width - 1 && !visited[current + 1]) { visited[current + 1] = 1; stack.push(current + 1); }
                  if (cy > 0 && !visited[current - width]) { visited[current - width] = 1; stack.push(current - width); }
                  if (cy < height - 1 && !visited[current + width]) { visited[current + width] = 1; stack.push(current + width); }
              }
            }
          }
        }
        
        // Always clean up almost transparent or checkered white separately if needed
        for (let i = 0; i < data.length; i += 4) {
           const r = data[i]; const g = data[i + 1]; const b = data[i + 2]; const a = data[i + 3];
           if (a === 0) continue;
           
           // If pixel is pure white (or very close to it) and we want it to be transparent (e.g. standard product shots)
           // But be careful not to remove white from the object itself! We only do this if it's very bright.
           if (r > 248 && g > 248 && b > 248) {
              // Only make it transparent if it's true white 
              data[i + 3] = 0;
           }
        }

        ctx.putImageData(imgData, 0, 0);
        // Transparente needs PNG
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Could not programmatically clean checkered background:', err);
        resolve(imgSrc);
      }
    };

    img.onerror = () => {
      resolve(imgSrc);
    };
  });
}

