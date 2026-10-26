'use strict';
(function(root){
  const G=typeof module!=='undefined'&&module.exports?require('./geometry.js'):root.Geo,EPS=1e-6;
  const mean=points=>G.mul(points.reduce((a,p)=>G.add(a,p),[0,0,0]),1/points.length);
  const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0];
  function inside(p,polygon,includeBoundary=true){
    let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[j],b=polygon[i],v=G.sub(b,a),q=G.sub(p,a),length=G.length(v);
      if(length>EPS&&Math.abs(cross2(v,q))<=EPS*length&&G.dot(q,v)>=-EPS&&G.dot(q,v)<=G.dot(v,v)+EPS)return includeBoundary;
      if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
    }return hit;
  }
  function face(points){
    const origin=points[0],u=G.unit(G.sub(points[1],origin));let normal;
    for(let i=2;i<points.length;i++){const n=G.cross(u,G.sub(points[i],origin));if(G.length(n)>EPS){normal=G.unit(n);break;}}
    if(!normal)return null;const v=G.cross(normal,u),project=p=>{const q=G.sub(p,origin);return[G.dot(q,u),G.dot(q,v)];};
    return{points,origin,normal,project,polygon:points.map(project)};
  }
  function surfaces(mesh){const indices=G.planar(mesh.entity)?[mesh.vertices.map((_,i)=>i)]:mesh.faces;return indices.map(f=>face(f.map(i=>mesh.vertices[i]))).filter(Boolean);}
  function edges(mesh){
    const found=new Map();for(const f of mesh.faces)for(let i=0;i<f.length;i++){const pair=[f[i],f[(i+1)%f.length]],key=[...pair].sort((a,b)=>a-b).join(':');found.set(key,pair);}
    for(const pair of mesh.edges)found.set([...pair].sort((a,b)=>a-b).join(':'),pair);
    return[...found.values()].map(pair=>pair.map(i=>mesh.vertices[i]));
  }
  function segmentsMeet(a,b,c,d){
    const u=G.sub(b,a),v=G.sub(d,c),w=G.sub(a,c),aa=G.dot(u,u),bb=G.dot(u,v),cc=G.dot(v,v),dd=G.dot(u,w),ee=G.dot(v,w),den=aa*cc-bb*bb;
    if(aa<EPS*EPS||cc<EPS*EPS)return false;
    if(Math.abs(den)<1e-12*aa*cc){if(G.length(G.cross(w,u))/Math.sqrt(aa)>EPS)return false;const t=G.dot(G.sub(c,a),u)/aa,s=G.dot(G.sub(d,a),u)/aa;return Math.max(0,Math.min(t,s))<=Math.min(1,Math.max(t,s))+EPS;}
    const t=(bb*ee-cc*dd)/den,s=(aa*ee-bb*dd)/den;return t>=-EPS&&t<=1+EPS&&s>=-EPS&&s<=1+EPS&&G.length(G.sub(G.lerp(a,b,t),G.lerp(c,d,s)))<EPS;
  }
  function segmentFace(a,b,f){
    const da=G.dot(G.sub(a,f.origin),f.normal),db=G.dot(G.sub(b,f.origin),f.normal);
    if(Math.abs(da)<EPS&&Math.abs(db)<EPS){if(inside(f.project(a),f.polygon)||inside(f.project(b),f.polygon))return true;return f.points.some((p,i)=>segmentsMeet(a,b,p,f.points[(i+1)%f.points.length]));}
    if(da*db>EPS*EPS||Math.abs(da-db)<EPS)return false;const t=da/(da-db);return t>=-EPS&&t<=1+EPS&&inside(f.project(G.lerp(a,b,t)),f.polygon);
  }
  function intersects(a,b){
    const ma=G.mesh(a),mb=G.mesh(b);
    for(let axis=0;axis<3;axis++)if(Math.max(...ma.vertices.map(p=>p[axis]))<Math.min(...mb.vertices.map(p=>p[axis]))-EPS||Math.max(...mb.vertices.map(p=>p[axis]))<Math.min(...ma.vertices.map(p=>p[axis]))-EPS)return false;
    if(a.type==='line'&&b.type==='line')return segmentsMeet(...ma.vertices,...mb.vertices);
    const fa=surfaces(ma),fb=surfaces(mb);
    return edges(ma).some(([p,q])=>fb.some(f=>segmentFace(p,q,f)))||edges(mb).some(([p,q])=>fa.some(f=>segmentFace(p,q,f)));
  }
  function graph(entities){
    const links=entities.map(()=>[]);for(let i=0;i<entities.length;i++)for(let j=0;j<i;j++)if(intersects(entities[i],entities[j])){links[i].push(j);links[j].push(i);}
    const reached=new Set(),todo=entities.length?[0]:[];while(todo.length){const i=todo.pop();if(reached.has(i))continue;reached.add(i);todo.push(...links[i].filter(j=>!reached.has(j)));}
    return{links,connected:entities.length>=2&&reached.size===entities.length&&links.every(adjacent=>adjacent.length>0)};
  }
  // An ear centroid is inside a concave polygon even when its origin is outside it.
  function interior(f,random){
    const poly=f.polygon,area=poly.reduce((sum,p,i)=>sum+cross2(p,poly[(i+1)%poly.length]),0),sign=Math.sign(area),ears=[];
    for(let i=0;i<poly.length;i++){
      const previous=(i+poly.length-1)%poly.length,next=(i+1)%poly.length,a=poly[previous],b=poly[i],c=poly[next];if(cross2(G.sub(b,a),G.sub(c,b))*sign<=EPS)continue;
      const triangle=[a,b,c];if(poly.some((p,j)=>j!==previous&&j!==i&&j!==next&&inside(p,triangle)))continue;
      ears.push([f.points[previous],f.points[i],f.points[next]]);
    }
    if(!ears.length)throw Error('No se ha podido encontrar un punto interior del contorno.');
    const triangle=ears[Math.floor(random()*ears.length)],weights=[.3+random(),.3+random(),.3+random()],sum=weights.reduce((a,b)=>a+b,0);
    return triangle.reduce((p,q,i)=>G.add(p,G.mul(q,weights[i]/sum)),[0,0,0]);
  }
  function anchor(entity,random){
    if(entity.type==='line')return G.add(entity.position,G.rotate([(random()-.5)*entity.size[0]*.5,0,0],entity.rotation));
    const fs=surfaces(G.mesh(entity)),f=fs[Math.floor(random()*fs.length)];
    return G.planar(entity)?interior(f,random):mean(f.points);
  }
  function transverse(a,b){
    if(a.type==='line'&&b.type==='line')return G.length(G.cross(G.rotate([1,0,0],a.rotation),G.rotate([1,0,0],b.rotation)))>.08;
    if(G.planar(a)&&G.planar(b))return G.length(G.cross(G.planeFrame(a).normal,G.planeFrame(b).normal))>.08;
    const line=a.type==='line'?a:b.type==='line'?b:null,plane=G.planar(a)?a:G.planar(b)?b:null;
    return!line||!plane||Math.abs(G.dot(G.rotate([1,0,0],line.rotation),G.planeFrame(plane).normal))>.08;
  }
  function readableLine(e,views=[]){return e.type!=='line'||views.every(key=>{const c=G.CAMERAS[key];if(!c)return true;const d=G.rotate([1,0,0],e.rotation);return Math.hypot(G.dot(d,c.right),G.dot(d,c.up))>.35;});}
  const vertexError='No se ha podido generar sin vértices dentro de otros planos. Reduce los elementos, elige menos vistas o desactiva la restricción.';
  function verticesOutsidePlanes(entities,views=['front','top'],candidateId=null){
    const meshes=entities.filter(e=>e.visible).map(G.mesh);
    for(const key of views){
      const camera=G.CAMERAS[key];if(!camera)continue;
      const projected=meshes.map(m=>({...m,p:m.vertices.map(p=>G.project(p,camera).slice(0,2))}));
      const masks=projected.filter(m=>G.planar(m.entity)).map(m=>{
        const poly=m.p,area=poly.reduce((sum,p,i)=>sum+cross2(G.sub(p,poly[0]),G.sub(poly[(i+1)%poly.length],poly[0])),0);
        return{...m,area,min:[0,1].map(i=>Math.min(...poly.map(p=>p[i]))),max:[0,1].map(i=>Math.max(...poly.map(p=>p[i])))};
      }).filter(m=>Math.abs(m.area)>EPS);
      for(const m of projected)for(const mask of masks){
        if(m.entity.id===mask.entity.id||candidateId!==null&&m.entity.id!==candidateId&&mask.entity.id!==candidateId)continue;
        if(m.p.some(p=>p[0]>mask.min[0]-EPS&&p[0]<mask.max[0]+EPS&&p[1]>mask.min[1]-EPS&&p[1]<mask.max[1]+EPS&&inside(p,mask.p,false)))return false;
      }
    }
    return true;
  }
  function separateVertices(entities,random=Math.random,views=['front','top']){
    const placed=[];
    for(const original of entities){
      const e=JSON.parse(JSON.stringify(original)),span=Math.max(120,...G.mesh(e).vertices.map(p=>G.length(G.sub(p,e.position))*2));let success=false;
      for(let attempt=0;attempt<256&&!success;attempt++){
        if(attempt){e.rotation=[(random()-.5)*160,(random()-.5)*160,(random()-.5)*360];e.position=original.position.map(p=>Math.max(-9900,Math.min(9900,p+(random()-.5)*span*(1+Math.floor(attempt/24)))));}
        success=verticesOutsidePlanes([...placed,e],views,e.id);
      }
      if(!success)throw Error(vertexError);placed.push(e);
    }
    return placed;
  }
  function connect(entities,random=Math.random,views=[],options={}){
    // Restart the placement when an earlier choice leaves no valid continuation.
    if(options.avoidInteriorVertices&&!options.singleAttempt){
      for(let attempt=0;attempt<32;attempt++){
        const trial=entities.map(e=>({...e,rotation:attempt?[(random()-.5)*160,(random()-.5)*160,(random()-.5)*360]:[...e.rotation]}));
        try{return connect(trial,random,views,{...options,singleAttempt:true});}catch(error){if(error.message!==vertexError)throw error;}
      }
      throw Error(vertexError);
    }
    const placed=entities.map(e=>JSON.parse(JSON.stringify(e)));
    if(placed.length<2)throw Error('Para conectar los elementos hacen falta al menos 2 por lámina.');
    for(let i=1;i<placed.length;i++){
      const e=placed[i],rotation=[...e.rotation];let success=false;
      for(let attempt=0;attempt<(options.avoidInteriorVertices?192:24)&&!success;attempt++){
        const parent=placed[attempt===0?i-1:Math.floor(random()*i)];e.rotation=rotation.map((angle,j)=>angle+attempt*[11.173,23.417,37.129][j]);
        e.position=G.add(e.position,G.sub(anchor(parent,random),anchor(e,random)));
        success=transverse(parent,e)&&readableLine(e,views)&&intersects(parent,e);
        if(success&&options.avoidInteriorVertices)success=verticesOutsidePlanes(placed.slice(0,i+1),options.views||['front','top'],e.id);
      }
      if(!success)throw Error(options.avoidInteriorVertices?vertexError:'No se ha podido conectar la geometría con estas dimensiones.');
    }
    return placed;
  }
  function extendLines(entities,views=['front','top','right'],margin=8){return G.fitInfiniteLines(entities.map(e=>({...JSON.parse(JSON.stringify(e)),...(e.type==='line'?{infiniteLine:true}:{})})),views,margin);}
  const api={intersects,graph,connect,extendLines,readableLine,verticesOutsidePlanes,separateVertices,vertexError};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BatchGeometry=api;
})(globalThis);
