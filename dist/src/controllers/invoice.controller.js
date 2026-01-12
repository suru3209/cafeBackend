"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoice = void 0;
const prisma_1 = require("../utils/prisma");
const pdfkit_1 = __importDefault(require("pdfkit"));
const dayjs_1 = __importDefault(require("dayjs"));
const path_1 = __importDefault(require("path"));
/**
 * Generate Invoice PDF
 */
const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: Array.isArray(orderId) ? orderId[0] : orderId },
            include: {
                user: { select: { name: true, email: true } },
                address: true,
                items: {
                    include: {
                        menuItem: { select: { name: true } },
                    },
                },
            },
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // 💰 ALL VALUES IN PAISE
        const subtotal = order.subtotal;
        const tax = order.tax;
        const delivery = order.delivery; // should be 7000 (₹70)
        const total = order.total;
        const rs = (p) => `₹${(p / 100).toFixed(2)}`;
        const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=invoice-${order.id}.pdf`);
        doc.pipe(res);
        /* ================= LOGO ================= */
        const logoPath = path_1.default.join(__dirname, "../public/logo.png");
        try {
            doc.image(logoPath, 50, 40, { width: 80 });
        }
        catch { }
        /* ================= HEADER ================= */
        doc
            .fontSize(22)
            .text("Aniicone’s Café", 150, 50)
            .fontSize(10)
            .text("Fresh Coffee • Delicious Food", 150, 80)
            .moveDown(3);
        /* ================= CUSTOMER INFO ================= */
        doc.fontSize(11);
        doc.text(`Invoice ID: ${order.id}`);
        doc.text(`Date: ${(0, dayjs_1.default)(order.createdAt).format("DD MMM YYYY, hh:mm A")}`);
        doc.text(`Customer: ${order.user.name}`);
        doc.text(`Email: ${order.user.email}`);
        doc.moveDown();
        doc.text("Delivery Address:");
        doc.text(`${order.address.label}
${order.address.address}
${order.address.city}, ${order.address.state} - ${order.address.zipCode}`);
        doc.moveDown(2);
        /* ================= TABLE HEADER ================= */
        doc.font("Helvetica-Bold");
        doc.text("Item", 50);
        doc.text("Qty", 280);
        doc.text("Price", 340);
        doc.text("Total", 430);
        doc.moveDown(0.5);
        doc.font("Helvetica");
        /* ================= ITEMS ================= */
        order.items.forEach((item) => {
            doc.text(item.menuItem.name, 50);
            doc.text(item.quantity.toString(), 280);
            doc.text(rs(item.price), 340);
            doc.text(rs(item.price * item.quantity), 430);
            doc.moveDown(0.3);
        });
        doc.moveDown();
        /* ================= TOTALS ================= */
        doc.text(`Subtotal: ${rs(subtotal)}`, { align: "right" });
        doc.text(`Tax (12%): ${rs(tax)}`, { align: "right" });
        doc.text(`Delivery: ${rs(delivery)}`, { align: "right" });
        doc
            .font("Helvetica-Bold")
            .text(`Grand Total: ${rs(total)}`, { align: "right" });
        doc.moveDown(2);
        doc.fontSize(10).text("Thank you for visiting Aniicone’s Café ☕", {
            align: "center",
        });
        doc.end();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate invoice" });
    }
};
exports.generateInvoice = generateInvoice;
