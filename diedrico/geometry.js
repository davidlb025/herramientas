(function (root) {
  'use strict';
  const EPS = 1e-8, rad = Math.PI / 180;
  const add = (a,b) => a.map((v,i)=>v+b[i]);
  const sub = (a,b) => a.map((v,i)=>v-b[i]);
  const mul = (a,k) => a.map(v=>v*k);
  const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const length = a => Math.hypot(...a);
  const unit = a => {const n=length(a); if(n<EPS) throw Error('La dirección no puede ser nula.');return mul(a,1/n);};
  const lerp = (a,b,t) => add(a,mul(sub(b,a),t));
  function contrast(a,b){const lum=c=>{const s=c.replace('#','');const hex=s.length===3?s.split('').map(x=>x+x).join(''):s;const v=hex.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));return v[0]*.2126+v[1]*.7152+v[2]*.0722;};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function textColor(color,background='#edf1ea'){let c=color;for(let i=0;i<35&&contrast(c,background)<4.5;i++){c='#'+c.slice(1).match(/../g).map(v=>Math.floor(parseInt(v,16)*.86).toString(16).padStart(2,'0')).join('');}return c;}
  function rotate(p,r) {
    const [x,y,z]=r.map(v=>v*rad), [sx,cx,sy,cy,sz,cz]=[Math.sin(x),Math.cos(x),Math.sin(y),Math.cos(y),Math.sin(z),Math.cos(z)];
    let [a,b,c]=p; [b,c]=[b*cx-c*sx,b*sx+c*cx];[a,c]=[a*cy+c*sy,-a*sy+c*cy];return [a*cz-b*sz,a*sz+b*cz,c];
  }
  function inverseRotate(p,r) {let [a,b,c]=p;const [x,y,z]=r.map(v=>-v*rad);[a,b]=[a*Math.cos(z)-b*Math.sin(z),a*Math.sin(z)+b*Math.cos(z)];[a,c]=[a*Math.cos(y)+c*Math.sin(y),-a*Math.sin(y)+c*Math.cos(y)];return[a,b*Math.cos(x)-c*Math.sin(x),b*Math.sin(x)+c*Math.cos(x)];}
  const world = (p,e) => add(rotate(p,e.rotation),e.position);
  function mesh(e) {
    const [w,d,h]=e.size, v=[], faces=[], edges=[];let curved=false;
    const edge=(a,b)=>edges.push([a,b]);
    if(e.type==='point') v.push([0,0,0]);
    else if(e.type==='line') {v.push([-w/2,0,0],[w/2,0,0]);edge(0,1);}
    else if(e.type==='plane') {v.push(...planeOutline(e).map(p=>[...p,0]));faces.push(v.map((_,i)=>i));for(let i=0;i<v.length;i++)edge(i,(i+1)%v.length);}
    else if(e.type==='circle'||e.type==='polygon') {
      const n=e.type==='circle'?96:e.sides;curved=e.type==='circle';for(let i=0;i<n;i++)v.push([w/2*Math.cos(i*2*Math.PI/n),d/2*Math.sin(i*2*Math.PI/n),0]);for(let i=0;i<n;i++)edge(i,(i+1)%n);if(e.type==='polygon')faces.push(v.map((_,i)=>i));
    }
    else if(e.type==='box') {
      v.push([-w/2,-d/2,-h/2],[w/2,-d/2,-h/2],[w/2,d/2,-h/2],[-w/2,d/2,-h/2],[-w/2,-d/2,h/2],[w/2,-d/2,h/2],[w/2,d/2,h/2],[-w/2,d/2,h/2]);
      faces.push([0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]);for(let i=0;i<4;i++){edge(i,(i+1)%4);edge(i+4,(i+1)%4+4);edge(i,i+4);}
    }
    else if(['cylinder','cone','prism','pyramid'].includes(e.type)) {
      curved=e.type==='cylinder'||e.type==='cone';const n=curved?64:e.sides, apex=e.type==='cone'||e.type==='pyramid';
      for(let i=0;i<n;i++)v.push([w/2*Math.cos(i*2*Math.PI/n),d/2*Math.sin(i*2*Math.PI/n),-h/2]);
      if(apex)v.push([0,0,h/2]);else for(let i=0;i<n;i++)v.push([v[i][0],v[i][1],h/2]);
      faces.push(Array.from({length:n},(_,i)=>n-1-i));if(!apex)faces.push(Array.from({length:n},(_,i)=>i+n));
      for(let i=0;i<n;i++){const j=(i+1)%n;faces.push(apex?[i,j,n]:[i,j,j+n,i+n]);edge(i,j);if(!apex)edge(i+n,j+n);if(!curved)edge(i,apex?n:i+n);}
    }
    return {vertices:v.map(p=>world(p,e)),faces,edges,curved,entity:e};
  }
  function basis(direction,up=[0,0,1]) {const d=unit(direction);if(Math.abs(dot(d,unit(up)))>.9999)up=[0,1,0];const right=unit(cross(up,d));return{d,right,up:unit(cross(d,right))};}
  const CAMERAS={iso:basis([1,-1,0.85]),front:basis([0,-1,0]),top:basis([0,0,1],[0,1,0]),right:basis([1,0,0]),left:basis([-1,0,0]),back:basis([0,1,0]),bottom:basis([0,0,-1],[0,-1,0])};
  const VIEW_NAMES={front:'Alzado · frente',top:'Planta · arriba',right:'Perfil derecho',left:'Perfil izquierdo',back:'Alzado posterior',bottom:'Planta inferior'};
  function project(p,b) {return [dot(p,b.right),-dot(p,b.up),dot(p,b.d)];}
  function bounds(entities,b=CAMERAS.iso) {
    const ps=projectedMeshes(entities,b).flatMap(m=>m.p);
    if(!ps.length)return {min:[-50,-50,-50],max:[50,50,50],center:[0,0,0],width:100,height:100};
    const min=[0,1,2].map(i=>Math.min(...ps.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...ps.map(p=>p[i])));
    return {min,max,center:mul(add(min,max),.5),width:Math.max(1,max[0]-min[0]),height:Math.max(1,max[1]-min[1])};
  }
  function planar(e) {return ['plane','circle','polygon'].includes(e.type);}
  function planeFrame(e) {return{normal:rotate([0,0,1],e.rotation),u:rotate([1,0,0],e.rotation),v:rotate([0,1,0],e.rotation),origin:e.position};}
  function elementCamera(e,mode) {
    if(planar(e)){const f=planeFrame(e);return mode==='vm'?basis(f.normal,f.v):basis(f.u,f.normal);}
    const u=rotate([1,0,0],e.rotation);if(mode==='vm') {let d=cross(u,[0,0,1]);if(length(d)<EPS)d=[0,-1,0];return basis(d,Math.abs(u[2])>.999?[0,1,0]:[0,0,1]);}return basis(u);
  }
  // Depth on a triangle in projection; larger depth is closer to the viewer.
  function depthAt(p,a,b,c) {
    const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<EPS)return null;
    const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/den;
    const v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/den;
    if(u< -EPS||v< -EPS||u+v>1+EPS)return null;return u*a[2]+v*b[2]+(1-u-v)*c[2];
  }
  function cross2(a,b){return a[0]*b[1]-a[1]*b[0];}
  function convexHull(points){
    const sorted=points.map(p=>p.slice(0,2)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),unique=sorted.filter((p,i)=>!i||length(sub(p,sorted[i-1]))>EPS);
    const half=ps=>{const out=[];for(const p of ps){while(out.length>1&&cross2(sub(out.at(-1),out.at(-2)),sub(p,out.at(-1)))<=EPS)out.pop();out.push(p);}return out;};
    if(unique.length<3)return unique;return[...half(unique).slice(0,-1),...half([...unique].reverse()).slice(0,-1)];
  }
  function projectedMeshes(entities,b){return entities.filter(e=>e.visible).map(e=>{const m=mesh(e);return{...m,p:m.vertices.map(v=>project(v,b))};});}
  // Find the shortest single 3D segment whose two endpoints clear every selected
  // projected contour. All views then use exactly the same spatial endpoints.
  function fitInfiniteLines(entities,views=['front','top','right'],margin=8){
    if(!entities.some(e=>e.visible&&e.type==='line'&&e.infiniteLine))return entities;
    const projections=views.map(key=>{const camera=typeof key==='string'?CAMERAS[key]:key;if(!camera)return null;return{camera,contours:projectedMeshes(entities,camera).map(m=>({entity:m.entity,poly:planar(m.entity)||m.entity.type==='line'?m.p:convexHull(m.p)}))};}).filter(Boolean);
    return entities.map(e=>{
      if(e.type!=='line'||!e.infiniteLine||!e.visible)return e;
      const direction=rotate([1,0,0],e.rotation);let lo=Infinity,hi=-Infinity;
      for(const {camera,contours}of projections){
        const d=project(direction,camera),len=Math.hypot(d[0],d[1]);if(len<EPS)throw Error('La recta se ve de punta en una vista. Cambia su orientación o las vistas.');
        const origin=project(e.position,camera),unit=[d[0]/len,d[1]/len],hits=[];
        for(const other of contours){
          if(other.entity.id===e.id)continue;const poly=other.poly,count=other.entity.type==='line'?1:poly.length;
          for(let i=0;i<count;i++){
            const a=poly[i],c=poly[(i+1)%poly.length],edge=sub(c,a),q=sub(a,origin),den=cross2(unit,edge);
            if(Math.abs(den)>EPS){const t=cross2(q,edge)/den,u=cross2(q,unit)/den;if(u>=-EPS&&u<=1+EPS)hits.push(t);}
            else if(Math.abs(cross2(q,unit))<EPS)hits.push(dot(q.slice(0,2),unit),dot(sub(c,origin).slice(0,2),unit));
          }
        }
        if(hits.length){lo=Math.min(lo,(Math.min(...hits)-margin)/len);hi=Math.max(hi,(Math.max(...hits)+margin)/len);}
      }
      if(!Number.isFinite(lo)||!Number.isFinite(hi))return e;
      const position=add(e.position,mul(direction,(lo+hi)/2)),size=[hi-lo,...e.size.slice(1)];
      if(size[0]>10000||position.some(v=>Math.abs(v)>10000))throw Error('La recta prolongada supera 10000 mm. Reduce las dimensiones o cambia las vistas.');
      return{...e,position,size};
    });
  }
  function crossingT(a,b,c,d) {const ab=sub(b,a),cd=sub(d,c),den=cross2(ab,cd);if(Math.abs(den)<EPS)return null;const t=cross2(sub(c,a),cd)/den,u=cross2(sub(c,a),ab)/den;return t>EPS&&t<1-EPS&&u>=-EPS&&u<=1+EPS?t:null;}
  function projectedScene(entities,b,{occlude=true}={}) {
    const triangles=[],segments=[],points=[],pmeshes=projectedMeshes(entities,b);
    for(const m of pmeshes) if(!planar(m.entity))for(const face of m.faces)for(let i=1;i<face.length-1;i++)triangles.push([m.p[face[0]],m.p[face[i]],m.p[face[i+1]]]);
    for(const m of pmeshes) {
      const ee=[...m.edges];
      // Curved solids contribute their silhouette generators, not mesh seams.
      if(m.curved&&m.faces.length) {
        const sideNormals=m.faces.slice(m.entity.type==='cone'?1:2).map(f=>{const vs=f.map(i=>m.vertices[i]);return dot(cross(sub(vs[1],vs[0]),sub(vs[2],vs[0])),b.d);});
        const n=sideNormals.length;for(let i=0;i<n;i++){const prev=sideNormals[(i+n-1)%n],now=sideNormals[i];if(prev*now<=0&&Math.abs(prev-now)>EPS)ee.push([i,m.entity.type==='cone'?n:i+n]);}
      }
      if(m.entity.type==='point')points.push({p:m.p[0],entity:m.entity});
      for(const [i,j] of ee){const a=m.p[i],c=m.p[j];if(Math.hypot(c[0]-a[0],c[1]-a[1])<EPS)continue;
        if(!occlude){segments.push({a,b:c,hidden:false,entity:m.entity,edge:[i,j],range:[0,1]});continue;}
        const ts=[0,1];for(const tri of triangles){for(let k=0;k<3;k++){const t=crossingT(a,c,tri[k],tri[(k+1)%3]);if(t!==null)ts.push(t);} // depth-order crossings inside a face
          const [p,q,r]=tri,den=(q[1]-r[1])*(p[0]-r[0])+(r[0]-q[0])*(p[1]-r[1]);
          if(Math.abs(den)>EPS){const dep=x=>{const u=((q[1]-r[1])*(x[0]-r[0])+(r[0]-q[0])*(x[1]-r[1]))/den,v=((r[1]-p[1])*(x[0]-r[0])+(p[0]-r[0])*(x[1]-r[1]))/den;return u*p[2]+v*q[2]+(1-u-v)*r[2]-x[2];};const da=dep(a),db=dep(c);if(da*db<0){const t=da/(da-db);if(t>EPS&&t<1-EPS)ts.push(t);}}
        }
        ts.sort((x,y)=>x-y);let run=null;for(let k=0;k<ts.length-1;k++){if(ts[k+1]-ts[k]<EPS)continue;const mid=lerp(a,c,(ts[k]+ts[k+1])/2),hidden=triangles.some(t=>{const z=depthAt(mid,...t);return z!==null&&z>mid[2]+1e-5;});const end=lerp(a,c,ts[k+1]);if(run&&run.hidden===hidden){run.b=end;run.range[1]=ts[k+1];}else{run={a:lerp(a,c,ts[k]),b:end,hidden,entity:m.entity,edge:[i,j],range:[ts[k],ts[k+1]]};segments.push(run);}}
      }
    }
    return{meshes:pmeshes,segments,points};
  }
  function linePlane(a,b,plane,segment=true) {const f=planeFrame(plane),v=sub(b,a),den=dot(f.normal,v);if(Math.abs(den)<EPS)return null;const t=dot(f.normal,sub(f.origin,a))/den;if(segment&&(t<-EPS||t>1+EPS))return null;return add(a,mul(v,t));}
  function planeIntersection(a,b) {const fa=planeFrame(a),fb=planeFrame(b),direction=cross(fa.normal,fb.normal),dd=dot(direction,direction);if(dd<EPS)return null;const da=dot(fa.normal,a.position),db=dot(fb.normal,b.position);const origin=mul(add(mul(cross(fb.normal,direction),da),mul(cross(direction,fa.normal),db)),1/dd);return{origin,direction:unit(direction)};}
  function planeFromPoints(a,b,c) {
    const u=unit(sub(b,a)),n=unit(cross(u,sub(c,a))),v=cross(n,u);
    // Matrix columns u, v, n; decomposition Rz * Ry * Rx.
    const ry=Math.asin(Math.max(-1,Math.min(1,-u[2]))),cy=Math.cos(ry);let rx,rz;
    if(Math.abs(cy)>1e-6){rx=Math.atan2(v[2],n[2]);rz=Math.atan2(u[1],u[0]);}else{rx=0;rz=Math.atan2(-v[0],v[1]);}
    const center=mul(add(add(a,b),c),1/3),coords=[a,b,c].map(p=>[dot(sub(p,center),u),dot(sub(p,center),v)]);
    return{position:center,rotation:[rx,ry,rz].map(x=>x/rad),size:[2*Math.max(...coords.map(p=>Math.abs(p[0])))*1.3,2*Math.max(...coords.map(p=>Math.abs(p[1])))*1.3,1]};
  }
  function lineFromPoints(a,b) {const v=sub(b,a),l=length(v);if(l<EPS)throw Error('Los extremos deben ser diferentes.');return{position:mul(add(a,b),.5),rotation:[0,-Math.asin(v[2]/l)/rad,Math.atan2(v[1],v[0])/rad],size:[l,1,1]};}
  function resizeLine(e,value,anchor='center') {
    if(e.type!=='line'||!Number.isFinite(value)||value<.1||value>10000)throw Error('La longitud debe estar entre 0,1 y 10000 mm.');
    const shift=anchor==='a'?(value-e.size[0])/2:anchor==='b'?(e.size[0]-value)/2:0;
    return {...e,size:[value,...e.size.slice(1)],position:add(e.position,rotate([shift,0,0],e.rotation))};
  }
  // Coordinates stay in the supporting plane. Resizing scales about its original origin.
  function planeOutline(e){return(e.outline||[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]).map(p=>[p[0]*e.size[0],p[1]*e.size[1]]);}
  function validateOutline(points){
    if(!Array.isArray(points)||points.length<3||points.length>64||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||Math.abs(v)>1e8)))throw Error('El contorno necesita entre 3 y 64 vértices con coordenadas válidas.');
    const n=points.length,turn=(a,b,c)=>cross2(sub(b,a),sub(c,a)),on=(p,a,b)=>Math.abs(turn(a,b,p))<EPS&&p.every((v,i)=>v>=Math.min(a[i],b[i])-EPS&&v<=Math.max(a[i],b[i])+EPS);
    let area=0;for(let i=0;i<n;i++){const a=points[i],b=points[(i+1)%n];if(length(sub(a,b))<1e-6)throw Error('Dos vértices consecutivos no pueden coincidir.');area+=turn(points[0],a,b);
      const c=points[(i+2)%n];if(Math.abs(turn(a,b,c))<EPS&&dot(sub(a,b),sub(c,b))>0)throw Error('Las aristas no pueden cruzarse ni solaparse.');
      for(let j=i+1;j<n;j++){if(j===i+1||(i===0&&j===n-1))continue;const c=points[j],d=points[(j+1)%n],t1=turn(a,b,c),t2=turn(a,b,d),t3=turn(c,d,a),t4=turn(c,d,b);if((t1*t2<0&&t3*t4<0)||on(c,a,b)||on(d,a,b)||on(a,c,d)||on(b,c,d))throw Error('Las aristas no pueden cruzarse ni solaparse.');}}
    if(Math.abs(area)<1e-6)throw Error('El contorno debe encerrar una superficie.');return points;
  }
  function withPlaneOutline(e,points){
    validateOutline(points);const dims=[0,1].map(i=>Math.max(...points.map(p=>p[i]))-Math.min(...points.map(p=>p[i])));
    if(dims.some(v=>v<.1||v>10000))throw Error('El ancho y fondo del contorno deben estar entre 0,1 y 10000 mm.');
    return{...e,size:[...dims,e.size[2]],outline:points.map(p=>p.map((v,i)=>v/dims[i]))};
  }
  function editPlane(e,action,index,delta=[0,0]){
    const p=planeOutline(e),n=p.length;if(!Number.isInteger(index)||index<0||index>=n)throw Error('Elige un vértice o una arista.');
    if(action==='split'){if(n>=64)throw Error('El plano admite hasta 64 vértices.');p.splice(index+1,0,lerp(p[index],p[(index+1)%n],.5));}
    else if(action==='delete'||action==='collapse'){if(n<=3)throw Error('El plano necesita al menos tres vértices.');if(action==='collapse'){p[index]=lerp(p[index],p[(index+1)%n],.5);p.splice((index+1)%n,1);}else p.splice(index,1);}
    else if(action==='vertex'||action==='edge'){p[index]=add(p[index],delta);if(action==='edge')p[(index+1)%n]=add(p[(index+1)%n],delta);}
    else throw Error('Elige un vértice o una arista.');return withPlaneOutline(e,p);
  }
  function planeScreenDelta(e,b,delta,scale=1){const f=planeFrame(e),u=[dot(f.u,b.right),-dot(f.u,b.up)],v=[dot(f.v,b.right),-dot(f.v,b.up)],det=cross2(u,v);if(Math.abs(det)<.04)return null;return[(delta[0]*v[1]-delta[1]*v[0])/(det*scale),(u[0]*delta[1]-u[1]*delta[0])/(det*scale)];}
  function eulerFromFrame(u,v,n){const ry=Math.asin(Math.max(-1,Math.min(1,-u[2]))),cy=Math.cos(ry);return[Math.abs(cy)>1e-6?Math.atan2(v[2],n[2]):0,ry,Math.abs(cy)>1e-6?Math.atan2(u[1],u[0]):Math.atan2(-v[0],v[1])].map(x=>x/rad);}
  function axisRotate(v,axis,degrees){const a=unit(axis),c=Math.cos(degrees*rad),s=Math.sin(degrees*rad);return add(add(mul(v,c),mul(cross(a,v),s)),mul(a,dot(a,v)*(1-c)));}
  function rotateEntity(e,axis,degrees,origin=e.position){const u=axisRotate(rotate([1,0,0],e.rotation),axis,degrees),v=axisRotate(rotate([0,1,0],e.rotation),axis,degrees),n=axisRotate(rotate([0,0,1],e.rotation),axis,degrees);return{...e,rotation:eulerFromFrame(u,v,n),position:add(origin,axisRotate(sub(e.position,origin),axis,degrees))};}
  function alignVector(e,from,to){const a=unit(from),b=unit(to),d=Math.max(-1,Math.min(1,dot(a,b))),c=cross(a,b);if(length(c)<EPS){if(d>0)return{...e,rotation:[...e.rotation],position:[...e.position]};return rotateEntity(e,unit(cross(a,Math.abs(a[0])<.8?[1,0,0]:[0,1,0])),180);}return rotateEntity(e,c,Math.acos(d)/rad);}
  function alignedToAxis(e,origin,direction,orient=true){const d=unit(direction),position=add(origin,mul(d,dot(sub(e.position,origin),d)));let next={...e,position};if(!orient||e.type==='point')return next;const source=rotate(e.type==='line'?[1,0,0]:[0,0,1],e.rotation);let target;
    if(planar(e)){target=sub(source,mul(d,dot(source,d)));if(length(target)<EPS)target=unit(cross(d,Math.abs(d[0])<.8?[1,0,0]:[0,1,0]));}
    else target=mul(d,dot(source,d)<0?-1:1);return alignVector(next,source,target);
  }
  function axisAngleForProjection(source,direction,axis,goals){const n=unit(source),d=unit(direction),a=unit(axis),C=dot(n,a)*dot(d,a),A=dot(n,d)-C,B=dot(cross(a,n),d),R=Math.hypot(A,B),solutions=[];const norm=x=>((x+180)%360+360)%360-180;
    for(const goal of goals){if(R<EPS){if(Math.abs(C-goal)<1e-7)solutions.push(0);continue;}const q=(goal-C)/R;if(q< -1-1e-7||q>1+1e-7)continue;const phi=Math.atan2(B,A),delta=Math.acos(Math.max(-1,Math.min(1,q)));solutions.push(norm((phi+delta)/rad),norm((phi-delta)/rad));}
    return solutions.length?solutions.sort((a,b)=>Math.abs(a)-Math.abs(b))[0]:null;
  }
  function orientForProjection(e,viewKey,kind,workAxis=null){if(e.type==='point')throw Error('Un punto no tiene orientación.');const b=CAMERAS[viewKey];if(!b)throw Error('Elige una vista válida.');const isLine=e.type==='line',source=rotate(isLine?[1,0,0]:[0,0,1],e.rotation),parallel=isLine?kind==='edge':kind==='vm',goals=parallel?[1,-1]:[0];
    if(workAxis){const angle=axisAngleForProjection(source,b.d,workAxis.direction,goals);if(angle===null)throw Error('Esta posición no se puede alcanzar con el eje común. Desactiva «Respetar eje común» o elige otro eje.');return rotateEntity(e,workAxis.direction,angle,workAxis.origin);}
    let target;if(parallel)target=mul(b.d,dot(source,b.d)<0?-1:1);else{target=sub(source,mul(b.d,dot(source,b.d)));if(length(target)<EPS)target=isLine?b.right:b.up;}return alignVector(e,source,target);
  }
  function validate(input) {
    if(!input||input.format!=='diedrico-web'||input.version!==1||!Array.isArray(input.entities)||input.entities.length>120)throw Error('No es un proyecto Diédrico válido (máximo 120 elementos).');
    const types=['point','line','plane','box','cylinder','cone','prism','pyramid','circle','polygon'],ids=new Set();
    const entities=input.entities.map(e=>{
      if(!e||!types.includes(e.type)||typeof e.id!=='string'||e.id.length>80||ids.has(e.id)||typeof e.name!=='string'||e.name.length>100||!/^#[0-9a-f]{6}$/i.test(e.color))throw Error('Hay un elemento con datos no válidos.');ids.add(e.id);
      for(const key of ['position','rotation','size'])if(!Array.isArray(e[key])||e[key].length!==3||e[key].some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>10000)||(key==='size'&&e[key].some(n=>n<.1)))throw Error('Las coordenadas deben ser finitas y las dimensiones positivas (0,1–10000 mm).');
      if(!Number.isInteger(e.sides)||e.sides<3||e.sides>24)throw Error('El número de lados debe estar entre 3 y 24.');
      if(e.outline!==undefined){if(e.type!=='plane'||!Array.isArray(e.outline)||e.outline.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e5)))throw Error('El contorno contiene datos no válidos.');validateOutline(planeOutline(e));}
      return{id:e.id,type:e.type,name:e.name,color:e.color,position:[...e.position],rotation:[...e.rotation],size:[...e.size],sides:e.sides,visible:e.visible!==false,locked:e.locked===true,...(e.outline?{outline:e.outline.map(p=>[...p])}:{}),...(e.type==='line'&&e.infiniteLine===true?{infiniteLine:true}:{})};
    });
    let workAxis=null;if(input.workAxis!=null){const a=input.workAxis;for(const key of ['origin','direction'])if(!Array.isArray(a[key])||a[key].length!==3||a[key].some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>10000))throw Error('El eje común contiene coordenadas no válidas.');if(length(a.direction)<EPS)throw Error('El eje común necesita una dirección.');workAxis={origin:[...a.origin],direction:unit(a.direction),label:String(a.label||'Eje común').slice(0,100),members:Array.isArray(a.members)?[...new Set(a.members.filter(id=>ids.has(id)))]:[]};}
    return{format:'diedrico-web',version:1,name:String(input.name||'Sin título').slice(0,100),entities,grid:[1,2,5,10,20,50].includes(input.grid)?input.grid:10,...(workAxis?{workAxis}:{})};
  }
  const api={EPS,rad,add,sub,mul,dot,cross,length,unit,lerp,contrast,textColor,rotate,inverseRotate,world,mesh,basis,CAMERAS,VIEW_NAMES,project,bounds,planar,planeFrame,elementCamera,depthAt,projectedScene,linePlane,planeIntersection,planeFromPoints,lineFromPoints,eulerFromFrame,axisRotate,rotateEntity,alignVector,alignedToAxis,axisAngleForProjection,orientForProjection,validate};
  Object.assign(api,{resizeLine,planeOutline,validateOutline,withPlaneOutline,editPlane,planeScreenDelta,projectedMeshes,fitInfiniteLines});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Geo=api;
})(typeof globalThis!=='undefined'?globalThis:this);
