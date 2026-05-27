import { env } from './config';
import { cache } from './cache';

const CACHE_TTL = 12 * 60 * 60; // 12 horas en segundos

export async function getExchangeRate(base: string, quote: string): Promise<number> {
  const cacheKey = `rate_${base}_${quote}`;
  const cachedRate = cache.get(cacheKey);

  if (cachedRate) {
    return cachedRate;
  }

  try {
    const response = await fetch(`${env.FRANKFURTER_API_URL}/rate/${base}/${quote}`);
    
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const rate = data.rate;

    if (rate) {
      cache.set(cacheKey, rate, CACHE_TTL);
      return rate;
    }
    
    throw new Error('Rate not found in API response');
  } catch (error) {
    console.error(`[Currency] Error getting exchange rate for ${base} to ${quote}:`, error);
    throw new Error(`Could not fetch rate for ${base}/${quote}. Details: ${(error as Error).message}`);
  }
}

export async function getMultipleExchangeRates(base: string, quotes: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const missingQuotes: string[] = [];

  for (const quote of quotes) {
    const cacheKey = `rate_${base}_${quote}`;
    const cachedRate = cache.get(cacheKey);
    if (cachedRate) {
      result[quote] = cachedRate;
    } else {
      missingQuotes.push(quote);
    }
  }

  if (missingQuotes.length > 0) {
    const quotesParam = missingQuotes.join(',');
    try {
      const response = await fetch(`${env.FRANKFURTER_API_URL}/rates?base=${base}&quotes=${quotesParam}`);
      
      if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
         for (const item of data) {
             const quote = item.quote;
             const rate = item.rate;
             
             if (quote && rate) {
                 result[quote] = rate;
                 cache.set(`rate_${base}_${quote}`, rate, CACHE_TTL);
             }
         }
      }
      
      for (const missing of missingQuotes) {
         if (result[missing] === undefined) {
             console.warn(`[Currency] Rate not found in API for ${base}/${missing}`);
         }
      }

    } catch (error) {
      console.error(`[Currency] Error getting multiple rates for ${base} to [${missingQuotes.join(',')}]`, error);
      throw new Error(`Could not fetch multiple rates. Details: ${(error as Error).message}`);
    }
  }

  return result;
}