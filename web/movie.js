// Tools for setting up tween movie

(function(global) {

  var frames;

  // position, rotation are x,y,z tuples
  // time = ms
  function MovieEvent(position, rotation, fov, text, time) {
    time = time || 15;

    // TODO pass camera in normally
    return {
      position: position,
      rotation: rotation,
      fov: fov,
      text: text,
      time: time
    }
  }

  function PlayMovie(frames, completedCallback) {
    RunFrame(frames, 0, completedCallback);
  }

  function RunFrame(frames, frame_idx, completedCallback) {
    var frame = frames[frame_idx];
    var tweenargs = {
      position_x: camera.position.x,
      position_y: camera.position.y,
      position_z: camera.position.z,
      rotation_x: camera.rotation.x,
      rotation_y: camera.rotation.y,
      rotation_z: camera.rotation.z,
      fov: camera.fov
    }
    var tween = new TWEEN.Tween(tweenargs).to({
        position_x: frame.position.x,
        position_y: frame.position.y,
        position_z: frame.position.z,
        rotation_x: frame.rotation.x,
        rotation_y: frame.rotation.y,
        rotation_z: frame.rotation.z,
        fov: frame.fov
      }, frame.time)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onStart(function() {
        console.log('starting frame', frame.text);
        if (frame.text) {
          $('#main-caption').html(frame.text);
        }
      })
      .onUpdate(function() {
        camera.position.set(tweenargs.position_x, tweenargs.position_y,
          tweenargs.position_z);
        camera.rotation.set(tweenargs.rotation_x, tweenargs.rotation_y,
          tweenargs.rotation_z);
        camera.fov = tweenargs.fov;
        camera.updateProjectionMatrix();
      })
      .onComplete(function() {
        if (frame_idx < frames.length - 1) {
          console.log('running next');
          RunFrame(frames, ++frame_idx, completedCallback);
        }
        else {
          completedCallback();
        }
      }).start();
  }

  window.PlayNext = function() {

  }

  window.StartMovie = function() {
    frames = [
      MovieEvent(
        //new THREE.Vector3(-100.298, -134.766, 447.004),  // position
        //new THREE.Vector3(0.2948709375011, -0.211489709708253, 0.06366940495736546),     // rotation
        new THREE.Vector3(-389.42, -891.5953, -1420.21459),  // position
        new THREE.Vector3(2.5839369989874, -0.206877525252764, 3.0141779097761026),     // rotation
        //new THREE.Vector3(-2.785340500011829, 0.12534666496470587, 2.5639590637178085),     // rotation
        50,   // fov
        "Welcome to the <a href=\"http://www.mpa-garching.mpg.de/galform/virgo/millennium/\" target=\"_blank\">Millenium Run</a>, the largest n-body supercomputer simulation ever."
        + "<br><br>In a cube of space 2 billion light years wide, it traces the evolution of over 10 billion pieces of dark matter, each a billion times the mass of our sun, roughly equivalent to 20 million galaxies."
        + "<br><br>Our galaxy is a single point of light in this rendering."
        + "<br><br>Your view spans a billion cubic light-years of space -- unthinkably huge, but just a tiny part of the universe."
        + '<br><br>&nbsp;<a href="#" class="js-close-dialog">&raquo; Continue</a>'
        ,
        11000
      ),
      MovieEvent(
        new THREE.Vector3(-189.42, -691.5953, -1220.21459),  // position
        new THREE.Vector3(-2.785340500011829, 0.12534666496470587, 2.5639590637178085),     // rotation
        80,   // fov
        null,
        10000
      ),
      MovieEvent(
        new THREE.Vector3(-189.42, -691.5953, -1220.21459),  // position
        new THREE.Vector3(-2.785340500011829, 0.12534666496470587, 2.5639590637178085),     // rotation
        40,   // fov
        null,
        10000
      ),
      MovieEvent(
        new THREE.Vector3(-96.1029589, 606.00058341, -1310.9945263),  // position
        new THREE.Vector3(-2.7085993236847865, -0.0664423697701746, -2.3178260010390517),     // rotation
        50,   // fov
        null,
        8000
      ),
    ];

    /*
    PlayMovie(frames, function() {
      // completed
      console.log('tweens done');
    });
    */
    console.log('asdasd');
    $('#main-caption').html(frames[0].text);

    $('#main-caption-close, #main-caption a.js-close-dialog').on('click', function() {
      $('#main-caption-container').hide();
      return false;
    });
  }
})(window);
