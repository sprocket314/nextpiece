/* Burr Atlas: faceted browser over the puzzlewillbeplayed.com index.
   Data arrives inline as JSON (#DATA rows, #PIECES geometry); see tools/build_atlas.py.
   Every filter lives in the URL, so a view can be bookmarked or shared. */
(function(){
'use strict';

/* ---------- isometric polycube renderer ----------
   Projection from (1,1,1): sx=(x-z)*C, sy=(x+z)*S - y ; visible faces +x,+y,+z.
   Painter's order = ascending (x+y+z). Hidden faces skipped when a neighbour fills them. */
const C=0.8660254, S=0.5;
function decodeVox(w,h,d,hex){
  const rb=(w+7)>>3, need=rb*h*d*2;
  const s=hex.length>=need?hex.slice(0,need):hex.padEnd(need,'0');
  const bytes=new Uint8Array(rb*h*d);
  for(let i=0;i<bytes.length;i++) bytes[i]=parseInt(s.substr(i*2,2),16);
  const set=new Set(); let i=0;
  for(let z=0;z<d;z++) for(let y=0;y<h;y++){
    const off=i*rb; i++;
    for(let x=0;x<w;x++) if((bytes[off+(x>>3)]>>(7-(x&7)))&1) set.add(x+','+y+','+z);
  }
  return set;
}
function isoSVG(vox,u){
  const has=(x,y,z)=>vox.has(x+','+y+','+z);
  const P=(a,b,c)=>[(a-c)*C*u, ((a+c)*S-b)*u];
  const cells=[...vox].map(k=>k.split(',').map(Number));
  cells.sort((A,B)=>(A[0]+A[1]+A[2])-(B[0]+B[1]+B[2]));
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  const poly=[];
  const push=(pts,fill)=>{
    let s='';
    for(const p of pts){ s+=p[0].toFixed(2)+','+p[1].toFixed(2)+' ';
      if(p[0]<minX)minX=p[0]; if(p[0]>maxX)maxX=p[0];
      if(p[1]<minY)minY=p[1]; if(p[1]>maxY)maxY=p[1]; }
    poly.push('<polygon points="'+s.trim()+'" fill="'+fill+'"/>');
  };
  for(const [x,y,z] of cells){
    if(!has(x,y+1,z)) push([P(x,y+1,z),P(x+1,y+1,z),P(x+1,y+1,z+1),P(x,y+1,z+1)],'var(--f-top)');
    if(!has(x+1,y,z)) push([P(x+1,y,z),P(x+1,y,z+1),P(x+1,y+1,z+1),P(x+1,y+1,z)],'var(--f-x)');
    if(!has(x,y,z+1)) push([P(x,y,z+1),P(x+1,y,z+1),P(x+1,y+1,z+1),P(x,y+1,z+1)],'var(--f-z)');
  }
  const pad=u*0.35;
  const vb=[minX-pad,minY-pad,(maxX-minX)+2*pad,(maxY-minY)+2*pad].map(n=>n.toFixed(2)).join(' ');
  return '<svg viewBox="'+vb+'" xmlns="http://www.w3.org/2000/svg" '+
         'shape-rendering="geometricPrecision" aria-hidden="true">'+
         '<g stroke="var(--piece-edge)" stroke-width="'+(u*0.055).toFixed(2)+'" stroke-linejoin="round">'+
         poly.join('')+'</g></svg>';
}

const SITE='https://puzzlewillbeplayed.com/';
const D=JSON.parse(document.getElementById('DATA').textContent);
const PC=JSON.parse(document.getElementById('PIECES').textContent);
const F={}; D.fields.forEach((n,i)=>F[n]=i);
const ROWS=D.rows;
const $=id=>document.getElementById(id);

/* ---------- assembled-shape images: Ishino's renders packed in one sprite ---------- */
const SH=JSON.parse($('SHIDX').textContent);
if(document.body.dataset.sprite)
  document.documentElement.style.setProperty('--sprite',`url("${document.body.dataset.sprite}")`);
function shapeStyle(code,px){
  const p=SH.index[code]; if(!p||!document.body.dataset.sprite) return null;
  const k=px/SH.cell;
  return `background-size:${(SH.cols*SH.cell*k).toFixed(1)}px ${(SH.rows*SH.cell*k).toFixed(1)}px;`+
         `background-position:${(-p[0]*SH.cell*k).toFixed(1)}px ${(-p[1]*SH.cell*k).toFixed(1)}px`;
}

/* ---------- header stats, computed from the data ---------- */
(function stats(){
  const years=ROWS.map(r=>r[F.year]).filter(y=>y>=1800);
  const shapes=new Set(ROWS.map(r=>r[F.shape]).filter(Boolean));
  const fmt=n=>n.toLocaleString('en-GB');
  $('st-npuz').textContent=fmt(ROWS.length);
  $('st-nshape').textContent=fmt(shapes.size);
  $('st-ndsgn').textContent=fmt(D.designers.length);
  $('st-ngeo').textContent=fmt(Object.keys(PC).length);
  $('st-years').textContent=Math.min(...years)+'–'+Math.max(...years);
})();

/* ---------- facet definitions ---------- */
const STRUCT_LABEL={free:'free-standing',board:'board burr',frame:'in a frame',
  traditional:'traditional',variation:'variation',rect:'rectangular',box:'box',
  box333:'box 3x3x3',box444:'box 4x4x4',cube:'cube (other)',cube333:'cube 3x3x3',
  cube444:'cube 4x4x4',cube555:'cube 5x5x5',cube666:'cube 6x6x6',cube777:'cube 7x7x7',
  cubes:'multi-cube',plank:'plank',pin:'pin',tri:'triangular',sphere:'sphere',
  wtc:'weird tilted cube',sliding:'sliding',misc:'miscellaneous'};
const CARRIER_LABEL={free:'free-standing',frame:'in a frame',box:'in a box'};
const TARGET_LABEL={solid:'solid',dense:'dense',open:'open',skeletal:'skeletal',
  'n/a':'n/a',unknown:'unknown'};
const BSTOCK_LABEL={stick:'stick',bar:'bar',board:'board',plate:'plate',block:'block',
  'stick+':'stick +odd','bar+':'bar +odd','board+':'board +odd','plate+':'plate +odd',
  'block+':'block +odd',mixed:'mixed kit','stick?':'stick (inferred)',
  'board?':'board (inferred)','?':'unknown'};
const IMG_LABEL={drawn:'drawn pieces',dims:'dimensions only',none:'no piece data'};
const FAM_LABEL={solid:'solid assembly','piece-burr':'stick burr',ring:'ring',
  'board-burr':'board burr',cross:'cross',traditional:'traditional',box:'box',
  chain:'chain','framed-burr':'framed burr',triangular:'triangular',knot:'knot',
  pin:'pin',sliding:'sliding',fence:'fence',plank:'plank',tilted:'tilted cube',
  misc:'miscellaneous',other:'other'};
const LVL_BANDS=[['t','trivial',1,1],['e','easy',2,4],['m','moderate',5,9],
  ['h','hard',10,19],['v','very hard',20,49],['x','extreme',50,1e9]];

function lvlBand(v){ if(!v) return null;
  for(const b of LVL_BANDS) if(v>=b[2]&&v<=b[3]) return b[0]; return null; }
function boxOf(r){ const d=r[F.dims]; return d?d.join('x'):null; }
function isCubic(r){ const d=r[F.dims]; return d&&d[0]===d[1]&&d[1]===d[2]; }

/* counts for chips computed over ALL rows (stable labels) */
function tally(fn){ const m=new Map();
  for(const r of ROWS){ const v=fn(r); if(v==null) continue;
    (Array.isArray(v)?v:[v]).forEach(x=>m.set(x,(m.get(x)||0)+1)); }
  return m; }

const T_np=tally(r=>r[F.npieces]||null);
const T_st=tally(r=>r[F.struct]);
const T_bx=tally(r=>boxOf(r));
const T_lv=tally(r=>lvlBand(r[F.lvl]));
const T_sk=tally(r=>r[F.stock]);
const T_ca=tally(r=>r[F.carrier]);
const T_tg=tally(r=>r[F.target]);
const T_dg=tally(r=>r[F.designer]>=0?r[F.designer]:null);
const T_fm=tally(r=>r[F.fam]);
const T_im=tally(r=>r[F.img]);

const TOP_BOXES=[...T_bx.entries()].sort((a,b)=>b[1]-a[1]).slice(0,18).map(e=>e[0]);
const TOP_DSGN=[...T_dg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,16).map(e=>e[0]);

/* ---------- state <-> URL ---------- */
const STATE={n:new Set(),s:new Set(),box:new Set(),lvl:new Set(),stock:new Set(),
             d:new Set(),fam:new Set(),carrier:new Set(),target:new Set(),img:new Set(),
             shape:'',q:'',cubic:''};
const SETS=['n','s','box','lvl','stock','d','fam','carrier','target','img'];
function readURL(){
  const p=new URLSearchParams(location.search);
  SETS.forEach(k=>{ const v=p.get(k); if(!v) return;
    v.split(',').filter(Boolean).forEach(x=>STATE[k].add(k==='n'?+x:x)); });
  STATE.q=p.get('q')||''; STATE.cubic=p.get('cubic')||''; STATE.shape=p.get('shape')||'';
}
function writeURL(){
  const p=new URLSearchParams();
  SETS.forEach(k=>{ if(STATE[k].size) p.set(k,[...STATE[k]].join(',')); });
  if(STATE.q) p.set('q',STATE.q);
  if(STATE.cubic) p.set('cubic',STATE.cubic);
  if(STATE.shape) p.set('shape',STATE.shape);
  const qs=p.toString();
  history.replaceState(null,'',qs?'?'+qs:location.pathname);
  return location.origin+location.pathname+(qs?'?'+qs:'');
}

/* ---------- filtering ---------- */
function match(r){
  if(STATE.n.size && !STATE.n.has(r[F.npieces])) return false;
  if(STATE.s.size && !STATE.s.has(r[F.struct])) return false;
  if(STATE.box.size && !STATE.box.has(boxOf(r))) return false;
  if(STATE.lvl.size && !STATE.lvl.has(lvlBand(r[F.lvl]))) return false;
  if(STATE.d.size && !STATE.d.has(String(r[F.designer]))) return false;
  if(STATE.fam.size && !STATE.fam.has(r[F.fam])) return false;
  if(STATE.img.size && !STATE.img.has(r[F.img])) return false;
  if(STATE.cubic==='1' && !isCubic(r)) return false;
  if(STATE.cubic==='0' && isCubic(r)) return false;
  if(STATE.shape && r[F.shape]!==STATE.shape) return false;
  if(STATE.stock.size && !STATE.stock.has(r[F.stock])) return false;
  if(STATE.carrier.size && !STATE.carrier.has(r[F.carrier])) return false;
  if(STATE.target.size && !STATE.target.has(r[F.target])) return false;
  if(STATE.q){ const q=STATE.q.toLowerCase();
    const dn=(D.designers[r[F.designer]]||'').toLowerCase();
    if(!r[F.name].toLowerCase().includes(q) && !dn.includes(q) &&
       !(r[F.shape]||'').toLowerCase().includes(q) &&
       !(r[F.bsn]||'').toLowerCase().includes(q)) return false; }
  return true;
}

/* ---------- rendering ---------- */
let SORT={key:'lvl',dir:-1}, SHOWN=250;
function shortBSN(r){
  const b=r[F.bsn]; if(!b) return typeCode(r);
  const at=b.indexOf('@');                    // drop @SHAPE/LEVEL[.SET]
  const h=at>0?b.slice(0,at):b;
  return h.replace(/\/(free|frame|box)(:[^/]*)?$/, '');  // drop carrier (own column)
}
function typeCode(r){
  const n=r[F.npieces]; const s=r[F.struct];
  return n ? n+'-'+s : s;
}
function sortVal(r,k){
  switch(k){
    case 'lvl': return r[F.lvl]||0;
    case 'name': return r[F.name].toLowerCase();
    case 'type': return typeCode(r);
    case 'box': {const d=r[F.dims]; return d?d[0]*10000+d[1]*100+d[2]:0;}
    case 'npieces': return r[F.npieces]||0;
    case 'stock': return r[F.stock]||'~';
    case 'designer': return (D.designers[r[F.designer]]||'~').toLowerCase();
    case 'year': return r[F.year]||0;
  }
  return 0;
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
const MAXLVL=200;
function render(){
  const out=ROWS.filter(match);
  out.sort((a,b)=>{ const x=sortVal(a,SORT.key), y=sortVal(b,SORT.key);
    if(x<y) return -SORT.dir; if(x>y) return SORT.dir;
    return a[F.name].localeCompare(b[F.name]); });
  const slice=out.slice(0,SHOWN);
  $('rows').innerHTML=slice.map(r=>{
    const lvl=r[F.lvl]||0;
    const pct=Math.min(100,Math.round(100*Math.log10(1+lvl)/Math.log10(1+MAXLVL)));
    const dn=D.designers[r[F.designer]]||'—';
    const box=boxOf(r)||'—';
    const vol=r[F.vol]?` <span style="color:var(--faint)">·${r[F.vol]}u</span>`:'';
    const bs=r[F.stock];
    const sk=(bs&&bs!=='?')
      ? `<span class="pchip">${BSTOCK_LABEL[bs]||bs}</span>`+
        (r[F.gauge]&&r[F.gauge]!=='?'?`<div class="num" style="font-size:10.5px;color:var(--faint)">${r[F.gauge]}</div>`:'')
      : '<span style="color:var(--faint)">&mdash;</span>';
    const href=SITE+r[F.uri];
    const shst=shapeStyle(r[F.shape],48);
    const shcell=shst
      ? `<div class="shape" style="${shst}" role="button" tabindex="0" data-uri="${esc(r[F.uri])}"
           data-name="${esc(r[F.name])}" aria-label="Assembled ${esc(r[F.name])}: show its pieces"
           title="${esc(r[F.shape]||'')} assembled"></div>`
      : `<div class="shape none" title="no assembled image"></div>`;
    const mv=esc(r[F.moves]||'').replace(/\./g,'.<wbr>');
    return `<tr>
      <td class="shp">${shcell}</td>
      <td class="th"><div class="thumb" data-uri="${esc(r[F.uri])}" data-name="${esc(r[F.name])}"
           role="button" tabindex="0" aria-label="Show the pieces of ${esc(r[F.name])}"></div></td>
      <td class="lvl">${lvl||'—'}<i><b style="width:${pct}%"></b></i></td>
      <td class="nm"><a href="${esc(href)}" target="_blank" rel="noopener"
           title="Open on puzzlewillbeplayed.com">${esc(r[F.name])}<span class="ext" aria-hidden="true">↗</span></a>
        <div class="mv">${mv}</div></td>
      <td><span class="tag bsn" title="${esc(r[F.bsn]||'')}">${esc(shortBSN(r))}</span>
        <div style="color:var(--faint);font-size:11px;margin-top:2px">${FAM_LABEL[r[F.fam]]||r[F.fam]}</div></td>
      <td class="num">${box}${vol}</td>
      <td class="num">${r[F.npieces]||'—'}</td>
      <td><div class="pv">${sk}</div></td>
      <td>${esc(dn)}</td>
      <td class="num">${r[F.year]||'—'}</td>
    </tr>`;
  }).join('');
  $('count').innerHTML=
    `${out.length.toLocaleString('en-GB')} <small>of ${ROWS.length.toLocaleString('en-GB')} puzzles</small>`;
  $('empty').hidden=out.length>0;
  const mb=$('more');
  mb.hidden=out.length<=SHOWN;
  mb.textContent=`Show ${Math.min(250,out.length-SHOWN)} more (${out.length-SHOWN} hidden)`;
  writeURL();
  observeThumbs();
}

/* ---------- facet UI ---------- */
function chip(label,count,pressed){
  return `<button class="chip" type="button" aria-pressed="${pressed}" data-v="${esc(label.v)}">`+
    `${esc(label.t)}<span class="n">${count}</span></button>`;
}
function group(title,html){ return `<div class="fgroup"><div class="flabel">${title}</div>
  ${html}</div>`; }

function buildFacets(){
  let h='';
  const nps=[...T_np.keys()].sort((a,b)=>a-b);
  h+=group('Piece count',`<div class="chips" data-facet="n">`+
    nps.map(n=>chip({t:n,v:n},T_np.get(n),STATE.n.has(n))).join('')+`</div>`);
  const sts=[...T_st.entries()].sort((a,b)=>b[1]-a[1]);
  h+=group('Assembly',`<div class="chips" data-facet="s">`+
    sts.map(([k,c])=>chip({t:STRUCT_LABEL[k]||k,v:k},c,STATE.s.has(k))).join('')+`</div>`);
  const ORD=['stick','bar','board','plate','block','stick+','bar+','board+','plate+','block+',
             'mixed','stick?','board?','?'];
  const sks=[...T_sk.entries()].sort((a,b)=>ORD.indexOf(a[0])-ORD.indexOf(b[0]));
  h+=group('Piece stock',`<div class="chips" data-facet="stock">`+
    sks.map(([k,c])=>chip({t:BSTOCK_LABEL[k]||k,v:k},c,STATE.stock.has(k))).join('')+`</div>`);
  const IORD=['drawn','dims','none'];
  const ims=[...T_im.entries()].sort((a,b)=>IORD.indexOf(a[0])-IORD.indexOf(b[0]));
  h+=group('Piece drawing',`<div class="chips" data-facet="img">`+
    ims.map(([k,c])=>chip({t:IMG_LABEL[k]||k,v:k},c,STATE.img.has(k))).join('')+`</div>`);
  const cas=[...T_ca.entries()].sort((a,b)=>b[1]-a[1]);
  h+=group('Carrier',`<div class="chips" data-facet="carrier">`+
    cas.map(([k,c])=>chip({t:CARRIER_LABEL[k]||k,v:k},c,STATE.carrier.has(k))).join('')+`</div>`);
  const tgs=[...T_tg.entries()].sort((a,b)=>b[1]-a[1]);
  h+=group('Target solid',`<div class="chips" data-facet="target">`+
    tgs.map(([k,c])=>chip({t:TARGET_LABEL[k]||k,v:k},c,STATE.target.has(k))).join('')+`</div>`);
  h+=group('Level',`<div class="chips" data-facet="lvl">`+
    LVL_BANDS.map(b=>chip({t:b[1],v:b[0]},T_lv.get(b[0])||0,STATE.lvl.has(b[0]))).join('')+`</div>`);
  h+=group('Envelope',`<div class="chips" data-facet="box">`+
    TOP_BOXES.map(b=>chip({t:b,v:b},T_bx.get(b),STATE.box.has(b))).join('')+`</div>`);
  const fms=[...T_fm.entries()].sort((a,b)=>b[1]-a[1]);
  h+=group('Form family',`<div class="chips" data-facet="fam">`+
    fms.map(([k,c])=>chip({t:FAM_LABEL[k]||k,v:k},c,STATE.fam.has(k))).join('')+`</div>`);
  h+=group('Designer',`<div class="chips" data-facet="d">`+
    TOP_DSGN.map(i=>chip({t:D.designers[i],v:i},T_dg.get(i),STATE.d.has(String(i)))).join('')+`</div>`);
  h+=group('Find',
    `<div class="chips">`+
    `<input type="search" id="q" placeholder="name, designer or shape code" aria-label="Search puzzles" value="${esc(STATE.q)}">`+
    `<select id="cubic" aria-label="Envelope shape">
       <option value="">any envelope shape</option>
       <option value="1">cubic only</option>
       <option value="0">non-cubic only</option>
     </select></div>`);
  $('facets').innerHTML=h;
  $('cubic').value=STATE.cubic;
  wire();
}
function wire(){
  document.querySelectorAll('.chips[data-facet]').forEach(box=>{
    const facet=box.dataset.facet;
    box.addEventListener('click',e=>{
      const b=e.target.closest('.chip'); if(!b) return;
      const v=(facet==='n')?+b.dataset.v:b.dataset.v;
      const set=STATE[facet];
      if(set.has(v)) set.delete(v); else set.add(v);
      b.setAttribute('aria-pressed',set.has(v));
      SHOWN=250; render();
    });
  });
  const q=$('q');
  q.addEventListener('input',()=>{STATE.q=q.value;SHOWN=250;render();});
  const c=$('cubic');
  c.addEventListener('change',()=>{STATE.cubic=c.value;SHOWN=250;render();});
}
document.querySelectorAll('thead th[data-sort]').forEach(th=>{
  th.addEventListener('click',()=>{
    const k=th.dataset.sort;
    if(SORT.key===k) SORT.dir*=-1; else {SORT.key=k;SORT.dir=(k==='name'||k==='designer'||k==='stock'||k==='type')?1:-1;}
    document.querySelectorAll('thead th').forEach(x=>x.removeAttribute('data-dir'));
    th.setAttribute('data-dir',SORT.dir>0?'asc':'desc');
    render();
  });
});
$('more').addEventListener('click',()=>{SHOWN+=250;render();});
$('clear').addEventListener('click',()=>{
  SETS.forEach(k=>STATE[k].clear());
  STATE.q='';STATE.cubic='';STATE.shape='';SHOWN=250;buildFacets();render();});
$('copy').addEventListener('click',async()=>{
  const u=writeURL();
  try{ await navigator.clipboard.writeText(u); }catch(e){
    const t=document.createElement('textarea');t.value=u;document.body.appendChild(t);
    t.select();try{document.execCommand('copy');}catch(_){}t.remove(); }
  const tag=$('copied');
  tag.style.visibility='visible';setTimeout(()=>tag.style.visibility='hidden',1600);
});

/* ---------- piece thumbnails ---------- */
const STOCKN={stick:'stick',bar:'bar',board:'board',plate:'plate',block:'block'};
function pieceSVG(p,u){
  if(p.t==='p') return isoSVG(decodeVox(p.w,p.h,p.d,p.x),u);
  return null;
}
function drawThumb(el){
  if(el.dataset.done) return; el.dataset.done='1';
  const list=PC[el.dataset.uri];
  if(!list||!list.length){ el.innerHTML='<span class="none">&mdash;</span>'; return; }
  let h='',shown=0;
  for(const p of list){
    if(shown>=4) break;
    const svg=pieceSVG(p,7);
    if(svg){ h+=svg+(p.k>1?`<span class="xk">x${p.k}</span>`:''); shown++; }
  }
  if(!shown){
    const b=list.filter(p=>p.t==='b'||p.t==='d');
    if(b.length){ const q=b[0];
      const dim = q.t==='b' ? `${q.L}x${q.s[0]}x${q.s[1]}` : `1x${q.w}x${q.h}`;
      h=`<span class="nd">${dim}</span>`+(b.length>1?`<span class="xk">+${b.length-1}</span>`:''); }
    else h='<span class="none">&mdash;</span>';
  } else if(list.length>shown){ h+=`<span class="xk">+${list.length-shown}</span>`; }
  el.innerHTML=h;
}
const IO=new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){ drawThumb(e.target); IO.unobserve(e.target); } });
},{rootMargin:'260px'});
function observeThumbs(){ document.querySelectorAll('.thumb:not([data-done])').forEach(t=>IO.observe(t)); }

