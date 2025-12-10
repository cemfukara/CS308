//the main Express app; sets up routes, middleware, etc.
//app/app.js → should only handle app configuration and middleware setup (no server start logic here).
import express from 'express';
import cors from 'cors'; //Cross Origin Resource Sharing, Frontend can make a request
import cookieParser from 'cookie-parser';
import {
  adminRoutes,
  cartRoutes,
  orderRoutes,
  productRoutes,
  userRoutes,
  categoryRoutes,
  wishlistRoutes,
  invoiceRoutes,
  reviewRoutes,
} from '../routes/index.js';
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:2000'],
    credentials: true,
  })
);

app.use(cookieParser());

// Sample route
app.use('/api/users', userRoutes);
app.use('/api/', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/', reviewRoutes);

export default app;
