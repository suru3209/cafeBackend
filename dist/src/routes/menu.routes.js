import { Router } from "express";
import { prisma } from "../utils/prisma";
const router = Router();
/**
 * GET /menu
 * Returns menu items with category & options
 */
router.get("/", async (_req, res) => {
    try {
        const items = await prisma.menuItem.findMany({
            where: {
                isAvailable: true,
            },
            include: {
                category: {
                    select: {
                        name: true,
                    },
                },
                options: {
                    orderBy: { sortOrder: "asc" },
                    include: {
                        values: {
                            orderBy: { sortOrder: "asc" },
                        },
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });
        // 🔁 Normalize response for frontend
        const formattedItems = items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            image: item.image,
            category: item.category,
            basePrice: item.basePrice, // paise
            options: item.options.map((opt) => ({
                id: opt.id,
                name: opt.name,
                required: opt.required,
                values: opt.values.map((v) => ({
                    value: v.value,
                    priceDelta: v.priceDelta, // paise
                })),
            })),
        }));
        res.status(200).json({
            success: true,
            items: formattedItems,
        });
    }
    catch (err) {
        console.error("MENU FETCH ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch menu",
        });
    }
});
export default router;
