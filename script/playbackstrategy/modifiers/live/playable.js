define(
    'bigscreenplayer/playbackstrategy/modifiers/live/playable',
  [
    'bigscreenplayer/playbackstrategy/modifiers/mediaplayerbase',
    'bigscreenplayer/playbackstrategy/modifiers/live/faketime'
  ],
    function (MediaPlayerBase, FakeTime) {
      'use strict';
      function PlayableLivePlayer (mediaPlayer) {
        var callbacksMap = [];
        var fakeTimer = FakeTime();
        addEventCallback(this, fakeTimer.updateFakeTimer);

        function addEventCallback (thisArg, callback) {
          function newCallback (event) {
            event.currentTime = fakeTimer.getCurrentTime();
            callback(event);
          }
          callbacksMap.push({ from: callback, to: newCallback });
          mediaPlayer.addEventCallback(thisArg, newCallback);
        }

        function removeEventCallback (thisArg, callback) {
          var filteredCallbacks = callbacksMap.filter(function (cb) {
            return cb.from === callback;
          });

          if (filteredCallbacks.length > 0) {
            callbacksMap = callbacksMap.splice(callbacksMap.indexOf(filteredCallbacks[0]));

            mediaPlayer.removeEventCallback(thisArg, filteredCallbacks[0].to);
          }
        }

        return {
          beginPlayback: function beginPlayback () {
            mediaPlayer.beginPlayback();
          },

          initialiseMedia: function initialiseMedia (mediaType, sourceUrl, mimeType, sourceContainer, opts) {
            if (mediaType === MediaPlayerBase.TYPE.AUDIO) {
              mediaType = MediaPlayerBase.TYPE.LIVE_AUDIO;
            } else {
              mediaType = MediaPlayerBase.TYPE.LIVE_VIDEO;
            }

            mediaPlayer.initialiseMedia(mediaType, sourceUrl, mimeType, sourceContainer, opts);
          },

          stop: function stop () {
            mediaPlayer.stop();
          },

          reset: function reset () {
            mediaPlayer.reset();
          },

          getState: function getState () {
            return mediaPlayer.getState();
          },

          getSource: function getSource () {
            return mediaPlayer.getSource();
          },

          getMimeType: function getMimeType () {
            return mediaPlayer.getMimeType();
          },

          addEventCallback: addEventCallback,

          removeEventCallback: removeEventCallback,

          removeAllEventCallbacks: function removeAllEventCallbacks () {
            mediaPlayer.removeAllEventCallbacks();
          },

          getPlayerElement: function getPlayerElement () {
            return mediaPlayer.getPlayerElement();
          }
        };
      }

      return PlayableLivePlayer;
    }
);
