import { Request, Response, NextFunction } from "express";

const UMBRAL_LENTA_MS = Number(process.env.UMBRAL_LENTA_MS ?? 1000);

interface Estadistica {
    peticiones: number;
    totalMs: number;
    maxMs: number;
    lentas: number;
}

const porRuta = new Map<string, Estadistica>();

export function medirLatencia(req: Request, res: Response, next: NextFunction): void {
    const inicio = performance.now();
    res.on("finish", () => {
        const ms = performance.now() - inicio;
        const ruta = `${req.method} ${req.path}`;
        const estadistica = porRuta.get(ruta) ?? { peticiones: 0, totalMs: 0, maxMs: 0, lentas: 0 };
        estadistica.peticiones++;
        estadistica.totalMs += ms;
        estadistica.maxMs = Math.max(estadistica.maxMs, ms);
        if (ms > UMBRAL_LENTA_MS) estadistica.lentas++;
        porRuta.set(ruta, estadistica);
    });
    next();
}

export function resumenMetricas() {
    return {
        umbralLentaMs: UMBRAL_LENTA_MS,
        rutas: [...porRuta].map(([ruta, e]) => ({
            ruta,
            peticiones: e.peticiones,
            promedioMs: e.totalMs / e.peticiones,
            maxMs: e.maxMs,
            lentas: e.lentas
        }))
    };
}
