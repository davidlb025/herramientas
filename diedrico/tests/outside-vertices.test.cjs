const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../geometry.js'),BG=require('../batch-geometry.js'),B=require('../batch.js'),E=require('../examples.js');global.Geo=G;require('../sheet.js');
const e=(id,type,props={})=>({id,type,name:id,color:'#327d69',position:[0,0,0],rotation:[0,0,0],size:[40,40,40],sides:5,visible:true,locked:false,...props});
const random=(seed=42)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const config={quantity:1,total:[5,5],planes:[3,3],lines:[2,2],solids:[0,0],avoidInteriorVertices:true,views:['front','top']};
test('Se comprueban interiores proyectados aunque los vértices no estén en el plano 3D',()=>{
  const plane=e('p','plane'),point=e('q','point',{position:[0,0,200]});assert.equal(BG.verticesOutsidePlanes([plane,point],['top']),false);assert.equal(BG.verticesOutsidePlanes([plane,point],['front']),true);
  assert.equal(BG.verticesOutsidePlanes([plane,{...point,visible:false}],['top']),true);assert.equal(BG.verticesOutsidePlanes([plane],['top']),true);
});
test('Los bordes, las concavidades y las vistas de canto no generan interiores falsos',()=>{
  const plane=e('p','plane',{size:[10,10,1],outline:[[0,0],[3,0],[3,1],[1,1],[1,3],[0,3]]}),q=e('q','point',{position:[20,20,100]});
  assert.equal(BG.verticesOutsidePlanes([plane,q],['top']),true);assert.equal(BG.verticesOutsidePlanes([plane,{...q,position:[5,20,100]}],['top']),false);
  assert.equal(BG.verticesOutsidePlanes([plane,{...q,position:[10,20,100]}],['top']),true);assert.equal(BG.verticesOutsidePlanes([plane,q],['front']),true);
});
test('Se comprueban extremos de rectas, vértices de sólidos y contornos circulares',()=>{
  for(const type of ['plane','polygon','circle'])for(const other of ['line','box','prism','pyramid','cylinder','cone']){
    const plane=e('p',type,{size:[200,200,1]}),object=e('o',other,{position:[0,0,200]});assert.equal(BG.verticesOutsidePlanes([plane,object],['top']),false,`${type} / ${other}`);
  }
});
test('Un borde oblicuo sigue siendo borde aunque cambie la profundidad del punto',()=>{
  const plane=e('p','plane',{rotation:[33,27,18]});
  for(const key of Object.keys(G.VIEW_NAMES)){
    const point=local=>e('q','point',{position:G.add(G.world(local,plane),G.mul(G.CAMERAS[key].d,500))});
    assert.equal(BG.verticesOutsidePlanes([plane,point([20,0,0])],[key]),true,key);
    assert.equal(BG.verticesOutsidePlanes([plane,point([19,0,0])],[key]),false,key);
  }
});
test('La generación sin vértices interiores conserva cantidades, plantillas y escena base',()=>{
  const source=E.create(),before=JSON.stringify(source);
  for(let seed=0;seed<30;seed++){
    const d=B.create(source,config,1,random(seed)).document;assert.equal(d.entities.length,5);assert.equal(BG.verticesOutsidePlanes(d.entities,config.views),true);assert.doesNotThrow(()=>G.validate(d));
    for(const plane of d.entities.filter(G.planar))assert.ok(source.entities.some(template=>template.type===plane.type&&JSON.stringify(template.size)===JSON.stringify(plane.size)&&JSON.stringify(template.outline)===JSON.stringify(plane.outline)));
  }
  assert.equal(JSON.stringify(source),before);
});
test('Conexión, prolongación y trazos parciales mantienen la restricción en la geometría final de la lámina',()=>{
  let successes=0;
  for(let seed=0;seed<24;seed++){
    try{
      const d=B.create(E.create(),{...config,connected:true,infiniteLines:true},1,random(seed)).document;
      assert.equal(BG.graph(d.entities).connected,true);const out=Sheet.create(d,{views:config.views,partialLines:true,partialPlanes:true,partialGap:4,pointLabels:true});assert.ok(out.fits);assert.equal(BG.verticesOutsidePlanes(out.document.entities,config.views),true);
      for(const view of config.views){const parts=Sheet.partialGeometry(G.projectedScene(out.document.entities,G.CAMERAS[view]),{partialPlanes:true,partialLines:true,partialGap:0});assert.equal(parts.points.filter(p=>p.kind==='interior-vertex').length,0);}
      successes++;
    }catch(error){assert.equal(error.message,BG.vertexError);}
  }
  assert.ok(successes>=20,`Solo ${successes} configuraciones válidas`);
});
test('La restricción respeta todas las vistas seleccionadas, también perfiles e inferiores',()=>{
  const views=Object.keys(G.VIEW_NAMES);
  for(let seed=0;seed<12;seed++){
    const d=B.create(E.create(),{...config,views,total:[6,6],solids:[1,1]},1,random(seed)).document;assert.equal(BG.verticesOutsidePlanes(d.entities,views),true);
  }
});
