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
  var SPREAD_FACTOR = 10;
  var WIDTH_PER_PIXEL = 2500 / 1e9;  // in light years per pixel

  var stats, scene, renderer, composer, projector;
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
    camera.position.set(1592, 600, 983)
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
    cameraControls = new THREE.OrbitControls(camera);
    //cameraControls.autoRotateSpeed = 0.2;

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
    var path = '../data/testout2.json';
    $.getJSON(path, function(data) {
      var particles = new THREE.Geometry();

      attributes = {
        brightness: {type: 'f', value: []},
        size: {type: 'f', value: []},
        r: {type: 'f', value: []},
        g: {type: 'f', value: []},
        b: {type: 'f', value: []},
        pos: { type: "v3", value: []}
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
        camPosX: { type: "f", value: 1.0 },
        camPosY: { type: "f", value: 1.0 },
        camPosZ: { type: "f", value: 1.0 }
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
      particle_material =  new THREE.ParticleBasicMaterial({
        color: 0xFFFFFF,
        size: 10,
        map: THREE.ImageUtils.loadTexture('images/cloud4.png'),
        transparent: true,
        depthTest: false
      });
      */

      var particle_system = new THREE.ParticleSystem(particles,
                                                     particle_material);
      scene.add(particle_system);

      window.bounding_cube = bounding_cube = new THREE.CubeGeometry(1250, 1250, 1250);
      //scene.add(bounding_cube);

      projector = new THREE.Projector();

      $('#loading').hide();

      StartMovie();

      /*
      setTimeout(function() {
        var newpos = new THREE.Vector3(10, 10, 10);
        console.log('tweeniningigng');
        var pos = camera.position;
        new TWEEN.Tween(pos).to( {
                x: newpos.x,
                y: newpos.y,
                z: newpos.z}, 8000)
            .easing( TWEEN.Easing.Sinusoidal.InOut)
            .onUpdate(function() {
              camera.position = pos;
              camera.updateProjectionMatrix();
            })
            .start();
      }, 2000);
      */
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
    if (uniforms) {
      uniforms.camPosX.value = camera.position.x;
      uniforms.camPosY.value = camera.position.y;
      uniforms.camPosZ.value = camera.position.z;

      //cam.position.z = 3000 * Math.abs(Math.sin(now * 0.00001));
    }

    render();
    requestAnimFrame(animate);
    TWEEN.update();
    updateFovDescription();
  }

  // render the scene
  function render() {
    // update camera controls
    cameraControls.update();
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
