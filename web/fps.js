function FpsCounter() {
  var me = this;
  // The higher this value, the less the fps will reflect temporary variations
  // A value of 1 will only keep the last value
  var filterStrength = 20;
  var frameTime = 0, lastLoop = new Date, thisLoop;

  me.tick = function(){
    var thisFrameTime = (thisLoop=new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
  }

  me.getFps = function() {
    return 1000/frameTime;
  }
}
