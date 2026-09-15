import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  GetCategoryParams,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

  // Count products per category
  const counts = await db
    .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)::int` })
    .from(productsTable)
    .groupBy(productsTable.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));

  const result = rows.map((cat) => ({
    ...cat,
    productCount: countMap.get(cat.id) ?? 0,
  }));

  res.json(result);
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, slug, description, imageUrl, icon, marginPercent } = parsed.data;
  const finalSlug = slug ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const [cat] = await db
    .insert(categoriesTable)
    .values({ name, slug: finalSlug, description, imageUrl, icon, marginPercent })
    .returning();

  res.status(201).json({ ...cat, productCount: 0 });
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  if (!cat) {
    res.status(404).json({ error: "Catégorie introuvable" });
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.categoryId, cat.id));

  res.json({ ...cat, productCount: countRow?.count ?? 0 });
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cat] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!cat) {
    res.status(404).json({ error: "Catégorie introuvable" });
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.categoryId, cat.id));

  res.json({ ...cat, productCount: countRow?.count ?? 0 });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
