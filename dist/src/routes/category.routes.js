import { Router } from "express";
import { prisma } from "../utils/prisma";
const router = Router();
//get all categories
router.get("/", async (req, res) => {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
    });
    res.json({ success: true, categories });
});
export default router;
