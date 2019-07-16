define(
  'bigscreenplayer/playbackstrategy/faketime',
  [
    'bigscreenplayer/playbackstrategy/modifiers/mediaplayerbase'
  ],
  function (MediaPlayerBase) {
    'use strict';

    var currentTime;
    var runningTime;
    var wasPlaying;

    function updateFakeTimer (event) {
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
      wasPlaying = false;
      currentTime = time;
    }

    return function () {
      return {
        getCurrentTime: getCurrentTime,
        setCurrentTime: setCurrentTime,
        updateFakeTimer: updateFakeTimer
      };
    };
  }
);
