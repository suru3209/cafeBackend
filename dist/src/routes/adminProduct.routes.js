import { Router } from "express";
import { prisma } from "../utils/prisma";
import { isAuth } from "../middlewares/isAuth";
import { upload } from "../utils/upload";
const router = Router();
/* =========================
   GET ALL PRODUCTS
========================= */
router.get("/", isAuth, async (_, res) => {
    try {
        const products = await prisma.menuItem.findMany({
            include: {
                category: true,
                options: { include: { values: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ products });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});
/* =========================
   CREATE PRODUCT
========================= */
router.post("/", isAuth, upload.single("image"), async (req, res) => {
    try {
        const { name, description, basePrice, categoryId, isVeg, options } = req.body;
        const product = await prisma.menuItem.create({
            data: {
                name,
                description,
                basePrice: Number(basePrice),
                isVeg: isVeg === "true" || isVeg === true,
                category: { connect: { id: categoryId } },
                image: req.file ? req.file.path : null,
                options: {
                    create: JSON.parse(options).map((opt) => ({
                        name: opt.name,
                        required: opt.required ?? false,
                        values: {
                            create: opt.values.map((v) => ({
                                value: v.value,
                                priceDelta: Number(v.priceDelta),
                            })),
                        },
                    })),
                },
            },
        });
        res.json({ success: true, product });
    }
    catch (err) {
        console.error("CREATE ERROR:", err);
        res.status(500).json({ message: "Create failed" });
    }
});
/* =========================
   GET SINGLE PRODUCT
========================= */
router.get("/:id", isAuth, async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Product id is required" });
        }
        const productId = id;
        const product = await prisma.menuItem.findUnique({
            where: { id: productId },
            include: {
                options: { include: { values: true } },
                category: true,
            },
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({ product });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch product" });
    }
});
/* =========================
   UPDATE PRODUCT + OPTIONS
========================= */
router.put("/:id", isAuth, upload.single("image"), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Product id is required" });
        }
        const productId = id;
        const { name, description, basePrice, isVeg, isAvailable, options } = req.body;
        // 1️⃣ Update product
        await prisma.menuItem.update({
            where: { id: productId },
            data: {
                name,
                description,
                basePrice: Number(basePrice),
                isVeg: isVeg === "true" || isVeg === true,
                isAvailable: isAvailable === "true" || isAvailable === true,
                image: req.file ? req.file.path : undefined,
            },
        });
        // 2️⃣ Delete old options (cascade deletes values)
        await prisma.menuOption.deleteMany({
            where: { menuItemId: productId },
        });
        // 3️⃣ Re-create options safely
        if (options) {
            const parsedOptions = typeof options === "string" ? JSON.parse(options) : options;
            for (const opt of parsedOptions) {
                await prisma.menuOption.create({
                    data: {
                        name: opt.name,
                        required: opt.required ?? false,
                        menuItem: { connect: { id: productId } },
                        values: {
                            create: opt.values.map((v) => ({
                                value: v.value,
                                priceDelta: Number(v.priceDelta),
                            })),
                        },
                    },
                });
            }
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error("UPDATE ERROR:", err);
        res.status(500).json({ message: "Update failed" });
    }
});
/* =========================
   DELETE PRODUCT (CASCADE)
========================= */
router.delete("/:id", isAuth, async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Product id is required" });
        }
        const productId = id;
        await prisma.menuItem.delete({
            where: { id: productId },
        });
        res.json({ success: true, message: "Product deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed" });
    }
});
export default router;
