import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB, { User } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'ZALO_PRO_SUPER_SECRET_KEY';

// Kết nối MongoDB
connectDB();

// ==========================================
// MIDDLEWARES
// ==========================================
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại' });
    if (user.status !== 'active') return res.status(403).json({ success: false, error: 'Tài khoản đã bị khóa' });
    if (new Date() > new Date(user.expireAt)) return res.status(403).json({ success: false, error: 'Tài khoản đã hết hạn. Vui lòng gia hạn thêm!' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ success: false, error: 'Không có quyền Admin' });
};


// ==========================================
// ROUTES: AUTH (Dành cho App Khách hàng đăng nhập)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { username, password, isDesktop } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success: false, error: 'Sai tài khoản hoặc mật khẩu' });
    if (user.status !== 'active') return res.status(403).json({ success: false, error: 'Tài khoản đã bị khóa bởi Admin' });
    if (new Date() > new Date(user.expireAt)) return res.status(403).json({ success: false, error: 'Giấy phép đã hết hạn. Vui lòng liên hệ Admin để gia hạn!' });

    // Kiểm tra mật khẩu
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ success: false, error: 'Sai tài khoản hoặc mật khẩu' });

    // Tạo JWT Token
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        expireAt: user.expireAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/heartbeat', verifyToken, (req, res) => {
  res.json({ success: true, user: { expireAt: req.user.expireAt, status: req.user.status } });
});


// ==========================================
// ROUTES: ADMIN QUẢN LÝ (Dành cho Web Admin)
// ==========================================
// 1. Lấy danh sách user
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password') // Không trả về mật khẩu
      .sort({ createdAt: -1 });
    
    // Đổi _id thành id cho Frontend dễ xử lý
    const formattedUsers = users.map(u => ({
      id: u._id,
      username: u.username,
      role: u.role,
      expireAt: u.expireAt,
      status: u.status,
      createdAt: u.createdAt
    }));
    
    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Tạo tài khoản mới cho khách
app.post('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  const { username, password, days = 30 } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, error: 'Tên đăng nhập đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + parseInt(days));

    await User.create({
      username,
      password: hashedPassword,
      expireAt
    });

    res.json({ success: true, message: 'Tạo tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// 4. Gia hạn thời gian (Cộng thêm ngày)
app.put('/api/admin/users/:id/extend', verifyToken, requireAdmin, async (req, res) => {
  const { days } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Không tìm thấy user' });

    const currentExpire = new Date(user.expireAt);
    const newExpire = currentExpire > new Date() ? currentExpire : new Date();
    newExpire.setDate(newExpire.getDate() + parseInt(days));

    user.expireAt = newExpire;
    await user.save();
    
    res.json({ success: true, message: `Đã gia hạn thêm ${days} ngày thành công` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Khóa / Mở khóa tài khoản
app.put('/api/admin/users/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// CẤU HÌNH PRODUCTION ĐỂ CHẠY TRÊN VPS
// (Máy chủ Backend sẽ kiêm luôn việc hiển thị giao diện Web Admin)
// ==========================================
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../web-admin/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../web-admin/dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[License Server] is running on port ${PORT}`);
});
