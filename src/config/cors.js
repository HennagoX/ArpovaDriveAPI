export const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://aprova-drive.vercel.app'
];

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Blocked by CORS: This origin is not allowed.'));
  },
  credentials: true
};
