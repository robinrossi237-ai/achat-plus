import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, promotionsTable } from "@workspace/db";
import {
  CreatePromotionBody,
  UpdatePromotionBody,
  UpdatePromotionParams,
  DeletePromotionParams,
  ListPromotionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatPromotion(p: typeof promotionsTable.$inferSelect) {
  return {
    ...p,
    startsAt: p.startsAt?.toISOString() ?? null,
    endsAt: p.endsAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/promotions", async (req, res): Promise<void> => {
  const params = ListPromotionsQueryParams.safeParse(req.query);
  const q = params.success ? params.data : {};

  const conditions = [];
  if (q.active !== undefined) conditions.push(eq(promotionsTable.active, q.active));

  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db.select().from(promotionsTable).where(where).orderBy(promotionsTable.createdAt);
  res.json(rows.map(formatPromotion));
});

router.post("/promotions", async (req, res): Promise<void> => {
  const parsed = CreatePromotionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { startsAt, endsAt, ...rest } = parsed.data;
  const [promo] = await db
    .insert(promotionsTable)
    .values({
      ...rest,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    })
    .returning();

  res.status(201).json(formatPromotion(promo));
});

router.patch("/promotions/:id", async (req, res): Promise<void> => {
  const params = UpdatePromotionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePromotionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { startsAt, endsAt, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
  if (endsAt !== undefined) updateData.endsAt = new Date(endsAt);

  const [promo] = await db
    .update(promotionsTable)
    .set(updateData)
    .where(eq(promotionsTable.id, params.data.id))
    .returning();

  if (!promo) {
    res.status(404).json({ error: "Promotion introuvable" });
    return;
  }

  res.json(formatPromotion(promo));
});

router.delete("/promotions/:id", async (req, res): Promise<void> => {
  const params = DeletePromotionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(promotionsTable).where(eq(promotionsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
