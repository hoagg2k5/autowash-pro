import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail, getOtpTemplate } from '../utils/email.js';
import { 
  findUserByPhone, 
  findVehiclesByUserId 
} from '../db-helper.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Otp from '../models/Otp.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-autowash';

export const register = async (req, res) => {
  try {
    const { phone, fullName, password, licensePlate, brand, model, color, email, otp } = req.body;
    
    if (!phone || !fullName || !password || !licensePlate || !email || !otp) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ Số điện thoại, Họ tên, Mật khẩu, Biển số xe, Email và Mã OTP xác thực." });
    }

    // 1. Kiểm tra số điện thoại định dạng VN
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Số điện thoại không đúng định dạng Việt Nam." });
    }

    // 2. Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email không đúng định dạng." });
    }

    // 3. Kiểm tra định dạng biển số xe VN
    const plateRegex = /^[0-9]{2}[A-Z0-9][- -]?[0-9]{4,5}$/;
    if (!plateRegex.test(licensePlate)) {
      return res.status(400).json({ error: "Biển số xe không đúng định dạng Việt Nam." });
    }

    // 4. Độ dài mật khẩu tối thiểu
    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu phải chứa ít nhất 6 ký tự để đảm bảo bảo mật." });
    }

    // Kiểm tra số điện thoại trùng lặp
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "Số điện thoại này đã được đăng ký." });
    }

    // Kiểm tra email trùng lặp
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email này đã được sử dụng." });
    }

    // Kiểm tra biển số xe trùng lặp
    const cleanedPlate = licensePlate.toUpperCase().trim();
    const existingPlate = await Vehicle.findOne({ licensePlate: cleanedPlate });
    if (existingPlate) {
      return res.status(400).json({ error: "Biển số xe này đã tồn tại trên hệ thống." });
    }

    // Xác minh mã OTP
    const otpRecord = await Otp.findOne({ email, type: 'register' });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Mã xác thực OTP không chính xác hoặc đã hết hạn." });
    }

    // Kiểm tra thời gian hết hạn (5 phút)
    const minutesElapsed = (Date.now() - new Date(otpRecord.createdAt).getTime()) / 1000 / 60;
    if (minutesElapsed > 5) {
      return res.status(400).json({ error: "Mã xác thực OTP đã hết hạn sử dụng." });
    }

    // Khởi tạo tài khoản Người dùng (Mặc định vai trò 'customer')
    const newUser = new User({
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      phone,
      fullName,
      email,
      role: 'customer',
      password: bcrypt.hashSync(password, 10),
      createdAt: new Date(),
      loyaltyTier: 'Member',
      totalSpent: 0,
      pointsBalance: 0,
      pointsExpiredSoon: 0,
      tierExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    await newUser.save();

    // Khởi tạo xe liên kết
    const newVehicle = new Vehicle({
      id: 'v-' + Math.random().toString(36).substr(2, 9),
      userId: newUser.id,
      licensePlate: cleanedPlate,
      brand: brand || 'Khác',
      model: model || 'Khác',
      color: color || 'Khác'
    });
    await newVehicle.save();

    // Xóa OTP sau khi đăng ký thành công
    await Otp.deleteOne({ _id: otpRecord._id });

    // Sinh mã JWT Token
    const token = jwt.sign({ id: newUser.id, role: newUser.role, branch: newUser.branch }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ 
      message: "Đăng ký thành công", 
      user: newUser,
      vehicle: newVehicle,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, phoneOrEmail, password } = req.body;
    const loginId = phoneOrEmail || phone;
    
    if (!loginId || !password) {
      return res.status(400).json({ error: "Số điện thoại / Email và Mật khẩu là bắt buộc." });
    }

    const user = await User.findOne({ $or: [{ phone: loginId }, { email: loginId }] });
    if (!user) {
      return res.status(404).json({ error: "Tài khoản không tồn tại. Vui lòng đăng ký." });
    }

    // Xác minh mật khẩu
    const isMatch = (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))
      ? bcrypt.compareSync(password, user.password)
      : user.password === password;

    if (!isMatch) {
      return res.status(401).json({ error: "Mật khẩu không chính xác." });
    }

    // Tự động mã hóa mật khẩu plaintext thành bcrypt khi đăng nhập thành công
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      try {
        user.password = bcrypt.hashSync(password, 10);
        await user.save();
      } catch (err) {
        console.error("Failed to migrate password on login:", err);
      }
    }

    // Sinh mã JWT Token
    const token = jwt.sign({ id: user.id, role: user.role, branch: user.branch }, JWT_SECRET, { expiresIn: '24h' });

    if (user.role === 'customer') {
      const vehicles = await findVehiclesByUserId(user.id);
      return res.json({ user, token, vehicles });
    }

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendEmailOTP = async (email, otp, type) => {
  const subject = type === 'register' ? '[AutoWash Pro] Mã OTP đăng ký tài khoản' : '[AutoWash Pro] Mã OTP khôi phục mật khẩu';
  const htmlContent = getOtpTemplate(otp, type);

  const result = await sendEmail({
    to: email,
    subject,
    html: htmlContent
  });

  return { 
    success: true, 
    fallback: !!result.simulated 
  };
};

export const sendOtpEndpoint = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email là bắt buộc." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email không đúng định dạng." });
    }

    const resolvedType = type || 'register';
    if (!['register', 'forgot-password'].includes(resolvedType)) {
      return res.status(400).json({ error: "Loại OTP không hợp lệ." });
    }

    // Kiểm tra email theo type
    if (resolvedType === 'register') {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: "Email này đã được sử dụng." });
      }
    } else if (resolvedType === 'forgot-password') {
      const userExists = await User.findOne({ email });
      if (!userExists) {
        return res.status(404).json({ error: "Email này chưa được đăng ký trong hệ thống." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu vào DB
    await Otp.findOneAndUpdate(
      { email, type: resolvedType },
      { otp, createdAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    const emailResult = await sendEmailOTP(email, otp, resolvedType);

    res.json({
      message: emailResult.fallback 
        ? "Mã OTP đã được tạo (Vì chưa cấu hình Gmail trong .env, hãy kiểm tra Terminal backend để lấy mã)."
        : "Mã OTP đã được gửi đến email của bạn.",
      fallback: !!emailResult.fallback
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPasswordEndpoint = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ Email, Mã OTP và Mật khẩu mới." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu mới phải chứa ít nhất 6 ký tự." });
    }

    // Kiểm tra OTP
    const otpRecord = await Otp.findOne({ email, type: 'forgot-password' });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Mã xác thực OTP không chính xác hoặc đã hết hạn." });
    }

    // Kiểm tra thời gian hết hạn (5 phút)
    const minutesElapsed = (Date.now() - new Date(otpRecord.createdAt).getTime()) / 1000 / 60;
    if (minutesElapsed > 5) {
      return res.status(400).json({ error: "Mã xác thực OTP đã hết hạn sử dụng." });
    }

    // Tìm và cập nhật user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Tài khoản với email này không tồn tại." });
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();

    // Xóa OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Mật khẩu đã được cập nhật thành công." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
