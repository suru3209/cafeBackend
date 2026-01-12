import { prisma } from "../utils/prisma";
import { getIO } from "../socket";
export const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { items, addressId } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!addressId) {
            return res.status(400).json({ message: "Address is required" });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        // ✅ Verify address belongs to user
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            return res.status(400).json({ message: "Invalid address" });
        }
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
                include: {
                    options: { include: { values: true } },
                },
            });
            if (!menuItem || !menuItem.isAvailable) {
                return res.status(404).json({ message: "Menu item not available" });
            }
            let unitPrice = menuItem.basePrice;
            if (item.selectedOptions) {
                for (const [optionId, optionValue] of Object.entries(item.selectedOptions)) {
                    const option = menuItem.options.find((o) => o.id === optionId);
                    const value = option?.values.find((v) => v.value === optionValue);
                    if (value)
                        unitPrice += value.priceDelta;
                }
            }
            subtotal += unitPrice * item.quantity;
            orderItems.push({
                menuItemId: menuItem.id,
                name: menuItem.name, // ✅ REQUIRED SNAPSHOT
                quantity: item.quantity,
                price: unitPrice,
                selectedOptions: item.selectedOptions ?? {},
            });
        }
        // ✅ PRICE BREAKDOWN
        const tax = Math.round(subtotal * 0.12); // 12%
        const delivery = 7000;
        const discount = 0;
        const total = subtotal + tax + delivery - discount;
        // ✅ CREATE ORDER
        const order = await prisma.order.create({
            data: {
                userId,
                addressId,
                subtotal,
                tax,
                delivery,
                discount,
                total,
                items: {
                    create: orderItems,
                },
            },
        });
        // 🔥 SOCKET EVENT (ADMIN)
        const io = getIO();
        io.emit("new-order", {
            orderId: order.id,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
        });
        return res.status(201).json({ success: true, order });
    }
    catch (error) {
        console.error("PLACE ORDER ERROR:", error);
        return res.status(500).json({ message: "Order placement failed" });
    }
};
export const getMyOrders = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                address: true, // 🔥 REQUIRED
                items: {
                    include: {
                        menuItem: { select: { name: true } },
                    },
                },
            },
        });
        return res.status(200).json({ success: true, orders });
    }
    catch (error) {
        console.error("GET MY ORDERS ERROR:", error);
        return res.status(500).json({ message: "Failed to fetch orders" });
    }
};
