'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

const NAV_ITEMS = [
  { href: '/admin', label: '📊 Dashboard', icon: '📊' },
  { href: '/admin/users', label: '👥 Users', icon: '👥' },
  { href: '/admin/cards', label: '🃏 Cards', icon: '🃏' },
  { href: '/admin/config', label: '⚙️ Config', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Skip auth check for login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsChecking(false);
      return;
    }

    const token = localStorage.getItem('sb-admin-token');
    const user = localStorage.getItem('sb-admin-user');

    if (!token || !user) {
      router.push('/admin/login');
      return;
    }

    try {
      setAdminUser(JSON.parse(user));
    } catch {
      router.push('/admin/login');
      return;
    }

    setIsChecking(false);
  }, [isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem('sb-admin-token');
    localStorage.removeItem('sb-admin-user');
    router.push('/admin/login');
  };

  // Login page renders without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isChecking) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingIcon}>⚙️</div>
        <p>Đang xác thực quyền admin...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminRoot}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>🔧</div>
          <div>
            <div className={styles.logoTitle}>SB-GARAGE</div>
            <div className={styles.logoSub}>ADMIN PANEL</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <span className={styles.adminBadge}>ADMIN</span>
            <span className={styles.adminName}>{adminUser?.username || '---'}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
