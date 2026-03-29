import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const browserDistFolder = join(__dirname, '../browser');
const uploadFolder = join(__dirname, '../uploads');

// Ensure upload folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const app = express();
app.use(express.json());
const angularApp = new AngularNodeAppEngine();

// Database initialization
const db = new Database('shubharambh.db');
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    amount REAL,
    date TEXT,
    category TEXT,
    description TEXT,
    receipt_path TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER,
    staff_type TEXT, -- Housekeeping, Security, etc.
    date TEXT,
    status TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    role TEXT,
    phone TEXT,
    address TEXT,
    responsibility TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Initial Admin User
const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
}

// Initial Security User
const securityExists = db.prepare('SELECT * FROM users WHERE username = ?').get('security');
if (!securityExists) {
  const hashedPassword = bcrypt.hashSync('security123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('security', hashedPassword, 'security');
}

const JWT_SECRET = process.env['JWT_SECRET'] || 'shubharambh-local-secret-key';

interface User {
  id: number;
  username: string;
  password?: string;
  role: string;
}

interface AuthRequest extends express.Request {
  user?: User;
}

// Auth Middleware
const authenticate = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const token = (req.headers['authorization']?.split(' ')[1] || req.query['token']) as string;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as User;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Multer Config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadFolder),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// API Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (user && user.password && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Expenses
app.get('/api/expenses', authenticate, (req, res) => {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  res.json(expenses);
});

app.post('/api/expenses', authenticate, upload.single('receipt'), (req: AuthRequest, res) => {
  const { title, amount, date, category, description } = req.body;
  const receipt_path = req.file ? req.file.filename : null;
  const result = db.prepare('INSERT INTO expenses (title, amount, date, category, description, receipt_path) VALUES (?, ?, ?, ?, ?, ?)')
    .run(title, amount, date, category, description, receipt_path);
  
  if (req.user) {
    db.prepare('INSERT INTO audit_logs (user_id, action) VALUES (?, ?)').run(req.user.id, `Added expense: ${title}`);
  }
  res.json({ id: result.lastInsertRowid });
});

// Attendance
app.get('/api/attendance', authenticate, (req, res) => {
  const attendance = db.prepare('SELECT * FROM attendance ORDER BY date DESC').all();
  res.json(attendance);
});

app.post('/api/attendance', authenticate, (req, res) => {
  const { staff_id, staff_type, date, status, description } = req.body;
  const result = db.prepare('INSERT INTO attendance (staff_id, staff_type, date, status, description) VALUES (?, ?, ?, ?, ?)')
    .run(staff_id, staff_type, date, status, description);
  res.json({ id: result.lastInsertRowid });
});

// Members
app.get('/api/members', authenticate, (req, res) => {
  const members = db.prepare('SELECT * FROM members').all();
  res.json(members);
});

app.post('/api/members', authenticate, (req, res) => {
  const { name, role, phone, address, responsibility } = req.body;
  const result = db.prepare('INSERT INTO members (name, role, phone, address, responsibility) VALUES (?, ?, ?, ?, ?)')
    .run(name, role, phone, address, responsibility);
  res.json({ id: result.lastInsertRowid });
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticate, (req, res) => {
  const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get() as { total: number | null };
  const staffCount = db.prepare('SELECT COUNT(DISTINCT staff_id) as count FROM attendance').get() as { count: number };
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get() as { count: number };
  const recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5').all();
  
  res.json({
    totalExpenses: totalExpenses.total || 0,
    staffCount: staffCount.count || 0,
    memberCount: memberCount.count || 0,
    recentLogs
  });
});

// Audit Report
app.get('/api/reports/audit', authenticate, (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const year = parseInt(req.query['year'] as string) || new Date().getFullYear();
  const startDate = `${year}-04-01`;
  const endDate = `${year + 1}-03-31`;

  const expenses = db.prepare('SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date ASC').all(startDate, endDate);
  const attendance = db.prepare('SELECT * FROM attendance WHERE date >= ? AND date <= ? ORDER BY date ASC').all(startDate, endDate);
  const logs = db.prepare('SELECT * FROM audit_logs WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC').all(startDate, endDate);

  const summary = {
    totalExpenses: (db.prepare('SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ?').get(startDate, endDate) as { total: number | null }).total || 0,
    expenseCount: expenses.length,
    attendanceCount: attendance.length,
    logCount: logs.length
  };

  res.json({ summary, expenses, attendance, logs });
});

// Expense Predictions
app.get('/api/reports/predictions', authenticate, (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  
  // Get monthly totals for the last 24 months
  const monthlyData = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(amount) as total
    FROM expenses
    GROUP BY month
    ORDER BY month DESC
    LIMIT 24
  `).all() as { month: string, total: number }[];

  // Simple linear regression for next 6 months
  // y = mx + b
  const data = monthlyData.reverse();
  const n = data.length;
  if (n < 2) {
    res.json({ history: data, predictions: [] });
    return;
  }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i].total;
    sumXY += i * data[i].total;
    sumX2 += i * i;
  }

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  const predictions = [];
  const lastMonth = new Date(data[n - 1].month + '-01');
  for (let i = 1; i <= 6; i++) {
    const nextMonth = new Date(lastMonth);
    nextMonth.setMonth(lastMonth.getMonth() + i);
    const monthStr = nextMonth.toISOString().substring(0, 7);
    predictions.push({
      month: monthStr,
      total: Math.max(0, m * (n + i - 1) + b)
    });
  }

  res.json({ history: data, predictions });
});

// Backup/Restore
app.get('/api/system/backup', authenticate, (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const backupPath = join(__dirname, '../shubharambh_backup.db');
  db.backup(backupPath)
    .then(() => {
      res.download(backupPath);
    })
    .catch((err: Error) => res.status(500).json({ error: err.message }));
});

// Serve uploads
app.use('/uploads', express.static(uploadFolder));

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
