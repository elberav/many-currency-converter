async function loadCurrencies() {
    try {
        const res = await fetch('/api/v1/currencies');
        const currencies = await res.json();
        
        const baseSelect = document.getElementById('base');
        const quoteSelect = document.getElementById('quote');
        
        baseSelect.innerHTML = '';
        quoteSelect.innerHTML = '';

        const sortedCodes = Object.keys(currencies).sort();

        sortedCodes.forEach(code => {
            const name = currencies[code];
            const optionText = `${code} - ${name}`;
            
            baseSelect.add(new Option(optionText, code, false, code === 'USD'));
            quoteSelect.add(new Option(optionText, code, false, code === 'PEN'));
        });
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').textContent = 'Error cargando las monedas. Revisa tu conexión.';
    }
}

async function testAPI(endpoint) {
    const base = document.getElementById('base').value;
    const quoteSelect = document.getElementById('quote');
    const selectedQuotes = Array.from(quoteSelect.selectedOptions).map(opt => opt.value).join(',');
    
    const amount = document.getElementById('amount').value;
    const resultDiv = document.getElementById('result');

    if (!selectedQuotes) {
        resultDiv.style.color = '#EF4444';
        resultDiv.textContent = 'Por favor selecciona al menos una moneda destino.';
        return;
    }

    resultDiv.style.color = '#FCD34D';
    resultDiv.textContent = 'Procesando petición...';

    try {
        let url = '';
        
        if (endpoint === 'history') {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 30);
            
            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];
            
            url = `/api/v1/history?base=${base}&symbols=${selectedQuotes}&start_date=${startStr}&end_date=${endStr}`;
            resultDiv.textContent = `Consultando historial de últimos 30 días...\n${url}`;
        } else if (endpoint === 'convert') {
             url = `/api/v1/convert-many?base=${base}&quotes=${selectedQuotes}&amount=${amount}`;
        } else {
            url = `/api/v1/rate?base=${base}&quotes=${selectedQuotes}`;
        }

        const startTime = performance.now();
        const res = await fetch(url);
        const endTime = performance.now();
        const timeTaken = (endTime - startTime).toFixed(0);

        const data = await res.json();
        
        if (res.ok) {
            resultDiv.style.color = '#10B981';
            resultDiv.textContent = `// Tiempo de respuesta: ${timeTaken}ms\n` + JSON.stringify(data, null, 2);
        } else {
            resultDiv.style.color = '#EF4444';
            resultDiv.textContent = `// Error HTTP ${res.status}\n` + JSON.stringify(data, null, 2);
        }
    } catch (error) {
        resultDiv.style.color = '#EF4444';
        resultDiv.textContent = 'Error de conexión: ' + error.message;
    }
}

document.getElementById('btn-convert').addEventListener('click', () => testAPI('convert'));
document.getElementById('btn-rate').addEventListener('click', () => testAPI('rate'));
document.getElementById('btn-history').addEventListener('click', () => testAPI('history'));

// Interceptar el scroll del ratón en la caja de monedas para hacerlo más lento
const quoteSelectBox = document.getElementById('quote');
quoteSelectBox.addEventListener('wheel', (e) => {
    e.preventDefault();
    // En lugar de saltar 3-4 opciones (default), saltamos de 1 en 1 (aprox 35px)
    // Esto lo hace sentir 3 puntos más lento y más suave.
    const scrollAmount = e.deltaY > 0 ? 35 : -35; 
    quoteSelectBox.scrollBy({ top: scrollAmount, behavior: 'smooth' });
});

loadCurrencies();