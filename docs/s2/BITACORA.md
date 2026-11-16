# Bitácora · Arquitecturas y procesos · Alex Sebastian Santos Cornejo

## Entorno

| Dato | Valor |
| --- | --- |
| Equipo (CPU, RAM) | Intel Core i7-13700, 16 núcleos físicos y 24 procesadores lógicos; 34.118.803.456 bytes de RAM (aprox. 31,8 GiB). |
| nucleos según /metricas | 24 |
| MAX_TRABAJADORES y MAX_COLA | 24 y 48, valores predeterminados. |
| Duración de un reporte con n=2000000 | 242 ms, prueba individual de `/reporte/pool` antes de las cargas. |

## 1. Resultados

| Escenario | Latencia 50 % | Latencia máx. | Respuestas 2xx | Respuestas 503 | Timeouts | bucle.maxMs |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · bloqueo (/health) | 1 ms | 1534 ms | 151361 | 0 | 0 | 1539 ms |
| 2 · worker sin límite | 1018 ms | 2408 ms | 936 | 0 | 0 | 62 ms |
| 3 · pool con límite | 956 ms | 1368 ms | 1024 | 0 | 0 | 28 ms |

Se reinició Pedidos antes de cada escenario. Se utilizó autocannon 8 con la opción
`-j`, que conserva la salida completa y los contadores exactos en JSON. En el
escenario 1 se enviaron dos solicitudes HTTP automatizadas desde PowerShell mientras
corría autocannon, en lugar de Postman o el navegador; los reportes tardaron 1530 y
1526 ms. Las comprobaciones de salud de Docker también aparecen en `/metricas`.
Al terminar autocannon aún podían quedar solicitudes en curso: sus contadores no
necesariamente coinciden con los de `/metricas`, que se consultó después.

### Escenario 1 · salida completa de autocannon y respuesta de /metricas

Comando: `npx -y autocannon@8 -j -c 20 -d 15 http://localhost:3000/health`

```json
{
  "url": "http://localhost:3000/health",
  "connections": 20,
  "sampleInt": 1000,
  "pipelining": 1,
  "workers": 0,
  "duration": 15.05,
  "samples": 15,
  "start": "2026-11-16T14:19:47.385Z",
  "finish": "2026-11-16T14:20:02.430Z",
  "errors": 0,
  "timeouts": 0,
  "mismatches": 0,
  "non2xx": 0,
  "resets": 0,
  "1xx": 0,
  "2xx": 151361,
  "3xx": 0,
  "4xx": 0,
  "5xx": 0,
  "statusCodeStats": {
    "200": {
      "count": 151361
    }
  },
  "latency": {
    "average": 1.66,
    "mean": 1.66,
    "stddev": 24.86,
    "min": 1,
    "max": 1534,
    "p0_001": 0,
    "p0_01": 0,
    "p0_1": 0,
    "p1": 0,
    "p2_5": 0,
    "p10": 1,
    "p25": 1,
    "p50": 1,
    "p75": 1,
    "p90": 2,
    "p97_5": 3,
    "p99": 4,
    "p99_9": 7,
    "p99_99": 1532,
    "p99_999": 1533,
    "totalCount": 151361
  },
  "requests": {
    "average": 10091.4,
    "mean": 10091.4,
    "stddev": 4581.88,
    "min": 451,
    "max": 13617,
    "total": 151361,
    "p0_001": 0,
    "p0_01": 0,
    "p0_1": 0,
    "p1": 0,
    "p2_5": 0,
    "p10": 451,
    "p25": 7667,
    "p50": 12607,
    "p75": 13135,
    "p90": 13471,
    "p97_5": 13623,
    "p99": 13623,
    "p99_9": 13623,
    "p99_99": 13623,
    "p99_999": 13623,
    "sent": 151381
  },
  "throughput": {
    "average": 2734649.6,
    "mean": 2734649.6,
    "stddev": 1241650.8,
    "min": 122221,
    "max": 3690207,
    "total": 41018831,
    "p0_001": 0,
    "p0_01": 0,
    "p0_1": 0,
    "p1": 0,
    "p2_5": 0,
    "p10": 122239,
    "p25": 2077695,
    "p50": 3416063,
    "p75": 3559423,
    "p90": 3651583,
    "p97_5": 3690495,
    "p99": 3690495,
    "p99_9": 3690495,
    "p99_99": 3690495,
    "p99_999": 3690495
  }
}
```

