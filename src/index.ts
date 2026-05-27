import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { getExchangeRate, getMultipleExchangeRates } from './frankfurter';
import { env } from './config';

const app = express();

// Seguridad Básica: Ocultar encabezados y proteger contra vulnerabilidades comunes
app.use(helmet());

// Seguridad: Habilitar CORS de manera segura (Ajusta esto en producción según tus dominios permitidos)
app.use(cors());

// Seguridad: Límite de peticiones para evitar ataques DDoS o abusos de facturación
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limitar cada IP a 100 peticiones por ventana de 15 min
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar el límite de peticiones solo a las rutas de la API
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10kb' })); // Límite de tamaño en el body para prevenir ataques de carga de memoria

app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/v1/rate', async (req: Request, res: Response): Promise<any> => {
  try {
    const base = (req.query.base as string) || 'USD';
    const quotesStr = (req.query.quote as string) || (req.query.quotes as string) || 'PEN';

    if (!base || !quotesStr) {
      return res.status(400).json({ error: 'Missing base or quotes query parameters' });
    }

    const quotes = quotesStr.split(',').map(q => q.trim().toUpperCase());
    
    if (quotes.length === 1) {
       const rate = await getExchangeRate(base.toUpperCase(), quotes[0]);
       return res.json({ base, quote: quotes[0], rate });
    }

    const rates = await getMultipleExchangeRates(base.toUpperCase(), quotes);
    return res.json({ base, rates });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/convert-many', async (req: Request, res: Response): Promise<any> => {
  try {
    const base = (req.query.base as string) || 'USD';
    const quotesStr = req.query.quotes as string;
    const amountStr = req.query.amount as string;
    
    if (!quotesStr || !amountStr) {
       return res.status(400).json({ error: 'Missing quotes or amount query parameters' });
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    const quotes = quotesStr.split(',').map(q => q.trim().toUpperCase());
    const rates = await getMultipleExchangeRates(base.toUpperCase(), quotes);
    
    const results: Record<string, number> = {};
    for (const quote of quotes) {
        if (rates[quote] !== undefined) {
             results[quote] = Number((amount * rates[quote]).toFixed(2));
        }
    }

    return res.json({ base, amount, rates, results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/currencies', async (req: Request, res: Response): Promise<any> => {
  try {
    const response = await fetch(`${env.FRANKFURTER_API_URL}/currencies`);
    if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.statusText}`);
    }
    const data = await response.json();
    
    let currenciesMap: Record<string, string> = {};
    
    if (Array.isArray(data)) {
        data.forEach(item => {
           currenciesMap[item.iso_code] = item.name; 
        });
    } else {
        currenciesMap = data;
    }
    
    return res.json(currenciesMap);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/history', async (req: Request, res: Response): Promise<any> => {
    try {
        const base = (req.query.base as string) || 'USD';
        const symbols = req.query.symbols as string;
        const start_date = req.query.start_date as string;
        const end_date = req.query.end_date as string || ''; 
        
        if (!start_date) {
            return res.status(400).json({ error: 'Missing start_date query parameter' });
        }

        let url = `${env.FRANKFURTER_API_URL}/rates?from=${start_date}&base=${base}`;
        if (end_date) url += `&to=${end_date}`;
        if (symbols) url += `&quotes=${symbols}`;

        const response = await fetch(url);
        if (!response.ok) {
             throw new Error(`Frankfurter API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return res.json(data);

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

app.listen(env.PORT, () => {
  console.log(`Currency Microservice running on http://localhost:${env.PORT}`);
});