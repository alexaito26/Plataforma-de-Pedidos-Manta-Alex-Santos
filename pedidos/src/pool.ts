import { availableParallelism } from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";

function leerLimite(nombre: string, defecto: number, minimo: number): number {
    const valor = process.env[nombre];
    if (valor === undefined) return defecto;
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero) || numero < minimo) {
        throw new Error(`${nombre} debe ser un entero mayor o igual a ${minimo}`);
    }
    return numero;
}

const maxTrabajadores = leerLimite("MAX_TRABAJADORES", availableParallelism(), 1);
const maxCola = leerLimite("MAX_COLA", maxTrabajadores * 2, 0);

interface Trabajo {
    n: number;
    resolve: (resultado: number) => void;
    reject: (error: Error) => void;
}

const cola: Trabajo[] = [];
let activos = 0;
let rechazadas = 0;

function ejecutar(trabajo: Trabajo): void {
    activos++;
    let worker: Worker;
    try {
        worker = new Worker(path.join(__dirname, "worker-reporte.js"), {
            workerData: { n: trabajo.n }
        });
    } catch (error) {
        activos--;
        trabajo.reject(error as Error);
        despachar();
        return;
    }

    let resultado: number | undefined;
    let fallo: Error | undefined;
    worker.once("message", (primos: number) => { resultado = primos; });
    worker.once("error", (error: Error) => { fallo = error; });
    // El puesto solo queda libre al salir el hilo, no al recibir su mensaje.
    worker.once("exit", (codigo: number) => {
        activos--;
        if (fallo) trabajo.reject(fallo);
        else if (codigo !== 0 || resultado === undefined) {
            trabajo.reject(new Error(`El Worker terminó sin resultado. Código: ${codigo}`));
        } else trabajo.resolve(resultado);
        despachar();
    });
}

function despachar(): void {
    while (activos < maxTrabajadores && cola.length > 0) {
        ejecutar(cola.shift()!);
    }
}

export function contarPrimosEnPool(n: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const trabajo = { n, resolve, reject };
        if (activos < maxTrabajadores) ejecutar(trabajo);
        else if (cola.length < maxCola) cola.push(trabajo);
        else {
            rechazadas++;
            const error = new Error("El pool y su cola están llenos");
            error.name = "PoolLleno";
            reject(error);
        }
    });
}

export function estadoPool() {
    return { maxTrabajadores, activos, enCola: cola.length, maxCola, rechazadas };
}
