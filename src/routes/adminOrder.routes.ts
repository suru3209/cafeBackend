import { Router } from "express";
import {prisma} from "../utils/prisma";
import { getIO } from "../socket";
import { OrderStatus } from "../../generated/prisma/client";
import { isAuth } from "../middlewares/isAuth";

const router = Router();

/* Get all orders */
router.get("/", isAuth, async (req, res) => {
  const { search, status } = req.query;

  const statusFilter =
    status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? (status as OrderStatus)
      : undefined;

  const orders = await prisma.order.findMany({
    where: {
      status: statusFilter,
      items: search
        ? {
            some: {
              menuItem: {
                name: { contains: String(search), mode: "insensitive" },
              },
            },
          }
        : undefined,
    },
    include: {
      user: true,
      items: { include: { menuItem: true } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ orders });
});

/* Update order status */
router.put("/:id/status", isAuth, async (req, res) => {
  const { status } = req.body;
  const orderId = String(req.params.id);

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  getIO().emit("order-updated", order);

  res.json({ success: true, order });
});

export default router;
