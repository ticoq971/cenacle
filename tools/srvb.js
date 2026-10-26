/* Serveur de pre-calcul : sert un dossier tel quel et accepte POST /bake/<nom>.bin (usage : node srvb.js <dossier> <port>) */
const http=require('http'),fs=require('fs'),path=require('path');const root=process.argv[2];
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 if(q.method==='POST'&&/^\/bake\/[0-9a-f]+\.bin$/.test(p)){const ch=[];q.on('data',d=>ch.push(d));q.on('end',()=>{const dir=path.join(root,'bake');fs.mkdirSync(dir,{recursive:true});fs.readdirSync(dir).forEach(f=>{if(f.endsWith('.bin'))fs.unlinkSync(path.join(dir,f))});fs.writeFileSync(path.join(root,p),Buffer.concat(ch));r.writeHead(200);r.end('ok')});return}
 fs.readFile(path.join(root,p),(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':T[path.extname(p).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});r.end(d)})}).listen(+process.argv[3]);