```json
{
  "umbralLentaMs": 1000,
  "nucleos": 24,
  "bucle": {
    "p50Ms": 10,
    "p99Ms": 12,
    "maxMs": 1539
  },
  "pool": {
    "maxTrabajadores": 24,
    "activos": 0,
    "enCola": 0,
    "maxCola": 48,
    "rechazadas": 0
  },
  "rutas": [
    {
      "ruta": "GET /health",
      "peticiones": 151382,
      "promedioMs": 0.050730605309744166,
      "maxMs": 3.0269049999999424,
      "lentas": 0
    },
    {
      "ruta": "GET /reporte/bloqueante",
      "peticiones": 2,
      "promedioMs": 1528.6183385,
      "maxMs": 1531.1087269999998,
      "lentas": 2
    }
  ]
}
```

### Escenario 2 · salida completa de autocannon y respuesta de /metricas

Comando: `npx -y autocannon@8 -j -c 50 -d 20 "http://localhost:3000/reporte/worker?n=2000000"`

```json
{
  "url": "http://localhost:3000/reporte/worker?n=2000000",
  "connections": 50,
  "sampleInt": 1000,
  "pipelining": 1,
  "workers": 0,
  "duration": 20.16,
  "samples": 20,
  "start": "2026-11-16T14:20:07.285Z",
  "finish": "2026-11-16T14:20:27.444Z",
  "errors": 0,
  "timeouts": 0,
  "mismatches": 0,
  "non2xx": 0,
  "resets": 0,
  "1xx": 0,
  "2xx": 936,
  "3xx": 0,
  "4xx": 0,
  "5xx": 0,
  "statusCodeStats": {
    "200": {
      "count": 936
    }
  },
  "latency": {
    "average": 1043.38,
    "mean": 1043.38,
    "stddev": 258.17,
    "min": 511,
    "max": 2408,
    "p0_001": 511,
    "p0_01": 511,
    "p0_1": 511,
    "p1": 575,
    "p2_5": 620,
    "p10": 738,
    "p25": 858,
    "p50": 1018,
    "p75": 1185,
    "p90": 1368,
    "p97_5": 1590,
    "p99": 1823,
    "p99_9": 2408,
    "p99_99": 2408,
    "p99_999": 2408,
    "totalCount": 936
  },
  "requests": {
    "average": 46.8,
    "mean": 46.8,
    "stddev": 9.52,
    "min": 12,
    "max": 59,
    "total": 936,
    "p0_001": 12,
    "p0_01": 12,
    "p0_1": 12,
    "p1": 12,
    "p2_5": 12,
    "p10": 37,
    "p25": 44,
    "p50": 49,
    "p75": 50,
    "p90": 55,
    "p97_5": 59,
    "p99": 59,
    "p99_9": 59,
    "p99_99": 59,
    "p99_999": 59,
    "sent": 986
  },
  "throughput": {
    "average": 13924.45,
    "mean": 13924.45,
    "stddev": 2832.89,
    "min": 3564,
    "max": 17554,
    "total": 278485,
    "p0_001": 3565,
    "p0_01": 3565,
    "p0_1": 3565,
    "p1": 3565,
    "p2_5": 3565,
    "p10": 10999,
    "p25": 13095,
    "p50": 14583,
    "p75": 14887,
    "p90": 16367,
    "p97_5": 17567,
    "p99": 17567,
    "p99_9": 17567,
    "p99_99": 17567,
    "p99_999": 17567
  }
}
```

