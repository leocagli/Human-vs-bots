#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/workspaces/Human-vs-bots/demo/civ-lite"
PORT="${1:-4173}"

cd "$ROOT_DIR"

if command -v python3 >/dev/null 2>&1; then
  echo "Serving CIV Lite on http://127.0.0.1:${PORT}"
  exec python3 -m http.server "$PORT" --bind 0.0.0.0
fi

if command -v node >/dev/null 2>&1; then
  echo "Serving CIV Lite on http://127.0.0.1:${PORT}"
  exec node -e 'const http=require("http"),fs=require("fs"),path=require("path");const root=process.cwd();const port=Number(process.argv[1]);const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml"};http.createServer((req,res)=>{let url=(req.url||"/").split("?")[0];if(url==="/"||url==="")url="/index.html";const filePath=path.join(root,path.normalize(url));if(filePath.startsWith(root)===false){res.writeHead(403);return res.end("Forbidden");}fs.readFile(filePath,(err,data)=>{if(err){res.writeHead(404);return res.end("Not found");}res.writeHead(200,{"Content-Type":mime[path.extname(filePath)]||"application/octet-stream"});res.end(data);});}).listen(port,"0.0.0.0",()=>console.log(`CIV Lite server on http://127.0.0.1:${port}`));' "$PORT"
fi

echo "Error: no se encontró python3 ni node para servir la demo." >&2
exit 1
