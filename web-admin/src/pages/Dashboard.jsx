import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, Search, Plus, MonitorOff, CalendarClock, ShieldBan, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  // Create Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDays, setNewDays] = useState('30');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/admin/users', { username: newUsername, password: newPassword, days: newDays });
      setShowCreate(false);
      setNewUsername('');
      setNewPassword('');
      toast.success('Tạo tài khoản thành công!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi tạo tài khoản');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetMachine = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa liên kết thiết bị của tài khoản này?')) return;
    try {
      await api.put(`/admin/users/${id}/reset-machine`);
      toast.success('Gia hạn tài khoản thành công!');
      fetchUsers();
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExtend = async (id) => {
    const days = prompt('Nhập số ngày muốn gia hạn thêm:', '30');
    if (!days || isNaN(days)) return;
    try {
      await api.put(`/admin/users/${id}/extend`, { days });
      toast.success('Gia hạn tài khoản thành công!');
      fetchUsers();
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    if (!confirm(`Bạn có chắc muốn ${newStatus === 'banned' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;
    try {
      await api.put(`/admin/users/${id}/status`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công!');
      fetchUsers();
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ flex: 1, padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
            <Users size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quản lý Khách hàng</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Theo dõi và cấp phép sử dụng phần mềm</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ color: 'var(--text-muted)' }}>
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input type="text" placeholder="Tìm kiếm tài khoản..." style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%' }} />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={18} /> Cấp tài khoản mới
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={30} style={{ margin: '0 auto 10px' }} />
            Đang tải dữ liệu...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Trạng thái</th>
                  <th>Ngày hết hạn</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Chưa có khách hàng nào. Hãy tạo mới!
                    </td>
                  </tr>
                ) : users.map(user => {
                  const isExpired = new Date(user.expireAt) < new Date();
                  return (
                    <tr key={user.id} className="animate-fade-in">
                      <td>
                        <div style={{ fontWeight: 500 }}>{user.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tham gia: {new Date(user.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td>
                        {user.status === 'banned' ? (
                          <span className="badge badge-inactive">Bị khóa</span>
                        ) : isExpired ? (
                          <span className="badge badge-inactive">Hết hạn</span>
                        ) : (
                          <span className="badge badge-active">Hoạt động</span>
                        )}
                      </td>
                      <td>
                        <div style={{ color: isExpired ? '#ef4444' : 'inherit' }}>
                          {new Date(user.expireAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleExtend(user.id)} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.8rem' }} title="Gia hạn thêm ngày">
                            <CalendarClock size={16} />
                          </button>

                          <button onClick={() => handleToggleStatus(user.id, user.status)} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.8rem', color: user.status === 'active' ? '#ef4444' : '#10b981' }} title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}>
                            {user.status === 'active' ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tạo tài khoản */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Tạo tài khoản khách hàng</h2>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label>Tên đăng nhập</label>
                <input type="text" className="input-control" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Mật khẩu</label>
                <input type="text" className="input-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Thời hạn (Số ngày)</label>
                <input type="number" className="input-control" value={newDays} onChange={e => setNewDays(e.target.value)} required min="1" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isCreating}>
                  {isCreating ? 'Đang tạo...' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
