"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = __importDefault(require("http"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const menu_routes_1 = __importDefault(require("./routes/menu.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const address_routes_1 = __importDefault(require("./routes/address.routes"));
const adminAuth_routes_1 = __importDefault(require("./routes/adminAuth.routes"));
const adminOrder_routes_1 = __importDefault(require("./routes/adminOrder.routes"));
const adminProduct_routes_1 = __importDefault(require("./routes/adminProduct.routes"));
const socket_1 = require("./socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// 🔥 Socket Init
(0, socket_1.initSocket)(server);
// ====================
// 🔐 SECURITY MIDDLEWARE
// ====================
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL, // production me apna domain
    credentials: true,
}));
// ====================
// 🚫 RATE LIMIT
// ====================
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
}));
// ====================
// 🧠 BODY + SESSION
// ====================
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    name: "aniicones.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // production me true
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: "lax",
    },
}));
// ====================
// 📁 STATIC FILES
// ====================
app.use("/uploads", express_1.default.static("uploads"));
// ====================
// 🚀 ROUTES
// ====================
app.use("/api/auth", auth_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/menu", menu_routes_1.default);
app.use("/api/user", user_routes_1.default);
app.use("/api/invoice", invoice_routes_1.default);
app.use("/api/addresses", address_routes_1.default);
// ADMIN
app.use("/api/admin/auth", adminAuth_routes_1.default);
app.use("/api/admin/orders", adminOrder_routes_1.default);
app.use("/api/admin/products", adminProduct_routes_1.default);
// ====================
// 🏠 ROOT
// ====================
app.get("/", (req, res) => {
    res.send("Aniicones Cafe Backend Running 🚀");
});
// ====================
// ❌ 404 HANDLER
// ====================
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
// ====================
// ⚠️ ERROR HANDLER
// ====================
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
});
// ====================
// 🔥 START SERVER
// ====================
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
