import type { ImagePos, Layer } from './types';

// Static design-studio data: canvas geometry, libraries, palettes, presets.

export const SVG_W = 200, SVG_H = 230;
export const PRINT = { x:60, y:85, w:80, h:105 };
// Realistic crew-neck tee, front view, in a 200x230 space. Symmetric about x=100:
// shoulders -> tapered sleeve caps -> body with slight waist -> curved hem,
// and a neckline that dips DOWN between the shoulders (a real crew cut-out).
export const SHIRT_PATH = 'M76 50 C68 47,60 45,52 46 C40 49,26 53,18 60 C14 72,13 84,14 96 C24 100,36 102,46 102 C50 100,52 98,54 96 C52 130,51 170,52 208 Q100 216,148 208 C149 170,148 130,146 96 C148 98,150 100,154 102 C164 102,176 100,186 96 C187 84,186 72,182 60 C174 53,160 49,148 46 C140 45,132 47,124 50 Q100 68,76 50 Z';

export const IMG_ZONE: Record<ImagePos,{x:number;y:number;w:number;h:number;clip:'body'|'full';slice?:boolean}> = {
  top:          {x:60,y:90,  w:80,h:44, clip:'body'},
  center:       {x:60,y:115, w:80,h:50, clip:'body'},
  bottom:       {x:60,y:148, w:80,h:42, clip:'body'},
  'full-body':  {x:60,y:90,  w:80,h:110,clip:'body'},
  'full-shirt': {x:20,y:30,  w:160,h:190,clip:'full',slice:true},
};
export const POS_LABELS: Record<ImagePos,string> = {top:'Top',center:'Center',bottom:'Bottom','full-body':'Full front','full-shirt':'All over'};

export const FONTS = [
  {id:'system-ui,sans-serif',                       label:'Sans',    preview:'Aa'},
  {id:'"Georgia",serif',                            label:'Serif',   preview:'Aa'},
  {id:'"Courier New",monospace',                    label:'Mono',    preview:'Aa'},
  {id:'"Impact","Arial Black",sans-serif',          label:'Impact',  preview:'AA'},
  {id:"'Bebas Neue',Impact,sans-serif",             label:'Display', preview:'AA'},
  {id:'"Playfair Display",Georgia,serif',           label:'Elegant', preview:'Aa'},
  {id:'"Brush Script MT","Segoe Script",cursive',   label:'Script',  preview:'Aa'},
  {id:'"Arial Narrow","Helvetica Neue",sans-serif', label:'Narrow',  preview:'Aa'},
  {id:'"Rockwell","Courier Bold",serif',            label:'Slab',    preview:'Aa'},
  {id:'"Verdana",Geneva,sans-serif',                label:'Round',   preview:'Aa'},
];

export const SHAPES_LIB = [
  {char:'★', label:'Star'},    {char:'♥', label:'Heart'},  {char:'◆', label:'Diamond'},
  {char:'●', label:'Circle'},  {char:'■', label:'Square'}, {char:'▲', label:'Triangle'},
  {char:'✦', label:'Sparkle'}, {char:'✚', label:'Cross'},  {char:'☾', label:'Moon'},
  {char:'∞', label:'Infinity'},{char:'⬡', label:'Hex'},    {char:'⚡', label:'Bolt'},
  {char:'↑', label:'Arrow'},   {char:'⊕', label:'Target'}, {char:'☀', label:'Sun'},
  {char:'❋', label:'Flower'},  {char:'⌘', label:'Cmd'},    {char:'⟁', label:'Tri2'},
  {char:'☮', label:'Peace'},   {char:'♠', label:'Spade'},  {char:'♪', label:'Note'},
  {char:'☄', label:'Comet'},   {char:'✈', label:'Plane'},  {char:'⚓', label:'Anchor'},
  {char:'☘', label:'Clover'},  {char:'✺', label:'Burst'},  {char:'❖', label:'Gem'},
  {char:'⌖', label:'Scope'},   {char:'♜', label:'Rook'},   {char:'∴', label:'Dots'},
];

export const EMOJIS_LIB = [
  '🔥','⚡','💀','🎭','🌊','🦁','🎨','🎵','🏆','💎',
  '🌙','⭐','🚀','🎯','🐉','👑','✊','🎪','🌈','🦋',
  '🐺','🦅','🐆','🌺','🍂','🦊','🐉','🌊','⛰','🌴',
];

// True vector shapes (crisp at any size, unlike glyph characters)
export const VECTOR_SHAPES: {kind:string;label:string}[] = [
  {kind:'rect',label:'Square'},  {kind:'circle',label:'Circle'},   {kind:'ring',label:'Ring'},
  {kind:'triangle',label:'Tri'}, {kind:'diamond',label:'Diamond'}, {kind:'star',label:'Star'},
  {kind:'line',label:'Line'},    {kind:'capsule',label:'Capsule'},
];

export const TEXT_COLORS = ['#ffffff','#000000','#FF4D1C','#FFD700','#10B981','#6C63FF','#FF69B4','#00BCD4','#F97316','#8B5CF6','#EF4444','#06B6D4'];

export const GRADIENT_PRESETS: Record<string,{label:string;stops:string[]}> = {
  holo:   {label:'Holo',   stops:['#00E5C8','#0099FF','#7B61FF']},
  sunset: {label:'Sunset', stops:['#F97316','#FF4D8D']},
  gold:   {label:'Gold',   stops:['#FFE259','#FFA751']},
  fire:   {label:'Fire',   stops:['#FF512F','#F09819']},
  ice:    {label:'Ice',    stops:['#83A4D4','#B6FBFF']},
  toxic:  {label:'Toxic',  stops:['#A8E063','#56AB2F']},
};

// One-click text styles — applied on top of the selected text layer
export const TEXT_PRESETS: {name:string;patch:Partial<Layer>}[] = [
  {name:'Neon',    patch:{color:'#00E5C8',glowBlur:7,glowColor:'#00E5C8',strokeWidth:0,gradient:'',shadowBlur:0}},
  {name:'Holo',    patch:{gradient:'holo',glowBlur:0,strokeWidth:0,shadowBlur:0}},
  {name:'Outline', patch:{color:'rgba(0,0,0,0)',strokeColor:'#ffffff',strokeWidth:1.4,gradient:'',glowBlur:0,shadowBlur:0}},
  {name:'Pop',     patch:{shadowDx:3,shadowDy:3,shadowBlur:1,shadowColor:'#000000',gradient:'',glowBlur:0}},
  {name:'Vintage', patch:{italic:true,fontFamily:'"Georgia",serif',color:'#FFD700',opacity:0.85,gradient:'',glowBlur:0,shadowBlur:0}},
  {name:'Clean',   patch:{glowBlur:0,strokeWidth:0,shadowBlur:0,gradient:'',opacity:1,italic:false}},
];

export const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
