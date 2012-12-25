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

  var stats, scene, renderer, composer;
  var camera, cameraControls;
  var pi = Math.PI;
  var using_webgl = false;
  var camera_fly_around = true;
  var object_movement_on = true;

  init();

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
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild(stats.domElement);

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    var cameraH	= 3;
    var cameraW	= cameraH / window.innerHeight * window.innerWidth;
    window.cam = camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    //camera.position.set(22.39102192510384, -124.78460848134833, -55.29382439584528);
    //camera.position.set(12.39102192510384, -124.78460848134833, -75.29382439584528);

    //camera.position.set(-145, 41, -31);
    camera.position.set(500,500,500);
    // 77, -155, 23

    THREE.Object3D._threexDomEvent.camera(camera);    // camera mouse handler
    THREEx.WindowResize(renderer, camera);    // handle window resize

    scene.add(camera);

    cameraControls	= new THREE.TrackballControlsX(camera)
    cameraControls.staticMoving = true;
    cameraControls.panSpeed = 2;
    cameraControls.zoomSpeed = 3;
    //cameraControls.maxDistance = 1100;
    cameraControls.maxDistance = 2100;

    // Rendering stuff

    // Sky
    /*
    if (using_webgl) {
      $('#loading-text').html('skybox');
      var path = "/images/dark-s_";
      var format = '.jpg';
      var urls = [
          path + 'px' + format, path + 'nx' + format,
          path + 'py' + format, path + 'ny' + format,
          path + 'pz' + format, path + 'nz' + format
        ];
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
      } ),

      mesh = new THREE.Mesh( new THREE.CubeGeometry( 5000, 5000, 5000 ), material );
      scene.add(mesh);
    }
    */

    $('#container').on('mousedown', function() {
      camera_fly_around = false;
    });

    window.renderer = renderer;

    load();

    animate();
  }

  function load() {
    $.getJSON('../data/partial.json', function(data) {
      var particles = new THREE.Geometry();
      var particle_material = new THREE.ParticleBasicMaterial({
        color: 0xffffff,
        size: 5,
        map: THREE.ImageUtils.loadTexture('images/cloud4.png'),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });
      $.each(data.positions, function(idx) {
        var particle = new THREE.Vector3(
          this[0] * 20,
          this[1] * 20,
          this[2] * 20
        );
        particles.vertices.push(particle);
      });
      console.log(particles.vertices);

      var particle_system = new THREE.ParticleSystem(particles,
                                                     particle_material);
      scene.add(particle_system);
      $('#loading').hide();
    });

  }

  // animation loop
  function animate() {
    render();
    requestAnimFrame(animate);
  }

  // render the scene
  function render() {
    // update camera controls
    cameraControls.update();
    stats.update();

    // actually render the scene
    renderer.render(scene, camera);
  }
});

if (!window.console) window.console = {log: function() {}};
