export default function AdminLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#00E5C8',
            animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
            opacity: 0.6,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scaleY(0.5);opacity:0.3}50%{transform:scaleY(1.5);opacity:0.9}}`}</style>
    </div>
  );
}
