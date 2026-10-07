import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success && res.data.user.role === 'admin') {
        localStorage.setItem('adminToken', res.data.token);
        navigate('/');
      } else {
        setError('Tài khoản không có quyền truy cập trang quản trị!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Hãy kiểm tra kết nối!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginBottom: '16px' }}>
            <ShieldAlert size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>AutoZalo Pro</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Hệ thống quản lý Giấy phép (Admin)</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Tên đăng nhập (Admin)</label>
            <input 
              type="text" 
              className="input-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Nhập tên tài khoản..." 
              required 
            />
          </div>
          <div className="input-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              className="input-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Nhập mật khẩu..." 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập Hệ thống'}
          </button>
        </form>
      </div>
    </div>
  );
}
