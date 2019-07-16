define(
  'bigscreenplayer/playbackstrategy/faketime',
  [
    'bigscreenplayer/playbackstrategy/modifiers/mediaplayerbase'
  ],
  function (MediaPlayerBase) {
    'use strict';

    return function () {
      var currentTime;
      var runningTime;
      var wasPlaying;

      function update (event) {
        if (wasPlaying && runningTime) {
          currentTime += (Date.now() - runningTime) / 1000;
        }

        runningTime = Date.now();
        wasPlaying = event.state === MediaPlayerBase.STATE.PLAYING;
      }

      function getCurrentTime () {
        return currentTime;
      }

      function setCurrentTime (time) {
        currentTime = time;
      }

      return {
        getCurrentTime: getCurrentTime,
        setCurrentTime: setCurrentTime,
        update: update
      };
    };
  }
);
