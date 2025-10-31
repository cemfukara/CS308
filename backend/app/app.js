//the main Express app; sets up routes, middleware, etc.
//app/app.js → should only handle app configuration and middleware setup (no server start logic here).
import express from "express";
import cors from "cors"; //Cross Origin Resource Sharing, Frontend can make a request
import {
    adminRoutes,
    cartRoutes,
    orderRoutes,
    productRoutes,
    userRoutes,
} from "./routes/index.js";

const app = express();
app.use(
    cors({
        //Connection with frontend only in the given port
        origin: "http://localhost:", //ADD FRONTEND's PORT!!!
    })
);
app.use(express.json());

// Sample route
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

export default app;