```json
{
  "umbralLentaMs": 1000,
  "nucleos": 24,
  "bucle": {
    "p50Ms": 10,
    "p99Ms": 30,
    "maxMs": 62
  },
  "pool": {
    "maxTrabajadores": 24,
    "activos": 0,
    "enCola": 0,
    "maxCola": 48,
    "rechazadas": 0
  },
  "rutas": [
    {
      "ruta": "GET /reporte/worker",
      "peticiones": 936,
      "promedioMs": 1036.4994394807704,
      "maxMs": 2300.025323,
      "lentas": 493
    },
    {
      "ruta": "GET /health",
      "peticiones": 2,
      "promedioMs": 0.9586314999987735,
      "maxMs": 1.6944779999994353,
      "lentas": 0
    }
  ]
}
```

### Escenario 3 · salida completa de autocannon y respuesta de /metricas

Comando: `npx -y autocannon@8 -j -c 50 -d 20 "http://localhost:3000/reporte/pool?n=2000000"`

```json
{
  "url": "http://localhost:3000/reporte/pool?n=2000000",
  "connections": 50,
  "sampleInt": 1000,
  "pipelining": 1,
  "workers": 0,
  "duration": 20.11,
  "samples": 20,
  "start": "2026-11-16T14:20:32.267Z",
  "finish": "2026-11-16T14:20:52.375Z",
  "errors": 0,
  "timeouts": 0,
  "mismatches": 0,
  "non2xx": 0,
  "resets": 0,
  "1xx": 0,
  "2xx": 1024,
  "3xx": 0,
  "4xx": 0,
  "5xx": 0,
  "statusCodeStats": {
    "200": {
      "count": 1024
    }
  },
  "latency": {
    "average": 958.15,
    "mean": 958.15,
    "stddev": 70.47,
    "min": 465,
    "max": 1368,
    "p0_001": 465,
    "p0_01": 465,
    "p0_1": 473,
    "p1": 628,
    "p2_5": 889,
    "p10": 921,
    "p25": 937,
    "p50": 956,
    "p75": 985,
    "p90": 1014,
    "p97_5": 1084,
    "p99": 1151,
    "p99_9": 1353,
    "p99_99": 1368,
    "p99_999": 1368,
    "totalCount": 1024
  },
  "requests": {
    "average": 51.2,
    "mean": 51.2,
    "stddev": 5.68,
    "min": 28,
    "max": 57,
    "total": 1024,
    "p0_001": 28,
    "p0_01": 28,
    "p0_1": 28,
    "p1": 28,
    "p2_5": 28,
    "p10": 49,
    "p25": 51,
    "p50": 52,
    "p75": 54,
    "p90": 54,
    "p97_5": 57,
    "p99": 57,
    "p99_9": 57,
    "p99_99": 57,
    "p99_999": 57,
    "sent": 1074
  },
  "throughput": {
    "average": 15112.2,
    "mean": 15112.2,
    "stddev": 1672.77,
    "min": 8260,
    "max": 16817,
    "total": 302230,
    "p0_001": 8263,
    "p0_01": 8263,
    "p0_1": 8263,
    "p1": 8263,
    "p2_5": 8263,
    "p10": 14471,
    "p25": 15055,
    "p50": 15343,
    "p75": 15935,
    "p90": 15935,
    "p97_5": 16831,
    "p99": 16831,
    "p99_9": 16831,
    "p99_99": 16831,
    "p99_999": 16831
  }
}
```

