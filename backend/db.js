import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri || mongoUri.includes('<username>')) {
      console.warn('⚠️  [MongoDB] Cảnh báo: Vui lòng dán link MongoDB thật vào file .env');
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('✅ [MongoDB] Đã kết nối thành công tới Cơ sở dữ liệu Cloud');
    await initRootAdmin();
  } catch (error) {
    console.error('❌ [MongoDB] Lỗi kết nối:', error.message);
    process.exit(1);
  }
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  expireAt: { type: Date, required: true },
  status: { type: String, default: 'active', enum: ['active', 'banned'] }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);

const initRootAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        expireAt: new Date('2099-12-31')
      });
      console.log('✅ [MongoDB] Đã tạo tài khoản Root Admin mặc định: admin / admin123');
    }
  } catch (error) {
    console.error('❌ Lỗi tạo Root Admin:', error.message);
  }
};

export default connectDB;
