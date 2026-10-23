(function(root,factory){
  if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./geometry.js'));
  else root.ExampleLibrary=factory(root.Geo);
})(globalThis,function(G){
  'use strict';
  const reference={"format":"diedrico-web","version":1,"name":"Pieza escalonada","entities":[{"id":"ad0acd8d-590f-4cd9-9bc2-531dd4f687b4","type":"plane","name":"Plano 1","color":"#327d69","position":[0,0,30],"rotation":[11.95,350.2,0.4],"size":[80,60,1],"sides":6,"visible":true,"locked":false},{"id":"88fa6bbd-cd34-4659-88b9-83118aaf0232","type":"line","name":"Segmento 1","color":"#b47b30","position":[-0.9599183968864784,-0.006701603506816901,29.83418926156942],"rotation":[5.96609354787342,-9.80000000000003,0.4000000000000149],"size":[102.66415955283183,1,1],"sides":6,"visible":true,"locked":false},{"id":"995f7540-74c3-443f-9046-8f0223c72357","type":"plane","name":"Plano 2","color":"#4c769b","position":[0,0,30],"rotation":[20,-20,96.85],"size":[52.030144544637174,87.19248726596402,1],"sides":6,"visible":true,"locked":false,"outline":[[-0.4255557763312048,-0.13336307702300346],[0.5744442236687952,-0.5301877360716045],[0.11599586112842468,0.4698122639283954]]}],"grid":10,"workAxis":{"origin":[0,0,30],"direction":[0.9853838847881056,0.006879389038980517,0.1702094991660328],"label":"Eje común","members":["88fa6bbd-cd34-4659-88b9-83118aaf0232","ad0acd8d-590f-4cd9-9bc2-531dd4f687b4"]}};
  const catalog=Object.freeze([
    {id:'triangle-study',title:'Triángulo, plano y recta',description:'El ejercicio aportado: dos planos, una recta y su eje común.',icon:'plane'},
    {id:'line-section',title:'Recta secante a un plano',description:'Localiza la intersección de una recta con un plano oblicuo.',icon:'intersect'},
    {id:'hinged-planes',title:'Bisagra de planos',description:'Dos planos comparten una arista y un eje de giro.',icon:'rotate'},
    {id:'parallel-planes',title:'Paralelos y transversal',description:'Dos planos paralelos atravesados por una misma recta.',icon:'layers'},
    {id:'three-planes',title:'Tres planos concurrentes',description:'Tres orientaciones distintas que pasan por un punto común.',icon:'plane'}
  ].map(Object.freeze));
  const colors=['#327d69','#b47b30','#4c769b','#955d87'];
  function element(id,type,props={}){return{id,type,name:id,color:colors[0],position:[0,0,30],rotation:[0,0,0],size:[100,70,1],sides:6,visible:true,locked:false,...props};}
  const offset=(origin,direction,distance)=>G.add(origin,G.mul(direction,distance));
  function create(key='triangle-study',translate=s=>s){
    const entry=catalog.find(e=>e.id===key);if(!entry)throw Error('Elige un ejercicio de la lista.');
    let doc={format:'diedrico-web',version:1,name:entry.title,entities:[],grid:10};
    if(key==='triangle-study'){
      doc=JSON.parse(JSON.stringify(reference));doc.name=entry.title;
      const names=['α · Plano oblicuo','r · Recta del plano α','β · Plano triangular'];doc.entities.forEach((e,i)=>e.name=names[i]);
    }
    if(key==='line-section'){
      const plane=element('section-plane','plane',{name:'α · Plano oblicuo',rotation:[24,-18,10],size:[100,75,1]}),f=G.planeFrame(plane),direction=G.unit(G.add(f.normal,G.mul(f.u,.4)));
      doc.entities=[plane,element('section-line','line',{name:'r · Recta secante',color:colors[1],...G.lineFromPoints(offset(plane.position,direction,-70),offset(plane.position,direction,70))})];
    }
    if(key==='hinged-planes'){
      const origin=[0,0,32],a=element('hinge-fixed','plane',{name:'α · Plano fijo',position:origin,rotation:[14,-12,8],outline:[[-.5,0],[.5,0],[.5,1],[-.5,1]]}),axis=G.planeFrame(a).u;
      const b=G.rotateEntity(element('hinge-moving','plane',{name:'β · Plano abatible',color:colors[2],position:[...origin],rotation:[...a.rotation],outline:[[-.5,0],[.5,0],[0,1]]}),axis,55,origin);
      const line=element('hinge-axis','line',{name:'e · Eje de bisagra',color:colors[3],...G.lineFromPoints(offset(origin,axis,-65),offset(origin,axis,65))});
      doc.entities=[a,b,line];doc.workAxis={origin:[...origin],direction:axis,label:'Eje de bisagra',members:doc.entities.map(e=>e.id)};
    }
    if(key==='parallel-planes'){
      const origin=[0,0,35],rotation=[28,-16,12],normal=G.rotate([0,0,1],rotation),u=G.rotate([1,0,0],rotation),direction=G.unit(G.add(normal,G.mul(u,.35)));
      doc.entities=[element('parallel-alpha','plane',{name:'α · Primer plano paralelo',position:offset(origin,normal,-18),rotation:[...rotation],size:[95,70,1]}),element('parallel-beta','plane',{name:'β · Segundo plano paralelo',color:colors[2],position:offset(origin,normal,18),rotation:[...rotation],size:[95,70,1]}),element('parallel-line','line',{name:'r · Recta transversal',color:colors[1],...G.lineFromPoints(offset(origin,direction,-70),offset(origin,direction,70))})];
    }
    if(key==='three-planes'){
      const origin=[0,0,35];doc.entities=[element('meeting-alpha','plane',{name:'α · Plano horizontal',position:[...origin],rotation:[0,0,0],size:[100,75,1]}),element('meeting-beta','plane',{name:'β · Primer plano inclinado',color:colors[2],position:[...origin],rotation:[60,0,20],size:[95,75,1]}),element('meeting-gamma','plane',{name:'γ · Segundo plano inclinado',color:colors[3],position:[...origin],rotation:[0,65,-15],size:[90,70,1]}),element('meeting-point','point',{name:'P · Punto común',color:colors[1],position:[...origin],size:[1,1,1]})];
    }
    doc.name=translate(doc.name);doc.entities.forEach(e=>e.name=translate(e.name));if(doc.workAxis)doc.workAxis.label=translate(doc.workAxis.label);
    return G.validate(doc);
  }
  return{catalog,create};
});
