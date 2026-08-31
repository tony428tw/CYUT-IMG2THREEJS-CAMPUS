import {defineConfig} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Development-only artifact sink. Fixed path, same-origin, loopback binding and bounded payload.
export default defineConfig({plugins:[{name:'local-glb-delivery',configureServer(server){
  server.middlewares.use('/__local-delivery/glb',async(req,res)=>{
    if(req.method!=='POST'||req.headers.origin!==`http://${req.headers.host}`||req.headers['content-type']!=='model/gltf-binary'){res.statusCode=403;res.end('Forbidden');return;}
    try{
      const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>50*1024*1024)throw new Error('GLB exceeds 50 MiB');chunks.push(Buffer.from(chunk));}
      const bytes=Buffer.concat(chunks);if(bytes.length<20||bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw new Error('Invalid GLB');
      const dir=fileURLToPath(new URL('./public/models/',import.meta.url));await mkdir(dir,{recursive:true});await writeFile(dir+'chaoyang-clocktower-campus.glb',bytes);
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify({saved:true,bytes:bytes.length,url:'/models/chaoyang-clocktower-campus.glb'}));
    }catch(e){res.statusCode=400;res.end(String(e));}
  });
}}],build:{rollupOptions:{output:{manualChunks:{three:['three'],exporter:['three/addons/exporters/GLTFExporter.js']}}}}});
