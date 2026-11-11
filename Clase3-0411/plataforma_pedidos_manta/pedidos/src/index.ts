import express, { Request, Response } from 'express';
import {randomUUID} from "node:crypto"; //Generar Valores Aleatorios

const PORT = Number(process.env.PORT ?? 3000);
const INVENTARIO_URL = process.env.INVENTARIO_URL ?? "http://localhost:3001";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 2000);

interface Pedido{
    id: string;
    sku: string;
    cantidad: number;
    creadoEn: string,
}
const pedidos : Pedido[] = [];


const app = express();
app.use(express.json());

//Salud Server
app.get("/health", (_req: Request, res: Response) =>{
    res.json({ status: "OK" , servicio: "pedidos"});
});

// Readiness: comprobar disponibilidad de Inventario
app.get("/health/ready", async (_req: Request, res: Response) => {
    const inicio = performance.now();

    try {
        const respuesta = await fetch(`${INVENTARIO_URL}/health`, {
            signal: AbortSignal.timeout(1000)
        });

        const ms = Math.round(performance.now() - inicio);

        if (!respuesta.ok) {
            res.status(503).json({
                status: "no-listo",
                inventario: `HTTP ${respuesta.status}`,
                ms
            });
            return;
        }

        res.status(200).json({
            status: "listo",
            inventario: "ok",
            ms
        });

    } catch (error) {
        const ms = Math.round(performance.now() - inicio);
        const e = error as Error;

        const motivo = e.name === "TimeoutError"
            ? "Tiempo de espera agotado"
            : `No se pudo conectar: ${e.message}`;

        res.status(503).json({
            status: "no-listo",
            inventario: motivo,
            ms
        });
    }
});

app.get("/pedidos", (_req: Request, res: Response) =>{
    res.json(pedidos);
});

app.post("/pedidos", async (req: Request, res: Response) =>{
    const {sku, cantidad} = req.body ?? {};
    if (typeof sku !== "string" || typeof cantidad !== "number" || cantidad <= 0){
        res.status(400).json({error: "Solicitud inválida, se requiere sku y cantidad"});
        return;
    }
  const inicio = performance.now(); //Toma el Tiempo de inicio

  try{
    /*
    const r = await fetch(`${INVENTARIO_URL}/stock/${encodeURIComponent(sku)}`,{ //encodeURIComponent para codificar el SKU en caso de que tenga caracteres especiales
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    */
    const r = await fetch(`${INVENTARIO_URL}/stock/${encodeURIComponent(sku)}/reservar`, {
        method: "POST",
        headers: {

            "Content-Type": "application/json"
        },
    body: JSON.stringify({ cantidad }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if(r.status === 404){
        res.status(404).json({error: `SKU no encontrado ${sku}`});
        return;
    };

    if (r.status === 409) {
    const detalle = await r.json();
    res.status(409).json(detalle);
    return;
}
    /*
    const stock = (await r.json()) as {disponible: number};

    if(stock.disponible < cantidad){
        res.status(409).json({error: `Stock insuficiente para ${sku}, disponible: ${stock.disponible}`});
        return;
    }
     */
    if (!r.ok) {
        const detalle = await r.json();
        res.status(r.status).json(detalle);
        return;
    }

    const pedido: Pedido = {

        id: randomUUID(),
        sku, cantidad,
        creadoEn: new Date().toISOString()};
        pedidos.push(pedido);
        res.status(201).json(pedido);

  } catch (error){
    const duracionMs =  Math.round(performance.now() - inicio);
    const e = error as Error & {cause ?: {code?: string}};
    const motivo = e.name === `TimeoutError` ? `Inventario no contestó en: ${TIMEOUT_MS} ms` : `No se pudo conectar a Inventario: ${e.cause?.code ?? e.message}`;
    console.error(pedidos + " " + motivo);
    res.status(503).json({error: "Inventario no disponible", motivo, duracionMs});
    //res.status(500).json({error: "Error al consultar el inventario"});
  }
});


//Puerto en el que escucha
app.listen(PORT, () => {
    console.log(`Servicio de pedidos escuchando en el puerto: ${PORT} ` + `Inventario: ${INVENTARIO_URL}` + ` Timeout: ${TIMEOUT_MS} ms`);
});

