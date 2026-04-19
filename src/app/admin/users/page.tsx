'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './users.module.css';

interface UserData {
  id: number; username: string; role: string; gold: number; level: number;
  exp: number; currentDay: number; garageHealth: number; techPoints: number;
  crewSlots: number; totalPacksOpened: number; createdAt: string;
}

interface UserDetail extends UserData {
  inventory: Array<{ id: number; cardId: number; quantity: number; card: { id: number; name: string; type: string; rarity: number } }>;
  questCount: number; endingCount: number;
}

const getToken = () => localStorage.getItem('sb-admin-token') || '';

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<UserData> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'PLAYER' });
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchUserDetail = async (userId: number) => {
    const res = await fetch(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.user) { setSelectedUser(data.user); setEditingUser({ ...data.user }); }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !selectedUser) return;
    const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    if (res.ok) { fetchUsers(); fetchUserDetail(selectedUser.id); }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('⚠️ Xác nhận xóa tài khoản này?')) return;
    if (!confirm('⚠️ CẢNH BÁO: Toàn bộ inventory, quests, achievements sẽ bị xóa. Tiếp tục?')) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    setMessage(data.message || data.error);
    if (res.ok) { setSelectedUser(null); fetchUsers(); }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) return;
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    if (res.ok) { setShowCreate(false); setNewUser({ username: '', password: '', role: 'PLAYER' }); fetchUsers(); }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddCard = async (cardId: number) => {
    if (!selectedUser) return;
    await fetch(`/api/admin/users/${selectedUser.id}/inventory`, {
      method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, quantity: 1 }),
    });
    fetchUserDetail(selectedUser.id);
  };

  const handleRemoveCard = async (cardId: number) => {
    if (!selectedUser) return;
    await fetch(`/api/admin/users/${selectedUser.id}/inventory`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId }),
    });
    fetchUserDetail(selectedUser.id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>👥 Quản Lý Users</h1>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>+ Tạo User Mới</button>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      {/* Create User Modal */}
      {showCreate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Tạo Tài Khoản Mới</h2>
            <input placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className={styles.input} />
            <input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={styles.input} />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className={styles.input}>
              <option value="PLAYER">PLAYER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className={styles.modalActions}>
              <button className={styles.saveBtn} onClick={handleCreateUser}>Tạo</button>
              <button className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input className={styles.searchInput} placeholder="🔍 Tìm username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={styles.filterSelect} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Tất cả role</option>
          <option value="PLAYER">PLAYER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <div className={styles.content}>
        {/* Users Table */}
        <div className={styles.tableWrap}>
          {loading ? <div className={styles.loading}>⏳ Đang tải...</div> : (
            <table className={styles.table}>
              <thead>
                <tr><th>ID</th><th>Username</th><th>Role</th><th>Level</th><th>Gold</th><th>Day</th><th>Health</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={selectedUser?.id === u.id ? styles.rowSelected : ''} onClick={() => fetchUserDetail(u.id)}>
                    <td>#{u.id}</td>
                    <td className={styles.usernameCell}>{u.username}</td>
                    <td><span className={u.role === 'ADMIN' ? styles.adminBadge : styles.playerBadge}>{u.role}</span></td>
                    <td>Lv.{u.level}</td>
                    <td className={styles.goldCell}>{u.gold.toLocaleString()}g</td>
                    <td>Day {u.currentDay}</td>
                    <td>{u.garageHealth}%</td>
                    <td><button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* User Detail Panel */}
        {selectedUser && editingUser && (
          <div className={styles.detailPanel}>
            <h2 className={styles.detailTitle}>📝 {selectedUser.username}</h2>

            <div className={styles.fieldGrid}>
              {(['gold', 'level', 'currentDay', 'garageHealth', 'techPoints', 'crewSlots', 'totalPacksOpened'] as const).map((field) => (
                <div key={field} className={styles.field}>
                  <label className={styles.fieldLabel}>{field}</label>
                  <input type="number" className={styles.fieldInput} value={(editingUser as any)[field] ?? ''} onChange={(e) => setEditingUser({ ...editingUser, [field]: Number(e.target.value) })} />
                </div>
              ))}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>role</label>
                <select className={styles.fieldInput} value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                  <option value="PLAYER">PLAYER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className={styles.detailActions}>
              <button className={styles.saveBtn} onClick={handleUpdateUser}>💾 Lưu Thay Đổi</button>
            </div>

            {/* Inventory */}
            <div className={styles.inventorySection}>
              <h3>📦 Inventory ({selectedUser.inventory?.length || 0} loại thẻ)</h3>
              <div className={styles.addCardRow}>
                <input id="addCardId" type="number" placeholder="Card ID" className={styles.fieldInput} />
                <button className={styles.saveBtn} onClick={() => { const el = document.getElementById('addCardId') as HTMLInputElement; handleAddCard(parseInt(el.value)); el.value = ''; }}>+ Thêm</button>
              </div>
              <div className={styles.inventoryList}>
                {selectedUser.inventory?.map((inv) => (
                  <div key={inv.cardId} className={styles.invItem}>
                    <span className={styles.invId}>#{inv.cardId}</span>
                    <span className={styles.invName}>{inv.card.name}</span>
                    <span className={styles.invQty}>×{inv.quantity}</span>
                    <button className={styles.removeBtn} onClick={() => handleRemoveCard(inv.cardId)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
