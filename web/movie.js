// Tools for setting up tween movie

(function(global) {
  // position, rotation are x,y,z tuples
  // time = ms
  function MovieEvent(position, rotation, fov, text, time) {
    time = time || 15;

    // TODO pass camera in normally
    this.position = position;
    this.rotation = rotation;
    this.fov = fov;
    this.text = text;
    this.time = time;
  }

  function PlayMovie(frames, completedCallback) {
    var tweens = [];
    for (var i=0; i < frames.length; i++) {
      var frame = frames[i];
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
          .easing( TWEEN.Easing.Sinusoidal.InOut)
          .onUpdate(function() {
            camera.position.set(tweenargs.position_x, tweenargs.position_y,
              tweenargs.position_z);
            camera.rotation.set(tweenargs.rotation_x, tweenargs.rotation_y,
              tweenargs.rotation_z);
            camera.fov = tweenargs.fov;
            camera.updateProjectionMatrix();
          });
      tweens.push(tween);
    }

    if (tweens.length === 1) {
      tween.start();
      return;
    }

    var prev = tweens[0];
    for (var i=1; i < tweens.length; i++) {
      var tween = tweens[i];
      // TODO update delay, delay, and such
      prev = prev.chain(tween);
    }

    // set up completion callback
    tweens[tweens.length-1].onComplete(function() {
      completedCallback();
    });

    // prev is the first tween now
    prev.start();

  }

  window.StartMovie = function() {
    frames = [
      new MovieEvent(
          //new THREE.Vector3(-100.298, -134.766, 447.004),  // position
          //new THREE.Vector3(0.2948709375011, -0.211489709708253, 0.06366940495736546),     // rotation
          new THREE.Vector3(-389.42, -891.5953, -1420.21459),  // position
          new THREE.Vector3(2.5839369989874, -0.206877525252764, 3.0141779097761026),     // rotation
          50,   // fov
          'test text',
          10000
      )
    ];

    PlayMovie(frames, function() {
      // completed
      alert('ok');
    });
  }
})(window);
