import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
import authRoutes from './routes/auth.routes';
import itemRoutes from './routes/item.routes';
import gachaRoutes from './routes/gacha.routes';
import userRoutes from './routes/user.routes';
import boxRoutes from './routes/box.routes';
import achievementRoutes from './routes/achievement.routes';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api', achievementRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔥 API disponível em http://localhost:${PORT}/api`);
});
