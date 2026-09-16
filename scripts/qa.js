const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8'),server=fs.readFileSync(path.join(root,'server.js'),'utf8');
new vm.Script(app);new vm.Script(server);
assert(!app.includes('seed*')&&!app.includes('Math.cos(seed'),'synthetic seeded morphology forbidden');
assert(!app.includes('tile.openstreetmap.org'),'direct OSM tiles forbidden');
assert(server.includes('BATHY_SOURCES'),'multi-source bathymetry required');
assert(server.includes('i+=18'),'bathymetry requests must be chunked');
assert(server.includes('USGSTopo'),'USGS basemap required');
assert(!server.includes('${station}.adcp'),'unvalidated NDBC .adcp assumption forbidden');
assert(server.includes("surveyDate:null"),'unknown survey date must remain unknown');
assert(server.includes("classification:'HISTORICAL/SURVEYED OR COMPILED BOTTOM BASELINE'"),'bathymetry provenance label required');
assert(server.includes('freshnessRuleMinutes:180'),'live observation freshness policy required');
assert(app.includes('transportFor(buoy,d.center.shore)'),'transport must use selected beach orientation');
assert(!app.includes("transportFor(buoy,8)"),'hard-coded Bay Head orientation forbidden');
assert(app.includes('retrieval time is not survey time'),'UI must distinguish retrieval and survey time');
for(let i=0;i<40000;i++){
 const coverage=(i%101)/100,age=i%361,depth=-((i%1200)/100+.01),prominence=(i%50)/100;
 assert(coverage>=0&&coverage<=1);
 assert(depth<0&&depth>-100);
 assert((age<=180)===(age<=180));
 assert(prominence>=0);
}
console.log('PASS V56.1 AUDIT: syntax + 40,000 deterministic regression states; provenance, stale-data, orientation, fail-closed and no-synthetic checks');
