// This file combines and exports all routes for easy import into app.js.
//routes/index.js → combine all routers into a single router and export it for easy inclusion in app.js.
// app/routes/index.js

import adminRoutes from "./adminRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";
import productRoutes from "./productRoutes.js";
import userRoutes from "./userRoutes.js";

export { adminRoutes, cartRoutes, orderRoutes, productRoutes, userRoutes };
