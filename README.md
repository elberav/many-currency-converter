# Currency Converter API Microservice

Un microservicio Serverless-ready para conversión de divisas, utilizando la API pública de Frankfurter. Cuenta con un sistema de caché en RAM para optimizar tiempos de respuesta y una interfaz web de prueba.
![image](https://github.com/elberav/many-currency-converter/blob/master/public/image.jpeg)

## 🔗 Endpoints de Frankfurter Utilizados

Para construir este microservicio, nos apoyamos en la API v2 de Frankfurter, específicamente en los siguientes endpoints:

- **`/v2/currencies`**: Se usa para obtener el catálogo completo de monedas globales soportadas, incluyendo sus códigos ISO y nombres completos.
- **`/v2/rate/{base}/{quote}`**: Se usa para obtener la tasa de cambio exacta y actual entre una moneda de origen (base) y una de destino (quote).
- **`/v2/rates?from={start}&to={end}&base={base}&quotes={quotes}`**: Se usa para obtener la serie temporal (historial) de fluctuaciones entre monedas en un rango de fechas.

---

## 🚀 Instalación y Ejecución

1. Instalar dependencias con `pnpm`:
   ```bash
   pnpm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```
3. Compilar e iniciar en Producción:
   ```bash
   pnpm run build
   pnpm start
   ```

El servicio se ejecuta por defecto en `http://localhost:8000`. También incluye una página web de prueba accesible ingresando a esa misma ruta desde un navegador.

---

## 📖 Guía de Uso de la API del Microservicio

Este microservicio actúa como un Gateway o puente. Puedes consumirlo desde cualquier aplicación, frontend o backend, independientemente del lenguaje de programación.

### 1. Obtener monedas soportadas
`GET /api/v1/currencies`
Devuelve un objeto JSON con los códigos ISO de las monedas y sus nombres.

### 2. Obtener tasa de cambio (Rate)
`GET /api/v1/rate?base=USD&quotes=PEN,EUR`
Devuelve la tasa de cambio actual. Puede aceptar una sola moneda o varias separadas por comas en el parámetro `quote` o `quotes`.

**Respuesta Simple (1 moneda):**
```json
{
  "base": "USD",
  "quote": "PEN",
  "rate": 3.75
}
```

**Respuesta Múltiple (Varias monedas):**
```json
{
  "base": "USD",
  "rates": {
    "PEN": 3.75,
    "EUR": 0.92
  }
}
```

### 3. Convertir a múltiples monedas simultáneamente
`GET /api/v1/convert-many?base=USD&quotes=PEN,EUR,JPY&amount=100`
Convierte un monto desde una moneda base hacia múltiples monedas destino de manera eficiente (una sola llamada a Frankfurter si no están en caché).

**Respuesta:**
```json
{
  "base": "USD",
  "amount": 100,
  "rates": {
    "PEN": 3.75,
    "EUR": 0.92,
    "JPY": 150.30
  },
  "results": {
    "PEN": 375,
    "EUR": 92,
    "JPY": 15030
  }
}
```

### 4. Consultar el historial
`GET /api/v1/history?base=USD&symbols=PEN,EUR&start_date=2026-04-27&end_date=2026-05-27`
Devuelve el historial diario de la tasa de cambio en un periodo de tiempo.

---

## 💻 Ejemplos de Consumo desde Otros Lenguajes

A continuación, ejemplos completos de cómo consumir los 4 endpoints disponibles desde diferentes lenguajes.

### 🐍 Python (usando `requests`)
```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# 1. Obtener monedas soportadas
res_currencies = requests.get(f"{BASE_URL}/currencies")
print("Monedas:", res_currencies.json())

# 2. Obtener tasa de cambio (Rate)
res_rate = requests.get(f"{BASE_URL}/rate?base=USD&quote=PEN")
print("Tasa de cambio:", res_rate.json())

# 3. Convertir a múltiples monedas (Convert Many)
res_convert = requests.get(f"{BASE_URL}/convert-many?base=USD&quotes=PEN,EUR,CAD&amount=100")
print("Conversión Múltiple:", res_convert.json())

# 4. Consultar el historial (History)
res_history = requests.get(f"{BASE_URL}/history?base=USD&symbols=PEN&start_date=2026-05-01&end_date=2026-05-27")
print("Historial:", res_history.json())
```

### 🐹 Go (usando la librería estándar `net/http`)
```go
package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func fetchEndpoint(path string) {
	resp, err := http.Get("http://localhost:8000/api/v1" + path)
	if err == nil {
		defer resp.Body.Close()
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Printf("Respuesta de %s:\n%s\n\n", path, string(body))
	}
}

func main() {
	// 1. Obtener monedas soportadas
	fetchEndpoint("/currencies")

	// 2. Obtener tasa de cambio (Rate)
	fetchEndpoint("/rate?base=USD&quote=PEN")

	// 3. Convertir a múltiples monedas (Convert Many)
	fetchEndpoint("/convert-many?base=USD&quotes=PEN,EUR,CAD&amount=100")

	// 4. Consultar el historial (History)
	fetchEndpoint("/history?base=USD&symbols=PEN&start_date=2026-05-01&end_date=2026-05-27")
}
```

### 🟢 Node.js / JavaScript Frontend (usando `fetch`)
```javascript
const BASE_URL = "http://localhost:8000/api/v1";

async function runExamples() {
    try {
        // 1. Obtener monedas soportadas
        const resCurrencies = await fetch(`${BASE_URL}/currencies`);
        console.log("Monedas:", await resCurrencies.json());

        // 2. Obtener tasa de cambio (Rate)
        const resRate = await fetch(`${BASE_URL}/rate?base=USD&quote=PEN`);
        console.log("Tasa de cambio:", await resRate.json());

        // 3. Convertir a múltiples monedas (Convert Many)
        const resConvert = await fetch(`${BASE_URL}/convert-many?base=USD&quotes=PEN,EUR,CAD&amount=100`);
        console.log("Conversión Múltiple:", await resConvert.json());

        // 4. Consultar el historial (History)
        const resHistory = await fetch(`${BASE_URL}/history?base=USD&symbols=PEN&start_date=2026-05-01&end_date=2026-05-27`);
        console.log("Historial:", await resHistory.json());

    } catch (error) {
        console.error("Error al consultar la API:", error);
    }
}

runExamples();
```