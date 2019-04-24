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

      var logger = device ? device.getLogger() : {
        info: noop,
        error: noop,
        log: noop
      };

      var config = device ? device.getConfig() : {};

      if (windowType !== WindowTypes.STATIC) {
        mediaPlayer = LivePlayer(config, logger);
      } else {
        mediaPlayer = Html5Player(logger);
      }

      return LegacyAdapter(windowType, mediaKind, timeData, playbackElement, isUHD, config, mediaPlayer);
    };
  });
