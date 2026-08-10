import { formatAdminDate } from './adminFormat';

export default function DailyRevenueChart({ orders }) {
  if (!orders.length) return <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>لا توجد بيانات</div>;

  // Group by day
  const dayMap = {};
  orders.forEach(o => {
    const day = formatAdminDate(o.date);
    dayMap[day] = (dayMap[day] || 0) + (o.total || 0);
  });

  const entries = Object.entries(dayMap).slice(-14); // last 14 days
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(([day, revenue]) => (
        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 70, fontSize: 12, fontWeight: 700, color: '#6b7280', textAlign: 'right', flexShrink: 0 }}>{day}</span>
          <div style={{ flex: 1, height: 24, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              background: 'linear-gradient(90deg, var(--brand), #ff6b6b)',
              width: `${(revenue / max) * 100}%`,
              transition: 'width 0.5s',
              minWidth: revenue > 0 ? 4 : 0,
            }} />
          </div>
          <span style={{ width: 80, fontSize: 12, fontWeight: 800, color: '#1a1a2e', textAlign: 'left', flexShrink: 0 }}>{revenue.toFixed(0)} ₪</span>
        </div>
      ))}
    </div>
  );
}
