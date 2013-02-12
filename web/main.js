$(function() {
  "use strict";

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  })();

  var WEB_GL_ENABLED = true;
  var SPREAD_FACTOR = 15;

  var stats, scene, renderer, composer, renderTarget, projector;
  var camera, cameraControls;
  var pi = Math.PI;
  var using_webgl = false;
  var camera_fly_around = true;
  var object_movement_on = true;

  var bounding_cube;

  var uniforms, attributes;

  function init(){
    $('#loading-text').html('renderer');
    if (WEB_GL_ENABLED && Detector.webgl){
      renderer = new THREE.WebGLRenderer({
        antialias		: true	// to get smoother output
        //preserveDrawingBuffer	: true	// to allow screenshot
      });
      renderer.setClearColor(0x000000, 1);
      using_webgl = true;
      window.gl = renderer.getContext();
    }
    else {
      renderer	= new THREE.CanvasRenderer();
      $('#not-supported').show();
      if (typeof mixpanel !== 'undefined') mixpanel.track('not supported');
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBuffer: false
    });

    document.getElementById('container').appendChild(renderer.domElement);

    // Set up stats
    /*
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild(stats.domElement);
    */

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    var cameraH	= 3;
    var cameraW	= cameraH / window.innerHeight * window.innerWidth;
    window.camera = camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(592, 600, 983)
    //camera.position.set(3750, 3750, 3750);
    //camera.rotation.set(-0.548, 0.9945, 0.5078);
    camera.center = new THREE.Vector3(0,0,0);

    //THREE.Object3D._threexDomEvent.camera(camera);    // camera mouse handler
    //THREEx.WindowResize(renderer, camera);    // handle window resize

    scene.add(camera);

    /*
    cameraControls	= new THREE.TrackballControlsX(camera)
    cameraControls.staticMoving = true;
    cameraControls.panSpeed = 2;
    cameraControls.zoomSpeed = 3;
    //cameraControls.maxDistance = 1100;
    cameraControls.maxDistance = 2100;
    */
    //window.cc = cameraControls = new THREE.OrbitControls(camera);
    window.cc = cameraControls = new THREE.TrackballControls(camera);
    cameraControls.maxDistance = 3150;
    //cameraControls.autoRotateSpeed = 0.2;

    // Rendering stuff

    $('#container').on('mousedown', function() {
      camera_fly_around = false;
    });

    window.renderer = renderer;

    load();
    animate();
  }

  function load() {
    var path = '../data/testout10_idk.json';
    $.getJSON(path, function(data) {
      var particles = new THREE.Geometry();

      attributes = {
        brightness: {type: 'f', value: []},
        size: {type: 'f', value: []},
        r: {type: 'f', value: []},
        g: {type: 'f', value: []},
        b: {type: 'f', value: []},
        pos: { type: "v3", value: []}
        //show: { type: "f", value: []}
      };
      uniforms = {
        map: { type: "t", value: THREE.ImageUtils.loadTexture("images/cloud4.png") },
      /*
        map_ellip1: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/elliptical1.jpg") },
        map_ellip2: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/elliptical2.jpg") },
        map_spiral1: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/spiral1.jpg") },
        map_spiral2: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/spiral2.jpg") },
        map_irreg1: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/irreg1.jpg") },
        map_irreg2: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/irreg2.jpg") },
        */
        /*
        camPosX: { type: "f", value: 1.0 },
        camPosY: { type: "f", value: 1.0 },
        camPosZ: { type: "f", value: 1.0 }
        */
      };

      var maxsize = Number.MAX_VALUE;
      var minsize = Number.MIN_VALUE;
      var maxlum = Number.MAX_VALUE;
      var minlum = Number.MIN_VALUE;
      $.each(data.positions, function(idx) {

        var x = (this[0]-125) * SPREAD_FACTOR
          , y = (this[1]-125) * SPREAD_FACTOR
          , z = (this[2]-125) * SPREAD_FACTOR
        ;

        //attributes.show.value[idx] = Math.random() > .7 ? 1. : 0.; // randomly determine whether to show

        var pos = new THREE.Vector3(x,y,z);
        attributes.pos.value[idx] = pos;

        var size = this[3] * 750;
        if (size < 0) {
          attributes.size.value[idx] = 0.;
          attributes.brightness.value[idx] = 0.;
        }

        var lum = this[4];
        if (lum < 0) {
          attributes.size.value[idx] = 0.;
          attributes.brightness.value[idx] = 0.;
        }

        maxsize = Math.max(maxsize, size);
        minsize = Math.min(maxsize, size);

        maxlum = Math.max(maxlum, lum);
        minlum = Math.min(maxlum, lum);

        attributes.size.value[idx] = size;
        attributes.brightness.value[idx] = lum;
        var lumpct = lum;
        lumpct = Math.min(lumpct, 100);
        lumpct = Math.max(lumpct, 0);
        var rgb;
        if (lumpct > .8) {
          // bluish
          rgb = hexToRgb(getColorFromPercent(lumpct, 0xADADFF, 0xffcccc));
        }
        else if (lumpct > .3) {
          // TODO get rid of green
          rgb = hexToRgb(getColorFromPercent(lumpct, 0xFFFF75, 0xE6E65C));
        }
        else {
          // reddish
          rgb = hexToRgb(getColorFromPercent(lumpct, 0xFFD1B2, 0xFFA366));
          // more reddish:
          //rgb = hexToRgb(getColorFromPercent(lumpct, 0xFFA366, 0xff6600));
        }
        // all orangey:
        //rgb = hexToRgb(getColorFromPercent(lumpct, 0xffa366, 0xffcccc));

        attributes.r.value[idx] = rgb.r/255;
        attributes.g.value[idx] = rgb.g/255;
        attributes.b.value[idx] = rgb.b/255;

        // decide what type of galaxy it is
        var rtype = Math.random();
        var rimg = Math.floor(Math.random() * 2) + 1;
        if (rtype < .6) {
          rtype = 0; // elliptical
        }
        else if (rtype < .8) {
          rtype = 1; //spiral
        }
        else {
          rtype = 2; // irregular
        }
        //attributes.gtype.value[idx] = rtype;
        //attributes.gimg.value[idx] = rimg;

        // add to mesh
        particles.vertices.push(pos);
      });

      var particle_material = new THREE.ShaderMaterial( {
        uniforms:       uniforms,
        attributes:     attributes,
        vertexShader: document.getElementById( 'vertex-shader' ).textContent,
        fragmentShader: document.getElementById( 'fragment-shader' ).textContent
      });
      particle_material.depthTest = false;
      particle_material.vertexColor = true;
      particle_material.transparent = true;
      particle_material.blending = THREE.AdditiveBlending;

      /*
      var particle_material =  new THREE.ParticleBasicMaterial({
        color: 0xFFFFFF,
        size: 50,
        map: THREE.ImageUtils.loadTexture('images/cloud4.png'),
        transparent: true,
        depthTest: false
      });
      */

      var particle_system = new THREE.ParticleSystem(particles,
                                                     particle_material);
      particle_system.frustumCulled = true;
      particle_system.sortParticles = false;
      scene.add(particle_system);

      window.bounding_cube = bounding_cube = new THREE.CubeGeometry(2500, 2500, 2500);
/*
      var cube = new THREE.Mesh(
          bounding_cube,
          new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } )
      );
      scene.add(cube);
*/

      var renderModel = new THREE.RenderPass( scene, camera );
      renderModel.clear = false;
      //THREE.BloomPass.blurX = new THREE.Vector2( 0.000000001953125, 0.0 );
      //THREE.BloomPass.blurY = new THREE.Vector2( 0.000000001953125, 0.0 );
      //var effectBloom = new THREE.BloomPass(1, 25, 4, 256);

      // tilt shift blur
      var hblur = new THREE.ShaderPass( THREE.HorizontalTiltShiftShader );
      var vblur = new THREE.ShaderPass( THREE.VerticalTiltShiftShader );

      var bluriness = 4;

      hblur.uniforms[ 'h' ].value = bluriness / window.innerWidth;
      vblur.uniforms[ 'v' ].value = bluriness / window.innerHeight;

      hblur.uniforms[ 'r' ].value = vblur.uniforms[ 'r' ].value = 0.5;

      composer = new THREE.EffectComposer( renderer, renderTarget );
      var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
      effectCopy.renderToScreen = true;
      composer.addPass( renderModel );
      //composer.addPass( effectBloom );
      composer.addPass( hblur );
      composer.addPass( vblur );
      composer.addPass( effectCopy );


      $('#loading').hide();

      StartMovie();
    });
  }

  function updateFovDescription() {
    if (!bounding_cube) return;
    var dist = Number.MAX_VALUE;
    for (var i=0; i < bounding_cube.vertices.length; i++) {
      dist = Math.min(dist, camera.position.distanceTo(bounding_cube.vertices[i]));
    }

    var vFOV = camera.fov * Math.PI / 180;        // convert vertical fov to radians
    var height = 2 * Math.tan( vFOV / 2 ) * dist; // visible height

    var aspect = $(window).width() / $(window).height();
    var width = height * aspect;
    var width_adjusted = Math.floor(width * 1e9/2500);
    var height_adjusted = Math.floor(height * 1e9/2500);

    $('#fov_desc').html(dist + '<br>' + numberWithCommas(width_adjusted) + ' x ' + numberWithCommas(height_adjusted) + ' light years');
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // animation loop
  function animate() {
      /*
    if (uniforms) {
      uniforms.camPosX.value = camera.position.x;
      uniforms.camPosY.value = camera.position.y;
      uniforms.camPosZ.value = camera.position.z;

    }
      */

    var now = +new Date();
    //camera.position.z = 2200 * Math.abs(Math.sin(now * 0.0001));

    render();
    requestAnimFrame(animate);
    //TWEEN.update();
    //updateFovDescription();
  }

  // render the scene
  function render() {
    // update camera controls
    cameraControls.update();
    // actually render the scene
    renderer.render(scene, camera);
    //if (composer) composer.render(0.1);
  }

  init();
});

if (!window.console) window.console = {log: function() {}};

function getColorFromPercent(value, highColor, lowColor) {
  var r = highColor >> 16;
  var g = highColor >> 8 & 0xFF;
  var b = highColor & 0xFF;

  r += ((lowColor >> 16) - r) * value;
  g += ((lowColor >> 8 & 0xFF) - g) * value;
  b += ((lowColor & 0xFF) - b) * value;

  return (r << 16 | g << 8 | b);
}


function hexToRgb(hex) {
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;
  return {
    'r': r,
    'g': g,
    'b': b
  };
}
