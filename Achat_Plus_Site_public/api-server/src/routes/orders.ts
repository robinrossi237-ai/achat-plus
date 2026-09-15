import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderBody,
  GetOrderParams,
  UpdateOrderParams,
  ListOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatOrderResponse(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  const q = params.success ? params.data : {};

  const conditions = [];
  if (q.status) conditions.push(eq(ordersTable.status, q.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const limit = q.limit ?? 50;
  const offset = q.offset ?? 0;

  const rows = await db
    .select()
    .from(ordersTable)
    .where(where)
    .orderBy(ordersTable.createdAt)
    .limit(limit)
    .offset(offset);

  res.json(rows.map(formatOrderResponse));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, quantity, customerName, customerPhone, customerAddress, deliveryType, notes } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  const unitPrice = product.finalPrice;
  const totalPrice = unitPrice * quantity;
  const productImage = product.images?.[0] ?? null;

  // Generate WhatsApp message
  const priceFormatted = new Intl.NumberFormat("fr-FR").format(totalPrice);
  const whatsappMessage = `Bonjour, je souhaite commander :\n${product.name}\nQuantité: ${quantity}\nPrix: ${priceFormatted} FCFA\nLivraison: ${deliveryType}\nPouvez-vous confirmer la disponibilité ?`;

  // Increment order count on product
  await db
    .update(productsTable)
    .set({ orderCount: product.orderCount + 1 })
    .where(eq(productsTable.id, productId));

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerName,
      customerPhone,
      customerAddress,
      productId,
      productName: product.name,
      productImage,
      quantity,
      unitPrice,
      totalPrice,
      deliveryType,
      notes,
      whatsappMessage,
      status: "new",
    })
    .returning();

  res.status(201).json(formatOrderResponse(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  res.json(formatOrderResponse(order));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set(parsed.data)
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  res.json(formatOrderResponse(order));
});

export default router;
