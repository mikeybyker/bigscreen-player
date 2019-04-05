define('bigscreenplayer/playbackstrategy/nativestrategy',
  [
    'bigscreenplayer/playbackstrategy/legacyplayeradapter',
    'bigscreenplayer/models/windowtypes',
    'bigscreenplayer/playbackstrategy/modifiers/html5',
    'bigscreenplayer/playbackstrategy/modifiers/live/' + (window.bigscreenPlayer.liveSupport || 'playable')
  ],
  function (LegacyAdapter, WindowTypes, Html5Player, LivePlayer) {
    return function (windowType, mediaKind, timeData, playbackElement, isUHD, device) {
      var mediaPlayer;
      function noop () {}

      var logger = {
        info: noop,
        error: noop,
        log: noop
      };

      var tempConfig = {};

      if (windowType !== WindowTypes.STATIC) {
        mediaPlayer = LivePlayer(tempConfig, logger);
      } else {
        mediaPlayer = Html5Player(logger);
      }

      return LegacyAdapter(windowType, mediaKind, timeData, playbackElement, isUHD, {}, mediaPlayer);
    };
  });
