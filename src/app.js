const beaches=[['Sandy Hook',40.466,-74.003],['Long Branch',40.304,-73.980],['Asbury Park',40.220,-74.000],['Belmar',40.180,-74.010],['Spring Lake',40.151,-74.026],['Manasquan',40.108,-74.034],["Jenkinson's",40.096,-74.036],['Bay Head',40.071,-74.042],['Mantoloking',40.040,-74.049],['Seaside Heights',39.943,-74.073],['Island Beach SP',39.840,-74.087],['Barnegat Light',39.755,-74.105],['Surf City',39.658,-74.171],['Beach Haven',39.560,-74.244],['Brigantine',39.410,-74.354],['Atlantic City',39.354,-74.425],['Ocean City',39.277,-74.566],['Sea Isle City',39.153,-74.690],['Avalon',39.095,-74.718],['Stone Harbor',39.050,-74.756],['Wildwood',38.988,-74.817]];
let conditions=null,reliefLayer=null,controller=null,loadTimer=null,renderSeq=0,lastKey='';
document.getElementById('app').innerHTML=`<header><div><b>BREAKSTATE <i>NJ</i></b><span>Nearshore Intelligence · V57.3 Fast Seafloor</span></div><em id="status">CONNECTING</em></header><div class="shell"><aside><h3>DESTINATION</h3><select id="beach"><option value="">Choose a beach — map always stays free</option>${beaches.map(b=>`<option>${b[0]}</option>`).join('')}</select><div class="tabs"><button class="active" data-base="topo">TOPO</button><button data-base="off">SEAFLOOR ONLY</button></div><div id="live" class="card">Loading timestamped NOAA observations…</div><h3>DISPLAY</h3><label class="check"><input id="reliefToggle" type="checkbox" checked> Bathymetric shaded relief</label><h3>MAP BEHAVIOR</h3><p class="small">Pan and zoom immediately. Existing seafloor remains visible while the next terrain image loads. Destinations only move the camera.</p><h3>DATA</h3><p class="small">NOAA/NCEI elevation-tinted terrain. Historical/compiled baseline; not a claim of today's sandbars.</p><div id="source" class="source"></div></aside><main><div id="map"></div><div class="legend"><b>NOAA/NCEI ELEVATION-TINTED SHADED RELIEF</b><div class="gradient"></div><div class="ticks"><span>deep</span><span>offshore</span><span>nearshore</span><span>shore</span></div></div><section id="readout"><div class="loading">Rendering seafloor…</div></section></main></div>`;
const map=L.map('map',{preferCanvas:true,zoomControl:true,minZoom:7,maxZoom:18,worldCopyJump:false,zoomAnimation:true,fadeAnimation:true}).setView([40.071,-74.025],14);
const base=L.tileLayer('/api/tile/{z}/{y}/{x}',{maxZoom:16,keepBuffer:5,updateWhenIdle:false,updateWhenZooming:false,attribution:'USGS The National Map'}).addTo(map);
const statusEl=document.getElementById('status'),sourceEl=document.getElementById('source'),readoutEl=document.getElementById('readout'),liveEl=document.getElementById('live');
function paddedBounds(){const b=map.getBounds(),dy=(b.getNorth()-b.getSouth())*.22,dx=(b.getEast()-b.getWest())*.22;return {north:b.getNorth()+dy,south:b.getSouth()-dy,west:b.getWest()-dx,east:b.getEast()+dx}}
function renderKey(b,w,h){return [b.north,b.south,b.west,b.east].map(v=>(Math.round(v*1000)/1000).toFixed(3)).join(':')+`:${w}x${h}`}
async function loadRelief(){
 if(map.getZoom()<10){statusEl.textContent='ZOOM IN FOR SEAFLOOR';return}
 const b=paddedBounds();
 if(b.north-b.south>.32||b.east-b.west>.32){statusEl.textContent='ZOOM IN FOR DETAIL';return}
 const size=map.getSize(),scale=window.devicePixelRatio>1?1.15:1;
 const w=Math.min(960,Math.max(512,Math.round(size.x*scale))),h=Math.min(960,Math.max(512,Math.round(size.y*scale))),key=renderKey(b,w,h);
 if(key===lastKey)return;
 if(controller)controller.abort();
 controller=new AbortController();
 const seq=++renderSeq,statusStart=performance.now();
 statusEl.textContent=reliefLayer?'UPDATING SEAFLOOR':'RENDERING SEAFLOOR';
 try{
  const q=new URLSearchParams({north:b.north.toFixed(6),south:b.south.toFixed(6),west:b.west.toFixed(6),east:b.east.toFixed(6),w:String(w),h:String(h)});
  const r=await fetch('/api/relief?'+q,{cache:'force-cache',signal:controller.signal});
  if(!r.ok){let detail='HTTP '+r.status;try{const payload=await r.json();detail=payload.detail||detail}catch{}throw new Error(detail)}
  const blob=await r.blob();
  if(seq!==renderSeq)return;
  const url=URL.createObjectURL(blob);
  const next=L.imageOverlay(url,[[b.south,b.west],[b.north,b.east]],{opacity:.96,interactive:false});
  next.once('load',()=>{
   if(seq!==renderSeq){URL.revokeObjectURL(url);return}
   const old=reliefLayer;reliefLayer=next;reliefLayer._breakstateUrl=url;lastKey=key;
   if(old){map.removeLayer(old);if(old._breakstateUrl)URL.revokeObjectURL(old._breakstateUrl)}
   statusEl.textContent=`SEAFLOOR READY · ${Math.round(performance.now()-statusStart)} ms`;
   sourceEl.innerHTML='<b>NOAA NCEI DEM Global Mosaic</b><span>Elevation tint + multidirectional relief</span><span>Historical/surveyed or compiled baseline · source survey date varies</span>';
   readoutEl.innerHTML='<div><label>SEAFLOOR RENDER</label><strong>ELEVATION-TINTED RELIEF</strong><span>NOAA server-side terrain render; no client point grid.</span></div><div><label>NAVIGATION</label><strong>FREE PAN / ZOOM</strong><span>Previous terrain remains visible during refresh.</span></div><div><label>DEPTH INSPECT</label><strong>CLICK MAP</strong><span>Queries NOAA/NCEI elevation at that coordinate.</span></div>';
  });
  next.addTo(map);
 }catch(err){
  if(err.name==='AbortError')return;
  statusEl.textContent=reliefLayer?'SEAFLOOR UPDATE FAILED':'SEAFLOOR SOURCE ERROR';
  if(!reliefLayer)readoutEl.innerHTML=`<div class="error"><b>SEAFLOOR UNAVAILABLE</b><span>${err.message}. No synthetic substitute rendered.</span></div>`;
 }
}
function scheduleLoad(delay=260){clearTimeout(loadTimer);loadTimer=setTimeout(loadRelief,delay)}
async function inspectDepth(e){const {lat,lng}=e.latlng;try{const r=await fetch(`/api/identify?lat=${lat.toFixed(7)}&lon=${lng.toFixed(7)}`,{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error(d.detail||'sample unavailable');const value=Number.isFinite(d.elevationM)?`${d.elevationM.toFixed(2)} m elevation${d.elevationM<0?` · ${d.depthM.toFixed(2)} m below source zero`:''}`:'No elevation returned';L.popup().setLatLng(e.latlng).setContent(`<b>${value}</b><br>NOAA/NCEI baseline<br>Raster ${d.rasterId??'unresolved'} · survey date unresolved`).openOn(map)}catch(err){L.popup().setLatLng(e.latlng).setContent(`Depth unavailable: ${err.message}`).openOn(map)}}
async function loadLive(){try{const r=await fetch('/api/conditions',{cache:'no-store'});conditions=await r.json();liveEl.innerHTML=conditions.buoys.map(x=>`<div><b>NOAA NDBC ${x.station} · ${x.fresh?'LIVE':'STALE'}</b><strong>${x.waveHeightM!=null?(x.waveHeightM*3.28084).toFixed(1)+' ft':'wave unavailable'}${x.periodS!=null?' @ '+x.periodS+'s':''}</strong><span>${x.waveDir??'—'}° · ${x.ageMinutes??'—'} min old</span></div>`).join('')||'<span>No NDBC observations returned.</span>'}catch{conditions=null;liveEl.innerHTML='<span>Live NOAA observations unavailable.</span>'}}
document.getElementById('beach').onchange=e=>{const b=beaches.find(x=>x[0]===e.target.value);if(b)map.flyTo([b[1],b[2]+.006],15,{duration:.55})};
document.getElementById('reliefToggle').onchange=e=>{if(!reliefLayer)return;e.target.checked?reliefLayer.addTo(map):map.removeLayer(reliefLayer)};
document.querySelectorAll('[data-base]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-base]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');btn.dataset.base==='topo'?base.addTo(map):map.removeLayer(base)});
map.on('movestart zoomstart',()=>clearTimeout(loadTimer));
map.on('moveend zoomend',()=>scheduleLoad(220));
map.on('click',inspectDepth);
loadLive();loadRelief();setInterval(loadLive,180000);
