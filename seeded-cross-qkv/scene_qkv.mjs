// Native WebGL points volume with optional Three.js renderer. Both display the same
// derived buffers. Three.js is CDN-loaded; native WebGL continues offline.
import {pointBuffers as makePointBuffers} from './data.mjs';
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const VS=`attribute vec3 aPosition;attribute vec3 aColor;uniform mat4 uMvp;uniform float uSize;varying vec3 vColor;void main(){gl_Position=uMvp*vec4(aPosition,1.0);gl_PointSize=uSize;vColor=aColor;}`;
const FS=`precision mediump float;varying vec3 vColor;void main(){vec2 p=gl_PointCoord-0.5;float d=length(p);if(d>0.48)discard;float a=0.87*(1.0-smoothstep(0.23,0.48,d));gl_FragColor=vec4(vColor,a);}`;
function matPerspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
function matLook(eye){const norm=v=>{const m=Math.hypot(...v)||1;return v.map(x=>x/m)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];const z=norm(eye),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function mmul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let sum=0;for(let k=0;k<4;k++)sum+=a[k*4+r]*b[c*4+k];o[c*4+r]=sum;}return o;}
function shader(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
export class VolumeScene {
 constructor(host,onPick){this.host=host;this.onPick=onPick;this.yaw=0.68;this.pitch=0.40;this.distance=11.9;this.spin=true;this.engine='';this.buffer=null;this.three=null;this.active=null;this.frame=0;this.destroyed=false;this.mouseDown=null;this.installControls();this.nativeInit();this.tick();this.tryThree();}
 nativeInit(){
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Native WebGL 3D head volume');this.host.appendChild(canvas);this.nativeCanvas=canvas;
  let gl;try{gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});}catch{}
  if(!gl){this.engine='2D canvas fallback';this.fallback=canvas.getContext('2d');this.onRenderer?.(this.engine);return;}
  try{
   const program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,VS));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   const pos=gl.getAttribLocation(program,'aPosition'),clr=gl.getAttribLocation(program,'aColor');this.native={gl,program,pos,clr,locMvp:gl.getUniformLocation(program,'uMvp'),locSize:gl.getUniformLocation(program,'uSize'),p:gl.createBuffer(),c:gl.createBuffer()};this.engine='Native WebGL 3D';
  }catch(e){this.engine='2D canvas fallback';this.native=null;this.fallback=canvas.getContext('2d');}
  this.onRenderer?.(this.engine);
 }
 async tryThree(){
  // The 3D page works without any network through the native renderer.
  try{
   const T=await import(THREE_URL);if(this.destroyed)return;
   const renderer=new T.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x060e17);
   const scene=new T.Scene();const camera=new T.PerspectiveCamera(45,1,0.1,80);
   const axisGeometry=new T.BufferGeometry();let ln=[];const hx=3.25,hy=2.3,hz=1.8;
   const V=[[ -hx,-hy,-hz],[hx,-hy,-hz],[hx,hy,-hz],[-hx,hy,-hz],[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]];
   for(const [a,b]of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])ln.push(...V[a],...V[b]);
   axisGeometry.setAttribute('position',new T.Float32BufferAttribute(ln,3));scene.add(new T.LineSegments(axisGeometry,new T.LineBasicMaterial({color:0x235f63,transparent:true,opacity:.48})));
   const volume={T,renderer,scene,camera,points:null};this.three=volume;
   if(this.buffer)this.createThreePoints();
   this.host.appendChild(renderer.domElement);this.nativeCanvas.style.display='none';this.engine='Three.js WebGL 3D';this.onRenderer?.(this.engine);
  }catch(e){this.importFailure=String(e?.message||e);}
 }
 createThreePoints(){if(!this.three||!this.buffer)return;const {T,scene}=this.three;
  if(this.three.points){scene.remove(this.three.points);this.three.points.geometry.dispose();this.three.points.material.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(this.buffer.positions,3));geo.setAttribute('color',new T.BufferAttribute(this.buffer.colors,3));
  const mat=new T.PointsMaterial({size:0.065,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:0.92,depthWrite:false,blending:T.AdditiveBlending});const points=new T.Points(geo,mat);scene.add(points);this.three.points=points;
 }
 setData(state,head){this.buffer=makePointBuffers(state,head);this.state=state;this.head=head;if(this.native){const {gl,p,c}=this.native;gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,this.buffer.positions,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,c);gl.bufferData(gl.ARRAY_BUFFER,this.buffer.colors,gl.STATIC_DRAW);}this.createThreePoints();}
 setView(yaw,pitch,dist){this.yaw=yaw;this.pitch=Math.max(-1.3,Math.min(1.3,pitch));this.distance=Math.max(5.4,Math.min(25,dist));}
 installControls(){
  this.host.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.mouseDown={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};this.spin=false;this.host.setPointerCapture(e.pointerId);});
  this.host.addEventListener('pointermove',e=>{const m=this.mouseDown;if(!m)return;const dx=e.clientX-m.x,dy=e.clientY-m.y;if(Math.hypot(e.clientX-m.startX,e.clientY-m.startY)>5)m.moved=true;this.yaw+=dx*.009;this.pitch=Math.max(-1.3,Math.min(1.3,this.pitch+dy*.009));m.x=e.clientX;m.y=e.clientY;});
  this.host.addEventListener('pointerup',e=>{const m=this.mouseDown;this.mouseDown=null;if(m&&!m.moved)this.pick(e.clientX,e.clientY);});
  this.host.addEventListener('pointercancel',()=>this.mouseDown=null);
  this.host.addEventListener('wheel',e=>{e.preventDefault();this.distance=Math.max(5.4,Math.min(25,this.distance+e.deltaY*.009));},{passive:false});
 }
 matrix(w,h){const cp=Math.cos(this.pitch),eye=[this.distance*cp*Math.sin(this.yaw),this.distance*Math.sin(this.pitch),this.distance*cp*Math.cos(this.yaw)];return {eye,mvp:mmul(matPerspective(Math.PI/4,Math.max(1,w)/Math.max(1,h),.1,80),matLook(eye))};}
 pick(clientX,clientY){if(!this.buffer)return;const rect=this.host.getBoundingClientRect(),x=(clientX-rect.left)/rect.width*2-1,y=1-(clientY-rect.top)/rect.height*2;const {mvp}=this.matrix(rect.width,rect.height);let best=-1,dBest=.040* .040,depBest=Infinity;
  for(let i=0;i<this.buffer.count;i++){const p=this.buffer.positions,k=3*i,px=p[k],py=p[k+1],pz=p[k+2];const X=mvp[0]*px+mvp[4]*py+mvp[8]*pz+mvp[12],Y=mvp[1]*px+mvp[5]*py+mvp[9]*pz+mvp[13],Z=mvp[2]*px+mvp[6]*py+mvp[10]*pz+mvp[14],W=mvp[3]*px+mvp[7]*py+mvp[11]*pz+mvp[15];if(W<=0)continue;const dx=X/W-x,dy=Y/W-y,d=dx*dx+dy*dy;if(d<dBest||Math.abs(d-dBest)<1e-7&&Z/W<depBest){best=i;dBest=d;depBest=Z/W;}}
  if(best>=0)this.onPick?.(this.buffer.logicalIndices[best]);
 }
 drawNative(w,h,dpr){if(!this.native||!this.buffer)return;const {gl,program,pos,clr,locMvp,locSize,p,c}=this.native;const cv=this.nativeCanvas;if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}gl.viewport(0,0,cv.width,cv.height);gl.clearColor(.018,.037,.063,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
  gl.useProgram(program);gl.uniformMatrix4fv(locMvp,false,this.matrix(w,h).mvp);gl.uniform1f(locSize,3.6*dpr);gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(pos);gl.bindBuffer(gl.ARRAY_BUFFER,c);gl.vertexAttribPointer(clr,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(clr);gl.drawArrays(gl.POINTS,0,this.buffer.count);
 }
 drawFallback(w,h,dpr){const cv=this.nativeCanvas,ctx=this.fallback;if(!ctx||!this.buffer)return;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#06111a';ctx.fillRect(0,0,w,h);const {mvp}=this.matrix(w,h),{positions,colors,count}=this.buffer;for(let i=0;i<count;i++){const j=i*3,[px,py,pz]=positions.slice(j,j+3);const X=mvp[0]*px+mvp[4]*py+mvp[8]*pz+mvp[12],Y=mvp[1]*px+mvp[5]*py+mvp[9]*pz+mvp[13],W=mvp[3]*px+mvp[7]*py+mvp[11]*pz+mvp[15];if(W<=0)continue;const x=(X/W+1)*w/2,y=(1-Y/W)*h/2;ctx.fillStyle=`rgba(${Math.floor(colors[j]*255)},${Math.floor(colors[j+1]*255)},${Math.floor(colors[j+2]*255)},.70)`;ctx.fillRect(x,y,2,2);}}
 tick(){if(this.destroyed)return;this.frame=requestAnimationFrame(()=>this.tick());if(this.spin)this.yaw+=.0018;const w=this.host.clientWidth,h=this.host.clientHeight;if(w<20||h<20)return;
  if(this.three){const {renderer,camera,scene}=this.three;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=45;camera.updateProjectionMatrix();const cp=Math.cos(this.pitch);camera.position.set(this.distance*cp*Math.sin(this.yaw),this.distance*Math.sin(this.pitch),this.distance*cp*Math.cos(this.yaw));camera.lookAt(0,0,0);renderer.render(scene,camera);}
  else if(this.native)this.drawNative(w,h,Math.min(devicePixelRatio||1,2));else this.drawFallback(w,h,Math.min(devicePixelRatio||1,2));
 }
 destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);this.three?.renderer.dispose();}
}