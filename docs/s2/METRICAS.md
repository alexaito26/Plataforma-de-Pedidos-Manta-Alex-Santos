# Métricas de Pedidos

Experimento con Docker Compose y solicitudes concurrentes desde el navegador: primero
`GET /reporte/bloqueante` y, 100 ms después, `GET /health?experimento=4`.
El parámetro evita reutilizar una respuesta en caché; la ruta medida es `/health`.

- Estado de `/health`: **200 OK**.
- Tiempo en la red del navegador: **1450.823 ms** (medición con `fetch`: 1451.7 ms).
- El resumen incluye pruebas anteriores y comprobaciones automáticas de salud de Docker.

Respuesta completa de `GET /metricas` después del experimento:

```json
{
  "umbralLentaMs": 1000,
  "rutas": [
    { "ruta": "GET /health", "peticiones": 12, "promedioMs": 0.5369712500003819, "maxMs": 2.5503480000006675, "lentas": 0 },
    { "ruta": "GET /favicon.ico", "peticiones": 7, "promedioMs": 0.5004974285702701, "maxMs": 1.1849350000002232, "lentas": 0 },
    { "ruta": "GET /reporte/bloqueante", "peticiones": 4, "promedioMs": 6320.4179965, "maxMs": 20692.449334000004, "lentas": 4 }
  ]
}
```

El navegador mide desde que envía la solicitud hasta que recibe la respuesta.
Ese tiempo incluye la espera mientras el hilo principal está ocupado con el reporte.
El interceptor empieza a medir solo cuando Express puede procesar `/health`.
Por eso registra un tiempo bajo aunque el cliente haya esperado mucho más.
El cliente observa un fallo de lentitud o, si vence su límite de espera, un timeout;
en esta prueba recibió finalmente un 200, no un error HTTP.
