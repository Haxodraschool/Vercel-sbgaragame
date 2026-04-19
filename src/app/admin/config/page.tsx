'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './config.module.css';

const getToken = () => localStorage.getItem('sb-admin-token') || '';

export default function ConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bosses');
  const [message, setMessage] = useState('');
  const [editingBoss, setEditingBoss] = useState<any>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/config', { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.gameConstants) setConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleUpdateBoss = async (bossId: number, data: any) => {
    const res = await fetch('/api/admin/config', {
      method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'boss', id: bossId, data }),
    });
    const result = await res.json();
    showMsg(result.message || result.error);
    if (res.ok) { fetchConfig(); setEditingBoss(null); }
  };

  // DB Backup
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/admin/db', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' }),
      });
      const data = await res.json();
      if (data.backup) {
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sb-garage-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showMsg('📥 Backup đã tải về thành công!');
      }
    } catch { showMsg('❌ Lỗi backup'); }
    setBackupLoading(false);
  };

  // DB Restore
  const handleRestore = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!confirm('⚠️ Khôi phục sẽ ghi đè dữ liệu cards/effects/combos. Tiếp tục?')) return;

      const text = await file.text();
      const backup = JSON.parse(text);
      const res = await fetch('/api/admin/db', {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', data: backup.data }),
      });
      const result = await res.json();
      showMsg(result.message || result.error);
      if (res.ok) fetchConfig();
    };
    input.click();
  };

  if (loading) return <div className={styles.loading}>⏳ Đang tải...</div>;
  if (!config) return <div className={styles.loading}>❌ Lỗi tải config</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>⚙️ Cấu Hình Game</h1>
      {message && <div className={styles.message}>{message}</div>}

      {/* Tabs */}
      <div className={styles.tabs}>
        {['bosses', 'events', 'constants', 'database'].map((t) => (
          <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'bosses' ? '👹 Bosses' : t === 'events' ? '⚡ Events' : t === 'constants' ? '🔧 Constants' : '💾 Database'}
          </button>
        ))}
      </div>

      {/* Bosses Tab */}
      {activeTab === 'bosses' && (
        <div className={styles.section}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Tên</th><th>Power Req</th><th>Gold Reward</th><th>Special</th><th>Actions</th></tr></thead>
            <tbody>
              {config.bosses?.map((b: any) => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td className={styles.bossName}>{b.name}</td>
                  <td>{editingBoss?.id === b.id ? <input type="number" value={editingBoss.requiredPower} onChange={(e) => setEditingBoss({ ...editingBoss, requiredPower: parseInt(e.target.value) })} className={styles.inlineInput} /> : b.requiredPower}</td>
                  <td className={styles.goldCell}>{editingBoss?.id === b.id ? <input type="number" value={editingBoss.rewardGold} onChange={(e) => setEditingBoss({ ...editingBoss, rewardGold: parseInt(e.target.value) })} className={styles.inlineInput} /> : `${b.rewardGold}g`}</td>
                  <td className={styles.specialCell}>{b.specialCondition || '—'}</td>
                  <td>
                    {editingBoss?.id === b.id ? (
                      <>
                        <button className={styles.saveBtn} onClick={() => handleUpdateBoss(b.id, { requiredPower: editingBoss.requiredPower, rewardGold: editingBoss.rewardGold })}>💾</button>
                        <button className={styles.cancelBtn} onClick={() => setEditingBoss(null)}>✕</button>
                      </>
                    ) : (
                      <button className={styles.editBtn} onClick={() => setEditingBoss({ ...b })}>✏️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className={styles.section}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Tên</th><th>Type</th><th>Target</th><th>Value</th><th>Probability</th></tr></thead>
            <tbody>
              {config.events?.map((e: any) => (
                <tr key={e.id}>
                  <td>#{e.id}</td>
                  <td>{e.name}</td>
                  <td><span className={styles.typeBadge}>{e.type}</span></td>
                  <td>{e.targetAttribute || '—'}</td>
                  <td>{e.effectValue}</td>
                  <td>{(e.probability * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Constants Tab */}
      {activeTab === 'constants' && (
        <div className={styles.section}>
          <div className={styles.constantsGrid}>
            {Object.entries(config.gameConstants).filter(([, v]) => typeof v === 'number' || typeof v === 'string').map(([key, value]) => (
              <div key={key} className={styles.constantItem}>
                <span className={styles.constantKey}>{key}</span>
                <span className={styles.constantValue}>{String(value)}</span>
              </div>
            ))}
          </div>
          <div className={styles.note}>
            💡 Để chỉnh constants, sửa trực tiếp trong file <code>src/lib/auth.ts</code> → GAME_CONSTANTS
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className={styles.section}>
          <div className={styles.dbActions}>
            <div className={styles.dbCard}>
              <div className={styles.dbIcon}>📥</div>
              <h3>Backup Database</h3>
              <p>Export toàn bộ dữ liệu (users, cards, configs) ra file JSON</p>
              <button className={styles.dbBtn} onClick={handleBackup} disabled={backupLoading}>
                {backupLoading ? '⏳ Đang backup...' : '📥 Tải Backup'}
              </button>
            </div>
            <div className={styles.dbCard}>
              <div className={styles.dbIcon}>📤</div>
              <h3>Restore Database</h3>
              <p>Khôi phục cards/effects/combos từ file backup JSON</p>
              <button className={styles.dbBtn} onClick={handleRestore}>📤 Chọn File Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
