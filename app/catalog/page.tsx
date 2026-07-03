'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ContinueDesignBanner } from '@/components/ContinueDesignBanner';
import { useFavorites } from '@/lib/useFavorites';
import Link from 'next/link';
import { CATALOG_DESIGNS, CATALOG_CATEGORIES, type CatalogDesign } from '@/lib/catalogDesigns';
import { PRODUCT_TYPE_LABELS, PRODUCT_PATHS, PRODUCT_BASE_PRICE } from '@/lib/productTypes';
import type { ProductType } from '@/lib/productTypes';
import { SHIRT_COLORS, SHIRT_SIZES, SHIPPING_PRICE } from '@/lib/mockData';
import type { TShirtColor, TShirtSize } from '@/lib/mockData';
import { submitOrder } from '@/lib/exportDesign';
import { useToast } from '@/components/Toast';
import ShirtMockup from '@/components/ShirtMockup';
import { useLocalSession } from '@/lib/useLocalSession';
import { svgToDataUrl } from '@/lib/svgDataUrl';
type TextPos = 'top' | 'center' | 'bottom';
type FontStyle = 'bold' | 'script' | 'minimal';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const FONT_CSS: Record<FontStyle, React.CSSProperties> = {
  bold:    { fontWeight: 900, fontStyle: 'normal', letterSpacing: '0.03em' },
  script:  { fontWeight: 600, fontStyle: 'italic', letterSpacing: '0.01em' },
  minimal: { fontWeight: 300, fontStyle: 'normal', letterSpacing: '0.18em' },
};

function ColorSwatch({ c, selected, onClick }: { c: TShirtColor; selected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={c.name}
      aria-label={`Select color: ${c.name}`}
      aria-pressed={selected}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 40, height: 40, borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected
          ? `0 0 0 2.5px #fff, 0 0 0 5px ${c.hex}, 0 6px 18px ${c.hex}88`
          : hover
          ? `0 0 0 2px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.4)`
          : `0 2px 8px rgba(0,0,0,0.35)`,
        transform: selected ? 'scale(1.18)' : hover ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {selected && <svg viewBox="0 0 16 16" width={15} height={15} fill="none" stroke={c.textColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3L13 5" /></svg>}
    </button>
  );
}

function SvgPreview({ svg, color, size = 56 }: { svg: string; color: string; size?: number }) {
  const colored = svg.replace(/currentColor/g, color);
  return <div style={{ width: size, height: size, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: colored.replace('<svg ', `<svg width="${size}" height="${size}" `) }} />;
}

function StateSelect({ id, value, onChange, style }: { id?: string; value: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value)} style={{ ...style, color: value ? '#fff' : 'rgba(255,255,255,0.28)' }}>
      <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>ST</option>
      {US_STATES.map(s => <option key={s} value={s} style={{ background: '#1a1a1a', color: '#fff' }}>{s}</option>)}
    </select>
  );
}

