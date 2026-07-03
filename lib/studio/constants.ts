import type { ActiveTool, ImagePos, Layer } from './types';

// Static design-studio data: canvas geometry, libraries, palettes, presets.

export const SVG_W = 200, SVG_H = 230;
export const PRINT = { x:60, y:85, w:80, h:105 };
// Realistic crew-neck tee, front view, in a 200x230 space. Symmetric about x=100:
// rounded shoulders, shaped sleeves, a relaxed body, and a subtle curved hem.
export const SHIRT_PATH = 'M73 50 C66 48,59 49,51 52 L41 57 C32 62,26 70,23 80 C21 86,24 90,30 91 L45 94 C49 94,53 90,56 82 C56 115,55 162,55 204 C68 208,84 210,100 210 C116 210,132 208,145 204 C145 162,144 115,144 82 C147 90,151 94,155 94 L170 91 C176 90,179 86,177 80 C174 70,168 62,159 57 L149 52 C141 49,134 48,127 50 C120 55,110 58,100 58 C90 58,80 55,73 50 Z';

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
  {id:'"Trebuchet MS","Segoe UI",sans-serif',       label:'Casual',  preview:'Aa'},
  {id:'"Copperplate","Copperplate Gothic Light",fantasy', label:'Caps', preview:'AA'},
];

export const SHAPES_LIB = [
  {char:'*', label:'Star'},      {char:'<3', label:'Heart'},   {char:'<>', label:'Diamond'},
  {char:'o', label:'Circle'},    {char:'[]', label:'Square'},  {char:'^', label:'Triangle'},
  {char:'+', label:'Sparkle'},   {char:'x', label:'Cross'},    {char:'C', label:'Moon'},
  {char:'oo', label:'Infinity'}, {char:'#', label:'Hex'},      {char:'!', label:'Bolt'},
  {char:'->', label:'Arrow'},    {char:'@', label:'Target'},   {char:'O', label:'Sun'},
  {char:'fl', label:'Flower'},   {char:'cmd', label:'Cmd'},    {char:'tri', label:'Tri2'},
  {char:'peace', label:'Peace'}, {char:'sp', label:'Spade'},   {char:'note', label:'Note'},
  {char:'comet', label:'Comet'}, {char:'fly', label:'Plane'},  {char:'anc', label:'Anchor'},
  {char:'cl', label:'Clover'},   {char:'burst', label:'Burst'},{char:'gem', label:'Gem'},
  {char:'scope', label:'Scope'}, {char:'rook', label:'Rook'},  {char:'...', label:'Dots'},
];
export const EMOJIS_LIB = [
  'FIRE','BOLT','SKULL','MASK','WAVE','LION','ART','MUSIC','TROPHY','GEM',
  'MOON','STAR','ROCKET','TARGET','DRAGON','CROWN','FIST','GAME','RAINBOW','WING',
  'TIGER','EAGLE','PANTHER','LEAF','MAPLE','FOX','SEA','MOUNT','PALM','SPARK',
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

// One-click text styles, applied on top of the selected text layer
export const TEXT_PRESETS: {name:string;patch:Partial<Layer>}[] = [
  {name:'Neon',    patch:{color:'#00E5C8',glowBlur:7,glowColor:'#00E5C8',strokeWidth:0,gradient:'',shadowBlur:0}},
  {name:'Holo',    patch:{gradient:'holo',glowBlur:0,strokeWidth:0,shadowBlur:0}},
  {name:'Outline', patch:{color:'rgba(0,0,0,0)',strokeColor:'#ffffff',strokeWidth:1.4,gradient:'',glowBlur:0,shadowBlur:0}},
  {name:'Pop',     patch:{shadowDx:3,shadowDy:3,shadowBlur:1,shadowColor:'#000000',gradient:'',glowBlur:0}},
  {name:'Vintage', patch:{italic:true,fontFamily:'"Georgia",serif',color:'#FFD700',opacity:0.85,gradient:'',glowBlur:0,shadowBlur:0}},
  {name:'Clean',   patch:{glowBlur:0,strokeWidth:0,shadowBlur:0,gradient:'',opacity:1,italic:false}},
];

export const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export const WORKFLOW_GROUPS: { label: string; tools: ActiveTool[]; primary: ActiveTool; detail: string }[] = [
  { label: 'Template', tools: ['templates'], primary: 'templates', detail: 'Start from a ready design' },
  { label: 'Design', tools: ['text', 'shapes'], primary: 'text', detail: 'Add words, icons, and shapes' },
  { label: 'Image', tools: ['upload', 'ai'], primary: 'upload', detail: 'Upload a picture or browse artwork' },
  { label: 'Shirt', tools: ['shirt'], primary: 'shirt', detail: 'Choose color and size' },
  { label: 'Order', tools: ['order'], primary: 'order', detail: 'Review quantity and delivery details' },
];

export const SIDE_TOOLS: { id: ActiveTool; icon: string; label: string; hint: string }[] = [
  { id: 'templates', icon: 'T', label: 'Ready design', hint: 'Start from a template' },
  { id: 'text', icon: 'Aa', label: 'Add text', hint: 'Names, slogans, numbers' },
  { id: 'upload', icon: 'Up', label: 'Add image', hint: 'Logo, photo, sleeve art' },
  { id: 'ai', icon: 'Art', label: 'Art ideas', hint: 'Match artwork to your idea' },
  { id: 'shapes', icon: 'S', label: 'Icons', hint: 'Symbols and shapes' },
  { id: 'order', icon: 'OK', label: 'Finish', hint: 'Review, share, and submit request' },
];
