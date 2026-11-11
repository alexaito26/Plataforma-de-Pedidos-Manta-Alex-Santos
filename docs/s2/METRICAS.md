# Métricas de Pedidos

Experimento con Docker Compose y dos pestañas de Postman: primero
`GET /reporte/bloqueante` y enseguida `GET /health`.

- Estado de `/health`: **200 OK**.
- Tiempo de `/health` en Postman: **293 ms**.
- El resumen incluye pruebas anteriores y comprobaciones automáticas de salud de Docker.

Respuesta completa de `GET /metricas` después del experimento:

```json
{
  "umbralLentaMs": 1000,
  "rutas": [
    { "ruta": "GET /health", "peticiones": 56, "promedioMs": 0.34567662500080587, "maxMs": 2.5503480000006675, "lentas": 0 },
    { "ruta": "GET /favicon.ico", "peticiones": 7, "promedioMs": 0.5004974285702701, "maxMs": 1.1849350000002232, "lentas": 0 },
    { "ruta": "GET /reporte/bloqueante", "peticiones": 7, "promedioMs": 4049.871830857147, "maxMs": 20692.449334000004, "lentas": 6 },
    { "ruta": "GET /metricas", "peticiones": 1, "promedioMs": 0.5211310000013327, "maxMs": 0.5211310000013327, "lentas": 0 }
  ]
}
```

Postman mide desde que envía la solicitud hasta que recibe la respuesta.
Ese tiempo incluye la espera mientras el hilo principal está ocupado con el reporte.
El interceptor empieza a medir solo cuando Express puede procesar `/health`.
Por eso registra un tiempo bajo aunque el cliente haya esperado mucho más.
El cliente observa un fallo de lentitud o, si vence su límite de espera, un timeout;
en esta prueba recibió finalmente un 200, no un error HTTP.