```json
{
  "umbralLentaMs": 1000,
  "nucleos": 24,
  "bucle": {
    "p50Ms": 10,
    "p99Ms": 15,
    "maxMs": 28
  },
  "pool": {
    "maxTrabajadores": 24,
    "activos": 24,
    "enCola": 23,
    "maxCola": 48,
    "rechazadas": 0
  },
  "rutas": [
    {
      "ruta": "GET /reporte/pool",
      "peticiones": 1025,
      "promedioMs": 954.3880301951225,
      "maxMs": 1277.1239240000002,
      "lentas": 149
    },
    {
      "ruta": "GET /health",
      "peticiones": 2,
      "promedioMs": 0.4118380000018078,
      "maxMs": 0.5723050000015064,
      "lentas": 0
    }
  ]
}
```

## 2. Análisis

### 1. Bloqueo y medición del bucle

En el escenario 1, `bucle.maxMs` fue **1539 ms** y el máximo de
`GET /health` medido por el interceptor fue **3,03 ms**. El bucle quedó
ocupado calculando los primos y su monitor detectó el retraso de ejecución.
El interceptor comienza solo cuando Express puede recibir y procesar la petición;
la espera anterior queda fuera de su cronómetro. Autocannon sí observó 1534 ms
de latencia máxima desde el cliente.

### 2. Un hilo por petición

El escenario 2 completó **936 respuestas 2xx** y registró **0 timeouts**;
no se produjo un timeout en este equipo y esta ejecución. Con 50 solicitudes
simultáneas, los hilos compiten por CPU y memoria y se paga su creación y gestión.
Aunque el reporte individual tardó 242 ms con el pool, la mediana del cliente
subió a 1018 ms y el máximo a 2408 ms. Una máquina menos capaz o una carga
mayor podría llegar al límite de espera, pero aquí no ocurrió.

### 3. Pool y modelos de fallo

El escenario 3 produjo **1024 respuestas 2xx** y **0 respuestas 503**.
Con 24 hilos y una cola de 48 caben hasta 72 trabajos, más que las 50
conexiones usadas; el contador `rechazadas` también quedó en cero.
Un 503 con `Retry-After` es un rechazo explícito por sobrecarga y dice cuándo
intentar de nuevo; un timeout es un fallo por omisión desde la perspectiva del
cliente: no recibió respuesta a tiempo y desconoce si el trabajo se ejecutó.

### 4. Reintentos

En esta medición no hubo 503 ni rechazo, por lo que no se observó una tormenta
de reintentos: la cola de 48 no llegó a llenarse con 50 clientes. Si se llena,
autocannon sigue enviando solicitudes sin respetar `Retry-After`, aumentando
el tráfico y el trabajo de rechazar peticiones durante la sobrecarga.
Un cliente bien diseñado debe respetar la cabecera, limitar sus reintentos y
usar espera exponencial con variación aleatoria para evitar la sincronización.

### 5. Tres réplicas

Cada proceso mantendría sus propias métricas, cola y contador de rechazos;
una petición a `/metricas` mostraría únicamente la réplica elegida por el
balanceador, no un total global. Con los límites medidos, tres réplicas podrían
ejecutar hasta **72 reportes simultáneos** y mantener hasta 144 en cola en total.
Para una visión global usaría recolección y agregación por instancia; para un
límite global real usaría un despachador o cola compartida y control distribuido.

## 3. Problemas encontrados

- Docker Desktop estaba apagado al inicio; se inició y después se reconstruyeron los servicios.
- La salida convencional de autocannon redondeaba los totales, así que se repitieron los tres escenarios con `-j` y se conservaron los conteos exactos.
- Con los valores predeterminados no hubo saturación en el escenario 3. Se comprobó por separado el rechazo `PoolLleno` con un trabajador y una posición de cola; no se alteraron los límites de la medición principal.

## 4. Uso declarado de IA

Se utilizó OpenCode con el modelo GPT-6.1 Terra para implementar el monitor del bucle y el despachador, ejecutar y registrar las pruebas, redactar la bitácora y preparar la entrega. Los valores anteriores proceden de las ejecuciones indicadas; el uso de IA y la prueba automatizada del escenario 1 se declaran expresamente.
