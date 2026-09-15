import { Router, type IRouter } from "express";
import { eq, sql, ne } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import { GetTopProductsQueryParams, GetRecentOrdersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(total_price), 0)`,
    })
    .from(ordersTable)
    .where(ne(ordersTable.status, "cancelled"));

  const [productStats] = await db
    .select({ totalProducts: sql<number>`count(*)::int` })
    .from(productsTable);

  const [clientStats] = await db
    .select({ totalClients: sql<number>`count(DISTINCT customer_phone)::int` })
    .from(ordersTable);

  const [pendingStats] = await db
    .select({ pendingOrders: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "new"));

  const [lowStockStats] = await db
    .select({ lowStockCount: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.stockStatus, "low"));

  // Estimate margin from order revenue vs supplier cost
  const orderRows = await db
    .select({
      totalPrice: ordersTable.totalPrice,
      quantity: ordersTable.quantity,
      supplierPrice: productsTable.supplierPrice,
    })
    .from(ordersTable)
    .innerJoin(productsTable, eq(ordersTable.productId, productsTable.id))
    .where(ne(ordersTable.status, "cancelled"));

  const totalMargin = orderRows.reduce(
    (acc, r) => acc + (r.totalPrice - r.supplierPrice * r.quantity),
    0
  );

  res.json({
    totalOrders: orderStats?.totalOrders ?? 0,
    totalRevenue: orderStats?.totalRevenue ?? 0,
    totalProducts: productStats?.totalProducts ?? 0,
    totalClients: clientStats?.totalClients ?? 0,
    pendingOrders: pendingStats?.pendingOrders ?? 0,
    lowStockCount: lowStockStats?.lowStockCount ?? 0,
    totalMargin,
  });
});

router.get("/stats/top-products", async (req, res): Promise<void> => {
  const params = GetTopProductsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 5) : 5;

  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      imageUrl: sql<string | null>`${productsTable.images}[1]`,
      orderCount: productsTable.orderCount,
      viewCount: productsTable.viewCount,
    })
    .from(productsTable)
    .orderBy(sql`order_count DESC`)
    .limit(limit);

  // Compute revenue per product from orders
  const enriched = await Promise.all(
    rows.map(async (p) => {
      const [rev] = await db
        .select({ revenue: sql<number>`COALESCE(SUM(total_price), 0)` })
        .from(ordersTable)
        .where(eq(ordersTable.productId, p.id));
      return { ...p, revenue: rev?.revenue ?? 0 };
    })
  );

  res.json(enriched);
});

router.get("/stats/orders-by-status", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      status: ordersTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  res.json(rows);
});

router.get("/stats/recent-orders", async (req, res): Promise<void> => {
  const params = GetRecentOrdersQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 10) : 10;

  const rows = await db
    .select()
    .from(ordersTable)
    .orderBy(sql`created_at DESC`)
    .limit(limit);

  res.json(
    rows.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }))
  );
});

export default router;
