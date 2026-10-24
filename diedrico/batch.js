'use strict';
(function(root){
  const G=typeof module!=='undefined'&&module.exports?require('./geometry.js'):root.Geo;
  const BG=typeof module!=='undefined'&&module.exports?require('./batch-geometry.js'):root.BatchGeometry;
  const groups=['planes','lines','solids'],solids=['box','prism','pyramid','cylinder','cone'];
  const colors=['#327d69','#b47b30','#4c769b','#955d87','#687c43','#a65348'];
  const names={plane:'Plano',line:'Segmento',box:'Ortoedro',prism:'Prisma',pyramid:'Pirámide',cylinder:'Cilindro',cone:'Cono'};
  const copy=value=>JSON.parse(JSON.stringify(value));
  function validate(settings){
    if(!Number.isInteger(settings?.quantity)||settings.quantity<1||settings.quantity>100)throw Error('Elige entre 1 y 100 láminas.');
    for(const key of ['total',...groups]){
      const range=settings[key],minimum=key==='total'?1:0;
      if(!Array.isArray(range)||range.length!==2||range.some(n=>!Number.isInteger(n)||n<minimum||n>120)||range[0]>range[1])throw Error('Revisa los rangos: usa enteros de 0 a 120, mínimo ≤ máximo y al menos 1 elemento en total.');
    }
    const min=Math.max(settings.connected?2:1,settings.total[0],groups.reduce((sum,key)=>sum+settings[key][0],0));
    const max=Math.min(settings.total[1],groups.reduce((sum,key)=>sum+settings[key][1],0));
    if(min>max)throw Error(settings.connected&&max<2?'Para conectar los elementos hacen falta al menos 2 por lámina.':'Los rangos de planos, rectas y sólidos no permiten alcanzar el total de elementos.');
    return {min,max};
  }
  function counts(settings,random=Math.random){
    const {min,max}=validate(settings),integer=(lo,hi)=>lo+Math.floor(random()*(hi-lo+1));
    let remaining=integer(min,max);const result={total:remaining};
    // Each choice leaves a feasible interval for all categories still to be drawn.
    const order=[...groups];for(let i=order.length-1;i>0;i--){const j=integer(0,i);[order[i],order[j]]=[order[j],order[i]];}
    order.forEach((key,i)=>{
      const rest=order.slice(i+1),lo=Math.max(settings[key][0],remaining-rest.reduce((sum,k)=>sum+settings[k][1],0)),hi=Math.min(settings[key][1],remaining-rest.reduce((sum,k)=>sum+settings[k][0],0));
      result[key]=integer(lo,hi);remaining-=result[key];
    });
    return result;
  }
  function create(source,settings,index=1,random=Math.random,translate=s=>s){
    const chosen=counts(settings,random),integer=(lo,hi)=>lo+Math.floor(random()*(hi-lo+1)),pick=items=>items[integer(0,items.length-1)];
    const visible=source.entities.filter(e=>e.visible),templates={planes:visible.filter(e=>G.planar(e)),lines:visible.filter(e=>e.type==='line'),solids:visible.filter(e=>solids.includes(e.type))};
    const entities=[],sequence={};
    for(const key of groups)for(let i=0;i<chosen[key];i++){
      const template=templates[key].length?pick(templates[key]):null,type=template?.type||(key==='planes'?'plane':key==='lines'?'line':pick(solids));
      sequence[type]=(sequence[type]||0)+1;
      const e=template?copy(template):{type,color:colors[entities.length%colors.length],size:key==='planes'?[80,60,1]:key==='lines'?[80,1,1]:[40,40,50],sides:integer(3,8)};
      Object.assign(e,{id:`batch-${index}-${entities.length}-${integer(0,0xffffffff).toString(36)}`,name:translate(names[type]||{circle:'Circunferencia',polygon:'Polígono'}[type])+' '+sequence[type],position:[integer(-55,55),integer(-45,45),integer(15,85)],rotation:[integer(-70,70),integer(-70,70),integer(-180,180)],visible:true,locked:false});
      delete e.infiniteLine;
      if((settings.infiniteLines||settings.prepareInfinite)&&e.type==='line')for(let attempt=0;attempt<24&&!BG.readableLine(e,settings.views||['front','top','right']);attempt++)e.rotation=e.rotation.map((angle,j)=>angle+[11.173,23.417,37.129][j]);
      entities.push(e);
    }
    let geometry=settings.connected?BG.connect(entities,random,settings.infiniteLines||settings.prepareInfinite?settings.views||['front','top','right']:[]):entities;
    if(settings.infiniteLines)geometry=BG.extendLines(geometry,settings.views);
    const suffix=' · '+String(index).padStart(3,'0'),document=G.validate({format:'diedrico-web',version:1,name:String(source.name).slice(0,100-suffix.length)+suffix,entities:geometry,grid:source.grid});
    return {document,counts:chosen};
  }
  // ZIP (stored entries, UTF-8 names): a single download, including when used offline.
  const crcTable=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
  function crc32(data){let crc=0xffffffff;for(const byte of data)crc=crcTable[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;}
  function zip(files){
    const encoder=new TextEncoder(),parts=[],directory=[];let offset=0,centralSize=0;
    for(const file of files){
      const name=encoder.encode(file.name),data=file.data===undefined?encoder.encode(file.text):file.data instanceof Uint8Array?file.data:new Uint8Array(file.data),crc=crc32(data),local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);
      lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,0x21,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,name.length,true);local.set(name,30);
      const central=new Uint8Array(46+name.length),cv=new DataView(central.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,0x21,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.set(name,46);
      parts.push(local,data);directory.push(central);offset+=local.length+data.length;centralSize+=central.length;
    }
    const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
    return new Blob([...parts,...directory,end],{type:'application/zip'});
  }
  const api={validate,counts,create,zip};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Batch=api;
})(globalThis);