/* ---------- piece viewer ---------- */
const ov=$('ov'), sheet=$('sheet');
let lastFocus=null;
function openSheet(uri,name){
  const list=PC[uri]||[];
  const row=ROWS.find(r=>r[F.uri]===uri);
  const meta=row?`<span class="mono">${esc(row[F.bsn]||'')}</span><br>${FAM_LABEL[row[F.fam]]||row[F.fam]} &middot; `+
    `${boxOf(row)||'?'} envelope &middot; level ${row[F.lvl]||'?'} &middot; `+
    `${esc(D.designers[row[F.designer]]||'unknown designer')} ${row[F.year]||''}`:'';
  let cards='',undrawn=0;
  for(const p of list){
    const svg=pieceSVG(p,13);
    if(svg){
      const dims=`${p.w}&times;${p.h}&times;${p.d}`;
      cards+=`<div class="pcard">${svg}<div class="cap"><b>${p.n} cubes</b><br>${dims}`+
             `${p.k>1?`<br>&times;${p.k}`:''}<br>${STOCKN[p.c]||p.c}</div></div>`;
    } else if(p.t==='d'){ undrawn+=p.k||1;
      cards+=`<div class="pcard"><div class="cap" style="padding:34px 0"><b>1&times;${p.w}&times;${p.h}</b><br>`+
             `board stock${p.k>1?`<br>&times;${p.k}`:''}<br><span style="color:var(--faint)">profile not drawn</span></div></div>`;
    } else if(p.t==='b'){ undrawn+=p.k||1;
      cards+=`<div class="pcard"><div class="cap" style="padding:34px 0"><b>${p.L}&times;${p.s[0]}&times;${p.s[1]}</b><br>`+
             `stick stock${p.k>1?`<br>&times;${p.k}`:''}<br><span style="color:var(--faint)">profile not drawn</span></div></div>`; }
  }
  const bigst=row?shapeStyle(row[F.shape],160):null;
  const big=bigst?`<div class="asm"><div class="shape-lg" style="${bigst}" role="img"
      aria-label="${esc(name)}, assembled"></div><div class="mono">assembled &middot; ${esc(row[F.shape])}</div></div>`:'';
  sheet.innerHTML=`<button class="act closeb" type="button" id="closeb">Close</button>`+
    `<h2 id="sheet-title">${esc(name)}</h2>${big}<div class="meta">${meta}<br>`+
    `<a href="${esc(SITE+uri)}" target="_blank" rel="noopener">See this puzzle on puzzlewillbeplayed.com ↗</a></div>`+
    (cards?`<div class="grid">${cards}</div>`:`<p style="color:var(--muted)">No piece geometry for this puzzle yet.</p>`)+
    (undrawn?`<div class="note">${undrawn} piece(s) are listed in the classic burr-stick code. Their length and
      cross-section are exact, but the notch pattern is not drawn here rather than guessed.</div>`:'')+
    `<div class="note">Pieces are drawn from the exact polycube codes published on puzzlewillbeplayed.com;
      the assembled image is Keiichiro Ishino's render from the same site.</div>`;
  lastFocus=document.activeElement;
  ov.hidden=false; document.body.style.overflow='hidden';
  $('closeb').addEventListener('click',closeSheet);
  $('closeb').focus();
}
function closeSheet(){ ov.hidden=true; document.body.style.overflow=''; if(lastFocus) lastFocus.focus(); }
ov.addEventListener('click',e=>{ if(e.target===ov) closeSheet(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!ov.hidden) closeSheet(); });
$('rows').addEventListener('click',e=>{
  const t=e.target.closest('.thumb,.shape[data-uri]'); if(!t) return;
  openSheet(t.dataset.uri,t.dataset.name);
});
$('rows').addEventListener('keydown',e=>{
  const t=e.target.closest('.thumb,.shape[data-uri]'); if(!t) return;
  if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openSheet(t.dataset.uri,t.dataset.name); }
});

/* ---------- light / dark switch, shared with the blog (localStorage "appearance") ---------- */
(function theme(){
  const btn=$('theme'), root=document.documentElement, mq=matchMedia('(prefers-color-scheme: dark)');
  const current=()=>root.getAttribute('data-theme')||(mq.matches?'dark':'light');
  const label=()=>{ const dark=current()==='dark';
    btn.textContent=dark?'\u2600 Light':'\u263E Dark';
    btn.setAttribute('aria-pressed',String(dark)); };
  btn.addEventListener('click',()=>{
    const next=current()==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{ localStorage.setItem('appearance',next); }catch(e){}
    label();
  });
  mq.addEventListener('change',label);
  label();
})();

readURL(); buildFacets(); render();
})();
