import express, { Request, Response } from 'express';

const PORT = Number(process.env.PORT ?? 3001);
const RETARDO_MS = Number(process.env.RETARDO_MS ?? 1000);
const stock = new Map<string, number>([
  ['Laptop-14', 10],
  ['MOUSE-USB', 40],
  ['Teclado-16', 12],
  ['Monitor-17', 5]
]);

const esperar = (ms: number) => new Promise <void>((r) => setTimeout(r, ms));

const app = express();

app.use(express.json());


app.get("/health", (_req: Request, res: Response) =>{
  res.status(200).json({ status: "OK" , servicio: "inventario" });
});

//Obetener Todos los Productos
app.get("/stock", async (_req: Request, res: Response) => {
  if(RETARDO_MS > 0) await esperar(RETARDO_MS); 
  const inventario = Array.from(stock.entries()).map(([sku, disponible]) => ({ sku, disponible }));
  res.json(inventario);
});

//Obtener Productos por SKU
app.get("/stock/:sku", async (req: Request <{sku:string }>, res: Response) => {
  if(RETARDO_MS > 0) await esperar(RETARDO_MS); 
  
  const disponible = stock.get(req.params.sku);

  if(disponible === undefined){
    res.status(404).json({ error: `SKU no encontrado ${req.params.sku}`});
    return;
  }

  res.json({ sku: req.params.sku, disponible });
});

// Reservar unidades de un producto
app.post("/stock/:sku/reservar", async (
  req: Request<{ sku: string }>,
  res: Response
) => {
  const { sku } = req.params;
  const { cantidad } = req.body ?? {};

  // Validar que la cantidad sea un entero positivo
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    res.status(400).json({
      error: "La cantidad debe ser un entero mayor que 0"
    });
    return;
  }

  // Verificar que el producto exista
  const disponible = stock.get(sku);

  if (disponible === undefined) {
    res.status(404).json({
      error: `SKU no encontrado: ${sku}`
    });
    return;
  }

  // Aplicar el retardo antes de descontar
  if (RETARDO_MS > 0) {
    await esperar(RETARDO_MS);
  }

  // Consultar nuevamente el stock tras el retardo
  const actual = stock.get(sku)!;

  // Comprobar que exista suficiente stock
  if (actual < cantidad) {
    res.status(409).json({
      error: "Stock insuficiente",
      sku,
      disponible: actual,
      solicitado: cantidad
    });
    return;
  }

  // Descontar el stock reservado
  const restante = actual - cantidad;
  stock.set(sku, restante);

  // Reserva realizada correctamente
  res.status(200).json({
    sku,
    reservado: cantidad,
    restante
  });
});


app.listen(PORT, () => {
  console.log(`Servicio de inventario escuchando en el puerto ${PORT}` + `retraso: ${RETARDO_MS} ms`);
});