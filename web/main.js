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
  var SPREAD_FACTOR = 30;
  //var TWINKLE_PROB = 400000;   // 1 in n twinkle
  var TWINKLE_PROB = 100;   // 1 in n twinkle
  var ALL_GALAXIES = false;

  var stats, scene, renderer, composer;
  var camera, cameraControls;
  var pi = Math.PI;
  var using_webgl = false;
  var camera_fly_around = true;
  var object_movement_on = true;

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
    window.cam = camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(1592, 600, 983)
    camera.rotation.set(-0.548, 0.9945, 0.5078);

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
    cameraControls = new THREE.OrbitControls(camera);
    //cameraControls.autoRotate = true;
    cameraControls.autoRotateSpeed = 0.2;

    // Rendering stuff

    // Sky
    if (false && using_webgl) {
      $('#loading-text').html('skybox');
      var path = "images/s_";
      var format = '.jpg';
      var urls = [
          path + 'px' + format, path + 'nx' + format,
          path + 'py' + format, path + 'ny' + format,
          path + 'pz' + format, path + 'nz' + format
        ];
        /*
      var urls = [];
      for (var i=0; i < 6; i++) {
        urls.push('images/universe.jpg');
      }
      */
      var reflectionCube = THREE.ImageUtils.loadTextureCube( urls );
      reflectionCube.format = THREE.RGBFormat;

      var shader = THREE.ShaderUtils.lib[ "cube" ];
      shader.uniforms[ "tCube" ].value = reflectionCube;

      var material = new THREE.ShaderMaterial( {
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
      } );

      mesh = new THREE.Mesh( new THREE.CubeGeometry( 6000, 6000, 6000 ), material );
      scene.add(mesh);
    }

    $('#container').on('mousedown', function() {
      camera_fly_around = false;
    });

    window.renderer = renderer;

    load();

    animate();
  }

  function load() {
    var path;
    if (ALL_GALAXIES) {
      path = '../data/full.json';
    }
    else {
      path = '../data/partial.json';
    }
    $.getJSON(path, function(data) {
      var particles = new THREE.Geometry();

      attributes = {
        brightness: {type: 'f', value: []},
        size: {type: 'f', value: []},
        r: {type: 'f', value: []},
        g: {type: 'f', value: []},
        b: {type: 'f', value: []},
        pos: { type: "v3", value: []},
        rand: { type: "f", value: []},
        gtype: { type: "f", value: []},
        gimg: { type: "f", value: []}
        //color: { type: "v3", value: []}
      };
      uniforms = {
        map: { type: "t", value: THREE.ImageUtils.loadTexture("images/cloud4.png") },
        map_ellip1: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/elliptical1.jpg") },
        map_ellip2: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/elliptical2.jpg") },
        map_spiral1: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/spiral1.jpg") },
        map_spiral2: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/spiral2.jpg") },
        map_irreg1: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/irreg1.jpg") },
        map_irreg2: { type: "t", value: THREE.ImageUtils.loadTexture("images/galaxy_maps/irreg2.jpg") },
        time: { type: "f", value: +new Date() },
        twinkleRand: { type: "f", value: 1.0 },
        lastTwinkle: { type: "f", value: 1.0 },
        js_time: { type: "f", value: +new Date() },
        camPosX: { type: "f", value: 1.0 },
        camPosY: { type: "f", value: 1.0 },
        camPosZ: { type: "f", value: 1.0 }
      };

/*
      var particle_material = new THREE.ParticleBasicMaterial({
        color: 0xffffff,
        size: 5,
        map: THREE.ImageUtils.loadTexture('images/cloud4.png'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });
*/
      var maxsize = Number.MAX_VALUE;
      var minsize = Number.MIN_VALUE;
      var maxlum = Number.MAX_VALUE;
      var minlum = Number.MIN_VALUE;
      $.each(data.positions, function(idx) {
        var x = this[0] * SPREAD_FACTOR
          , y = this[1] * SPREAD_FACTOR
          , z = this[2] * SPREAD_FACTOR
        ;
        var pos = new THREE.Vector3(x,y,z);
        attributes.pos.value[idx] = pos;

        var size = this[3] * 750;
        if (size > 9999 || size < 0) {
          attributes.size.value[idx] = 0.;
          attributes.brightness.value[idx] = 0.;
        }

        var lum = this[4];
        if (lum > 9999 || lum < 0) {
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
          rgb = hexToRgb(getColorFromPercent(lumpct, 0xADADFF, 0xffcccc));
        }
        else if (lumpct > .3) {
          rgb = hexToRgb(getColorFromPercent(lumpct, 0xFFFF75, 0xE6E65C));
        }
        else {
          rgb = hexToRgb(getColorFromPercent(lumpct, 0xFFA366, 0xff6600));
        }
        //attributes.color.value[idx] = new THREE.Vector3(rgb.r/255, rgb.g/255, rgb.b/255);
        attributes.r.value[idx] = rgb.r/255;
        attributes.g.value[idx] = rgb.g/255;
        attributes.b.value[idx] = rgb.b/255;
        attributes.rand.value[idx] = Math.floor(Math.random() * TWINKLE_PROB);

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
        attributes.gtype.value[idx] = rtype;
        attributes.gimg.value[idx] = rimg;

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
      // TODO custom blending that limits light intensity
      particle_material.blending = THREE.AdditiveBlending;

      var particle_system = new THREE.ParticleSystem(particles,
                                                     particle_material);
      scene.add(particle_system);

      $('#loading').hide();
    });
  }

  // animation loop
  var lastTwinkle = +new Date();
  function animate() {
    /*
    var timer = 0.0001 * Date.now();
    cam.position.x = Math.sin(timer) * 25;
    //cam.position.y = Math.sin( timer ) * 100;
    cam.position.z = -100 + Math.cos(timer) * 20;
    */

    if (uniforms) {
      //uniforms.time.value = Math.sin(+new Date());
      var now = uniforms.js_time.value = +new Date();
      uniforms.time.value = Math.sin(Math.floor(now / 100));
      if (now - lastTwinkle > 200 && Math.random() > 0.5) {
        uniforms.twinkleRand.value = Math.floor(Math.random() * TWINKLE_PROB);
        uniforms.lastTwinkle.value = lastTwinkle = now;
      }

      uniforms.camPosX.value = cam.position.x;
      uniforms.camPosY.value = cam.position.y;
      uniforms.camPosZ.value = cam.position.z;
    }

    render();
    requestAnimFrame(animate);
  }

  // render the scene
  function render() {
    // update camera controls
    cameraControls.update();
    //stats.update();

    // actually render the scene
    renderer.render(scene, camera);
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
