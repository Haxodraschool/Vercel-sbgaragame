'use client';

import React, { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

interface StatsData {
  overview: {
    totalPlayers: number;
    totalAdmins: number;
    totalCards: number;
    totalInventoryItems: number;
    totalGoldInCirculation: number;
    totalQuests: number;
    successQuests: number;
    questSuccessRate: number;
    totalBosses: number;
    totalEvents: number;
  };
  recentPlayers: Array<{
    id: number;
    username: string;
    level: number;
    gold: number;
    currentDay: number;
    updatedAt: string;
  }>;
  popularCards: Array<{
    cardId: number;
    totalOwned: number;
    name: string;
    rarity: number;
    type: string;
  }>;
}

const RARITY_COLORS: Record<number, string> = {
  1: '#9ca3af', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#eab308',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sb-admin-token');
    if (!token) return;

    fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.overview) setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.loading}>⏳ Đang tải dữ liệu...</div>;
  }

  if (!stats) {
    return <div className={styles.loading}>❌ Không thể tải dữ liệu</div>;
  }

  const { overview, recentPlayers, popularCards } = stats;

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>📊 Dashboard</h1>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard icon="👥" label="Players" value={overview.totalPlayers} color="#06b6d4" />
        <StatCard icon="🛡️" label="Admins" value={overview.totalAdmins} color="#a855f7" />
        <StatCard icon="🃏" label="Thẻ Bài" value={overview.totalCards} color="#22c55e" />
        <StatCard icon="💰" label="Gold Lưu Hành" value={overview.totalGoldInCirculation.toLocaleString()} color="#fbbf24" />
        <StatCard icon="📦" label="Items Sở Hữu" value={overview.totalInventoryItems} color="#f97316" />
        <StatCard icon="📋" label="Quests" value={`${overview.successQuests}/${overview.totalQuests}`} color="#3b82f6" sub={`${overview.questSuccessRate}% win`} />
        <StatCard icon="👹" label="Bosses" value={overview.totalBosses} color="#ef4444" />
        <StatCard icon="⚡" label="Events" value={overview.totalEvents} color="#eab308" />
      </div>

      {/* Bottom Section */}
      <div className={styles.bottomGrid}>
        {/* Recent Players */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>🕒 Players Hoạt Động Gần Đây</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Level</th>
                <th>Gold</th>
                <th>Day</th>
              </tr>
            </thead>
            <tbody>
              {recentPlayers.map((p) => (
                <tr key={p.id}>
                  <td className={styles.idCell}>#{p.id}</td>
                  <td>{p.username}</td>
                  <td>Lv.{p.level}</td>
                  <td className={styles.goldCell}>{p.gold.toLocaleString()}g</td>
                  <td>Day {p.currentDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Popular Cards */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>🔥 Thẻ Phổ Biến Nhất</h2>
          <div className={styles.cardList}>
            {popularCards.map((c, i) => (
              <div key={c.cardId} className={styles.cardRow}>
                <span className={styles.rank}>#{i + 1}</span>
                <span className={styles.cardName} style={{ color: RARITY_COLORS[c.rarity] }}>
                  {'★'.repeat(c.rarity)} {c.name}
                </span>
                <span className={styles.cardType}>{c.type}</span>
                <span className={styles.cardCount}>{c.totalOwned} owned</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statInfo}>
        <div className={styles.statValue} style={{ color }}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}
