import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reviewsTable, productsTable } from "@workspace/db";
import {
  CreateReviewBody,
  UpdateReviewBody,
  UpdateReviewParams,
  DeleteReviewParams,
  ListReviewsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichReview(review: typeof reviewsTable.$inferSelect) {
  const [product] = await db
    .select({ name: productsTable.name })
    .from(productsTable)
    .where(eq(productsTable.id, review.productId));

  return {
    ...review,
    productName: product?.name ?? null,
    createdAt: review.createdAt.toISOString(),
  };
}

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);
  const q = params.success ? params.data : {};

  const conditions = [];
  if (q.productId) conditions.push(eq(reviewsTable.productId, q.productId));
  if (q.approved !== undefined) conditions.push(eq(reviewsTable.approved, q.approved));

  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db.select().from(reviewsTable).where(where).orderBy(reviewsTable.createdAt);

  const enriched = await Promise.all(rows.map(enrichReview));
  res.json(enriched);
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({ ...parsed.data, approved: false }).returning();
  const enriched = await enrichReview(review);
  res.status(201).json(enriched);
});

router.patch("/reviews/:id", async (req, res): Promise<void> => {
  const params = UpdateReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db
    .update(reviewsTable)
    .set(parsed.data)
    .where(eq(reviewsTable.id, params.data.id))
    .returning();

  if (!review) {
    res.status(404).json({ error: "Avis introuvable" });
    return;
  }

  const enriched = await enrichReview(review);
  res.json(enriched);
});

router.delete("/reviews/:id", async (req, res): Promise<void> => {
  const params = DeleteReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(reviewsTable).where(eq(reviewsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