function DrawerShirt({ design, color, frontText, backText, frontPos, backPos, frontFont, backFont, showBack, productType }: {
  design: CatalogDesign; color: TShirtColor | null;
  frontText: string; backText: string;
  frontPos: TextPos; backPos: TextPos;
  frontFont: FontStyle; backFont: FontStyle;
  showBack: boolean; productType: ProductType;
}) {
  const bg = color?.hex ?? '#2a2a2a';
  const tc = color?.textColor ?? 'rgba(255,255,255,0.6)';
  const textY = (pos: TextPos) => pos === 'top' ? '30%' : pos === 'bottom' ? '74%' : '67%';
  const activeText = showBack ? backText : frontText;
  const activePos = showBack ? backPos : frontPos;
  const activeFont = showBack ? backFont : frontFont;
  const p = PRODUCT_PATHS[productType];
  const isSocks = productType === 'SOCKS';

  if (productType === 'TSHIRT') {
    return (
      <div style={{ position: 'relative', width: 130, height: 150 }}>
        <ShirtMockup colorHex={bg} size={130} style={{ width: 130, height: 150 }} />
        {!showBack && (
          <div style={{ position: 'absolute', top: '34%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <SvgPreview svg={design.svg} color={tc} size={46} />
          </div>
        )}
        {activeText && (
          <div style={{ position: 'absolute', top: textY(activePos), left: '50%', transform: 'translateX(-50%)', fontSize: '7.5px', color: tc, maxWidth: 82, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...FONT_CSS[activeFont] }}>
            {activeText}
          </div>
        )}
        {showBack && <div style={{ position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', fontSize: '6px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.1em' }}>BACK</div>}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: 130, height: 130 }}>
      <svg width="130" height="130" viewBox="0 0 200 200" fill="none">
        <path d={p.body} fill={bg} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
        {p.shadeLeft  && <path d={p.shadeLeft}  fill="rgba(0,0,0,0.07)"/>}
        {p.shadeRight && <path d={p.shadeRight} fill="rgba(0,0,0,0.05)"/>}
        {p.detail     && <path d={p.detail} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5" strokeLinecap="round"/>}
      </svg>
      {!showBack && !isSocks && (
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <SvgPreview svg={design.svg} color={tc} size={50} />
        </div>
      )}
      {isSocks && !showBack && (
        <div style={{ position: 'absolute', top: '55%', left: '48%', transform: 'translate(-50%,-50%)' }}>
          <SvgPreview svg={design.svg} color={tc} size={36} />
        </div>
      )}
      {activeText && !isSocks && (
        <div style={{ position: 'absolute', top: textY(activePos), left: '50%', transform: 'translateX(-50%)', fontSize: '7.5px', color: tc, maxWidth: 90, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...FONT_CSS[activeFont] }}>
          {activeText}
        </div>
      )}
      {showBack && <div style={{ position: 'absolute', bottom: 4, width: '100%', textAlign: 'center', fontSize: '6px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.1em' }}>BACK</div>}
    </div>
  );
}

function ShirtCard({ design, selected, onClick, featured = false, fav = false, onToggleFav }: { design: CatalogDesign; selected: boolean; onClick: () => void; featured?: boolean; fav?: boolean; onToggleFav?: () => void }) {
  const [hover, setHover] = useState(false);
  const mock = featured ? 200 : 120;
  const art = featured ? 80 : 48;
  return (
    <div onClick={onClick} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()} role="button" tabIndex={0} aria-label={`Select ${design.title} - $${design.price}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className={`scan-card holo-card${featured ? ' cat-featured-card' : ''}`} style={{ height: '100%', display: 'flex', flexDirection: featured ? 'row' : 'column', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', position: 'relative', border: `1.5px solid ${selected ? '#00E5C8' : hover ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`, background: selected ? 'rgba(0,229,200,0.05)' : hover ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)', boxShadow: selected ? '0 0 28px rgba(0,229,200,0.22), 0 0 0 1px rgba(0,229,200,0.1)' : hover ? '0 12px 40px rgba(0,0,0,0.35)' : 'none', transform: hover ? 'translateY(-4px) scale(1.01)' : 'none' }}>
      {featured && <div aria-hidden="true" style={{ position: 'absolute', bottom: -10, right: 8, zIndex: 0, fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '5rem', lineHeight: 1, color: 'rgba(0,229,200,0.05)', letterSpacing: '0.04em', pointerEvents: 'none' }}>FEATURED</div>}
      {design.badge && <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, fontSize: '0.5rem', fontWeight: 800, padding: '3px 7px', borderRadius: 999, background: design.badge === 'bestseller' ? '#FF4D1C' : design.badge === 'new' ? '#10B981' : '#8B5CF6', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{design.badge}</div>}
      {design.artistName && <div style={{ position: 'absolute', top: design.badge ? 28 : 10, left: 10, zIndex: 2, fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(0,153,255,0.85)', color: '#fff', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 3 }}><svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={8} height={8} aria-hidden="true"><path d="M1 9c1.5-3 3.5-7 4.5-7s.5 1.5 0 2c-1 1 1.5 1.5 2-.5"/><circle cx="9" cy="1.5" r=".75"/></svg>{design.artistName}</div>}
      {selected && <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(0,229,200,0.5)' }}><svg viewBox="0 0 14 14" width={12} height={12} fill="none" stroke="#050507" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7.5l2.5 2.5L11 4" /></svg></div>}
      {onToggleFav && (
        <button aria-label={fav ? `Remove ${design.title} from saved` : `Save ${design.title}`} aria-pressed={fav}
          onClick={e => { e.stopPropagation(); onToggleFav(); }}
          style={{ position: 'absolute', top: selected ? 38 : 10, right: 10, zIndex: 3, width: 26, height: 26, borderRadius: '50%', border: `1px solid ${fav ? 'rgba(255,77,109,0.55)' : 'rgba(255,255,255,0.14)'}`, background: fav ? 'rgba(255,77,109,0.16)' : 'rgba(5,5,8,0.72)', color: fav ? '#ff4d6d' : 'rgba(255,255,255,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'all 0.15s' }}>
          <svg viewBox="0 0 16 16" width={13} height={13} fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 13.5C5 11 2 8.8 2 5.9 2 4 3.5 2.5 5.3 2.5c1.1 0 2.1.5 2.7 1.4.6-.9 1.6-1.4 2.7-1.4C12.5 2.5 14 4 14 5.9c0 2.9-3 5.1-6 7.6z"/></svg>
        </button>
      )}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: featured ? '1.5rem' : '1.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: featured ? '0 0 auto' : undefined }}>
        <div style={{ position: 'relative', width: mock, height: mock }}>
          <ShirtMockup colorHex="#2a2a2a" size={mock} />
          <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)' }}><SvgPreview svg={design.svg} color="rgba(255,255,255,0.75)" size={art} /></div>
        </div>
      </div>
      <div style={{ padding: featured ? '1.5rem' : '0.875rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: featured ? 1 : undefined, position: 'relative', zIndex: 1 }}>
        {featured && <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(0,229,200,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Editor&apos;s pick</div>}
        <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: featured ? 'clamp(1.6rem,3vw,2.4rem)' : '1.05rem', letterSpacing: '0.04em', lineHeight: 1.05, marginBottom: 3 }}>{design.title}</div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: featured ? 14 : 8 }}>{design.category}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: featured ? '1.9rem' : '1.2rem', letterSpacing: '0.04em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>${design.price}</span>
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>+ ${SHIPPING_PRICE} ship</span>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const router = useRouter();
  const session = useLocalSession();
  const [catFilter, setCatFilter] = useState('All');
  const { favorites, toggle: toggleFav, isFav } = useFavorites();
  const [favOnly, setFavOnly] = useState(false);
  const [productFilter, setProductFilter] = useState<ProductType | 'ALL'>('ALL');
  const [drawerProductType, setDrawerProductType] = useState<ProductType>('TSHIRT');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'featured'|'price-asc'|'price-desc'|'newest'>('featured');
  const [selected, setSelected] = useState<CatalogDesign | null>(null);
  const [artistDesigns, setArtistDesigns] = useState<CatalogDesign[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState<TShirtColor | null>(null);
  const [size, setSize] = useState<TShirtSize | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontPos, setFrontPos] = useState<TextPos>('center');
  const [backPos, setBackPos] = useState<TextPos>('center');
  const [frontFont, setFrontFont] = useState<FontStyle>('bold');
  const [backFont, setBackFont] = useState<FontStyle>('bold');

  const [drawerStep, setDrawerStep] = useState<'customize' | 'delivery'>('customize');
  const [shipName, setShipName] = useState('');
  const [shipEmail, setShipEmail] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipZip, setShipZip] = useState('');
  const [shipState, setShipState] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { show: showToast, element: toastEl } = useToast();

  useEffect(() => {
    if (session === undefined) return; // not hydrated yet
    if (!session) { router.replace('/'); return; }
    // Prefill the order form once, asynchronously, to avoid cascading renders
    const t = setTimeout(() => {
      if (session.name && session.name !== 'Guest') setShipName(prev => prev || session.name);
      if (session.email) setShipEmail(prev => prev || session.email!);
      try {
        const saved = localStorage.getItem('pd_shipping');
        if (saved) {
          const s = JSON.parse(saved);
          setShipStreet(prev => prev || (s.street ?? ''));
          setShipCity(prev => prev || (s.city ?? ''));
          setShipZip(prev => prev || (s.zip ?? ''));
          setShipState(prev => prev || (s.state ?? ''));
        }
      } catch { /* ignore corrupt saved shipping */ }
    }, 0);
    return () => clearTimeout(t);
  }, [session, router]);

  useEffect(() => {
    fetch('/api/catalog/artist-designs')
      .then(r => r.json())
      .then(setArtistDesigns)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (selected && drawerRef.current && !drawerRef.current.contains(e.target as Node)) closeDrawer();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && selected) closeDrawer();
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', handleKey); };
  }, [selected]);

  function openDesign(d: CatalogDesign) {
    setSelected(d); setColor(null); setSize(null);
    setFrontText(''); setBackText(''); setShowBack(false);
    setDrawerStep('customize'); setOrdered(false);
    setDrawerProductType('TSHIRT');
  }
  function closeDrawer() { setSelected(null); }

  const allDesigns = [...CATALOG_DESIGNS, ...artistDesigns];
  const filtered = allDesigns
    .filter(d => !favOnly || favorites.includes(d.id))
    .filter(d => catFilter === 'All' || d.category === catFilter)
    .filter(d => productFilter === 'ALL' || d.productType === productFilter)
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      const rank = (d: CatalogDesign) => d.badge === 'bestseller' ? 0 : d.badge === 'new' ? 1 : 2;
      if (sortBy === 'newest') return (a.badge === 'new' ? 0 : 1) - (b.badge === 'new' ? 0 : 1);
      return rank(a) - rank(b); // featured: bestsellers, then new, then the rest
    });

  // Density-contrast: highlight one bestseller as a large editorial card, but only
  // in the unfiltered default view (filtering/searching keeps a clean uniform grid).
  const isDefaultView = !search && catFilter === 'All' && productFilter === 'ALL';
  const featuredId = isDefaultView ? (filtered.find(d => d.badge === 'bestseller')?.id ?? null) : null;

  const total = PRODUCT_BASE_PRICE[drawerProductType] + SHIPPING_PRICE;
  const customizeDone = color !== null && size !== null;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipEmail);
  const deliveryDone = shipName.trim().length > 1 && emailValid && shipStreet.trim().length > 3 && shipCity.trim().length > 1 && /^\d{5}$/.test(shipZip) && shipState !== '';

  async function handleOrder() {
    if (!selected || !color || !size) return;
    setSubmitting(true);
    try {
      const svgDataUrl = svgToDataUrl(selected.svg.replace(/currentColor/g, color.textColor));
      const result = await submitOrder({
        customerName: shipName, customerEmail: shipEmail,
        shippingName: shipName, shippingAddr: shipStreet,
        shippingCity: shipCity, shippingZip: shipZip, shippingState: shipState, total,
        design: {
          title: selected.title, emoji: '',
          customText: [frontText, backText].filter(Boolean).join(' | ') || undefined,
          colorHex: color.hex, colorName: color.name, size, price: selected.price, svgDataUrl,
          artistDesignId: selected.originalId ?? undefined,
        },
      });
      if (result.ok) {
        if (saveAddress) {
          try { localStorage.setItem('pd_shipping', JSON.stringify({ street: shipStreet, city: shipCity, zip: shipZip, state: shipState })); } catch { /* ignore */ }
        }
        setOrderId(result.id); setOrdered(true);
        showToast('Order request sent!', 'success');
      } else {
        showToast(result.error, 'error');
      }
    } catch { showToast('Network error. Check your connection.', 'error'); }
    finally { setSubmitting(false); }
  }

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.55rem 0.75rem', color: '#fff', fontSize: '0.82rem', outline: 'none' };

  if (!session) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#050507,#060610)' }}><div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>Loading...</div></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#050507 0%,#060610 100%)', position: 'relative' }}>
      {toastEl}
      <ContinueDesignBanner/>
      {/* Background atmosphere */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,200,0.04) 0%, transparent 60%)', top: '-5%', right: '10%' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 65%)', bottom: '15%', left: '2%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      {selected && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }} />}

      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: 12, background: 'rgba(5,5,7,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => router.push('/home')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Outfit', system-ui, sans-serif" }}><svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 6H2M6 2L2 6l4 4" /></svg>Back</button>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.35rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1, margin: 0 }}>Catalog</h1>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: '2px 8px' }}>{allDesigns.length} designs</span>
        <div style={{ flex: 1 }} />
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search designs..." aria-label="Search designs" maxLength={80} style={{ ...inp, width: 200, padding: '0.45rem 0.75rem', fontSize: '0.78rem', borderRadius: 8 }} />
      </header>

      <div style={{ position: 'sticky', top: 56, zIndex: 45, background: 'rgba(5,5,7,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Product type strip */}
        <div className="rsp-pad" style={{ padding: '0.625rem 2rem 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['ALL', 'TSHIRT', 'LONG_SLEEVE', 'HOODIE', 'HOODIE_VEST', 'SOCKS'] as const).map(pt => (
            <button key={pt} aria-pressed={productFilter === pt} onClick={() => setProductFilter(pt)} style={{ padding: '4px 12px', borderRadius: 999, border: '1px solid', borderColor: productFilter === pt ? 'rgba(0,229,200,0.45)' : 'rgba(255,255,255,0.07)', background: productFilter === pt ? 'rgba(0,229,200,0.08)' : 'transparent', color: productFilter === pt ? '#00E5C8' : 'rgba(255,255,255,0.32)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4 }}>
              {pt === 'ALL' ? <><svg viewBox="0 0 12 12" width={9} height={9} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 1v10M1 6h10M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>All Types</> : PRODUCT_TYPE_LABELS[pt]}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <div className="rsp-pad" style={{ padding: '0.625rem 2rem 0.75rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATALOG_CATEGORIES.map(c => (
            <button key={c} aria-pressed={catFilter === c} onClick={() => setCatFilter(c)} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: catFilter === c ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)', background: catFilter === c ? 'rgba(99,102,241,0.1)' : 'transparent', color: catFilter === c ? '#818CF8' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{c}</button>
          ))}
          <select aria-label="Sort designs" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
            <option value="featured" style={{ background: '#111' }}>Featured</option>
            <option value="newest" style={{ background: '#111' }}>Newest</option>
            <option value="price-asc" style={{ background: '#111' }}>Price: low to high</option>
            <option value="price-desc" style={{ background: '#111' }}>Price: high to low</option>
          </select>
          {favorites.length > 0 && (
            <button aria-pressed={favOnly} onClick={() => setFavOnly(v => !v)} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: favOnly ? 'rgba(255,77,109,0.55)' : 'rgba(255,77,109,0.22)', background: favOnly ? 'rgba(255,77,109,0.12)' : 'transparent', color: favOnly ? '#ff4d6d' : 'rgba(255,77,109,0.65)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg viewBox="0 0 16 16" width={11} height={11} fill="currentColor" aria-hidden="true"><path d="M8 13.5C5 11 2 8.8 2 5.9 2 4 3.5 2.5 5.3 2.5c1.1 0 2.1.5 2.7 1.4.6-.9 1.6-1.4 2.7-1.4C12.5 2.5 14 4 14 5.9c0 2.9-3 5.1-6 7.6z"/></svg>
              Saved ({favorites.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Editorial billboard ── */}
      <section aria-label="Catalog intro" style={{ position: 'relative', zIndex: 1, overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Ghost word */}
        <div aria-hidden="true" style={{ position: 'absolute', top: '50%', right: '-2%', transform: 'translateY(-50%)', fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(7rem,22vw,18rem)', color: 'rgba(0,229,200,0.04)', letterSpacing: '0.02em', lineHeight: 0.8, pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}>WEAR IT</div>
        <div className="rsp-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '3.25rem 2rem 2.5rem', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.62rem', fontWeight: 700, color: 'rgba(0,229,200,0.75)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.9rem' }}>
            <span style={{ width: 18, height: 1, background: 'rgba(0,229,200,0.6)' }} />
            The Collection
          </div>
          <h2 className="text-reveal" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(3rem,9vw,7rem)', fontWeight: 400, letterSpacing: '0.025em', lineHeight: 0.86, margin: 0, maxWidth: 720 }}>
            <span style={{ display: 'block', color: '#fff' }}>Designed by you.</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#00E5C8 0%,#0099FF 50%,#7B61FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Worn everywhere.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.92rem', lineHeight: 1.65, maxWidth: 420, marginTop: '1.1rem' }}>
            Every piece starts as a curated design concept. Pick one, make it yours, and submit a clean order request in seconds.
          </p>
          {/* Stat strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1.25rem,4vw,2.75rem)', marginTop: '2rem', flexWrap: 'wrap' }}>
            {[[`${allDesigns.length}`, 'Designs'], ['300dpi', 'Artwork'], ['Review', 'Ready'], ['50%', 'To Artists']].map(([n, l], i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1.25rem,4vw,2.75rem)' }}>
                {i > 0 && <span aria-hidden="true" style={{ width: 1, height: 28, background: 'rgba(0,229,200,0.18)' }} />}
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 400, letterSpacing: '0.03em', lineHeight: 1, background: 'linear-gradient(135deg,#fff 40%,rgba(0,229,200,0.85))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{n}</div>
                  <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>{l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gridAutoFlow: 'dense', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
        {filtered.map((d, i) => {
          const isFeatured = d.id === featuredId;
          return (
            <div key={d.id} className={isFeatured ? 'cat-featured' : undefined} style={{ animation: `up 0.45s ease ${Math.min(i * 0.05, 0.5)}s both` }}>
              <ShirtCard design={d} selected={selected?.id === d.id} onClick={() => openDesign(d)} featured={isFeatured} fav={isFav(d.id)} onToggleFav={() => toggleFav(d.id)} />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,229,200,0.06)', border: '1px solid rgba(0,229,200,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,229,200,0.6)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" width={28} height={28} aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6M11 8v6"/></svg>
            </div>
            <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 400, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.7)', lineHeight: 1.1, marginBottom: '0.75rem' }}>
              {search ? `NOTHING FOR "${search.toUpperCase()}"` : 'NO DESIGNS HERE'}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', maxWidth: 320, lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {search ? 'Try a different search term or explore all categories.' : 'Start a custom design or choose another category with ready-to-order styles.'}
            </p>
            {(search || catFilter !== 'All') && (
              <button onClick={() => { setSearch(''); setCatFilter('All'); }} style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: '1px solid rgba(0,229,200,0.3)', background: 'rgba(0,229,200,0.06)', color: '#00E5C8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Drawer */}
      <div ref={drawerRef} role={selected ? 'dialog' : undefined} aria-modal={selected ? true : undefined} aria-label={selected ? `Customize ${selected.title}` : undefined} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(460px, 100vw)', zIndex: 60, background: '#0f0f0f', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', transform: selected ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', boxShadow: selected ? '-24px 0 60px rgba(0,0,0,0.5)' : 'none' }}>
        {selected && (
          <>
            <div style={{ height: 54, display: 'flex', alignItems: 'center', padding: '0 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, gap: 10 }}>
              {drawerStep === 'delivery' && !ordered && <button aria-label="Back to customize" onClick={() => setDrawerStep('customize')} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 2 }}><svg viewBox="0 0 14 14" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 7H3M7 3L3 7l4 4" /></svg></button>}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selected.title}</div>
                <div aria-live="polite" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{ordered ? 'Request sent' : drawerStep === 'customize' ? 'Step 1 - Customize' : 'Step 2 - Delivery'}</div>
              </div>
              <button aria-label="Close panel" onClick={closeDrawer} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg viewBox="0 0 14 14" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" /></svg></button>
            </div>

            {ordered ? (
              <div role="status" aria-live="polite" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '2rem' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,229,200,0.15),rgba(0,153,255,0.1))', border: '1px solid rgba(0,229,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#00E5C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28} aria-hidden="true"><path d="M5 12l5 5 9-9"/></svg>
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.35rem' }}>Order request sent</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{selected.title} - {color?.name} - Size {size}</div>
                {orderId && <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', fontFamily: 'monospace' }}>#{orderId.slice(0,8).toUpperCase()}</div>}
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>Check your order status in your <Link href="/profile" style={{ color: '#00E5C8', textDecoration: 'none' }}>profile page</Link>.</p>
                <button onClick={() => { setOrdered(false); setSelected(null); }} style={{ marginTop: 4, padding: '0.75rem 2rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', color: '#050507', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', boxShadow: '0 6px 20px rgba(0,229,200,0.3)' }}>Back to catalog</button>
              </div>
            ) : drawerStep === 'customize' ? (
              <>
                {/* Preview + front/back toggle */}
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.25rem 1rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <DrawerShirt design={selected} color={color} frontText={frontText} backText={backText} frontPos={frontPos} backPos={backPos} frontFont={frontFont} backFont={backFont} showBack={showBack} productType={drawerProductType} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(['front', 'back'] as const).map(side => (
                        <button key={side} aria-pressed={(showBack ? side === 'back' : side === 'front')} onClick={() => setShowBack(side === 'back')} style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid', borderColor: (showBack ? side === 'back' : side === 'front') ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)', background: (showBack ? side === 'back' : side === 'front') ? 'rgba(0,229,200,0.08)' : 'transparent', color: (showBack ? side === 'back' : side === 'front') ? '#00E5C8' : 'rgba(255,255,255,0.3)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {side === 'front'
                            ? <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={11} height={11} aria-hidden="true"><path d="M3 2C2 3 1 4 1 5l1.5 1C2 8.5 2 10.5 2 12h10c0-1.5 0-3.5-.5-6L13 5c0-1-1-2-2-3l-2 1C8 2 7 2 7 2s-1 0-2 .5z"/></svg> Front</>
                            : <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width={11} height={11} aria-hidden="true"><path d="M10 3L6 7l4 4"/><path d="M6 7H13"/><path d="M3 2v10"/></svg> Back</>
                          }
                          {(side === 'front' ? frontText : backText) && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00E5C8', display: 'inline-block' }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                  {/* Product type */}
                  <div style={{ marginBottom: '1.15rem' }}>
                    <div style={lbl}>Product Type</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(['TSHIRT', 'LONG_SLEEVE', 'HOODIE', 'HOODIE_VEST', 'SOCKS'] as const).map(pt => (
                        <button key={pt} aria-pressed={drawerProductType === pt} onClick={() => setDrawerProductType(pt)} style={{ padding: '5px 11px', borderRadius: 9, border: `1.5px solid ${drawerProductType === pt ? 'rgba(0,229,200,0.45)' : 'rgba(255,255,255,0.08)'}`, background: drawerProductType === pt ? 'rgba(0,229,200,0.09)' : 'rgba(255,255,255,0.02)', color: drawerProductType === pt ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {PRODUCT_TYPE_LABELS[pt]}
                          {drawerProductType === pt && <span style={{ fontSize: '0.55rem', color: '#00E5C8', opacity: 0.8 }}>${PRODUCT_BASE_PRICE[pt]}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Color */}
                  <div style={{ marginBottom: '1.15rem' }}>
                    <div style={lbl}>Shirt Color {color && <span style={{ fontWeight: 500, textTransform: 'none' }}>- {color.name}</span>}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 4 }}>
                      {SHIRT_COLORS.map(c => <ColorSwatch key={c.id} c={c} selected={color?.id === c.id} onClick={() => setColor(c)} />)}
                    </div>
                  </div>
                  {/* Size */}
                  <div style={{ marginBottom: '1.15rem' }}>
                    <div style={lbl}>Size {size && <span style={{ fontWeight: 500, textTransform: 'none' }}>- {size}</span>}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {SHIRT_SIZES.map(s => <button key={s} aria-pressed={size === s} onClick={() => setSize(s)} style={{ width: 42, height: 42, borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${size === s ? 'rgba(0,229,200,0.5)' : 'rgba(255,255,255,0.08)'}`, background: size === s ? 'rgba(0,229,200,0.1)' : 'rgba(255,255,255,0.02)', color: size === s ? '#00E5C8' : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s', boxShadow: size === s ? '0 0 12px rgba(0,229,200,0.15)' : 'none' }}>{s}</button>)}
                    </div>
                  </div>
                  {/* Text */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                    <div style={lbl}>Text - {showBack ? 'Back' : 'Front'} <span style={{ fontWeight: 400, textTransform: 'none', color: 'rgba(255,255,255,0.2)' }}>(optional)</span></div>
                    <input
                      aria-label={`Custom text on ${showBack ? 'back' : 'front'} of shirt`}
                      value={showBack ? backText : frontText}
                      onChange={e => showBack ? setBackText(e.target.value) : setFrontText(e.target.value)}
                      maxLength={28} placeholder="e.g. YOUR NAME..."
                      style={inp}
                    />
                    {(showBack ? backText : frontText) && (
                      <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <div style={lbl}>Position</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(['top', 'center', 'bottom'] as TextPos[]).map(p => (
                              <button key={p} aria-pressed={(showBack ? backPos : frontPos) === p} onClick={() => showBack ? setBackPos(p) : setFrontPos(p)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${(showBack ? backPos : frontPos) === p ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)'}`, background: (showBack ? backPos : frontPos) === p ? 'rgba(0,229,200,0.07)' : 'transparent', color: (showBack ? backPos : frontPos) === p ? '#00E5C8' : 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}>{p}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={lbl}>Font</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {([['bold','BOLD'],['script','Script'],['minimal','minimal']] as [FontStyle,string][]).map(([f, label]) => (
                              <button key={f} aria-pressed={(showBack ? backFont : frontFont) === f} onClick={() => showBack ? setBackFont(f) : setFrontFont(f)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${(showBack ? backFont : frontFont) === f ? 'rgba(0,229,200,0.4)' : 'rgba(255,255,255,0.07)'}`, background: (showBack ? backFont : frontFont) === f ? 'rgba(0,229,200,0.07)' : 'transparent', color: (showBack ? backFont : frontFont) === f ? '#00E5C8' : 'rgba(255,255,255,0.35)', fontSize: f === 'bold' ? '0.7rem' : '0.72rem', fontWeight: f === 'bold' ? 900 : f === 'script' ? 600 : 300, fontStyle: f === 'script' ? 'italic' : 'normal', letterSpacing: f === 'minimal' ? '0.12em' : 0 }}>{label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Total</span>
                    <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.3rem', letterSpacing: '0.04em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>${total.toFixed(2)}</span>
                  </div>
                  <button aria-describedby={!customizeDone ? 'customize-hint' : undefined} disabled={!customizeDone} onClick={() => setDrawerStep('delivery')} style={{ width: '100%', height: 46, borderRadius: 12, border: 'none', background: customizeDone ? 'linear-gradient(135deg,#00E5C8,#0099FF)' : 'rgba(255,255,255,0.05)', color: customizeDone ? '#050507' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.88rem', cursor: customizeDone ? 'pointer' : 'default', boxShadow: customizeDone ? '0 6px 20px rgba(0,229,200,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {!color || !size ? <span id="customize-hint">Pick color & size</span> : 'Continue to delivery'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                  {/* Recap */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem', background: 'rgba(0,229,200,0.04)', borderRadius: 12, border: '1px solid rgba(0,229,200,0.12)', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                      <ShirtMockup colorHex={color?.hex ?? '#2a2a2a'} size={56} />
                      <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)' }}><SvgPreview svg={selected.svg} color={color?.textColor ?? '#fff'} size={22} /></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{selected.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{color?.name} - Size {size}</div>
                      {(frontText || backText) && <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{[frontText && `Front: "${frontText}"`, backText && `Back: "${backText}"`].filter(Boolean).join(' - ')}</div>}
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontWeight: 400, fontSize: '1.15rem', letterSpacing: '0.04em', background: 'linear-gradient(135deg,#00E5C8,#0099FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', flexShrink: 0 }}>${total.toFixed(2)}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div className="rsp-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label htmlFor="cat-name" style={lbl}>Full Name</label><input id="cat-name" aria-invalid={shipName.trim().length > 0 && shipName.trim().length < 2} style={inp} name="name" autoComplete="name" value={shipName} onChange={e => setShipName(e.target.value)} placeholder="Jane Smith" maxLength={80} /></div>
                      <div><label htmlFor="cat-email" style={lbl}>Email</label><input id="cat-email" aria-invalid={shipEmail.length > 0 && !emailValid} style={inp} type="email" name="email" autoComplete="email" value={shipEmail} onChange={e => setShipEmail(e.target.value)} placeholder="you@example.com" maxLength={120} /></div>
                    </div>
                    <div><label htmlFor="cat-street" style={lbl}>Street Address</label><input id="cat-street" style={inp} name="street-address" autoComplete="street-address" value={shipStreet} onChange={e => setShipStreet(e.target.value)} placeholder="123 Main St" maxLength={120} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px 80px', gap: 10 }}>
                      <div><label htmlFor="cat-city" style={lbl}>City</label><input id="cat-city" style={inp} name="city" autoComplete="address-level2" value={shipCity} onChange={e => setShipCity(e.target.value)} placeholder="New York" maxLength={60} /></div>
                      <div>
                        <label htmlFor="cat-state" style={lbl}>State</label>
                        <StateSelect id="cat-state" value={shipState} onChange={setShipState} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} />
                      </div>
                      <div><label htmlFor="cat-zip" style={lbl}>ZIP</label><input id="cat-zip" style={{ ...inp, fontFamily: 'monospace' }} name="postal-code" autoComplete="postal-code" inputMode="numeric" value={shipZip} onChange={e => setShipZip(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="10001" /></div>
                    </div>

                    {/* Save checkbox - only for registered users */}
                    {session.type === 'user' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginTop: 4 }}>
                        <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="sr-only" />
                        <div aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${saveAddress ? '#00E5C8' : 'rgba(255,255,255,0.2)'}`, background: saveAddress ? '#00E5C8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer', pointerEvents: 'none' }}>
                          {saveAddress && <svg viewBox="0 0 14 14" width={11} height={11} fill="none" stroke="#050507" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7.5l2.5 2.5L11 4" /></svg>}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Save delivery details for next time</span>
                      </label>
                    )}
                  </div>
                </div>

                <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
                  <button disabled={!deliveryDone || submitting} onClick={handleOrder} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: deliveryDone && !submitting ? 'linear-gradient(135deg,#00E5C8,#0099FF)' : 'rgba(255,255,255,0.05)', color: deliveryDone && !submitting ? '#050507' : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: '0.9rem', cursor: deliveryDone && !submitting ? 'pointer' : 'default', boxShadow: deliveryDone && !submitting ? '0 6px 20px rgba(0,229,200,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {submitting ? 'Sending request...' : !deliveryDone ? 'Fill in delivery details' : `Submit order request - $${total.toFixed(2)}`}
                  </button>
                  {deliveryDone && <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>{[
                    {label: 'Secure', icon: <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={8} height={8} aria-hidden="true"><path d="M5 1L2 2.5v3c0 1.5 1 3 3 3.5 2-.5 3-2 3-3.5v-3z"/></svg>},
                    {label: 'Manual review', icon: <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={8} height={8} aria-hidden="true"><circle cx="5" cy="5" r="4"/><path d="M5 3v2l1.5 1.5"/></svg>},
                    {label: 'Design review', icon: <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={8} height={8} aria-hidden="true"><path d="M2 6L5 3l3 3M5 3v6"/></svg>},
                  ].map(t => <span key={t.label} style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{color:'rgba(0,229,200,0.6)',display:'flex'}}>{t.icon}</span>{t.label}</span>)}</div>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 };
