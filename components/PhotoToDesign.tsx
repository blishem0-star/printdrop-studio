'use client';
import { useState, useRef } from 'react';

const STYLES = [
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨' },
  { id: 'minimalist', label: 'Minimalist', emoji: '◻️' },
  { id: 'watercolor', label: 'Watercolor', emoji: '🖌️' },
  { id: 'lineart', label: 'Line Art', emoji: '✏️' },
  { id: 'cyberpunk', label: 'Cyberpunk', emoji: '⚡' },
  { id: 'retro', label: 'Retro', emoji: '📺' },
];

const MOCK_RESULTS = ['🐺', '🦊', '🦁', '🐯'];

type Props = {
  onDesignGenerated?: (emoji: string, label: string) => void;
};

export default function PhotoToDesign({ onDesignGenerated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState('cartoon');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  };

  const handleGenerate = () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);

    const steps = [15, 35, 60, 80, 95, 100];
    let i = 0;
    const tick = setInterval(() => {
      setProgress(steps[i]);
      i++;
      if (i >= steps.length) {
        clearInterval(tick);
        const mockEmoji = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
        setResult(mockEmoji);
        setLoading(false);
        onDesignGenerated?.(mockEmoji, `${STYLES.find(s => s.id === style)?.label} Style`);
      }
    }, 500);
  };

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 20, padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 24 }}>📸</div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Photo → AI Design</h3>
          <p style={{ color: '#555', fontSize: 12 }}>Upload any photo. AI transforms it into print-ready art.</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? '#FF4D1C' : '#2a2a2a'}`,
          borderRadius: 14, padding: '2rem',
          textAlign: 'center', cursor: 'pointer',
          background: file ? 'rgba(255,77,28,0.04)' : '#111',
          transition: 'all 0.2s', marginBottom: '1.25rem',
          position: 'relative', overflow: 'hidden',
        }}>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {preview ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
            <img src={preview} alt="preview" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10, border: '2px solid #FF4D1C' }} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{file?.name}</p>
              <p style={{ color: '#555', fontSize: 11 }}>{((file?.size ?? 0) / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
            <p style={{ color: '#666', fontSize: 13 }}>Drop your photo here or <span style={{ color: '#FF4D1C' }}>browse</span></p>
            <p style={{ color: '#444', fontSize: 11, marginTop: 4 }}>JPG, PNG, WEBP · Max 10MB</p>
          </div>
        )}
      </div>

      {/* Style selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
          Art Style
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.4rem 0.875rem', borderRadius: 8,
              border: `1px solid ${style === s.id ? '#FF4D1C' : '#222'}`,
              background: style === s.id ? 'rgba(255,77,28,0.1)' : '#111',
              color: style === s.id ? '#FF8C00' : '#666',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <span>{s.emoji}</span>{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button className="btn-primary" onClick={handleGenerate}
        disabled={!file || loading}
        style={{ width: '100%', justifyContent: 'center', opacity: !file || loading ? 0.5 : 1, position: 'relative', overflow: 'hidden' }}>
        {loading ? `Generating... ${progress}%` : '✦ Transform with AI'}
        {loading && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            height: 3, background: 'rgba(255,255,255,0.4)',
            width: `${progress}%`, transition: 'width 0.4s ease',
          }} />
        )}
      </button>

      {/* Result */}
      {result && !loading && (
        <div style={{ marginTop: '1.25rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{result}</div>
          <p style={{ color: '#10B981', fontWeight: 600, fontSize: 13 }}>✓ AI design generated!</p>
          <p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>Applied to your shirt preview above</p>
        </div>
      )}
    </div>
  );
}
