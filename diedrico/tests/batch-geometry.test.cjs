const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../batch.js'),BG=require('../batch-geometry.js'),G=require('../geometry.js'),E=require('../examples.js');global.Geo=G;require('../sheet.js');
const entity=(id,type,props={})=>({id,type,name:id,color:'#327d69',position:[0,0,0],rotation:[0,0,0],size:[40,40,40],sides:5,visible:true,locked:false,...props});
const source=entities=>({format:'diedrico-web',version:1,name:'Prueba',grid:10,entities});
function random(seed=42){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('Distingue una cadena conectada de dos parejas separadas aunque cada elemento tenga un cruce',()=>{
  const planes=[0,30,150,180].map((x,i)=>entity('p'+i,'plane',{position:[x,0,0]}));
  const split=BG.graph(planes);assert.ok(split.links.every(links=>links.length>0));assert.equal(split.connected,false);
  const chain=planes.map((e,i)=>({...e,position:[i*30,0,0]}));assert.equal(BG.graph(chain).connected,true);assert.equal(BG.intersects(chain[0],chain[3]),false);
});
test('Los cruces se comprueban en 3D y dentro de los parches finitos',()=>{
  const horizontal=entity('h','line',{size:[20,1,1]}),skew=entity('s','line',{size:[20,1,1],position:[0,0,5],rotation:[0,0,90]});
  assert.equal(BG.intersects(horizontal,skew),false);assert.equal(BG.intersects(horizontal,{...skew,position:[0,0,0]}),true);
  const plane=entity('p','plane',{size:[10,10,1]});assert.equal(BG.intersects(plane,entity('outside','line',{position:[20,0,0],rotation:[0,90,0]})),false);assert.equal(BG.intersects(plane,entity('inside','line',{rotation:[0,90,0]})),true);
});
test('Un hueco cóncavo no cuenta como cruce y se detectan secciones de sólidos',()=>{
  const plane=entity('p','plane',{size:[10,10,1],outline:[[0,0],[3,0],[3,1],[1,1],[1,3],[0,3]]}),line=entity('r','line',{size:[20,1,1],position:[20,20,0],rotation:[0,90,0]});
  assert.equal(BG.intersects(plane,line),false);assert.equal(BG.intersects(plane,{...line,position:[5,20,0]}),true);
  assert.equal(BG.intersects(entity('b','box'),entity('p','plane',{size:[60,60,1]})),true);
});
test('El modo conectado exige al menos dos elementos y respeta los rangos al elevar el mínimo',()=>{
  const config={quantity:1,total:[1,1],planes:[0,4],lines:[0,0],solids:[0,0],connected:true};assert.throws(()=>B.validate(config),/al menos 2/);
  for(let i=0;i<30;i++)assert.ok(B.counts({...config,total:[1,4]},random(i)).total>=2);
});
test('La generación construye una única red de cruces para planos, rectas y cuerpos de todas las clases',()=>{
  for(const type of ['plane','circle','polygon','line','box','prism','pyramid','cylinder','cone']){
    const category=G.planar({type})?'planes':type==='line'?'lines':'solids',config={quantity:1,total:[4,4],planes:[0,0],lines:[0,0],solids:[0,0],[category]:[4,4],connected:true};
    for(let seed=1;seed<=4;seed++){const d=B.create(source([entity(type,type)]),config,1,random(seed)).document;assert.equal(BG.graph(d.entities).connected,true,`${type} ${seed}`);assert.doesNotThrow(()=>G.validate(d));}
  }
});
test('La conexión conserva contornos cóncavos alejados del origen y no modifica la escena base',()=>{
  const concave=entity('c','plane',{size:[10,10,1],outline:[[2,2],[5,2],[5,3],[3,3],[3,5],[2,5]]}),s=source([concave]),before=JSON.stringify(s);
  const config={quantity:1,total:[5,5],planes:[3,3],lines:[2,2],solids:[0,0],connected:true};
  for(let seed=1;seed<=20;seed++){const d=B.create(s,config,1,random(seed)).document;assert.equal(BG.graph(d.entities).connected,true);for(const plane of d.entities.filter(G.planar))assert.deepEqual(plane.outline,concave.outline);}
  assert.equal(JSON.stringify(s),before);
});
test('Las rectas infinitas conservan su modo al guardar y no modifican la escena base',()=>{
  const s=source([entity('p','plane',{size:[200,130,1],rotation:[24,17,-12]}),entity('r','line',{size:[2,1,1],rotation:[0,-32,31]})]),before=JSON.stringify(s),views=Object.keys(G.VIEW_NAMES),extended=BG.extendLines(s.entities,views,16),line=extended[1],direction=G.rotate([1,0,0],line.rotation);
  assert.ok(line.size[0]>s.entities[1].size[0]);assert.equal(JSON.stringify(s),before);
  assert.deepEqual(G.validate(source(extended)).entities[1].size,line.size);
  assert.equal(G.validate(source(extended)).entities[1].infiniteLine,true);
});
test('Conexión y rectas prolongadas funcionan juntas sin perder los cruces ni acabar de punta',()=>{
  const config={quantity:1,total:[6,6],planes:[3,3],lines:[3,3],solids:[0,0],connected:true,infiniteLines:true,views:Object.keys(G.VIEW_NAMES)};
  for(let seed=0;seed<25;seed++){const d=B.create(E.create(),config,1,random(seed)).document;assert.equal(BG.graph(d.entities).connected,true);assert.ok(d.entities.every(e=>BG.readableLine(e,config.views)));}
});
test('ZIP conserva los bytes binarios PNG sin codificarlos como texto',async()=>{
  const bytes=Uint8Array.from([137,80,78,71,13,10,26,10,0,255,128]),data=Buffer.from(await B.zip([{name:'imagen.png',data:bytes}]).arrayBuffer()),length=data.readUInt16LE(26);assert.deepEqual(data.subarray(30+length,30+length+bytes.length),Buffer.from(bytes));assert.equal(data.readUInt32LE(18),bytes.length);
});
