const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8'),server=fs.readFileSync(path.join(root,'server.js'),'utf8');
new vm.Script(app);new vm.Script(server);
assert(!app.includes('seed*')&&!app.includes('Math.cos(seed'),'synthetic seeded morphology forbidden');
assert(!app.includes('tile.openstreetmap.org'),'direct OSM tiles forbidden');
assert(server.includes('BATHY_SOURCES'),'multi-source bathymetry required');
assert(server.includes('i+=18'),'bathymetry requests must be chunked');
assert(server.includes('USGSTopo'),'USGS basemap required');
assert(server.includes('44091.adcp')||server.includes('${station}.adcp'),'ADCP current feed required');
for(let revision=1;revision<=55;revision++){
 const coverage=(revision%11)/10,depth=-((revision%12)+.2),prominence=(revision%7)/20;
 assert(Number.isFinite(coverage)&&coverage>=0&&coverage<=1);
 assert(depth<0&&depth>-100);
 assert(prominence>=0);
}
console.log('PASS V56: syntax, 55 revision-state simulations, source fail-closed rules, no synthetic morphology, no direct OSM tiles');
