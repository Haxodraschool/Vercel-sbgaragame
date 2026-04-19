'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('sb-admin-token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the normal login API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng nhập thất bại');
        setLoading(false);
        return;
      }

      // Now verify admin role
      const profileRes = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${data.token}` },
      });

      if (!profileRes.ok) {
        setError('⛔ Tài khoản này không có quyền Admin!');
        setLoading(false);
        return;
      }

      // Store admin token separately
      localStorage.setItem('sb-admin-token', data.token);
      localStorage.setItem('sb-admin-user', JSON.stringify(data.user));
      router.push('/admin');
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.icon}>🔧</div>
          <h1 className={styles.title}>SB-GARAGE</h1>
          <p className={styles.subtitle}>ADMIN PANEL</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '⏳ Đang xác thực...' : '🔐 ĐĂNG NHẬP ADMIN'}
          </button>
        </form>

        <div className={styles.footer}>
          Chỉ dành cho quản trị viên hệ thống
        </div>
      </div>
    </div>
  );
}
