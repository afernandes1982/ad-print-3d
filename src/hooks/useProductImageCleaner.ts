import { useEffect, useRef } from 'react';
import { Product } from '../types';
import { cleanPngCheckersAndSetWhite } from '../utils/imageCleaner';

/**
 * Custom hook to automatically monitor all products and process newly added
 * and existing product images using cleanPngCheckersAndSetWhite.
 * This guarantees a clean, consistent white background for all items shown in the catalog.
 */
export function useProductImageCleaner(
  products: Product[],
  updateProducts: (updatedList: Product[]) => void
) {
  // Keep track of image sources that have already been cleaned or checked to prevent infinite loops
  const processedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!products || products.length === 0) return;

    // Find products whose imageUrl holds an external web image or data URL and hasn't been checked yet
    const pendingProducts = products.filter((product) => {
      const url = product.imageUrl;
      if (!url) return false;
      
      // We only clean web URLs and data URIs (not short internal template names like 'estrela-espiral' or 'nexo-cube')
      const isProcessable = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
      
      return isProcessable && !processedUrlsRef.current.has(url);
    });

    if (pendingProducts.length === 0) return;

    // Process them sequentially or in parallel, then update state once done
    let hasChanges = false;
    const updatedProducts = [...products];

    const cleanPromises = pendingProducts.map(async (product) => {
      const originalUrl = product.imageUrl;
      // Mark as processed immediately to prevent duplicate requests in the next render cycle before resolving
      processedUrlsRef.current.add(originalUrl);

      try {
        const cleanedUrl = await cleanPngCheckersAndSetWhite(originalUrl);
        
        if (cleanedUrl && cleanedUrl !== originalUrl) {
          const idx = updatedProducts.findIndex((p) => p.id === product.id);
          if (idx !== -1) {
            updatedProducts[idx] = {
              ...updatedProducts[idx],
              imageUrl: cleanedUrl,
            };
            hasChanges = true;
            // Also mark the new base64 URL as processed so we don't try to clean it again
            processedUrlsRef.current.add(cleanedUrl);
          }
        }
      } catch (err) {
        console.warn(`Error cleaning image background for product ${product.id}:`, err);
      }
    });

    Promise.all(cleanPromises).then(() => {
      if (hasChanges) {
        updateProducts(updatedProducts);
      }
    });
  }, [products, updateProducts]);
}
