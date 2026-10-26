const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../geometry.js'),I=require('../i18n.js');global.Geo=G;global.I18n=I;require('../sheet.js');
const e=(id,type,props={})=>({id,type,name:'Nombre del objeto',color:'#327d69',position:[0,0,0],rotation:[17,23,31],size:[40,30,50],sides:5,visible:true,locked:false,...props});
const doc=entities=>({name:'Ejercicio',grid:10,entities});
const labels=svg=>[...svg.matchAll(/<text data-purpose="vertex-label"[^>]*>([^<]*)<\/text>/g)].map(m=>m[1].replaceAll('&apos;',"'"));
const view=(svg,key)=>svg.split(`data-view="${key}"`)[1].split('</g></g>')[0];
test('La lámina inicial tiene letras, trazos parciales a 6 mm y solo frente y arriba, sin títulos, pie ni nombres',()=>{
  const html=require('node:fs').readFileSync(require.resolve('../index.html'),'utf8'),input=id=>html.match(new RegExp('<input id="'+id+'"[^>]*>'))[0],checked=id=>/\bchecked\b/.test(input(id));
  const options=Object.fromEntries(Object.entries({showViewTitles:'sheet-view-titles',showViewFrames:'sheet-view-frames',showFooter:'sheet-footer',labels:'sheet-labels',pointLabels:'sheet-point-labels',partialLines:'sheet-partial-lines',partialPlanes:'sheet-partial-planes'}).map(([key,id])=>[key,checked(id)]));
  options.partialGap=Number(input('sheet-partial-gap').match(/value="([^"]+)"/)[1]);
  assert.deepEqual(options,{showViewTitles:false,showViewFrames:true,showFooter:false,labels:false,pointLabels:true,partialLines:true,partialPlanes:true,partialGap:6});
  assert.doesNotMatch(input('sheet-partial-gap'),/\bdisabled\b/);assert.match(html,/>6 mm<\/output>/);
  const out=Sheet.create(doc([e('p','plane')]),options);assert.deepEqual(Object.keys(out.layout.cells),['front','top']);assert.ok(out.fits);assert.doesNotMatch(out.svg,/data-purpose="footer"|Nombre del objeto|data-purpose="view-title"/);assert.match(out.svg,/data-purpose="vertex-label"/);
  assert.match(Sheet.create(doc([e('p','plane')]),{showFooter:true,labels:true}).svg,/data-purpose="footer"/);
});
test('Cada vértice conserva su letra con las primas de cada vista y los nombres son independientes',()=>{
  const d=doc([e('r','line')]),views=Object.keys(G.VIEW_NAMES),out=Sheet.create(d,{views,pointLabels:true});
  for(const [key,suffix]of Object.entries({top:'',front:"'",right:"''",left:"'''",back:"''''",bottom:"'''''"}))assert.deepEqual(labels(view(out.svg,key)),['A'+suffix,'B'+suffix]);
  assert.doesNotMatch(out.svg,/Nombre del objeto/);assert.match(Sheet.create(d,{pointLabels:true,labels:true}).svg,/Nombre del objeto/);
  assert.deepEqual(labels(view(Sheet.create(d,{views:['top','front'],pointLabels:true}).svg,'front')),["A'","B'"]);
});
test('La misma posición espacial comparte letra y los puntos coincidentes en proyección comparten rótulo',()=>{
  const a=e('a','point',{rotation:[0,0,0]}),b=e('b','point',{position:[0,0,20]}),same=e('same','point');
  const out=Sheet.create(doc([a,b,same]),{pointLabels:true});assert.deepEqual(labels(view(out.svg,'top')),['A / B']);assert.deepEqual(labels(view(out.svg,'front')),["A'","B'"]);
});
test('La secuencia continúa tras Z y omite elementos ocultos o ajenos a la selección',()=>{
  const entities=Array.from({length:28},(_,i)=>e('p'+i,'point',{position:[i*10,i*7,i*5]}));
  let out=Sheet.create(doc(entities),{views:['top'],pointLabels:true});assert.deepEqual(labels(out.svg).slice(-3),['Z','AA','AB']);
  entities[0].visible=false;out=Sheet.create(doc(entities),{pointLabels:true,onlySelected:true,selected:'p27'});assert.deepEqual(labels(view(out.svg,'top')),['A']);
});
test('Los trazos parciales rotulan los vértices originales, incluidos los interiores, sin inventar puntos de corte',()=>{
  const d=doc([e('p','plane',{rotation:[0,0,0],size:[100,80,1]}),e('r','line',{rotation:[0,0,0],size:[20,1,1]})]);
  const out=Sheet.create(d,{views:['top'],partialLines:true,pointLabels:true});assert.deepEqual(labels(out.svg),['A','B','C','D','E','F']);assert.equal((out.svg.match(/data-purpose="interior-vertex"/g)||[]).length,2);
});
test('Las letras respetan la oclusión y no rotulan los vértices de discretización de una curva',()=>{
  const d=doc([e('box','box',{rotation:[0,0,0]}),e('point','point',{position:[0,0,0]}),e('circle','circle',{position:[150,0,0]})]);
  const out=Sheet.create(d,{views:['top'],pointLabels:true,hidden:false});assert.ok(!labels(out.svg).includes('I'));assert.ok(labels(out.svg).length<=4);assert.doesNotMatch(out.svg,/NaN|Infinity/);
});
test('Los nuevos controles y la explicación se traducen al catalán',()=>{
  for(const text of ["Letras de puntos (A, A')","A en planta, A' en alzado; la misma letra identifica el mismo punto.",'Vértices fuera de otros planos','Ningún vértice queda dentro de la proyección de otro plano en las vistas elegidas. Se permiten cruces de aristas.'])assert.notEqual(I.translate(text,'ca'),text);
});
