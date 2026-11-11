
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { contarPrimos } from "./calculo.js";
import { Worker } from "node:worker_threads";
import path from "node:path";
import { medirLatencia, resumenMetricas } from "./metricas";

const PORT = Number(process.env.PORT ?? 3000);
const INVENTARIO_URL = process.env.INVENTARIO_URL ?? "http://localhost:3001";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 2000);
const REPORTE_N = Number(process.env.REPORTE_N ?? 8_000_000);

interface Pedido {
    id: string;
    sku: string;
    cantidad: number;
    creadoEn: string;
}

const pedidos: Pedido[] = [];

const app = express();
app.use(express.json());
app.use(medirLatencia);

app.get("/metricas", (_req: Request, res: Response) => {
    res.json(resumenMetricas());
});

// Salud del servicio
app.get("/health", (_req: Request, res: Response) => {
    res.json({
        status: "OK",
        servicio: "pedidos"
    });
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

// Listado de pedidos
app.get("/pedidos", (_req: Request, res: Response) => {
    res.json(pedidos);
});

// Crear pedido y reservar stock
app.post("/pedidos", async (req: Request, res: Response) => {
    const { sku, cantidad } = req.body ?? {};

    if (
        typeof sku !== "string" ||
        typeof cantidad !== "number" ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {
        res.status(400).json({
            error: "Solicitud inválida, se requiere sku y cantidad válida"
        });
        return;
    }

    const inicio = performance.now();

    try {
        const r = await fetch(
            `${INVENTARIO_URL}/stock/${encodeURIComponent(sku)}/reservar`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ cantidad }),
                signal: AbortSignal.timeout(TIMEOUT_MS)
            }
        );

        if (r.status === 404) {
            res.status(404).json({
                error: `SKU no encontrado ${sku}`
            });
            return;
        }

        if (r.status === 409) {
            const detalle = await r.json();
            res.status(409).json(detalle);
            return;
        }

        if (!r.ok) {
            const detalle = await r.json();
            res.status(r.status).json(detalle);
            return;
        }

        const pedido: Pedido = {
            id: randomUUID(),
            sku,
            cantidad,
            creadoEn: new Date().toISOString()
        };

        pedidos.push(pedido);

        res.status(201).json(pedido);

    } catch (error) {
        const duracionMs = Math.round(performance.now() - inicio);
        const e = error as Error & { cause?: { code?: string } };

        const motivo = e.name === "TimeoutError"
            ? `Inventario no contestó en: ${TIMEOUT_MS} ms`
            : `No se pudo conectar a Inventario: ${e.cause?.code ?? e.message}`;

        console.error("Error al crear pedido:", motivo);

        res.status(503).json({
            error: "Inventario no disponible",
            motivo,
            duracionMs
        });
    }
});

// Leer y validar el parámetro n
function leerN(req: Request): number {
    const n = Number(req.query.n ?? REPORTE_N);

    return Number.isInteger(n) && n > 0 && n <= 50_000_000
        ? n
        : REPORTE_N;
}

// Reporte bloqueante: utiliza el hilo principal
app.get("/reporte/bloqueante", (req: Request, res: Response) => {
    const n = leerN(req);
    const inicio = performance.now();

    const primos = contarPrimos(n);

    const duracionMs = Math.round(performance.now() - inicio);

    res.status(200).json({
        modo: "bloqueando",
        n,
        primos,
        duracionMs
    });
});

// Ejecutar cálculo en Worker Thread
function contarPrimosEnWorker(n: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const archivo = path.join(__dirname, "worker-reporte.js");

        const worker = new Worker(archivo, {
            workerData: { n }
        });

        let completado = false;

        worker.once("message", (primos: number) => {
            completado = true;
            resolve(primos);
        });

        worker.once("error", (error: Error) => {
            completado = true;
            reject(error);
        });

        worker.once("exit", (codigo: number) => {
            if (!completado) {
                reject(
                    new Error(
                        `El Worker terminó antes de responder. Código: ${codigo}`
                    )
                );
            }
        });
    });
}

// Reporte mediante Worker Thread
app.get("/reporte/worker", async (req: Request, res: Response) => {
    const n = leerN(req);
    const inicio = performance.now();

    try {
        const primos = await contarPrimosEnWorker(n);

        const duracionMs = Math.round(performance.now() - inicio);

        res.status(200).json({
            modo: "worker",
            n,
            primos,
            duracionMs
        });

    } catch (error) {
        const e = error as Error;

        console.error("Error en Worker:", e.message);

        res.status(500).json({
            error: "Error al ejecutar el Worker",
            motivo: e.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(
        `Servicio de pedidos escuchando en el puerto: ${PORT} ` +
        `Inventario: ${INVENTARIO_URL} ` +
        `Timeout: ${TIMEOUT_MS} ms`
    );
});
