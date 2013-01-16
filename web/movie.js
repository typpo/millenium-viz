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

  function PlayMovie(frames) {
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
            position_zz: frame.position.z,
            rotation_x: frame.rotation.x,
            rotation_y: frame.rotation.y,
            rotation_z: frame.rotation.z,
            fov: frame.fov
          }, 8000)
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
    prev.start();
  }

  window.StartMovie = function() {
    frames = [
      new MovieEvent(
          new THREE.Vector3(10, 10, 10),  // position
          new THREE.Vector3(0, 0, 0),     // rotation
          75,   // fov
          'test text',
          10000
      )
    ];

    PlayMovie(frames);
  }
})(window);
