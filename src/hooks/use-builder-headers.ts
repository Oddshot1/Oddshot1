// ODDSHOT Builder Headers Hook
// Fetches signed builder authentication headers from secure server
import { useCallback } from 'react';

interface BuilderHeaders {
  POLY_BUILDER_API_KEY: string;
  POLY_BUILDER_TIMESTAMP: string;
  POLY_BUILDER_PASSPHRASE: string;
  POLY_BUILDER_SIGNATURE: string;
}

export function useBuilderHeaders() {
  const getBuilderHeaders = useCallback(async (
    method: string,
    path: string,
    body?: any
  ): Promise<BuilderHeaders | null> => {
    try {
      console.log('[useBuilderHeaders] Requesting builder signature for:', { method, path });
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-builder-sign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            method: method.toUpperCase(), 
            path, 
            body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : ''
          }),
        }
      );
      
      if (!response.ok) {
        console.error('[useBuilderHeaders] Failed to get builder headers:', response.status);
        return null;
      }
      
      const headers = await response.json();
      console.log('[useBuilderHeaders] Builder headers received successfully');
      
      return headers;
    } catch (error) {
      console.error('[useBuilderHeaders] Error getting builder headers:', error);
      return null;
    }
  }, []);
  
  return { getBuilderHeaders };
}

