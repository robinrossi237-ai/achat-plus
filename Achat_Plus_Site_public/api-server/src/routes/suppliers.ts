import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, suppliersTable, productsTable, ordersTable } from "@workspace/db";
import {
  CreateSupplierBody,
  UpdateSupplierBody,
  GetSupplierParams,
  UpdateSupplierParams,
  DeleteSupplierParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/suppliers", async (_req, res): Promise<void> => {
  const rows = await db.select().from(suppliersTable).orderBy(suppliersTable.name);

  const productCounts = await db
    .select({ supplierId: productsTable.supplierId, count: sql<number>`count(*)::int` })
    .from(productsTable)
    .groupBy(productsTable.supplierId);

  const productMap = new Map(productCounts.map((c) => [c.supplierId, c.count]));

  // Count orders via products belonging to each supplier
  const orderCounts = await db
    .select({ supplierId: productsTable.supplierId, count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .innerJoin(productsTable, eq(ordersTable.productId, productsTable.id))
    .groupBy(productsTable.supplierId);

  const orderMap = new Map(orderCounts.map((c) => [c.supplierId, c.count]));

  res.json(
    rows.map((s) => ({
      ...s,
      productCount: productMap.get(s.id) ?? 0,
      totalOrders: orderMap.get(s.id) ?? 0,
    }))
  );
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db.insert(suppliersTable).values(parsed.data).returning();
  res.status(201).json({ ...supplier, productCount: 0, totalOrders: 0 });
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  if (!supplier) {
    res.status(404).json({ error: "Fournisseur introuvable" });
    return;
  }

  const [pc] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.supplierId, params.data.id));

  const [oc] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .innerJoin(productsTable, eq(ordersTable.productId, productsTable.id))
    .where(eq(productsTable.supplierId, params.data.id));

  res.json({ ...supplier, productCount: pc?.count ?? 0, totalOrders: oc?.count ?? 0 });
});

router.patch("/suppliers/:id", async (req, res): Promise<void> => {
  const params = UpdateSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db
    .update(suppliersTable)
    .set(parsed.data)
    .where(eq(suppliersTable.id, params.data.id))
    .returning();

  if (!supplier) {
    res.status(404).json({ error: "Fournisseur introuvable" });
    return;
  }

  res.json({ ...supplier, productCount: 0, totalOrders: 0 });
});

router.delete("/suppliers/:id", async (req, res): Promise<void> => {
  const params = DeleteSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
