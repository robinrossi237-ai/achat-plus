import { Router, type IRouter } from "express";
import { eq, and, sql, ilike, gte, lte, or } from "drizzle-orm";
import { db, productsTable, categoriesTable, suppliersTable, reviewsTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
  ListFeaturedProductsQueryParams,
  GetRelatedProductsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichProduct(product: typeof productsTable.$inferSelect) {
  const [cat] = await db
    .select({ name: categoriesTable.name, marginPercent: categoriesTable.marginPercent })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, product.categoryId));

  let supplierName: string | null = null;
  if (product.supplierId) {
    const [sup] = await db
      .select({ name: suppliersTable.name })
      .from(suppliersTable)
      .where(eq(suppliersTable.id, product.supplierId));
    supplierName = sup?.name ?? null;
  }

  const [reviewStats] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(rating), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.productId, product.id), eq(reviewsTable.approved, true)));

  return {
    ...product,
    categoryName: cat?.name ?? null,
    supplierName,
    averageRating: reviewStats?.avg ?? null,
    reviewCount: reviewStats?.count ?? 0,
    images: product.images ?? [],
    flashSaleEndsAt: product.flashSaleEndsAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function computeMarginAndPrice(
  supplierPrice: number,
  marginPercent: number | null | undefined,
  categoryMargin: number
): { marginPercent: number; finalPrice: number } {
  const margin = marginPercent ?? categoryMargin ?? 20;
  const finalPrice = Math.round(supplierPrice * (1 + margin / 100));
  return { marginPercent: margin, finalPrice };
}

router.get("/products/featured", async (req, res): Promise<void> => {
  const params = ListFeaturedProductsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 8) : 8;

  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.featured, true))
    .limit(limit);

  const enriched = await Promise.all(rows.map(enrichProduct));
  res.json(enriched);
});

router.get("/products/flash-sale", async (_req, res): Promise<void> => {
  const rows = await db.select().from(productsTable).where(eq(productsTable.isFlashSale, true)).limit(10);
  const enriched = await Promise.all(rows.map(enrichProduct));
  res.json(enriched);
});

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  const q = params.success ? params.data : {};

  const conditions = [];
  if (q.categoryId) conditions.push(eq(productsTable.categoryId, q.categoryId));
  if (q.search) conditions.push(or(ilike(productsTable.name, `%${q.search}%`), ilike(productsTable.brand ?? "", `%${q.search}%`)));
  if (q.featured !== undefined) conditions.push(eq(productsTable.featured, q.featured));
  if (q.onPromotion !== undefined) conditions.push(eq(productsTable.isFlashSale, q.onPromotion));
  if (q.stockStatus) conditions.push(eq(productsTable.stockStatus, q.stockStatus));
  if (q.minPrice) conditions.push(gte(productsTable.finalPrice, q.minPrice));
  if (q.maxPrice) conditions.push(lte(productsTable.finalPrice, q.maxPrice));

  const where = conditions.length ? and(...conditions) : undefined;
  const limit = q.limit ?? 20;
  const offset = q.offset ?? 0;

  const [rows, totalRows] = await Promise.all([
    db.select().from(productsTable).where(where).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
  ]);

  const enriched = await Promise.all(rows.map(enrichProduct));
  res.json({ items: enriched, total: totalRows[0]?.count ?? 0 });
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, slug, categoryId, supplierPrice, marginPercent: inputMargin, ...rest } = parsed.data;

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, categoryId));
  const { marginPercent, finalPrice } = computeMarginAndPrice(supplierPrice, inputMargin, cat?.marginPercent ?? 20);

  const finalSlug = slug ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const [product] = await db
    .insert(productsTable)
    .values({ name, slug: finalSlug, categoryId, supplierPrice, marginPercent, finalPrice, ...rest })
    .returning();

  const enriched = await enrichProduct(product);
  res.status(201).json(enriched);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  // Increment view count
  await db
    .update(productsTable)
    .set({ viewCount: product.viewCount + 1 })
    .where(eq(productsTable.id, product.id));

  const enriched = await enrichProduct({ ...product, viewCount: product.viewCount + 1 });
  res.json(enriched);
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing[0]) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  const updateData = { ...parsed.data } as Record<string, unknown>;

  // Recalculate final price if supplier price or margin changed
  const newSupplierPrice = (parsed.data.supplierPrice as number | undefined) ?? existing[0].supplierPrice;
  if (parsed.data.supplierPrice !== undefined || parsed.data.marginPercent !== undefined) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, existing[0].categoryId));
    const { marginPercent, finalPrice } = computeMarginAndPrice(
      newSupplierPrice,
      (parsed.data.marginPercent as number | undefined) ?? null,
      cat?.marginPercent ?? 20
    );
    updateData.marginPercent = marginPercent;
    updateData.finalPrice = finalPrice;
  }

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  const enriched = await enrichProduct(product);
  res.json(enriched);
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/products/:id/related", async (req, res): Promise<void> => {
  const params = GetRelatedProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.json([]);
    return;
  }

  const related = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.categoryId, product.categoryId), sql`id != ${product.id}`))
    .limit(6);

  const enriched = await Promise.all(related.map(enrichProduct));
  res.json(enriched);
});

export default router;
