"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const socket_1 = require("../socket");
const client_1 = require("../../generated/prisma/client");
const isAuth_1 = require("../middlewares/isAuth");
const router = (0, express_1.Router)();
/* Get all orders */
router.get("/", isAuth_1.isAuth, async (req, res) => {
    const { search, status } = req.query;
    const statusFilter = status && Object.values(client_1.OrderStatus).includes(status)
        ? status
        : undefined;
    const orders = await prisma_1.prisma.order.findMany({
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
router.put("/:id/status", isAuth_1.isAuth, async (req, res) => {
    const { status } = req.body;
    const orderId = String(req.params.id);
    const order = await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { status },
    });
    (0, socket_1.getIO)().emit("order-updated", order);
    res.json({ success: true, order });
});
exports.default = router;
