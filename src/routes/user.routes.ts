import { Router } from "express";
import {prisma} from "../utils/prisma";
import { isAuth } from "../middlewares/isAuth";

const router = Router();

router.put("/update-profile", isAuth, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await prisma.user.update({
      where: { id: req.session.userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
