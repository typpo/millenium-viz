// Tools for setting up tween movie

// coord, rotation are x,y,z tuples
function MovieEvent(coord, rotation, text, time) {
  time = time || 15;

  this.coord = coord;
  this.rotation = rotation;
  this.text = text;
  this.time = time;
}

function PlayMovie(frames) {
  var tweens = [];
  for (var i=0; i < frames.length; i++) {
    var frame = frames[i];
    var pos = camera.position;
    var tween = new TWEEN.Tween(pos).to( {
            x: frame.coord.x,
            y: frame.coord.y,
            z: frame.coord.z}, 8000)
        .easing( TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function() {
          camera.position = pos;
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
