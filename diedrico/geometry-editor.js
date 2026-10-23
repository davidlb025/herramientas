'use strict';
(function(){
  const tr=s=>I18n.t(s);let editing=null,part='vertex',index=0,drag=null,lastSelection=null;
  const active=()=>{const e=selected();return e&&e.id===editing&&!e.locked&&e.visible?e:null;};
  function message(s=''){$('shape-error').textContent=tr(s);$('shape-error').hidden=!s;}
  function replace(next){G.validate({...doc,entities:doc.entities.map(e=>e.id===next.id?next:e)});mutate(()=>{doc.entities=doc.entities.map(e=>e.id===next.id?next:e);});}
  function action(fn){cancel();const e=editable();if(!e)return;try{message();replace(fn(e));}catch(err){message(err.message);}}
  function stop(){cancel();editing=null;refreshEditor(selected());schedule();}
  function start(type){const e=editable();if(!e||e.type!==type)return;if(!e.visible){toast('Muestra el elemento antes de editarlo.');return;}if(editing===e.id){stop();return;}setMode('orbit');editing=e.id;index=0;part='vertex';camera(G.elementCamera(e,'vm'),`VM · ${e.name}`,true);refreshEditor(e);message();}
  function refreshEditor(e){
    if(e?.id!==lastSelection){message();index=0;lastSelection=e?.id;}
    if(!e||e.id!==editing||e.locked||!e.visible)editing=null;
    $('line-editor').hidden=e?.type!=='line';$('plane-editor').hidden=e?.type!=='plane';
    const live=!!active();canvas.classList.toggle('editing-shape',live);$('shape-edit-hint').hidden=!live;
    $('shape-edit-hint').textContent=tr(e?.type==='line'?'Arrastra A o B · Escape termina':'Arrastra vértices o aristas · Escape termina');
    $('line-edit-toggle').innerHTML=icon('move')+tr(live&&e?.type==='line'?'Terminar edición':'Arrastrar extremos');$('line-edit-toggle').setAttribute('aria-pressed',String(live&&e?.type==='line'));
    $('outline-toggle').innerHTML=icon('polygon')+tr(live&&e?.type==='plane'?'Terminar edición':'Editar aristas');$('outline-toggle').setAttribute('aria-pressed',String(live&&e?.type==='plane'));$('outline-controls').hidden=!(live&&e?.type==='plane');
    for(const el of document.querySelectorAll('.shape-editor input,.shape-editor select,.shape-editor button'))el.disabled=!e||e.locked;
    if(e?.type==='line')$('line-length').value=round(e.size[0],6);
    if(e?.type==='plane'){
      const points=G.planeOutline(e),n=points.length;index=Math.max(0,Math.min(index,n-1));$('outline-count').textContent=`${n} / 64`;
      $('outline-part').value=part;$('outline-index').innerHTML=points.map((_,i)=>`<option value="${i}">${part==='vertex'?'V'+(i+1):`${i+1} → ${(i+1)%n+1}`}</option>`).join('');$('outline-index').value=index;
      const p=part==='vertex'?points[index]:G.lerp(points[index],points[(index+1)%n],.5);$('outline-u').value=round(p[0],6);$('outline-v').value=round(p[1],6);
      $('outline-position-title').textContent=tr(part==='vertex'?'Posición del vértice':'Centro de arista');$('outline-delete').innerHTML=icon('trash')+tr(part==='vertex'?'Eliminar vértice':'Eliminar arista');$('outline-delete').disabled=e.locked||n<=3;$('outline-split').disabled=e.locked||n>=64;
    }
  }
  $('line-length-form').onsubmit=ev=>{ev.preventDefault();const value=$('line-length').value;action(e=>G.resizeLine(e,value.trim()===''?NaN:Number(value),$('line-anchor').value));};
  $('line-half').onclick=()=>action(e=>G.resizeLine(e,e.size[0]/2,$('line-anchor').value));$('line-double').onclick=()=>action(e=>G.resizeLine(e,e.size[0]*2,$('line-anchor').value));
  $('line-edit-toggle').onclick=()=>start('line');$('outline-toggle').onclick=()=>start('plane');
  $('outline-part').onchange=()=>{part=$('outline-part').value;message();refreshEditor(selected());schedule();};$('outline-index').onchange=()=>{index=Number($('outline-index').value);message();refreshEditor(selected());schedule();};
  $('outline-position-form').onsubmit=ev=>{ev.preventDefault();const target=[$('outline-u'),$('outline-v')].map(el=>el.value.trim()===''?NaN:Number(el.value));action(e=>{const points=G.planeOutline(e),p=part==='vertex'?points[index]:G.lerp(points[index],points[(index+1)%points.length],.5);return G.editPlane(e,part,index,G.sub(target,p));});};
  $('outline-split').onclick=()=>{const previous=index;action(e=>{const next=G.editPlane(e,'split',index);index=previous+1;part='vertex';return next;});};
  function deletePart(){action(e=>G.editPlane(e,part==='vertex'?'delete':'collapse',index));}
  $('outline-delete').onclick=deletePart;$('outline-vm').onclick=()=>{const e=active();if(e)camera(G.elementCamera(e,'vm'),`VM · ${e.name}`,true);};
  function handles(e){const p=G.mesh(e).vertices.map(toScreen);return e.type==='line'?p.map((q,i)=>({p:q,kind:'end',index:i})):p.map((q,i)=>({p:q,kind:'vertex',index:i})).concat(p.map((q,i)=>({p:G.lerp(q,p[(i+1)%p.length],.5),kind:'edge',index:i})));}
  function draw(){const e=active();if(!e)return;const hs=handles(e);ctx.save();ctx.setLineDash([]);
    if(e.type==='plane'&&part==='edge'){const vs=G.mesh(e).vertices;strokeWorld(vs[index],vs[(index+1)%vs.length],'#163f35',3);}
    for(const h of hs){const q=h.p,chosen=h.kind===part&&h.index===index;ctx.beginPath();if(h.kind==='edge')ctx.rect(q[0]-4,q[1]-4,8,8);else ctx.arc(q[0],q[1],chosen?7:6,0,Math.PI*2);ctx.fillStyle=chosen?'#163f35':'#fff';ctx.fill();ctx.strokeStyle='#163f35';ctx.lineWidth=2;ctx.stroke();if(h.kind!=='edge'){ctx.font='600 12px Segoe UI';const label=e.type==='line'?'AB'[h.index]:'V'+(h.index+1);ctx.lineWidth=4;ctx.strokeStyle='#edf1ea';ctx.strokeText(label,q[0]+10,q[1]-10);ctx.fillStyle='#163f35';ctx.fillText(label,q[0]+10,q[1]-10);}}
    ctx.restore();
  }
  function swallow(ev){ev.preventDefault();ev.stopImmediatePropagation();}
  canvas.addEventListener('pointerdown',ev=>{
    if(drag&&ev.pointerId!==drag.pointer){swallow(ev);cancel();return;}
    const e=active();if(!e||ev.button!==0||ev.shiftKey||ev.altKey)return;const p=pointerPos(ev),hs=handles(e);let hit=hs.find(h=>h.kind!=='edge'&&Math.hypot(p[0]-h.p[0],p[1]-h.p[1])<13)||hs.find(h=>Math.hypot(p[0]-h.p[0],p[1]-h.p[1])<13);
    if(!hit&&e.type==='plane'){const ps=G.mesh(e).vertices.map(toScreen),i=ps.findIndex((q,i)=>segmentDistance(p,q,ps[(i+1)%ps.length])<8);if(i>=0)hit={kind:'edge',index:i};}
    if(!hit)return;swallow(ev);canvas.focus({preventScroll:true});message();
    if(e.type==='plane'){part=hit.kind;index=hit.index;refreshEditor(e);if(!G.planeScreenDelta(e,view.basis,[0,0],view.scale)){message('El plano está de canto. Pulsa Ver contorno en VM para editarlo.');schedule();return;}}
    else{const u=G.rotate([1,0,0],e.rotation);if(Math.hypot(G.dot(u,view.basis.right),G.dot(u,view.basis.up))<.1){message('La recta está de punta. Usa VM para editar sus extremos.');return;}}
    drag={pointer:ev.pointerId,start:p,original:clone(e),before:snapshot(),kind:hit.kind,index:hit.index,basis:clone(view.basis),scale:view.scale};canvas.setPointerCapture(ev.pointerId);schedule();
  },true);
  canvas.addEventListener('pointermove',ev=>{
    if(!drag||ev.pointerId!==drag.pointer)return;swallow(ev);const d=drag,e=d.original,delta=G.sub(pointerPos(ev),d.start);try{let next;
      if(e.type==='plane'){let movement=G.planeScreenDelta(e,d.basis,delta,d.scale);if(display.snap||ev.ctrlKey)movement=movement.map(v=>Math.round(v/doc.grid)*doc.grid);next=G.editPlane(e,d.kind,d.index,movement);}
      else{const u=G.rotate([1,0,0],e.rotation),q=[G.dot(u,d.basis.right),-G.dot(u,d.basis.up)],movement=G.dot(delta,q)/(d.scale*G.dot(q,q));let value=e.size[0]+(d.index===1?movement:-movement);if(display.snap||ev.ctrlKey)value=Math.round(value/doc.grid)*doc.grid;next=G.resizeLine(e,value,d.index===0?'b':'a');}
      G.validate({...doc,entities:doc.entities.map(x=>x.id===e.id?next:x)});doc.entities=doc.entities.map(x=>x.id===e.id?next:x);message();invalidate();refreshEditor(next);
    }catch(err){message(err.message);}
  },true);
  function finish(ev,cancelled=false){if(!drag||ev.pointerId!==drag.pointer)return;swallow(ev);const d=drag;drag=null;if(canvas.hasPointerCapture(d.pointer))canvas.releasePointerCapture(d.pointer);if(cancelled){doc=JSON.parse(d.before);invalidate();refresh();message('Edición cancelada.');}else commit(d.before);}
  canvas.addEventListener('pointerup',ev=>finish(ev),true);canvas.addEventListener('pointercancel',ev=>finish(ev,true),true);
  canvas.addEventListener('lostpointercapture',ev=>{if(drag&&ev.pointerId===drag.pointer){cancel();refresh();}},true);
  canvas.addEventListener('wheel',ev=>{if(drag)swallow(ev);},{capture:true,passive:false});
  function cancel(){if(!drag)return;const d=drag;drag=null;doc=JSON.parse(d.before);if(canvas.hasPointerCapture(d.pointer))canvas.releasePointerCapture(d.pointer);invalidate();refresh();}
  window.addEventListener('blur',cancel);
  window.addEventListener('keydown',ev=>{if(!active()||/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)||document.querySelector('dialog[open]'))return;if(ev.key==='Escape'){swallow(ev);if(drag){cancel();refresh();}else stop();}else if((ev.key==='Delete'||ev.key==='Backspace')&&selected().type==='plane'){swallow(ev);deletePart();}},true);
  window.GeometryEditor={refresh:refreshEditor,draw,active,cancel,stop};refreshEditor(selected());
})();
