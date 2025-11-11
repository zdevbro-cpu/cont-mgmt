app.use(cors({
  origin: ['http://localhost:5173', 'https://your-vercel-app.vercel.app'],
  credentials: true
}));