'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './cards.module.css';

interface CardData {
  id: number; name: string; type: string; rarity: number;
  statPower: number; statHeat: number; statStability: number;
  cost: number; description: string | null; imageUrl: string | null;
  effects: Array<{ id: number; triggerCondition: string; description: string }>;
}

const CARD_TYPES = ['ENGINE','TURBO','EXHAUST','COOLING','FILTER','FUEL','SUSPENSION','TIRE','NITROUS','TOOL','CREW'];
const RARITY_COLORS: Record<number,string> = { 1:'#9ca3af', 2:'#22c55e', 3:'#3b82f6', 4:'#a855f7', 5:'#eab308' };
const RARITY_NAMES: Record<number,string> = { 1:'Common', 2:'Uncommon', 3:'Rare', 4:'Epic', 5:'Legendary' };
const getToken = () => localStorage.getItem('sb-admin-token') || '';

export default function CardsPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CardData | null>(null);
  const [editing, setEditing] = useState<Partial<CardData>>({});
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (rarityFilter) params.set('rarity', rarityFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/cards?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.cards) setCards(data.cards);
    setLoading(false);
  }, [typeFilter, rarityFilter, search]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const selectCard = (card: CardData) => {
    setSelected(card);
    setEditing({ ...card });
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!selected) return;
    const res = await fetch(`/api/admin/cards/${selected.id}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    if (res.ok) { fetchCards(); if (data.card) { setSelected(data.card); setEditing({ ...data.card }); } }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`/api/admin/cards/${selected.id}/image`, {
      method: 'POST', headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    setTimeout(() => setMessage(''), 3000);
  };

  // Live Preview values
  const previewData = { ...selected, ...editing };
  const maxPower = 250, maxHeat = 175, maxStability = 120;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>🃏 Quản Lý Thẻ Bài</h1>
      {message && <div className={styles.message}>{message}</div>}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input className={styles.searchInput} placeholder="🔍 Tìm tên thẻ..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={styles.filterSelect} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tất cả loại</option>
          {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className={styles.filterSelect} value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
          <option value="">Tất cả ★</option>
          {[1,2,3,4,5].map((r) => <option key={r} value={r}>{'★'.repeat(r)} {RARITY_NAMES[r]}</option>)}
        </select>
      </div>

      <div className={styles.content}>
        {/* Cards Table */}
        <div className={styles.tableWrap}>
          {loading ? <div className={styles.loading}>⏳ Đang tải...</div> : (
            <table className={styles.table}>
              <thead>
                <tr><th>ID</th><th>Ảnh</th><th>Tên</th><th>Type</th><th>★</th><th>Power</th><th>Heat</th><th>Stab</th><th>Giá</th></tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} className={selected?.id === c.id ? styles.rowSelected : ''} onClick={() => selectCard(c)}>
                    <td className={styles.idCell}>#{c.id}</td>
                    <td><img src={c.imageUrl || `/componentcardimg/${c.id}.jpg`} alt="" className={styles.thumbImg} onError={(e) => { (e.target as HTMLImageElement).src = '/componentcardimg/placeholder.jpg'; }} /></td>
                    <td className={styles.nameCell} style={{ color: RARITY_COLORS[c.rarity] }}>{c.name}</td>
                    <td className={styles.typeCell}>{c.type}</td>
                    <td style={{ color: RARITY_COLORS[c.rarity] }}>{'★'.repeat(c.rarity)}</td>
                    <td className={styles.powerCell}>{c.statPower}</td>
                    <td className={styles.heatCell}>{c.statHeat}</td>
                    <td className={styles.stabCell}>{c.statStability}</td>
                    <td className={styles.costCell}>{c.cost}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Edit + Live Preview Panel */}
        {selected && (
          <div className={styles.editPanel}>
            {/* Live Preview Card */}
            <div className={styles.previewCard}>
              <div className={styles.previewImgWrap} style={{ borderColor: RARITY_COLORS[previewData.rarity || 1] }}>
                <img src={imagePreview || previewData.imageUrl || `/componentcardimg/${selected.id}.jpg`} alt={previewData.name || ''} onError={(e) => { (e.target as HTMLImageElement).src = '/componentcardimg/placeholder.jpg'; }} />
              </div>
              <div className={styles.previewName}>{previewData.name}</div>
              <div className={styles.previewRarity} style={{ color: RARITY_COLORS[previewData.rarity || 1] }}>
                {'★'.repeat(previewData.rarity || 1)}{'☆'.repeat(5 - (previewData.rarity || 1))} {RARITY_NAMES[previewData.rarity || 1]}
              </div>
              <div className={styles.previewStats}>
                <div className={styles.previewStat}>
                  <span className={styles.previewStatLabel}>🔥 Power</span>
                  <div className={styles.previewBar}><div className={styles.previewBarFill} style={{ width: `${Math.min(Math.abs(previewData.statPower || 0) / maxPower * 100, 100)}%`, background: 'linear-gradient(90deg,#16a34a,#22c55e)' }} /></div>
                  <span style={{ color: '#22c55e' }}>{(previewData.statPower || 0) > 0 ? '+' : ''}{previewData.statPower || 0}</span>
                </div>
                <div className={styles.previewStat}>
                  <span className={styles.previewStatLabel}>🌡️ Heat</span>
                  <div className={styles.previewBar}><div className={styles.previewBarFill} style={{ width: `${Math.min(Math.abs(previewData.statHeat || 0) / maxHeat * 100, 100)}%`, background: (previewData.statHeat || 0) < 0 ? 'linear-gradient(90deg,#7c3aed,#a855f7)' : 'linear-gradient(90deg,#dc2626,#ef4444)' }} /></div>
                  <span style={{ color: (previewData.statHeat || 0) < 0 ? '#a855f7' : '#ef4444' }}>{(previewData.statHeat || 0) > 0 ? '+' : ''}{previewData.statHeat || 0}</span>
                </div>
                <div className={styles.previewStat}>
                  <span className={styles.previewStatLabel}>⚖️ Stab</span>
                  <div className={styles.previewBar}><div className={styles.previewBarFill} style={{ width: `${Math.min(Math.abs(previewData.statStability || 0) / maxStability * 100, 100)}%`, background: (previewData.statStability || 0) < 0 ? 'linear-gradient(90deg,#dc2626,#ef4444)' : 'linear-gradient(90deg,#2563eb,#3b82f6)' }} /></div>
                  <span style={{ color: (previewData.statStability || 0) < 0 ? '#ef4444' : '#3b82f6' }}>{(previewData.statStability || 0) > 0 ? '+' : ''}{previewData.statStability || 0}</span>
                </div>
              </div>
              <div className={styles.previewCost}>💰 {previewData.cost || 0}g</div>
            </div>

            {/* Edit Form */}
            <div className={styles.editForm}>
              <h3 className={styles.editTitle}>✏️ Chỉnh Sửa</h3>

              <div className={styles.editField}>
                <label>Tên</label>
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className={styles.editRow}>
                <div className={styles.editField}>
                  <label>Type</label>
                  <select value={editing.type || ''} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                    {CARD_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.editField}>
                  <label>Rarity</label>
                  <select value={editing.rarity || 1} onChange={(e) => setEditing({ ...editing, rarity: parseInt(e.target.value) })}>
                    {[1,2,3,4,5].map((r) => <option key={r} value={r}>{'★'.repeat(r)}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.editRow}>
                <div className={styles.editField}><label>Power</label><input type="number" value={editing.statPower ?? ''} onChange={(e) => setEditing({ ...editing, statPower: parseInt(e.target.value) || 0 })} /></div>
                <div className={styles.editField}><label>Heat</label><input type="number" value={editing.statHeat ?? ''} onChange={(e) => setEditing({ ...editing, statHeat: parseInt(e.target.value) || 0 })} /></div>
                <div className={styles.editField}><label>Stability</label><input type="number" value={editing.statStability ?? ''} onChange={(e) => setEditing({ ...editing, statStability: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className={styles.editField}><label>Giá (Gold)</label><input type="number" value={editing.cost ?? ''} onChange={(e) => setEditing({ ...editing, cost: parseInt(e.target.value) || 0 })} /></div>
              <div className={styles.editField}><label>Mô tả</label><textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} /></div>

              {/* Image Upload */}
              <div className={styles.editField}>
                <label>Ảnh thẻ</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
                <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>📁 Chọn ảnh mới</button>
              </div>

              <div className={styles.editActions}>
                <button className={styles.saveBtn} onClick={handleSave}>💾 Lưu Thay Đổi</button>
                <button className={styles.cancelBtn} onClick={() => { setEditing({ ...selected }); setImagePreview(null); }}>↩️ Hoàn tác</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
