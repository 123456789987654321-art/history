import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export type Params={width:number;height:number;depth:number;leg:number};
export class Viewer{
 renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,.1,100);controls:OrbitControls;
 root=new THREE.Group();ears=new THREE.Group();belly=new THREE.Group();feet=new THREE.Group();photo?:THREE.Texture;plate?:THREE.Mesh;exploded=false;face='front';scale=1;x=0;y=0;inferred=true;params:Params={width:2.6,height:1.8,depth:1.8,leg:1.2};
 constructor(private host:HTMLElement,onHotspot:(name:string)=>void,onOrbit:()=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor('#102a28');this.renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(this.renderer.domElement);this.camera.position.set(6,4.2,8);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,.3,0);this.controls.enableDamping=true;this.controls.minDistance=4;this.controls.maxDistance=14;this.controls.maxPolarAngle=Math.PI*.85;this.controls.addEventListener('end',onOrbit);
  this.scene.add(new THREE.HemisphereLight(0xfff2d8,0x234640,3));const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(4,7,5);this.scene.add(light);this.scene.add(this.root);this.root.add(this.ears,this.belly,this.feet);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(3.4,80),new THREE.MeshStandardMaterial({color:0x173b35,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-3.4;this.scene.add(floor);
  const grid=new THREE.GridHelper(7,20,0x3c6155,0x20483f);grid.position.y=-3.39;this.scene.add(grid);this.build();
  let down={x:0,y:0};this.renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});this.renderer.domElement.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=host.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hit=ray.intersectObjects(this.root.children,true)[0];if(hit){let object:THREE.Object3D|null=hit.object;while(object && !object.userData.part)object=object.parent;if(object)onHotspot(object.userData.part);}});
  new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}).observe(host);
  this.renderer.setAnimationLoop(()=>{this.controls.update();this.ears.position.y=THREE.MathUtils.lerp(this.ears.position.y,this.exploded?1.1:0,.1);this.feet.position.y=THREE.MathUtils.lerp(this.feet.position.y,this.exploded?-.7:0,.1);this.renderer.render(this.scene,this.camera);});
 }
 build(){for(const group of [this.ears,this.belly,this.feet]){group.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.LineSegments){obj.geometry.dispose();const ms=Array.isArray(obj.material)?obj.material:[obj.material];ms.forEach(m=>m.dispose());}});group.clear();}this.ears.userData.part='鼎耳';this.belly.userData.part='鼎腹';this.feet.userData.part='鼎足';const {width:w,height:h,depth:d,leg:l}=this.params;
  const material=new THREE.MeshStandardMaterial({color:0x7c9278,metalness:.45,roughness:.68,transparent:!this.inferred,opacity:this.inferred?1:.12});
  const box=(group:THREE.Group,a:number,b:number,c:number,x:number,y:number,z:number)=>{const geo=new THREE.BoxGeometry(a,b,c);const mesh=new THREE.Mesh(geo,material.clone());mesh.position.set(x,y,z);group.add(mesh);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0xc6b888,transparent:true,opacity:this.inferred?.34:.12}));edge.position.copy(mesh.position);group.add(edge);};
  box(this.belly,w,h,.12,0,0,d/2);box(this.belly,w,h,.12,0,0,-d/2);box(this.belly,.12,h,d,-w/2,0,0);box(this.belly,.12,h,d,w/2,0,0);box(this.belly,w,.12,d,0,-h/2,0);
  for(const side of [-1,1]){const x=side*(w/2-.35);box(this.ears,.15,.68,.2,x-.23,h/2+.34,0);box(this.ears,.15,.68,.2,x+.23,h/2+.34,0);box(this.ears,.61,.15,.2,x,h/2+.68,0);}
  for(const x of [-1,1])for(const z of [-1,1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.17,.13,l,12),material.clone());leg.position.set(x*(w/2-.28),-h/2-l/2,z*(d/2-.28));this.feet.add(leg);}
  material.dispose();this.updatePlate();
 }
 setPhoto(canvas:HTMLCanvasElement){this.photo?.dispose();this.photo=new THREE.CanvasTexture(canvas);this.photo.colorSpace=THREE.SRGBColorSpace;this.photo.wrapS=this.photo.wrapT=THREE.ClampToEdgeWrapping;this.updatePlate();}
 updatePlate(){if(this.plate){this.belly.remove(this.plate);this.plate.geometry.dispose();(this.plate.material as THREE.Material).dispose();this.plate=undefined;}if(!this.photo)return;const {width:w,height:h,depth:d}=this.params;this.photo.repeat.set(1/this.scale,1/this.scale);this.photo.offset.set((1-1/this.scale)/2+this.x,(1-1/this.scale)/2+this.y);const side=this.face==='left'||this.face==='right';this.plate=new THREE.Mesh(new THREE.PlaneGeometry(side?d:w,h),new THREE.MeshBasicMaterial({map:this.photo,side:THREE.FrontSide}));const p=this.plate;
  if(this.face==='front')p.position.z=d/2+.066;if(this.face==='back'){p.position.z=-d/2-.066;p.rotation.y=Math.PI;}if(this.face==='left'){p.position.x=-w/2-.066;p.rotation.y=-Math.PI/2;}if(this.face==='right'){p.position.x=w/2+.066;p.rotation.y=Math.PI/2;}this.belly.add(p);
 }
 reset(){this.camera.position.set(6,4.2,8);this.controls.target.set(0,.3,0);this.controls.update();}
 snapshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement;}
}
