/**
 * @fileOverview Requirejs module containing device modifier for media playback on Samsung devices.
 * @preserve Copyright (c) 2013-present British Broadcasting Corporation. All rights reserved.
 * @license See https://github.com/bbc/tal/blob/master/LICENSE for full licence
 */

define(
    'bigscreenplayer/playbackstrategy/modifiers/maple',
  [
    'bigscreenplayer/playbackstrategy/modifiers/mediaplayerbase'
  ],
    function (MediaPlayerBase) {
      'use strict';

    /**
     * Main MediaPlayer implementation for Samsung devices implementing the Maple API.
     * Use this device modifier if a device implements the Samsung Maple media playback standard.
     * It must support creation of <object>; elements with appropriate SAMSUNG_INFOLINK classids.
     * Those objects must expose an API in accordance with the Samsung Maple media specification.
     * @name antie.devices.mediaplayer.SamsungMaple
     * @class
     * @extends antie.devices.mediaplayer.MediaPlayer
     */

      var state = MediaPlayerBase.STATE.EMPTY;
      var playerPlugin = document.getElementById('playerPlugin');
      var deferSeekingTo = null;
      var postBufferingState = null;
      var tryingToPause = false;
      var currentTimeKnown = false;
      var CURRENT_TIME_TOLERANCE = 2.5;

      var type;
      var source;
      var mimeType;

      var currentTime;
      var range;

      var eventCallbacks;
      var eventCallback;

      var onWindowHide = function () {};

      var device; // TODO: remove device being needed

      function getState () {
        return state;
      }

      function getCurrentTime () {
        if (getState() === MediaPlayerBase.STATE.STOPPED) {
          return undefined;
        } else {
          return currentTime;
        }
      }

      function getSource () {
        return source;
      }

      function getMimeType () {
        return mimeType;
      }

      function getSeekableRange () {
        return range;
      }

      function getDuration () {
        return range.end;
      }

      function getPlayerElement () {
        return playerPlugin;
      }

      function onFinishedBuffering () {
        if (getState() !== MediaPlayerBase.STATE.BUFFERING) {
          return;
        }

        if (deferSeekingTo === null) {
          if (postBufferingState === MediaPlayerBase.STATE.PAUSED) {
            tryPauseWithStateTransition();
          } else {
            toPlaying();
          }
        }
      }

      function onDeviceError (message) {
        reportError(message);
      }

      function onDeviceBuffering () {
        if (getState() === MediaPlayerBase.STATE.PLAYING) {
          toBuffering();
        }
      }

      function onEndOfMedia () {
        toComplete();
      }

      function stopPlayer () {
        playerPlugin.Stop();
        currentTimeKnown = false;
      }

      function tryPauseWithStateTransition () {
        var success = isSuccessCode(playerPlugin.Pause());
        if (success) {
          toPaused();
        }

        tryingToPause = !success;
      }

      function onStatus () {
        var state = getState();
        if (state === MediaPlayerBase.STATE.PLAYING) {
          emitEvent(MediaPlayerBase.EVENT.STATUS);
        }
      }

      function onMetadata () {
        range = {
          start: 0,
          end: playerPlugin.GetDuration() / 1000
        };
      }

      function onCurrentTime (timeInMillis) {
        currentTime = timeInMillis / 1000;
        onStatus();
        currentTimeKnown = true;

        if (deferSeekingTo !== null) {
          deferredSeek();
        }

        if (tryingToPause) {
          tryPauseWithStateTransition();
        }
      }

      function deferredSeek () {
        var clampedTime = getClampedTimeForPlayFrom(deferSeekingTo);
        var isNearCurrentTime = isNearToCurrentTime(clampedTime);

        if (isNearCurrentTime) {
          toPlaying();
          deferSeekingTo = null;
        } else {
          var seekResult = seekTo(clampedTime);
          if (seekResult) {
            deferSeekingTo = null;
          }
        }
      }

      function getClampedTimeForPlayFrom (seconds) {
        var clampedTime = getClampedTime(seconds);
        if (clampedTime !== seconds) {
          device.getLogger().debug('playFrom ' + seconds + ' clamped to ' + clampedTime + ' - seekable range is { start: ' + range.start + ', end: ' + range.end + ' }');
        }
        return clampedTime;
      }

      function registerEventHandlers () {
        window.SamsungMapleOnRenderError = function () {
          onDeviceError('Media element emitted OnRenderError');
        };
        playerPlugin.OnRenderError = 'SamsungMapleOnRenderError';

        window.SamsungMapleOnConnectionFailed = function () {
          onDeviceError('Media element emitted OnConnectionFailed');
        };
        playerPlugin.OnConnectionFailed = 'SamsungMapleOnConnectionFailed';

        window.SamsungMapleOnNetworkDisconnected = function () {
          onDeviceError('Media element emitted OnNetworkDisconnected');
        };
        playerPlugin.OnNetworkDisconnected = 'SamsungMapleOnNetworkDisconnected';

        window.SamsungMapleOnStreamNotFound = function () {
          onDeviceError('Media element emitted OnStreamNotFound');
        };
        playerPlugin.OnStreamNotFound = 'SamsungMapleOnStreamNotFound';

        window.SamsungMapleOnAuthenticationFailed = function () {
          onDeviceError('Media element emitted OnAuthenticationFailed');
        };
        playerPlugin.OnAuthenticationFailed = 'SamsungMapleOnAuthenticationFailed';

        window.SamsungMapleOnRenderingComplete = function () {
          onEndOfMedia();
        };
        playerPlugin.OnRenderingComplete = 'SamsungMapleOnRenderingComplete';

        window.SamsungMapleOnBufferingStart = function () {
          onDeviceBuffering();
        };
        playerPlugin.OnBufferingStart = 'SamsungMapleOnBufferingStart';

        window.SamsungMapleOnBufferingComplete = function () {
          onFinishedBuffering();
        };
        playerPlugin.OnBufferingComplete = 'SamsungMapleOnBufferingComplete';

        window.SamsungMapleOnStreamInfoReady = function () {
          onMetadata();
        };
        playerPlugin.OnStreamInfoReady = 'SamsungMapleOnStreamInfoReady';

        window.SamsungMapleOnCurrentPlayTime = function (timeInMillis) {
          onCurrentTime(timeInMillis);
        };
        playerPlugin.OnCurrentPlayTime = 'SamsungMapleOnCurrentPlayTime';

        onWindowHide = function () {
          stop();
        };

        window.addEventListener('hide', onWindowHide, false);
        window.addEventListener('unload', onWindowHide, false);
      }

      function unregisterEventHandlers () {
        var eventHandlers = [
          'SamsungMapleOnRenderError',
          'SamsungMapleOnRenderingComplete',
          'SamsungMapleOnBufferingStart',
          'SamsungMapleOnBufferingComplete',
          'SamsungMapleOnStreamInfoReady',
          'SamsungMapleOnCurrentPlayTime',
          'SamsungMapleOnConnectionFailed',
          'SamsungMapleOnNetworkDisconnected',
          'SamsungMapleOnStreamNotFound',
          'SamsungMapleOnAuthenticationFailed'
        ];

        for (var i = 0; i < eventHandlers.length; i++) {
          var handler = eventHandlers[i];
          var hook = handler.substring('SamsungMaple'.length);
          playerPlugin[hook] = undefined;

          delete window[handler];
        }

        window.removeEventListener('hide', onWindowHide, false);
        window.removeEventListener('unload', onWindowHide, false);
      }

      function wipe () {
        stopPlayer();
        type = undefined;
        source = undefined;
        mimeType = undefined;
        currentTime = undefined;
        range = undefined;
        deferSeekingTo = null;
        tryingToPause = false;
        currentTimeKnown = false;
        unregisterEventHandlers();
      }

      function seekTo (seconds) {
        var offset = seconds - getCurrentTime();
        var success = isSuccessCode(jump(offset));

        if (success) {
          currentTime = seconds;
        }

        return success;
      }

      function seekToWithFailureStateTransition (seconds) {
        var success = seekTo(seconds);
        if (!success) {
          toPlaying();
        }
      }

      function jump (offsetSeconds) {
        if (offsetSeconds > 0) {
          return playerPlugin.JumpForward(offsetSeconds);
        } else {
          return playerPlugin.JumpBackward(Math.abs(offsetSeconds));
        }
      }

      function isHlsMimeType () {
        var mime = mimeType.toLowerCase();
        return mime === 'application/vnd.apple.mpegurl' || mime === 'application/x-mpegurl';
      }

      function wrappedSource () {
        var source = source;
        if (isHlsMimeType()) {
          source += '|COMPONENT=HLS';
        }
        return source;
      }

      function reportError (errorMessage) {
        emitEvent(MediaPlayerBase.EVENT.ERROR, {'errorMessage': errorMessage});
      }

      function toStopped () {
        currentTime = 0;
        range = undefined;
        state = MediaPlayerBase.STATE.STOPPED;
        emitEvent(MediaPlayerBase.EVENT.STOPPED);
      }

      function toBuffering () {
        state = MediaPlayerBase.STATE.BUFFERING;
        emitEvent(MediaPlayerBase.EVENT.BUFFERING);
      }

      function toPlaying () {
        state = MediaPlayerBase.STATE.PLAYING;
        emitEvent(MediaPlayerBase.EVENT.PLAYING);
      }

      function toPaused () {
        state = MediaPlayerBase.STATE.PAUSED;
        emitEvent(MediaPlayerBase.EVENT.PAUSED);
      }

      function toComplete () {
        state = MediaPlayerBase.STATE.COMPLETE;
        emitEvent(MediaPlayerBase.EVENT.COMPLETE);
      }

      function toEmpty () {
        wipe();
        state = MediaPlayerBase.STATE.EMPTY;
      }

      function toError (errorMessage) {
        wipe();
        state = MediaPlayerBase.STATE.ERROR;
        reportError(errorMessage);
      }

      function setDisplayFullScreenForVideo () {
        if (type === MediaPlayerBase.TYPE.VIDEO) {
          var dimensions = device.getScreenSize();
          playerPlugin.SetDisplayArea(0, 0, dimensions.width, dimensions.height);
        }
      }

      function isSuccessCode (code) {
        var samsung2010ErrorCode = -1;
        return code && code !== samsung2010ErrorCode;
      }

      function initialiseMedia (mediaType, url, mediaMimeType) {
        if (getState() === MediaPlayerBase.STATE.EMPTY) {
          type = mediaType;
          source = url;
          mimeType = mediaMimeType;
          registerEventHandlers();
          toStopped();
        } else {
          toError('Cannot set source unless in the \'' + MediaPlayerBase.STATE.EMPTY + '\' state');
        }
      }

      function resume () {
        postBufferingState = MediaPlayerBase.STATE.PLAYING;
        switch (getState()) {
          case MediaPlayerBase.STATE.PLAYING:
            break;

          case MediaPlayerBase.STATE.BUFFERING:
            if (tryingToPause) {
              tryingToPause = false;
              toPlaying();
            }
            break;

          case MediaPlayerBase.STATE.PAUSED:
            playerPlugin.Resume();
            toPlaying();
            break;

          default:
            toError('Cannot resume while in the \'' + getState() + '\' state');
            break;
        }
      }

      function playFrom (seconds) {
        postBufferingState = MediaPlayerBase.STATE.PLAYING;
        var seekingTo = range ? getClampedTimeForPlayFrom(seconds) : seconds;

        switch (getState()) {
          case MediaPlayerBase.STATE.BUFFERING:
            deferSeekingTo = seekingTo;
            break;

          case MediaPlayerBase.STATE.PLAYING:
            toBuffering();
            if (!currentTimeKnown) {
              deferSeekingTo = seekingTo;
            } else if (isNearToCurrentTime(seekingTo)) {
              toPlaying();
            } else {
              seekToWithFailureStateTransition(seekingTo);
            }
            break;

          case MediaPlayerBase.STATE.PAUSED:
            toBuffering();
            if (!currentTimeKnown) {
              deferSeekingTo = seekingTo;
            } else if (isNearToCurrentTime(seekingTo)) {
              playerPlugin.Resume();
              toPlaying();
            } else {
              seekToWithFailureStateTransition(seekingTo);
              playerPlugin.Resume();
            }
            break;

          case MediaPlayerBase.STATE.COMPLETE:
            playerPlugin.Stop();
            setDisplayFullScreenForVideo();
            playerPlugin.ResumePlay(wrappedSource(), seekingTo);
            toBuffering();
            break;

          default:
            toError('Cannot playFrom while in the \'' + getState() + '\' state');
            break;
        }
      }

      function beginPlayback () {
        postBufferingState = MediaPlayerBase.STATE.PLAYING;
        switch (getState()) {
          case MediaPlayerBase.STATE.STOPPED:
            toBuffering();
            setDisplayFullScreenForVideo();
            playerPlugin.Play(wrappedSource());
            break;

          default:
            toError('Cannot beginPlayback while in the \'' + getState() + '\' state');
            break;
        }
      }

      function beginPlaybackFrom (seconds) {
        postBufferingState = MediaPlayerBase.STATE.PLAYING;
        var seekingTo = range ? getClampedTimeForPlayFrom(seconds) : seconds;

        switch (getState()) {
          case MediaPlayerBase.STATE.STOPPED:
            setDisplayFullScreenForVideo();
            playerPlugin.ResumePlay(wrappedSource(), seekingTo);
            toBuffering();
            break;

          default:
            toError('Cannot beginPlayback while in the \'' + getState() + '\' state');
            break;
        }
      }

      function pause () {
        postBufferingState = MediaPlayerBase.STATE.PAUSED;
        switch (getState()) {
          case MediaPlayerBase.STATE.BUFFERING:
          case MediaPlayerBase.STATE.PAUSED:
            break;

          case MediaPlayerBase.STATE.PLAYING:
            tryPauseWithStateTransition();
            break;

          default:
            toError('Cannot pause while in the \'' + getState() + '\' state');
            break;
        }
      }

      function stop () {
        switch (getState()) {
          case MediaPlayerBase.STATE.STOPPED:
            break;

          case MediaPlayerBase.STATE.BUFFERING:
          case MediaPlayerBase.STATE.PLAYING:
          case MediaPlayerBase.STATE.PAUSED:
          case MediaPlayerBase.STATE.COMPLETE:
            stopPlayer();
            toStopped();
            break;

          default:
            toError('Cannot stop while in the \'' + getState() + '\' state');
            break;
        }
      }

      function reset () {
        switch (getState()) {
          case MediaPlayerBase.STATE.EMPTY:
            break;

          case MediaPlayerBase.STATE.STOPPED:
          case MediaPlayerBase.STATE.ERROR:
            toEmpty();
            break;

          default:
            toError('Cannot reset while in the \'' + getState() + '\' state');
            break;
        }
      }

      function emitEvent (eventType, eventLabels) {
        var event = {
          type: eventType,
          currentTime: getCurrentTime(),
          seekableRange: getSeekableRange(),
          duration: getDuration(),
          url: getSource(),
          mimeType: getMimeType(),
          state: getState()
        };

        if (eventLabels) {
          for (var key in eventLabels) {
            if (eventLabels.hasOwnProperty(key)) {
              event[key] = eventLabels[key];
            }
          }
        }

        for (var index = 0; index < eventCallbacks.length; index++) {
          eventCallbacks[index](event);
        }
      }

      function addEventCallback (thisArg, newCallback) {
        eventCallback = function (event) {
          newCallback.call(thisArg, event);
        };
        eventCallbacks.push(eventCallback);
      }

      function removeEventCallback (callback) {
        var index = eventCallbacks.indexOf(callback);
        if (index !== -1) {
          eventCallbacks.splice(index, 1);
        }
      }

      function removeAllEventCallbacks () {
        eventCallbacks = undefined;
      }

      /**
        * Check whether a time value is near to the current media play time.
        * @param {Number} seconds The time value to test, in seconds from the start of the media
        * @protected
      */
      function isNearToCurrentTime (seconds) {
        var currentTime = getCurrentTime();
        var targetTime = getClampedTime(seconds);
        return Math.abs(currentTime - targetTime) <= CURRENT_TIME_TOLERANCE;
      }

      /**
        * Clamp a time value so it does not exceed the current range.
        * Clamps to near the end instead of the end itself to allow for devices that cannot seek to the very end of the media.
        * @param {Number} seconds The time value to clamp in seconds from the start of the media
        * @protected
      */
      function getClampedTime (seconds) {
        var range = getSeekableRange();
        var offsetFromEnd = getClampOffsetFromConfig();
        var nearToEnd = Math.max(range.end - offsetFromEnd, range.start);
        if (seconds < range.start) {
          return range.start;
        } else if (seconds > nearToEnd) {
          return nearToEnd;
        } else {
          return seconds;
        }
      }

      var CLAMP_OFFSET_FROM_END_OF_RANGE = 1.1;

      function getClampOffsetFromConfig () {
        var clampOffsetFromEndOfRange;

        // TODO: can we tidy this, is it needed any more? If so we can combine it into bigscreen-player configs
        // if (config && config.streaming && config.streaming.overrides) {
        //   clampOffsetFromEndOfRange = config.streaming.overrides.clampOffsetFromEndOfRange;
        // }

        if (clampOffsetFromEndOfRange !== undefined) {
          return clampOffsetFromEndOfRange;
        } else {
          return CLAMP_OFFSET_FROM_END_OF_RANGE;
        }
      }

      return function (newDevice) {
        device = newDevice;
        return {
          initialiseMedia: initialiseMedia,
          resume: resume,
          pause: pause,
          stop: stop,
          reset: reset,
          playFrom: playFrom,
          beginPlayback: beginPlayback,
          beginPlaybackFrom: beginPlaybackFrom,
          getCurrentTime: getCurrentTime,
          getSource: getSource,
          getMimeType: getMimeType,
          getState: getState,
          getPlayerElement: getPlayerElement,
          getSeekableRange: getSeekableRange,
          getDuration: getDuration,
          addEventCallback: addEventCallback,
          removeEventCallback: removeEventCallback,
          removeAllEventCallbacks: removeAllEventCallbacks
        };
      };
    }
);
