define([
  'bigscreenplayer/bigscreenplayer',
  'bigscreenplayer/models/windowtypes',
  'bigscreenplayer/debugger/debugtool',
  'bigscreenplayer/playbackspinner'
],
  function (BigscreenPlayer, WindowTypes, DebugTool, PlaybackSpinner) {

    var playbackElement = document.getElementById('videoContainer');
    var controlsElement = document.getElementById('bsp_controls');
    var playButton = document.getElementById('playButton');
    var pauseButton = document.getElementById('pauseButton');
    var seekForwardButton = document.getElementById('forwardButton');
    var seekBackButton = document.getElementById('backButton');
    var seekToEndButton = document.getElementById('seekEndButton');
    var debugToolButton = document.getElementById('toggleDebugToolButton');
    var controlsTimeout;

    // Create playback spinner
    var playbackSpinner = new PlaybackSpinner();

    // Set controls to invisible initially
    controlsElement.style.display = "none";

    // Toggle on screen playback controls
    function toggleControls() {
      controlsElement.style.display = controlsElement.style.display == "none" ? "block" : "none";
      if(controlsElement.style.display === "block") {
        playButton.focus();
      }
    }

    // Timeout feature for controls
    function startControlsTimeOut() {

      clearTimeout(controlsTimeout);

      if(controlsElement.style.display === "block") {
        controlsTimeout = setTimeout(function () {
          toggleControls();
        }, 5000);
      } else {
        toggleControls();
      }
    }

    // Create event listeners 
    function setupControls () {

      window.addEventListener('keydown', function() {
        startControlsTimeOut();
      });

      playButton.addEventListener('click', function () {
        bigscreenPlayer.play();
        startControlsTimeOut();
      });

      pauseButton.addEventListener('click', function () {
        bigscreenPlayer.pause();
        startControlsTimeOut();
      });

      seekForwardButton.addEventListener('click', function () {
        bigscreenPlayer.setCurrentTime(bigscreenPlayer.getCurrentTime() + 10);
        startControlsTimeOut();
      });

      seekBackButton.addEventListener('click', function () {
        bigscreenPlayer.setCurrentTime(bigscreenPlayer.getCurrentTime() - 10);
        startControlsTimeOut();
      });

      seekToEndButton.addEventListener('click', function () {
        bigscreenPlayer.setCurrentTime(bigscreenPlayer.getDuration() - 10);
        startControlsTimeOut();
      });

      debugToolButton.addEventListener('click', function () {
        DebugTool.toggleVisibility();
        startControlsTimeOut();
      });

      bigscreenPlayer.registerForTimeUpdates(function (event) {
      });

      bigscreenPlayer.registerForStateChanges(function (event) {
        var state = 'EMPTY';
        switch (event.state) {
          case 0: state = 'STOPPED'; break;
          case 1: state = 'PAUSED'; break;
          case 2: state = 'PLAYING'; break;
          case 4: state = 'WAITING'; break;
          case 5: state = 'ENDED'; break;
          case 6: state = 'FATAL_ERROR'; break;
        }
        if(state === 'WAITING') {
          playbackElement.appendChild(playbackSpinner);
        } else {
          playbackElement.removeChild(playbackSpinner);
        }
      });
    }

    // Create player instance
    var bigscreenPlayer = BigscreenPlayer();

    // Init UI controls
    setupControls();

    // Set initial focus
    playButton.focus();


    // Set the playback element size
    playbackElement.style.height =  window.innerHeight  / 4 + 'px';
    playbackElement.style.width = window.innerWidth / 4 + 'px';
    playbackElement.style.position = 'absolute';
    playbackElement.style.top = '0px';
    playbackElement.style.right = window.innnerWidth / 4 + 'px';

    // Create data source for bigscreen-plauer
    var minimalData = {
      media: {
        // type: 'application/x-mpegURL',
        type: 'video/mp4',
        urls: [
          {
            // Content from DASH IF testing assests (used in their reference player) 
            // https://reference.dashif.org/dash.js/v2.9.2/samples/dash-if-reference-player/index.htm
            // url: 'http://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
            url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd'
            // https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8
          }
        ]
      }
    };

    // Specify extra input args
    var windowType = WindowTypes.STATIC;
    var liveSupport = 'seekable';
    var enableSubtitles = false;

    // Initialise the player
    // At this point TAL environment can be injected, if needed
    bigscreenPlayer.init(playbackElement, minimalData, windowType, enableSubtitles, liveSupport);

  }
);
