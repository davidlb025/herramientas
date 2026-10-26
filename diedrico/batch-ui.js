'use strict';
(()=>{
  let running=false,cancelled=false,results=[],archives={},resultFormat='a4',page=0,archiveName='';
  const dialog=$('batch-dialog'),t=I18n.t,downloadIds=['batch-download-svg','batch-download-png','batch-download-json','batch-print'];
  function settings(){return{quantity:$('batch-quantity').valueAsNumber,connected:$('batch-connected').checked,infiniteLines:$('batch-infinite-lines').checked,avoidInteriorVertices:$('batch-outside-vertices').checked,...Object.fromEntries(['total','planes','lines','solids'].map(key=>[key,['min','max'].map(end=>$(`batch-${key}-${end}`).valueAsNumber)]))};}
  function summary(){
    refreshSheetFooter();const options=sheetOptions();
    $('batch-config').textContent=[options.format.toUpperCase(),$('sheet-scale').selectedOptions[0].textContent,options.views.map(key=>t(G.VIEW_NAMES[key])).join(', ')||t('Selecciona al menos una vista.')].join(' · ');
    $('batch-selection-note').hidden=!options.onlySelected;
  }
  function clearResults(){results=[];archives={};$('batch-results').hidden=true;for(const id of downloadIds)$(id).hidden=true;$('batch-preview').replaceChildren();}
  function openBatch(){cancelGesture();if($('sheet-dialog').open)$('sheet-dialog').close();summary();$('batch-error').textContent='';dialog.showModal();}
  $('batch-btn').onclick=openBatch;$('sheet-batch-btn').onclick=openBatch;
  $('batch-settings-btn').onclick=()=>{dialog.close();openSheet();};
  function showPage(){
    $('batch-page').textContent=`${t('Lámina')} ${page+1} / ${results.length}`;
    $('batch-preview').innerHTML=sheetMarkup(results[page].sheet.svg,'batch-preview');$('batch-prev').disabled=page===0;$('batch-next').disabled=page===results.length-1;
  }
  $('batch-prev').onclick=()=>{if(page>0){page--;showPage();}};
  $('batch-next').onclick=()=>{if(page<results.length-1){page++;showPage();}};
  function busy(value){
    running=value;$('batch-fields').disabled=value;$('batch-generate').disabled=value;$('batch-cancel').hidden=!value;$('batch-progress').hidden=!value;for(const id of downloadIds)$(id).disabled=value;dialog.setAttribute('aria-busy',String(value));
  }
  $('batch-cancel').onclick=()=>{cancelled=true;};
  dialog.addEventListener('close',()=>{if(running&&!dialog.open)cancelled=true;});
  dialog.addEventListener('cancel',()=>{if(running)cancelled=true;});
  window.addEventListener('diedrico-language',()=>{if(dialog.open)summary();if(results.length)showPage();});
  $('batch-print').onclick=()=>{if(results.length&&!running)printSheets(results.map(result=>result.sheet.svg),resultFormat);};
  async function png(sheet){
    const image=new Image(),url=URL.createObjectURL(new Blob([sheet.svg],{type:'image/svg+xml;charset=utf-8'}));
    try{
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error(t('No se pudo rasterizar la lámina.')));image.src=url;});
      const canvas=document.createElement('canvas');canvas.width=Math.round(sheet.paper[0]*8);canvas.height=Math.round(sheet.paper[1]*8);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));canvas.width=canvas.height=0;if(!blob)throw Error(t('No se pudo generar la imagen.'));return new Uint8Array(await blob.arrayBuffer());
    }finally{URL.revokeObjectURL(url);}
  }
  async function exportZip(format){
    if(!results.length||running)return;$('batch-error').textContent='';
    if(archives[format]){download(archives[format],archiveName+'-'+format+'.zip');return;}
    cancelled=false;busy(true);$('batch-progress').max=results.length;$('batch-progress').value=0;
    try{
      const files=[];
      for(let i=0;i<results.length;i++){
        $('batch-status').textContent=`${t('Preparando ZIP')} ${format.toUpperCase()} · ${i+1} / ${results.length}`;
        await new Promise(resolve=>setTimeout(resolve,0));if(cancelled)break;
        const result=results[i];
        files.push(format==='png'?{name:result.name+'.png',data:await png(result.sheet)}:format==='svg'?{name:result.name+'.svg',text:result.sheet.svg}:{name:result.name+'.diedrico.json',text:JSON.stringify(result.document,null,2)});
        $('batch-progress').value=i+1;
      }
      if(cancelled){$('batch-status').textContent=t('Descarga cancelada. Las láminas siguen disponibles.');return;}
      archives[format]=Batch.zip(files);download(archives[format],archiveName+'-'+format+'.zip');$('batch-status').textContent=`${t('ZIP descargado:')} ${format.toUpperCase()} · ${results.length} ${t('láminas')}`;
    }catch(error){$('batch-error').textContent=t(error.message);$('batch-status').textContent='';}
    finally{busy(false);}
  }
  for(const format of ['svg','png','json'])$('batch-download-'+format).onclick=()=>exportZip(format);
  $('batch-form').onsubmit=async event=>{
    event.preventDefault();if(running)return;$('batch-error').textContent='';
    let config,options,source;
    try{
      config=settings();Batch.validate(config);summary();options=clone(sheetOptions());source=clone(doc);
      if(!options.views.length)throw Error('Selecciona al menos una vista.');options.onlySelected=false;options.selected=null;
    }catch(error){$('batch-error').textContent=t(error.message);return;}
    clearResults();cancelled=false;busy(true);$('batch-progress').max=config.quantity;$('batch-progress').value=0;$('batch-status').textContent=t('Generando láminas…');
    const pending=[],base=fileName();
    try{
      for(let index=1;index<=config.quantity;index++){
        await new Promise(resolve=>setTimeout(resolve,0));if(cancelled)break;
        const generated=Batch.create(source,{...config,infiniteLines:false,prepareInfinite:config.infiniteLines,views:options.views},index,Math.random,t),original=generated.document.entities;
        if(config.infiniteLines)generated.document=G.validate({...generated.document,entities:BatchGeometry.extendLines(original,options.views)});
        const sheet=Sheet.create(generated.document,{...options,footerTitle:footerTitleCustom?options.footerTitle:generated.document.name});
        if(sheet.error||!sheet.fits)throw Error(`${t('Lámina')} ${index}: ${sheet.error||sheet.warning||t('La lámina no cabe a la escala elegida.')} ${t('Revisa la escala o las dimensiones antes de generar el lote.')}`);
        generated.document=G.validate(sheet.document);
        if(config.avoidInteriorVertices&&!BatchGeometry.verticesOutsidePlanes(generated.document.entities,options.views))throw Error(`${t('Lámina')} ${index}: ${t(BatchGeometry.vertexError)}`);
        pending.push({...generated,sheet,name:base.slice(0,80)+'-'+String(index).padStart(3,'0')});
        $('batch-progress').value=index;$('batch-status').textContent=`${t('Generando láminas…')} ${index} / ${config.quantity}`;
      }
      if(cancelled){$('batch-status').textContent=t('Generación cancelada.');return;}
      results=pending;resultFormat=options.format;archiveName=base+'-laminas';page=0;
      $('batch-results').hidden=false;for(const id of downloadIds)$(id).hidden=false;showPage();
      $('batch-status').textContent=`${t('Láminas generadas:')} ${results.length}. ${t('Elige un formato para descargar.')}`;
    }catch(error){clearResults();$('batch-status').textContent='';$('batch-error').textContent=t(error.message);}
    finally{busy(false);}
  };
})();
