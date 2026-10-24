const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../batch.js'),G=require('../geometry.js'),E=require('../examples.js'),I=require('../i18n.js');
global.Geo=G;global.I18n=I;require('../sheet.js');
const settings={quantity:10,total:[2,8],planes:[0,4],lines:[1,5],solids:[0,3]};
function random(seed=42){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
test('Los sorteos respetan simultáneamente el total y todas las categorías, incluidos los extremos',()=>{
  for(const rnd of [()=>0,()=>1-Number.EPSILON,random()])for(let i=0;i<300;i++){
    const counts=B.counts(settings,rnd);assert.equal(counts.total,counts.planes+counts.lines+counts.solids);
    for(const key of ['total','planes','lines','solids'])assert.ok(counts[key]>=settings[key][0]&&counts[key]<=settings[key][1]);
  }
  assert.deepEqual(B.validate({...settings,total:[120,120],planes:[120,120],lines:[0,0],solids:[0,0]}),{min:120,max:120});
});
test('Rechaza vacíos, decimales, valores fuera de límites y rangos incompatibles sin intentar generar',()=>{
  for(const change of [{quantity:0},{quantity:101},{quantity:1.5},{planes:[3,2]},{lines:[-1,2]},{total:[0,0]},{solids:[0,121]},{planes:[0,NaN]},{total:[20,30]},{total:[1,1],planes:[2,3]},{total:[1,3],lines:[0,0],planes:[0,0],solids:[0,0]}])assert.throws(()=>B.validate({...settings,...change}));
});
test('Los proyectos generados son independientes, válidos y contienen las cantidades solicitadas',()=>{
  const source=E.create(),original=JSON.stringify(source),rnd=random(),config={...settings,total:[6,6],planes:[2,2],lines:[2,2],solids:[2,2]},documents=[];
  for(let index=1;index<=10;index++){
    const {document:d,counts}=B.create(source,config,index,rnd);assert.equal(d.entities.length,6);assert.equal(d.entities.filter(e=>G.planar(e)).length,2);assert.equal(d.entities.filter(e=>e.type==='line').length,2);assert.equal(counts.solids,2);assert.equal(new Set(d.entities.map(e=>e.id)).size,6);assert.doesNotThrow(()=>G.validate(d));documents.push(d);
  }
  assert.equal(JSON.stringify(source),original);assert.notDeepEqual(documents[0].entities,documents[1].entities);documents[0].entities[0].size[0]=999;assert.equal(JSON.stringify(source),original);
  const outline=source.entities.find(e=>e.outline)?.outline;assert.ok(outline);assert.ok(documents.some(d=>d.entities.some(e=>e.outline)));
});
test('Admite categorías exclusivas y una escena vacía; traduce los nombres generados',()=>{
  const source={format:'diedrico-web',version:1,name:'Prueba',entities:[],grid:20};
  for(const category of ['planes','lines','solids']){
    const ranges={quantity:1,total:[3,3],planes:[0,0],lines:[0,0],solids:[0,0],[category]:[3,3]},d=B.create(source,ranges,1,random(),s=>I.translate(s,'ca')).document;
    assert.equal(d.grid,20);assert.equal(d.entities.length,3);assert.ok(d.entities.every(e=>category==='planes'?e.type==='plane':category==='lines'?e.type==='line':!G.planar(e)&&e.type!=='line'));
    assert.ok(d.entities.every(e=>e.name.startsWith(I.translate({plane:'Plano',line:'Segmento',box:'Ortoedro',prism:'Prisma',pyramid:'Pirámide',cylinder:'Cilindro',cone:'Cono'}[e.type],'ca'))));
  }
});
test('Reutiliza dimensiones, contornos y colores sin copiar bloqueos ni referencias del ejercicio',()=>{
  const source=E.create(),template=source.entities.find(e=>e.outline);source.entities=[{...template,locked:true}];
  const d=B.create(source,{quantity:1,total:[2,2],planes:[2,2],lines:[0,0],solids:[0,0]},1,random()).document;
  for(const e of d.entities){assert.deepEqual(e.outline,template.outline);assert.deepEqual(e.size,template.size);assert.equal(e.color,template.color);assert.equal(e.locked,false);assert.equal(e.visible,true);}assert.equal(d.workAxis,undefined);
});
test('Las láminas generadas aplican vistas, formato, escala, títulos, pie y trazos parciales',()=>{
  const d=B.create(E.create(),{quantity:1,total:[3,3],planes:[2,2],lines:[1,1],solids:[0,0]},1,random()).document;
  const result=Sheet.create(d,{views:['front','top'],format:'a3',scale:'0.2',hidden:true,colors:true,labels:false,grid:true,projectors:true,showViewTitles:false,partialLines:true,partialPlanes:true,partialGap:4,showFooter:true,footerTitle:'Título personalizado',footerNote:'Nota personalizada',footerDetails:false});
  assert.ok(result.fits);assert.deepEqual(result.paper,[420,297]);assert.match(result.svg,/Título personalizado/);assert.match(result.svg,/Nota personalizada/);assert.doesNotMatch(result.svg,/NaN|Infinity|Perfil derecho/);assert.doesNotMatch(result.svg,/<text[^>]*>Alzado/);
});
test('ZIP incluye nombres UTF-8 y los contenidos íntegros con CRC-32 y directorio central válido',async()=>{
  const files=[{name:'lámina-001.svg',text:'<svg>α β</svg>'},{name:'001.diedrico.json',text:JSON.stringify(E.create())}],data=Buffer.from(await B.zip(files).arrayBuffer());
  let offset=0;const locals=[];
  for(const file of files){assert.equal(data.readUInt32LE(offset),0x04034b50);assert.equal(data.readUInt16LE(offset+6),0x800);const length=data.readUInt32LE(offset+18),nameLength=data.readUInt16LE(offset+26);assert.equal(data.toString('utf8',offset+30,offset+30+nameLength),file.name);assert.equal(data.toString('utf8',offset+30+nameLength,offset+30+nameLength+length),file.text);locals.push(offset);offset+=30+nameLength+length;}
  const centralStart=offset;for(let i=0;i<files.length;i++){assert.equal(data.readUInt32LE(offset),0x02014b50);assert.equal(data.readUInt32LE(offset+42),locals[i]);offset+=46+data.readUInt16LE(offset+28);}
  assert.equal(data.readUInt32LE(offset),0x06054b50);assert.equal(data.readUInt16LE(offset+10),files.length);assert.equal(data.readUInt32LE(offset+16),centralStart);assert.equal(offset+22,data.length);
  const known=Buffer.from(await B.zip([{name:'crc.txt',text:'123456789'}]).arrayBuffer());assert.equal(known.readUInt32LE(14),0xcbf43926);
});
