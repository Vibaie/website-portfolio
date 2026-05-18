/* LiquidEther.js - Vanilla JS fluid simulation. Requires THREE.js global. */
(function (G) {
  'use strict';
  if (!G.THREE) { console.error('LiquidEther: THREE must be loaded first'); return; }
  var T = G.THREE;

  function makePalette(stops) {
    var arr = (Array.isArray(stops) && stops.length) ? (stops.length===1?[stops[0],stops[0]]:stops) : ['#fff','#fff'];
    var w=arr.length, data=new Uint8Array(w*4);
    for(var i=0;i<w;i++){var c=new T.Color(arr[i]);data[i*4]=Math.round(c.r*255);data[i*4+1]=Math.round(c.g*255);data[i*4+2]=Math.round(c.b*255);data[i*4+3]=255;}
    var tx=new T.DataTexture(data,w,1,T.RGBAFormat);
    tx.magFilter=T.LinearFilter;tx.minFilter=T.LinearFilter;tx.wrapS=T.ClampToEdgeWrapping;tx.wrapT=T.ClampToEdgeWrapping;tx.generateMipmaps=false;tx.needsUpdate=true;
    return tx;
  }

  var fv=`attribute vec3 position;uniform vec2 px;uniform vec2 boundarySpace;varying vec2 uv;precision highp float;
void main(){vec3 pos=position;vec2 scale=1.0-boundarySpace*2.0;pos.xy=pos.xy*scale;uv=vec2(0.5)+(pos.xy)*0.5;gl_Position=vec4(pos,1.0);}`;
  var lv=`attribute vec3 position;uniform vec2 px;precision highp float;varying vec2 uv;
void main(){vec3 pos=position;uv=0.5+pos.xy*0.5;vec2 n=sign(pos.xy);pos.xy=abs(pos.xy)-px*1.0;pos.xy*=n;gl_Position=vec4(pos,1.0);}`;
  var mv=`precision highp float;attribute vec3 position;attribute vec2 uv;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;
void main(){vec2 pos=position.xy*scale*2.0*px+center;vUv=uv;gl_Position=vec4(pos,0.0,1.0);}`;
  var af=`precision highp float;uniform sampler2D velocity;uniform float dt;uniform bool isBFECC;uniform vec2 fboSize;uniform vec2 px;varying vec2 uv;
void main(){vec2 ratio=max(fboSize.x,fboSize.y)/fboSize;
if(isBFECC==false){vec2 vel=texture2D(velocity,uv).xy;vec2 uv2=uv-vel*dt*ratio;gl_FragColor=vec4(texture2D(velocity,uv2).xy,0.0,0.0);}
else{vec2 sn=uv;vec2 vo=texture2D(velocity,uv).xy;vec2 so=sn-vo*dt*ratio;vec2 vn1=texture2D(velocity,so).xy;vec2 sn2=so+vn1*dt*ratio;vec2 err=sn2-sn;vec2 sn3=sn-err/2.0;vec2 v2=texture2D(velocity,sn3).xy;vec2 so2=sn3-v2*dt*ratio;gl_FragColor=vec4(texture2D(velocity,so2).xy,0.0,0.0);}}`;
  var cf=`precision highp float;uniform sampler2D velocity;uniform sampler2D palette;uniform vec4 bgColor;varying vec2 uv;
void main(){vec2 vel=texture2D(velocity,uv).xy;float lv=clamp(length(vel),0.0,1.0);vec3 c=texture2D(palette,vec2(lv,0.5)).rgb;
vec3 rgb=mix(bgColor.rgb,c,lv);float a=mix(bgColor.a,1.0,lv);gl_FragColor=vec4(rgb,a);}`;
  var df=`precision highp float;uniform sampler2D velocity;uniform float dt;uniform vec2 px;varying vec2 uv;
void main(){float x0=texture2D(velocity,uv-vec2(px.x,0.0)).x;float x1=texture2D(velocity,uv+vec2(px.x,0.0)).x;float y0=texture2D(velocity,uv-vec2(0.0,px.y)).y;float y1=texture2D(velocity,uv+vec2(0.0,px.y)).y;gl_FragColor=vec4((x1-x0+y1-y0)/2.0/dt);}`;
  var ef=`precision highp float;uniform vec2 force;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;
void main(){vec2 c=(vUv-0.5)*2.0;float d=1.0-min(length(c),1.0);d*=d;gl_FragColor=vec4(force*d,0.0,1.0);}`;
  var pof=`precision highp float;uniform sampler2D pressure;uniform sampler2D divergence;uniform vec2 px;varying vec2 uv;
void main(){float p0=texture2D(pressure,uv+vec2(px.x*2.0,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x*2.0,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y*2.0)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y*2.0)).r;float div=texture2D(divergence,uv).r;gl_FragColor=vec4((p0+p1+p2+p3)/4.0-div);}`;
  var prf=`precision highp float;uniform sampler2D pressure;uniform sampler2D velocity;uniform vec2 px;uniform float dt;varying vec2 uv;
void main(){float p0=texture2D(pressure,uv+vec2(px.x,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y)).r;vec2 v=texture2D(velocity,uv).xy;v=v-vec2(p0-p1,p2-p3)*0.5*dt;gl_FragColor=vec4(v,0.0,1.0);}`;
  var vf=`precision highp float;uniform sampler2D velocity;uniform sampler2D velocity_new;uniform float v;uniform vec2 px;uniform float dt;varying vec2 uv;
void main(){vec2 old=texture2D(velocity,uv).xy;vec2 n0=texture2D(velocity_new,uv+vec2(px.x*2.0,0.0)).xy;vec2 n1=texture2D(velocity_new,uv-vec2(px.x*2.0,0.0)).xy;vec2 n2=texture2D(velocity_new,uv+vec2(0.0,px.y*2.0)).xy;vec2 n3=texture2D(velocity_new,uv-vec2(0.0,px.y*2.0)).xy;vec2 nv=4.0*old+v*dt*(n0+n1+n2+n3);nv/=4.0*(1.0+v*dt);gl_FragColor=vec4(nv,0.0,0.0);}`;

  function LiquidEther(container, opts) {
    opts = Object.assign({mouseForce:20,cursorSize:100,isViscous:false,viscous:30,iterationsViscous:32,iterationsPoisson:32,dt:0.014,BFECC:true,resolution:0.5,isBounce:false,colors:['#5227FF','#FF9FFC','#B497CF'],autoDemo:true,autoSpeed:0.5,autoIntensity:2.2,takeoverDuration:0.25,autoResumeDelay:1000,autoRampDuration:0.6}, opts||{});
    var self=this, raf=null, resRaf=null, isVis=true, webgl=null, ro=null, io=null;
    var palTex=makePalette(opts.colors), bgVec=new T.Vector4(0,0,0,0);

    // Common
    var Com={width:0,height:0,aspect:1,pixelRatio:1,container:null,renderer:null,clock:null,time:0,delta:0};
    Com.init=function(c){
      Com.container=c;Com.pixelRatio=Math.min(window.devicePixelRatio||1,2);Com.resize();
      Com.renderer=new T.WebGLRenderer({antialias:true,alpha:true});
      Com.renderer.autoClear=false;Com.renderer.setClearColor(new T.Color(0),0);
      Com.renderer.setPixelRatio(Com.pixelRatio);Com.renderer.setSize(Com.width,Com.height);
      Com.renderer.domElement.style.cssText='width:100%;height:100%;display:block;position:absolute;top:0;left:0;';
      Com.clock=new T.Clock();Com.clock.start();
    };
    Com.resize=function(){if(!Com.container)return;var r=Com.container.getBoundingClientRect();Com.width=Math.max(1,Math.floor(r.width));Com.height=Math.max(1,Math.floor(r.height));Com.aspect=Com.width/Com.height;if(Com.renderer)Com.renderer.setSize(Com.width,Com.height,false);};
    Com.update=function(){Com.delta=Com.clock.getDelta();Com.time+=Com.delta;};

    // Mouse
    var Mou={mouseMoved:false,coords:new T.Vector2(),coords_old:new T.Vector2(),diff:new T.Vector2(),timer:null,container:null,listenerTarget:null,docTarget:null,isHoverInside:false,hasUserControl:false,isAutoActive:false,autoIntensity:2.0,takeoverActive:false,takeoverStartTime:0,takeoverDuration:0.25,takeoverFrom:new T.Vector2(),takeoverTo:new T.Vector2(),onInteract:null};
    Mou._mm=function(e){if(!Mou._inside(e.clientX,e.clientY))return;if(Mou.onInteract)Mou.onInteract();if(Mou.isAutoActive&&!Mou.hasUserControl&&!Mou.takeoverActive){var r=Mou.container.getBoundingClientRect();var nx=(e.clientX-r.left)/r.width,ny=(e.clientY-r.top)/r.height;Mou.takeoverFrom.copy(Mou.coords);Mou.takeoverTo.set(nx*2-1,-(ny*2-1));Mou.takeoverStartTime=performance.now();Mou.takeoverActive=true;Mou.hasUserControl=true;Mou.isAutoActive=false;return;}Mou._set(e.clientX,e.clientY);Mou.hasUserControl=true;};
    Mou._ts=function(e){if(e.touches.length!==1)return;var t=e.touches[0];if(!Mou._inside(t.clientX,t.clientY))return;if(Mou.onInteract)Mou.onInteract();Mou._set(t.clientX,t.clientY);Mou.hasUserControl=true;};
    Mou._tm=function(e){if(e.touches.length!==1)return;var t=e.touches[0];if(!Mou._inside(t.clientX,t.clientY))return;if(Mou.onInteract)Mou.onInteract();Mou._set(t.clientX,t.clientY);};
    Mou._te=function(){Mou.isHoverInside=false;};
    Mou._dl=function(){Mou.isHoverInside=false;};
    Mou._inside=function(x,y){if(!Mou.container)return false;var r=Mou.container.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;};
    Mou._set=function(x,y){if(!Mou.container)return;if(Mou.timer)clearTimeout(Mou.timer);var r=Mou.container.getBoundingClientRect();var nx=(x-r.left)/r.width,ny=(y-r.top)/r.height;Mou.coords.set(nx*2-1,-(ny*2-1));Mou.mouseMoved=true;Mou.timer=setTimeout(function(){Mou.mouseMoved=false;},100);};
    Mou.setNorm=function(nx,ny){Mou.coords.set(nx,ny);Mou.mouseMoved=true;};
    Mou.init=function(c){Mou.container=c;Mou.docTarget=c.ownerDocument;var dv=Mou.docTarget.defaultView||window;Mou.listenerTarget=dv;dv.addEventListener('mousemove',Mou._mm);dv.addEventListener('touchstart',Mou._ts,{passive:true});dv.addEventListener('touchmove',Mou._tm,{passive:true});dv.addEventListener('touchend',Mou._te);Mou.docTarget.addEventListener('mouseleave',Mou._dl);};
    Mou.dispose=function(){if(Mou.listenerTarget){Mou.listenerTarget.removeEventListener('mousemove',Mou._mm);Mou.listenerTarget.removeEventListener('touchstart',Mou._ts);Mou.listenerTarget.removeEventListener('touchmove',Mou._tm);Mou.listenerTarget.removeEventListener('touchend',Mou._te);}if(Mou.docTarget)Mou.docTarget.removeEventListener('mouseleave',Mou._dl);};
    Mou.update=function(){
      if(Mou.takeoverActive){var t=(performance.now()-Mou.takeoverStartTime)/(Mou.takeoverDuration*1000);if(t>=1){Mou.takeoverActive=false;Mou.coords.copy(Mou.takeoverTo);Mou.coords_old.copy(Mou.coords);Mou.diff.set(0,0);}else{var k=t*t*(3-2*t);Mou.coords.copy(Mou.takeoverFrom).lerp(Mou.takeoverTo,k);}}
      Mou.diff.subVectors(Mou.coords,Mou.coords_old);Mou.coords_old.copy(Mou.coords);
      if(Mou.coords_old.x===0&&Mou.coords_old.y===0)Mou.diff.set(0,0);
      if(Mou.isAutoActive&&!Mou.takeoverActive)Mou.diff.multiplyScalar(Mou.autoIntensity);
    };

    // AutoDriver
    var lastInteract=performance.now();
    var AD={enabled:opts.autoDemo,speed:opts.autoSpeed,resumeDelay:opts.autoResumeDelay,rampMs:opts.autoRampDuration*1000,active:false,current:new T.Vector2(0,0),target:new T.Vector2(),lastTime:performance.now(),activationTime:0,margin:0.2,_tmp:new T.Vector2()};
    AD.pickTarget=function(){AD.target.set((Math.random()*2-1)*(1-AD.margin),(Math.random()*2-1)*(1-AD.margin));};
    AD.pickTarget();
    AD.forceStop=function(){AD.active=false;Mou.isAutoActive=false;};
    AD.update=function(){
      if(!AD.enabled)return;
      var now=performance.now();
      if(now-lastInteract<AD.resumeDelay){if(AD.active)AD.forceStop();return;}
      if(Mou.isHoverInside){if(AD.active)AD.forceStop();return;}
      if(!AD.active){AD.active=true;AD.current.copy(Mou.coords);AD.lastTime=now;AD.activationTime=now;}
      Mou.isAutoActive=true;
      var dt2=Math.min((now-AD.lastTime)/1000,0.2);AD.lastTime=now;
      var dir=AD._tmp.subVectors(AD.target,AD.current);var dist=dir.length();
      if(dist<0.01){AD.pickTarget();return;}
      dir.normalize();
      var ramp=AD.rampMs>0?Math.min(1,(now-AD.activationTime)/AD.rampMs):1;ramp=ramp*ramp*(3-2*ramp);
      var move=Math.min(AD.speed*dt2*ramp,dist);
      AD.current.addScaledVector(dir,move);
      Mou.setNorm(AD.current.x,AD.current.y);
    };

    function fboOpts(){
      var ios=/(iPad|iPhone|iPod)/i.test(navigator.userAgent);
      return {type:ios?T.HalfFloatType:T.FloatType,depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter,wrapS:T.ClampToEdgeWrapping,wrapT:T.ClampToEdgeWrapping};
    }

    function ShaderPass(props){
      this.props=props||{};this.uniforms=props.material&&props.material.uniforms;
      this.scene=new T.Scene();this.camera=new T.Camera();this.material=null;this.plane=null;
      if(this.uniforms){this.material=new T.RawShaderMaterial(props.material);var g=new T.PlaneGeometry(2,2);this.plane=new T.Mesh(g,this.material);this.scene.add(this.plane);}
    }
    ShaderPass.prototype.render=function(){Com.renderer.setRenderTarget(this.props.output||null);Com.renderer.render(this.scene,this.camera);Com.renderer.setRenderTarget(null);};

    // FBO size
    var fboSize=new T.Vector2(), cellScale=new T.Vector2(), boundarySpace=new T.Vector2();
    function calcSize(){var w=Math.max(1,Math.round(opts.resolution*Com.width));var h=Math.max(1,Math.round(opts.resolution*Com.height));cellScale.set(1/w,1/h);fboSize.set(w,h);}

    // Init Common + Mouse
    container.style.position=container.style.position||'relative';
    container.style.overflow='hidden';
    Com.init(container);
    Mou.init(container);
    Mou.autoIntensity=opts.autoIntensity;
    Mou.takeoverDuration=opts.takeoverDuration;
    Mou.onInteract=function(){lastInteract=performance.now();AD.forceStop();};
    calcSize();

    var fo=fboOpts();
    function makeFBO(){return new T.WebGLRenderTarget(fboSize.x,fboSize.y,fo);}
    var fbos={vel0:makeFBO(),vel1:makeFBO(),vis0:makeFBO(),vis1:makeFBO(),div:makeFBO(),p0:makeFBO(),p1:makeFBO()};

    // Advection
    var advUni={boundarySpace:{value:cellScale},px:{value:cellScale},fboSize:{value:fboSize},velocity:{value:fbos.vel0.texture},dt:{value:opts.dt},isBFECC:{value:true}};
    var advPass=new ShaderPass({material:{vertexShader:fv,fragmentShader:af,uniforms:advUni},output:fbos.vel1});
    var bndG=new T.BufferGeometry();
    bndG.setAttribute('position',new T.BufferAttribute(new Float32Array([-1,-1,0,-1,1,0,-1,1,0,1,1,0,1,1,0,1,-1,0,1,-1,0,-1,-1,0]),3));
    var bndLine=new T.LineSegments(bndG,new T.RawShaderMaterial({vertexShader:lv,fragmentShader:af,uniforms:advUni}));
    advPass.scene.add(bndLine);

    // ExternalForce
    var extUni={px:{value:cellScale},force:{value:new T.Vector2()},center:{value:new T.Vector2()},scale:{value:new T.Vector2(opts.cursorSize,opts.cursorSize)}};
    var extPass=new ShaderPass({output:fbos.vel1});
    var mouseG=new T.PlaneGeometry(1,1);
    var mouseMesh=new T.Mesh(mouseG,new T.RawShaderMaterial({vertexShader:mv,fragmentShader:ef,blending:T.AdditiveBlending,depthWrite:false,uniforms:extUni}));
    extPass.scene.add(mouseMesh);

    // Viscous
    var visUni={boundarySpace:{value:boundarySpace},velocity:{value:fbos.vel1.texture},velocity_new:{value:fbos.vis0.texture},v:{value:opts.viscous},px:{value:cellScale},dt:{value:opts.dt}};
    var visPass=new ShaderPass({material:{vertexShader:fv,fragmentShader:vf,uniforms:visUni},output:fbos.vis1,out0:fbos.vis0,out1:fbos.vis1});

    // Divergence
    var divUni={boundarySpace:{value:boundarySpace},velocity:{value:fbos.vis0.texture},px:{value:cellScale},dt:{value:opts.dt}};
    var divPass=new ShaderPass({material:{vertexShader:fv,fragmentShader:df,uniforms:divUni},output:fbos.div});

    // Poisson
    var poiUni={boundarySpace:{value:boundarySpace},pressure:{value:fbos.p0.texture},divergence:{value:fbos.div.texture},px:{value:cellScale}};
    var poiPass=new ShaderPass({material:{vertexShader:fv,fragmentShader:pof,uniforms:poiUni},output:fbos.p1,out0:fbos.p0,out1:fbos.p1});

    // Pressure
    var prUni={boundarySpace:{value:boundarySpace},pressure:{value:fbos.p0.texture},velocity:{value:fbos.vis0.texture},px:{value:cellScale},dt:{value:opts.dt}};
    var prPass=new ShaderPass({material:{vertexShader:fv,fragmentShader:prf,uniforms:prUni},output:fbos.vel0});

    // Output
    var outScene=new T.Scene(), outCam=new T.Camera();
    var outMesh=new T.Mesh(new T.PlaneGeometry(2,2),new T.RawShaderMaterial({vertexShader:fv,fragmentShader:cf,transparent:true,depthWrite:false,uniforms:{velocity:{value:fbos.vel0.texture},boundarySpace:{value:new T.Vector2()},palette:{value:palTex},bgColor:{value:bgVec}}}));
    outScene.add(outMesh);

    function doAdvection(){advUni.dt.value=opts.dt;bndLine.visible=opts.isBounce;advUni.isBFECC.value=opts.BFECC;advPass.render();}
    function doExternalForce(){
      var fx=(Mou.diff.x/2)*opts.mouseForce, fy=(Mou.diff.y/2)*opts.mouseForce;
      var csx=opts.cursorSize*cellScale.x, csy=opts.cursorSize*cellScale.y;
      extUni.force.value.set(fx,fy);
      extUni.center.value.set(Math.min(Math.max(Mou.coords.x,-1+csx+cellScale.x*2),1-csx-cellScale.x*2),Math.min(Math.max(Mou.coords.y,-1+csy+cellScale.y*2),1-csy-cellScale.y*2));
      extUni.scale.value.set(opts.cursorSize,opts.cursorSize);
      extPass.render();
    }
    function doViscous(){
      visUni.v.value=opts.viscous;var fin,fout;
      for(var i=0;i<opts.iterationsViscous;i++){fin=(i%2===0)?visPass.props.out0:visPass.props.out1;fout=(i%2===0)?visPass.props.out1:visPass.props.out0;visUni.velocity_new.value=fin.texture;visPass.props.output=fout;visPass.render();}
      return fout;
    }
    function doDivergence(vel){divUni.velocity.value=vel.texture;divPass.render();}
    function doPoisson(){
      var pin,pout;
      for(var i=0;i<opts.iterationsPoisson;i++){pin=(i%2===0)?poiPass.props.out0:poiPass.props.out1;pout=(i%2===0)?poiPass.props.out1:poiPass.props.out0;poiUni.pressure.value=pin.texture;poiPass.props.output=pout;poiPass.render();}
      return pout;
    }
    function doPressure(vel,pressure){prUni.velocity.value=vel.texture;prUni.pressure.value=pressure.texture;prPass.render();}
    function doOutput(){Com.renderer.setRenderTarget(null);Com.renderer.render(outScene,outCam);}

    function simulate(){
      if(opts.isBounce)boundarySpace.set(0,0);else boundarySpace.copy(cellScale);
      doAdvection();
      doExternalForce();
      var vel=opts.isViscous?doViscous():fbos.vel1;
      doDivergence(vel);
      var pressure=doPoisson();
      doPressure(vel,pressure);
      doOutput();
    }

    var running=false;
    function loop(){if(!running)return;AD.update();Mou.update();Com.update();simulate();raf=requestAnimationFrame(loop);}
    function start(){if(running)return;running=true;loop();}
    function pause(){running=false;if(raf){cancelAnimationFrame(raf);raf=null;}}

    container.prepend(Com.renderer.domElement);
    start();

    function onResize(){if(resRaf)cancelAnimationFrame(resRaf);resRaf=requestAnimationFrame(function(){Com.resize();calcSize();for(var k in fbos)fbos[k].setSize(fboSize.x,fboSize.y);});}
    window.addEventListener('resize',onResize);

    document.addEventListener('visibilitychange',function(){document.hidden?pause():(isVis&&start());});

    io=new IntersectionObserver(function(entries){isVis=entries[0].isIntersecting;isVis&&!document.hidden?start():pause();},{threshold:[0,0.01]});
    io.observe(container);

    self._dispose=function(){
      pause();
      window.removeEventListener('resize',onResize);
      if(ro)ro.disconnect();if(io)io.disconnect();
      Mou.dispose();
      if(Com.renderer){var c=Com.renderer.domElement;if(c&&c.parentNode)c.parentNode.removeChild(c);Com.renderer.dispose();try{Com.renderer.forceContextLoss();}catch(e){}}
    };
  }

  LiquidEther.prototype.dispose=function(){if(this._dispose)this._dispose();};

  G.LiquidEther=LiquidEther;
})(window);
