(function(root){
  'use strict';
  const t=s=>root.I18n?root.I18n.t(s):s;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const n=x=>Number(x.toFixed(4)),fmt=x=>Number(x.toFixed(2)).toLocaleString('es-ES');
  const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0];
  function crossing(a,b,c,d){
    const r=[b[0]-a[0],b[1]-a[1]],s=[d[0]-c[0],d[1]-c[1]],den=cross2(r,s);
    if(Math.abs(den)<1e-10*Math.max(1,Math.hypot(...r)*Math.hypot(...s)))return null;
    const q=[c[0]-a[0],c[1]-a[1]],t=cross2(q,s)/den,u=cross2(q,r)/den;
    return t>=-1e-8&&t<=1+1e-8&&u>=-1e-8&&u<=1+1e-8?[Math.max(0,Math.min(1,t)),Math.max(0,Math.min(1,u))]:null;
  }
  function insidePolygon(p,poly){
    let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[j],b=poly[i],v=[b[0]-a[0],b[1]-a[1]],q=[p[0]-a[0],p[1]-a[1]],length=Math.hypot(...v);
      if(length>1e-8&&Math.abs(cross2(v,q))<=1e-8*length&&q[0]*v[0]+q[1]*v[1]>=-1e-8&&q[0]*v[0]+q[1]*v[1]<=length*length+1e-8)return false;
      if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }return inside;
  }
  function mergeIntervals(intervals){
    const out=[];for(const [lo,hi]of intervals.map(([a,b])=>[Math.max(0,a),Math.min(1,b)]).filter(([a,b])=>b-a>1e-8).sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&lo<=last[1]+1e-8)last[1]=Math.max(last[1],hi);else out.push([lo,hi]);}return out;
  }
  function interiorIntervals(a,b,poly){
    const cuts=[0,1];for(let i=0;i<poly.length;i++){const hit=crossing(a,b,poly[i],poly[(i+1)%poly.length]);if(hit)cuts.push(hit[0]);}cuts.sort((a,b)=>a-b);
    const out=[];for(let i=1;i<cuts.length;i++)if(cuts[i]-cuts[i-1]>1e-8&&insidePolygon(root.Geo.lerp(a,b,(cuts[i-1]+cuts[i])/2),poly))out.push([cuts[i-1],cuts[i]]);return mergeIntervals(out);
  }
  function partialGeometry(scene,options={},scale=1){
    const G=root.Geo,meshes=new Map(scene.meshes.map(m=>[m.entity.id,m])),sources=new Map(),segments=[],points=[...scene.points],marks=new Map();
    function markPoint(entity,p,hidden){const key=entity.id+':'+Math.round(p[0]*1e6)+':'+Math.round(p[1]*1e6),previous=marks.get(key);if(previous){previous.hidden=previous.hidden&&hidden;if(p[2]>previous.p[2])previous.p=[...p];return;}const point={p:[...p],entity,hidden,kind:'interior-vertex'};marks.set(key,point);points.push(point);}
    let gap=Number(options.partialGap??4);if(!Number.isFinite(gap))gap=4;gap=Math.max(0,Math.min(20,gap));scale=Number.isFinite(scale)&&scale>0?scale:1;
    const eligible=e=>e.type==='line'?!!options.partialLines:['plane','polygon'].includes(e.type)&&!!options.partialPlanes;
    const planes=scene.meshes.filter(m=>['plane','polygon'].includes(m.entity.type)).map(m=>{const poly=m.p,area=poly.reduce((sum,p,i)=>sum+cross2([p[0]-poly[0][0],p[1]-poly[0][1]],[poly[(i+1)%poly.length][0]-poly[0][0],poly[(i+1)%poly.length][1]-poly[0][1]]),0);return{id:m.entity.id,poly,area};}).filter(m=>Math.abs(m.area)>1e-7);
    for(let i=0;i<scene.segments.length;i++){const s=scene.segments[i],m=meshes.get(s.entity.id),key=s.entity.id+':'+(s.edge?s.edge.join(':'):'fragment'+i);let source=sources.get(key);if(!source){source={entity:s.entity,a:s.edge&&m?m.p[s.edge[0]]:s.a,b:s.edge&&m?m.p[s.edge[1]]:s.b,fragments:[]};sources.set(key,source);}source.fragments.push(s);}
    const edges=[...sources.values()];
    for(const source of edges){
      if(!eligible(source.entity)){segments.push(...source.fragments);continue;}
      const {a,b}=source,length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<1e-8)continue;
      const margin=gap/(length*scale),masks=planes.filter(p=>p.id!==source.entity.id),interiors=mergeIntervals(masks.flatMap(p=>interiorIntervals(a,b,p.poly))),full=interiors.length===1&&interiors[0][0]<1e-8&&interiors[0][1]>1-1e-8;
      // Keep actual vertices as points. New clipping boundaries never become vertices.
      for(const [p,t]of [[a,0],[b,1]])if(full||masks.some(m=>insidePolygon(p,m.poly))){const matching=source.fragments.filter(s=>{const r=s.range||[0,1];return t>=r[0]-1e-8&&t<=r[1]+1e-8;}),visible=matching.some(s=>!s.hidden);if(matching.length&&(options.hidden!==false||visible))markPoint(source.entity,p,!visible);}
      const removed=interiors.map(([lo,hi])=>[lo-margin,hi+margin]);
      if(gap>0)for(const other of edges){if(other.entity.id===source.entity.id)continue;const hit=crossing(a,b,other.a,other.b);if(!hit)continue;const [t,u]=hit;if(other.fragments.some(s=>{const r=s.range||[0,1];return(options.hidden!==false||!s.hidden)&&u>=r[0]-1e-8&&u<=r[1]+1e-8;}))removed.push([t-margin,t+margin]);}
      const allowed=[];let at=0;for(const [lo,hi]of mergeIntervals(removed)){if(lo-at>1e-8)allowed.push([at,lo]);at=Math.max(at,hi);}if(1-at>1e-8)allowed.push([at,1]);
      for(const s of source.fragments)for(const [lo,hi]of allowed){const r=s.range||[0,1],from=Math.max(lo,r[0]),to=Math.min(hi,r[1]);if(to-from>1e-8)segments.push({...s,a:G.lerp(a,b,from),b:G.lerp(a,b,to),range:[from,to]});}
    }
    // A punta projection can collapse both endpoints to the same paper point.
    const triangles=scene.meshes.filter(m=>!G.planar(m.entity)).flatMap(m=>m.faces.flatMap(f=>f.slice(1,-1).map((_,i)=>[m.p[f[0]],m.p[f[i+1]],m.p[f[i+2]]])));
    for(const m of scene.meshes)if(eligible(m.entity))for(const [i,j]of m.edges){const a=m.p[i],b=m.p[j];if(Math.hypot(b[0]-a[0],b[1]-a[1])>1e-8)continue;for(const p of [a,b])if(planes.some(mask=>mask.id!==m.entity.id&&insidePolygon(p,mask.poly))){const hidden=triangles.some(tri=>{const depth=G.depthAt(p,...tri);return depth!==null&&depth>p[2]+1e-5;});if(options.hidden!==false||!hidden)markPoint(m.entity,p,hidden);}}
    return{segments,points};
  }
  function partialSegments(scene,options={},scale=1){return partialGeometry(scene,options,scale).segments;}
  const vertexKey=p=>p.map(v=>Math.round(v*1e6)).join(':');
  function vertexLetters(entities){
    const letters=new Map();
    function letter(index){let out='';for(let i=index+1;i>0;i=Math.floor((i-1)/26))out=String.fromCharCode(65+(i-1)%26)+out;return out;}
    for(const e of entities){const m=root.Geo.mesh(e);m.vertices.forEach((p,i)=>{if(m.curved&&!(e.type==='cone'&&i===m.vertices.length-1))return;const key=vertexKey(p);if(!letters.has(key))letters.set(key,letter(letters.size));});}
    return letters;
  }
  function drawVertexLabels(scene,transform,options){
    const G=root.Geo,letters=options.vertexLetters||vertexLetters(scene.meshes.map(m=>m.entity)),suffix={top:'',front:"'",right:"''",left:"'''",back:"''''",bottom:"'''''"}[options.viewKey]||'',groups=new Map(),bb=options.labelBounds;
    const triangles=scene.meshes.filter(m=>!G.planar(m.entity)).flatMap(m=>m.faces.flatMap(f=>f.slice(1,-1).map((_,i)=>[m.p[f[0]],m.p[f[i+1]],m.p[f[i+2]]])));
    for(const m of scene.meshes)m.p.forEach((p,i)=>{
      const label=letters.get(vertexKey(m.vertices[i]));if(label===undefined)return;
      const hidden=triangles.some(tri=>{const depth=G.depthAt(p,...tri);return depth!==null&&depth>p[2]+1e-5;});if(hidden&&options.hidden===false)return;
      const q=transform(p),key=q.map(v=>Math.round(v*1e6)).join(':'),group=groups.get(key);
      if(group){group.labels.add(label+suffix);group.hidden=group.hidden&&hidden;}
      else groups.set(key,{q,labels:new Set([label+suffix]),entity:m.entity,hidden});
    });
    let out='';const placed=[];
    for(const group of groups.values()){
      const {q,entity,hidden}=group,text=[...group.labels].join(' / '),w=text.length*1.65,color=options.colors?G.textColor(entity.color,'#ffffff'):hidden?'#596559':'#263e33';
      const clamp=([x,y])=>bb?[Math.max(bb.x+1.5,Math.min(bb.x+bb.w-w-1.5,x)),Math.max(bb.y+(bb.labelTop??3),Math.min(bb.y+bb.h-1.5,y))]:[x,y];
      const candidates=[[q[0]+1.2,q[1]-1.2],[q[0]+1.2,q[1]+3.2],[q[0]-w-1.2,q[1]-1.2],[q[0]-w-1.2,q[1]+3.2]].map(clamp);
      const [x,y]=candidates.find(([x,y])=>!placed.some(r=>x<r.x+r.w+.6&&x+w+.6>r.x&&y-2.8<r.y+.8&&y+.8>r.y-2.8))||candidates[0];placed.push({x,y,w});
      out+=`<circle data-purpose="vertex-point" cx="${n(q[0])}" cy="${n(q[1])}" r=".45" fill="${color}"/><text data-purpose="vertex-label" data-entity="${esc(entity.id)}" x="${n(x)}" y="${n(y)}" font-size="2.7" fill="${color}" stroke="#fff" stroke-width=".8" stroke-linejoin="round" paint-order="stroke">${esc(text)}</text>`;
    }
    return out;
  }
  function drawing(scene,transform,options={}){
    const {hidden=true,colors=false,labels=false,stroke=.28}=options,paths=new Map();let out='';
    const origin=transform([0,0,0]),unit=transform([1,0,0]),scale=Math.hypot(unit[0]-origin[0],unit[1]-origin[1]),geometry=options.partialLines||options.partialPlanes?partialGeometry(scene,options,scale):scene,segments=geometry.segments;
    for(const s of segments){if(s.hidden&&!hidden)continue;const color=colors?s.entity.color:(s.hidden?'#7b817b':'#263e33'),key=s.entity.id+(s.hidden?'h':'v'),a=transform(s.a),b=transform(s.b);let p=paths.get(key);if(!p){p={id:s.entity.id,color,hidden:s.hidden,d:''};paths.set(key,p);}p.d+=`M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;}
    // Hidden strokes first, so coincident visible edges remain continuous.
    for(const p of [...paths.values()].sort((a,b)=>Number(b.hidden)-Number(a.hidden)))out+=`<path data-entity="${esc(p.id)}" d="${p.d}" fill="none" stroke="${p.color}" stroke-width="${p.hidden?stroke*.65:stroke}"${p.hidden?' stroke-dasharray="1.5 1"':''} stroke-linejoin="round" stroke-linecap="round"/>`;
    for(const p of geometry.points){if(p.hidden&&!hidden)continue;const q=transform(p.p);out+=`<circle data-entity="${esc(p.entity.id)}"${p.kind?' data-purpose="interior-vertex"':''} cx="${n(q[0])}" cy="${n(q[1])}" r="${stroke*2}" fill="${colors?p.entity.color:p.hidden?'#7b817b':'#263e33'}"/>`;}
    if(labels){const placed=[],bb=options.labelBounds;for(const m of scene.meshes){const xs=m.p.map(p=>p[0]),ys=m.p.map(p=>p[1]),p=transform([Math.min(...xs),Math.min(...ys)]),label=m.entity.name.length>25?m.entity.name.slice(0,24)+'…':m.entity.name,w=label.length*1.4+1;let x=p[0]+1,y=p[1]-1.5;if(bb){x=Math.max(bb.x+2,Math.min(bb.x+bb.w-w-2,x));y=Math.max(bb.y+(bb.labelTop??11),Math.min(bb.y+bb.h-3,y));}for(let tries=0;tries<40&&placed.some(r=>x<r.x+r.w&&x+w>r.x&&y-3<r.y+1&&y>r.y-3);tries++)y+=4;if(bb&&y>bb.y+bb.h-2)continue;placed.push({x,y,w});out+=`<rect x="${n(x-.5)}" y="${n(y-2.8)}" width="${n(w)}" height="3.5" fill="#fff" fill-opacity=".9"/><text x="${n(x)}" y="${n(y)}" font-size="2.5" fill="${colors?root.Geo.textColor(m.entity.color,'#ffffff'):'#526657'}">${esc(label)}</text>`;}}
    if(options.pointLabels)out+=drawVertexLabels(scene,transform,options);
    return out;
  }
  const defaultFooterNote=()=>[t('Sistema europeo'),t('Primer diedro'),t('Unidades: mm'),t('Diédrico 3D')].join(' · ');
  function wrapText(text,maxWidth,fontSize){
    const width=s=>[...s].reduce((sum,c)=>sum+(/[WMwm@#%&]/.test(c)?.98:/[ilI.,:;'!|\s]/.test(c)?.34:/[A-Z0-9]/.test(c)?.72:c.charCodeAt(0)>0x2e80?1:.65),0)*fontSize,words=String(text).replace(/\s+/g,' ').trim().split(' '),lines=[];let current='';
    for(let word of words){if(!word)continue;if(current&&width(current+' '+word)>maxWidth){lines.push(current);current='';}while(width(word)>maxWidth){if(current){lines.push(current);current='';}let count=1;while(count<word.length&&width(word.slice(0,count+1))<=maxWidth)count++;lines.push(word.slice(0,count));word=word.slice(count);}current+=(current?' ':'')+word;}if(current)lines.push(current);return lines;
  }
  function correspondenceGuides(entities,views,transform){
    const G=root.Geo,vertices=entities.flatMap(e=>G.mesh(e).vertices),runs=new Map(),mitres=[];
    function add(a,b,kind){if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-6)return;const vertical=Math.abs(a[0]-b[0])<1e-6,fixed=vertical?(a[0]+b[0])/2:(a[1]+b[1])/2,axis=vertical?1:0,key=(vertical?'v':'h')+fixed.toFixed(4),lo=Math.min(a[axis],b[axis]),hi=Math.max(a[axis],b[axis]);let run=runs.get(key);if(!run){run={vertical,fixed,intervals:[]};runs.set(key,run);}run.intervals.push({lo,hi,kind});}
    const row=['right','front','left','back'].filter(v=>views.includes(v));
    for(const p of vertices){for(let i=1;i<row.length;i++)add(transform(row[i-1])(G.project(p,G.CAMERAS[row[i-1]])),transform(row[i])(G.project(p,G.CAMERAS[row[i]])),'height');
      for(const base of ['top','bottom'])if(views.includes('front')&&views.includes(base))add(transform('front')(G.project(p,G.CAMERAS.front)),transform(base)(G.project(p,G.CAMERAS[base])),'width');}
    for(const base of ['top','bottom'])for(const side of ['right','left'])if(views.includes(base)&&views.includes(side)){
      const corners=[];for(const p of vertices){const a=transform(base)(G.project(p,G.CAMERAS[base])),b=transform(side)(G.project(p,G.CAMERAS[side])),corner=[b[0],a[1]];add(a,corner,'depth');add(corner,b,'depth');corners.push(corner);}
      if(corners.length){corners.sort((a,b)=>a[0]-b[0]);const a=corners[0],b=corners.at(-1),slope=(base==='top'?-1:1)*(side==='right'?1:-1);mitres.push({a:[a[0]-1.5,a[1]-slope*1.5],b:[b[0]+1.5,b[1]+slope*1.5],views:[base,side]});}
    }
    const segments=[];for(const run of runs.values()){const sorted=run.intervals.sort((a,b)=>a.lo-b.lo),merged=[];for(const interval of sorted){const prev=merged.at(-1);if(prev&&interval.lo<=prev.hi+1e-5){prev.hi=Math.max(prev.hi,interval.hi);}else merged.push({...interval});}for(const interval of merged){const point=v=>run.vertical?[run.fixed,v]:[v,run.fixed];segments.push({a:point(interval.lo),b:point(interval.hi)});}}
    return{segments,mitres};
  }
  function create(doc,options){
    const G=root.Geo,{format='a4',scale='auto',selected=null,onlySelected=false,grid=false,projectors=false,showFooter=false,footerDetails=true,showViewTitles=true,showViewFrames=true}=options,header=showViewTitles?7:0;
    const placements={right:[0,1],front:[1,1],left:[2,1],back:[3,1],top:[1,2],bottom:[1,0]},views=[...new Set(options.views??['front','top'])].filter(v=>v in placements);
    const inputEntities=doc.entities.filter(e=>e.visible&&(!onlySelected||e.id===selected)),paper=format==='a3'?[420,297]:[297,210],lineMargin=options._lineMargin??8;
    if(!views.length)return{error:t('Selecciona al menos una vista.')};if(!inputEntities.length)return{error:t('No hay elementos visibles para esta lámina.')};
    let entities;try{entities=G.fitInfiniteLines(inputEntities,views,lineMargin);}catch(error){return{error:t(error.message)};}
    const scenes={},bounds={},cols={},rows={};
    const title=String(options.footerTitle??doc.name).replace(/\s+/g,' ').trim().slice(0,100),note=String(options.footerNote??defaultFooterNote()).replace(/\s+/g,' ').trim().slice(0,180),footerWidth=paper[0]-20-(footerDetails?76:0),titleLines=wrapText(title,footerWidth,4.2),noteLines=wrapText(note,footerWidth,2.6),lastBaseline=noteLines.length?6+titleLines.length*5.3+(noteLines.length-1)*3.8:titleLines.length?6+(titleLines.length-1)*5.3:0,footerY=paper[1]-10-Math.max(14,lastBaseline+1);
    for(const key of views){bounds[key]=G.bounds(entities,G.CAMERAS[key]);const[c,r]=placements[key];cols[c]=Math.max(cols[c]||0,bounds[key].width);rows[r]=Math.max(rows[r]||0,bounds[key].height);}
    const cmin=Math.min(...Object.keys(cols).map(Number)),cmax=Math.max(...Object.keys(cols).map(Number)),rmin=Math.min(...Object.keys(rows).map(Number)),rmax=Math.max(...Object.keys(rows).map(Number));
    for(let c=cmin;c<=cmax;c++)if(!cols[c])cols[c]=1;for(let r=rmin;r<=rmax;r++)if(!rows[r])rows[r]=1;
    const nc=cmax-cmin+1,nr=rmax-rmin+1,padX=9,padY=7+header,gap=5,W=paper[0]-20,bodyTop=10,H=(showFooter?footerY-7:paper[1]-10)-bodyTop;
    const sumX=Object.values(cols).reduce((a,b)=>a+b,0),sumY=Object.values(rows).reduce((a,b)=>a+b,0);
    const auto=Math.min((W-nc*padX-gap*(nc-1))/sumX,(H-nr*padY-gap*(nr-1))/sumY,5),k=scale==='auto'?auto:Number(scale);
    if(!Number.isFinite(k)||k<=0)return{error:t('Elige una escala válida.')};
    const requestedGap=Number(options.partialGap??4),overhang=8+(options.partialLines?(Number.isFinite(requestedGap)?Math.max(0,Math.min(20,requestedGap)):4):0);
    if(entities.some(e=>e.infiniteLine)&&Math.abs(lineMargin*k-overhang)>.02){if((options._linePass||0)>=64)return{error:t('No caben extremos correspondientes con 8 mm de margen. Reduce la separación en cruces o elige menos vistas.')};return create(doc,{...options,_lineMargin:overhang/k,_linePass:(options._linePass||0)+1});}
    for(const key of views)scenes[key]=G.projectedScene(entities,G.CAMERAS[key]);
    const totalW=sumX*k+nc*padX+gap*(nc-1),totalH=sumY*k+nr*padY+gap*(nr-1),fits=totalW<=W+.01&&totalH<=H+.01&&k>0;
    const cw=Object.fromEntries(Object.entries(cols).map(([c,w])=>[c,w*k+padX])),rh=Object.fromEntries(Object.entries(rows).map(([r,h])=>[r,h*k+padY]));
    let x=10+(W-totalW)/2,y=bodyTop+(H-totalH)/2;const xs={},ys={};for(let c=cmin;c<=cmax;c++){xs[c]=x;x+=cw[c]+gap;}for(let r=rmin;r<=rmax;r++){ys[r]=y;y+=rh[r]+gap;}
    const cells={};for(const key of views){const[c,r]=placements[key],b=bounds[key];cells[key]={x:xs[c],y:ys[r],w:cw[c],h:rh[r],cx:xs[c]+cw[c]/2,cy:ys[r]+(rh[r]+header)/2,b};}
    const trans=key=>p=>[cells[key].cx+(p[0]-cells[key].b.center[0])*k,cells[key].cy+(p[1]-cells[key].b.center[1])*k],letters=options.pointLabels?vertexLetters(entities):null;
    let defs='',content='';
    for(const key of views){const c=cells[key],clipTop=c.y+(showViewTitles?7:1);defs+=`<clipPath id="clip-${key}"><rect x="${n(c.x+1)}" y="${n(clipTop)}" width="${n(c.w-2)}" height="${n(c.y+c.h-1-clipTop)}"/></clipPath>`;
      content+=`<g data-view="${key}">${showViewFrames?`<rect data-purpose="view-frame" x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}" fill="none" stroke="#dfe5df" stroke-width=".16"/>`:''}${showViewTitles?`<rect x="${n(c.x+.2)}" y="${n(c.y+.2)}" width="${n(c.w-.4)}" height="6.5" fill="#fff"/><text data-purpose="view-title" x="${n(c.x+3)}" y="${n(c.y+4.5)}" font-size="2.8" fill="#526657">${t(G.VIEW_NAMES[key])}</text>`:''}<g clip-path="url(#clip-${key})">`;
      if(grid){const step=doc.grid*k;if(step>=1){let d='';const zero=trans(key)([0,0]);for(let gx=c.x+((zero[0]-c.x)%step+step)%step;gx<c.x+c.w;gx+=step)d+=`M${n(gx)} ${n(clipTop)}V${n(c.y+c.h)}`;for(let gy=clipTop+((zero[1]-clipTop)%step+step)%step;gy<c.y+c.h;gy+=step)d+=`M${n(c.x)} ${n(gy)}H${n(c.x+c.w)}`;content+=`<path d="${d}" stroke="#e8ece7" stroke-width=".12" fill="none"/>`;}}
      content+=drawing(scenes[key],trans(key),{...options,viewKey:key,vertexLetters:letters,labelBounds:{...c,labelTop:showViewTitles?11:3}})+'</g></g>';
    }
    const guides=projectors?correspondenceGuides(entities,views,trans):{segments:[],mitres:[]};
    if(projectors){const path=segments=>segments.map(s=>`M${n(s.a[0])} ${n(s.a[1])}L${n(s.b[0])} ${n(s.b[1])}`).join('');defs+=`<clipPath id="clip-correspondences"><rect x="10" y="${bodyTop}" width="${W}" height="${n(H)}"/></clipPath>`;content=`<g data-purpose="correspondences" clip-path="url(#clip-correspondences)"><path data-kind="projectors" d="${path(guides.segments)}" fill="none" stroke="#7b9382" stroke-width=".13" stroke-dasharray="1.2 1"/><path data-kind="mitres" d="${path(guides.mitres)}" fill="none" stroke="#668270" stroke-width=".16"/></g>`+content;}
    const label=scale==='auto'?`${t('Ajustada')} · ${fmt(k)}:1`:(k>=1?`${fmt(k)}:1`:`1:${fmt(1/k)}`);
    let footer='';if(showFooter){footer=`<g data-purpose="footer"><path d="M10 ${n(footerY)}H${paper[0]-10}" stroke="#647b69" stroke-width=".3"/>`;titleLines.forEach((line,i)=>footer+=`<text x="10" y="${n(footerY+6+i*5.3)}" font-size="4.2" font-weight="600" fill="#203d35">${esc(line)}</text>`);noteLines.forEach((line,i)=>footer+=`<text x="10" y="${n(footerY+6+titleLines.length*5.3+i*3.8)}" font-size="2.6" fill="#526657">${esc(line)}</text>`);if(footerDetails)footer+=`<text x="${paper[0]-10}" y="${n(footerY+6)}" text-anchor="end" font-size="3" fill="#203d35">${t('Escala')} ${label}</text><text x="${paper[0]-10}" y="${n(footerY+12)}" text-anchor="end" font-size="2.5" fill="#526657">${format.toUpperCase()} ${t('horizontal')} · ${entities.length} ${t(entities.length===1?'elemento':'elementos')}</text>`;footer+='</g>';}
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${paper[0]}mm" height="${paper[1]}mm" viewBox="0 0 ${paper[0]} ${paper[1]}" role="img" aria-label="${t('Lámina de proyecciones ortogonales')}"><title>${esc(doc.name)} · ${t('Proyecciones ortogonales')}</title><desc>${t('Sistema europeo')}, ${t('Primer diedro')}. ${t('Medidas en milímetros.')} ${views.map(v=>t(G.VIEW_NAMES[v])).join(', ')}. ${t('Curvas discretizadas.')}</desc><defs>${defs}</defs><rect width="${paper[0]}" height="${paper[1]}" fill="#fff"/><g font-family="Segoe UI,Arial,sans-serif">${content}${footer}</g></svg>`;
    const prepared=new Map(entities.map(e=>[e.id,e])),document={...doc,entities:doc.entities.map(e=>prepared.get(e.id)||e)};
    return{svg,paper,scale:k,fits,document,layout:{cells,body:{x:10,y:bodyTop,w:W,h:H}},guides,warning:fits?'':t('La geometría no cabe a esta escala. Elige «Ajustar al papel» o una escala menor.')};
  }
  root.Sheet={create,drawing,esc,defaultFooterNote,correspondenceGuides,partialSegments,partialGeometry};
})(globalThis);
