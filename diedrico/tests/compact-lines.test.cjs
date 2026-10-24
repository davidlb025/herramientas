const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../geometry.js'),B=require('../batch.js');global.Geo=G;require('../sheet.js');
const entity=(id,type,props={})=>({id,type,name:id,color:'#327d69',position:[0,0,0],rotation:[0,0,0],size:[40,20,1],sides:5,visible:true,locked:false,...props});
const plane=entity('p','plane'),line=entity('r','line',{rotation:[0,-45,30],size:[1000,1,1],infiniteLine:true});
const doc=entities=>({format:'diedrico-web',version:1,name:'Prueba',grid:10,entities});
const close=(a,b,tolerance=1e-5)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≠ ${b}`);
const transform=(sheet,key,p)=>{const c=sheet.layout.cells[key],q=G.project(p,G.CAMERAS[key]);return[c.cx+(q[0]-c.b.center[0])*sheet.scale,c.cy+(q[1]-c.b.center[1])*sheet.scale];};
const on=(p,s)=>{const v=G.sub(s.b,s.a),q=G.sub(p,s.a);return Math.abs(v[0]*q[1]-v[1]*q[0])<1e-4&&G.dot(q,v)>=-1e-4&&G.dot(q,v)<=G.dot(v,v)+1e-4;};
test('A y B son los mismos puntos 3D en las seis vistas y el ajuste elimina la longitud sobrante',()=>{
  const original=doc([plane,line]),before=JSON.stringify(original),sheet=Sheet.create(original,{views:Object.keys(G.VIEW_NAMES),format:'a3',scale:'auto',showFooter:false});assert.ok(sheet.fits,sheet.error);
  const r=sheet.document.entities.find(e=>e.id==='r'),ends=G.mesh(r).vertices;assert.ok(r.size[0]<line.size[0]);assert.equal(JSON.stringify(original),before);
  for(const key of Object.keys(G.VIEW_NAMES)){const scene=G.projectedScene(sheet.document.entities,G.CAMERAS[key]),m=scene.meshes.find(m=>m.entity.id==='r');assert.deepEqual(m.vertices,ends);for(let i=0;i<2;i++)assert.deepEqual(m.p[i],G.project(ends[i],G.CAMERAS[key]));}
});
test('Cada extremo deja al menos 8 mm visibles con distintas escalas y separaciones parciales',()=>{
  for(const scale of [.2,.5,1])for(const gap of [0,4,10]){
    const options={views:['front','top'],scale,partialLines:true,partialGap:gap,showFooter:false},sheet=Sheet.create(doc([plane,line]),options);assert.ok(sheet.fits,sheet.error);
    for(const view of options.views){
      const scene=G.projectedScene(sheet.document.entities,G.CAMERAS[view]),parts=Sheet.partialGeometry(scene,options,sheet.scale).segments.filter(s=>s.entity.id==='r'),continuous=gap===0&&view==='front';assert.equal(parts.length,continuous?1:2);
      for(const part of parts){const length=Math.hypot(part.b[0]-part.a[0],part.b[1]-part.a[1])*sheet.scale/(continuous?2:1);assert.ok(length>=7.9999,`${view}: ${length}`);if(view==='top')close(length,8);}
    }
  }
});
test('Las correspondencias unen exactamente A con A y B con B en planta, alzado y perfil',()=>{
  const options={views:['front','top','right'],scale:'auto',partialLines:true,partialGap:4,projectors:true},sheet=Sheet.create(doc([plane,line]),options);assert.ok(sheet.fits,sheet.error);
  const ends=G.mesh(sheet.document.entities.find(e=>e.id==='r')).vertices;
  for(const p of ends){const front=transform(sheet,'front',p),top=transform(sheet,'top',p),right=transform(sheet,'right',p);close(front[0],top[0]);close(front[1],right[1]);assert.ok(sheet.guides.segments.some(s=>on(front,s)&&on(top,s)));assert.ok(sheet.guides.segments.some(s=>on(front,s)&&on(right,s)));}
  assert.ok(!/NaN|Infinity/.test(sheet.svg));
});
test('El contorno cóncavo determina un tramo mínimo asimétrico sin usar vértices lejanos',()=>{
  const concave=entity('c','plane',{size:[10,10,1],outline:[[0,0],[10,0],[10,1],[1,1],[1,10],[0,10]]}),r=entity('r','line',{position:[0,50,0],size:[1000,1,1],infiniteLine:true}),fitted=G.fitInfiniteLines([concave,r],['top'],8),ends=G.mesh(fitted[1]).vertices;close(ends[0][0],-8);close(ends[1][0],18);assert.ok(fitted[1].size[0]<r.size[0]);
});
test('El JSON conserva exactamente los extremos dibujados sin modificar las rectas finitas',()=>{
  const finite=entity('s','line',{rotation:[0,-20,17],position:[0,0,5],size:[18,1,1]}),sheet=Sheet.create(doc([plane,line,finite]),{views:['front','top'],scale:.5});assert.ok(sheet.fits,sheet.error);
  const opened=G.validate(JSON.parse(JSON.stringify(sheet.document)));assert.deepEqual(G.mesh(opened.entities.find(e=>e.id==='r')).vertices,G.mesh(sheet.document.entities.find(e=>e.id==='r')).vertices);assert.deepEqual(opened.entities.find(e=>e.id==='s'),finite);
  const generated=B.create(doc([line]),{quantity:1,total:[1,1],planes:[0,0],lines:[1,1],solids:[0,0]}).document;assert.equal(generated.entities[0].infiniteLine,undefined);
});
