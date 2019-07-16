/*
 *  playable live modfifier is just a wrapper around html5
 *  So no further logical testing is required for unit tests
 *  providing that hml5 is properly tested
 */

require(
  [
    'bigscreenplayer/playbackstrategy/modifiers/mediaplayerbase',
    'bigscreenplayer/playbackstrategy/modifiers/live/playable',
    'squire'
  ],
    function (MediaPlayerBase, PlayableMediaPlayer, Squire) {
      var sourceContainer = document.createElement('div');
      var injector = new Squire();
      var player;
      var playableMediaPlayer;

      function wrapperTests (action, expectedReturn) {
        if (expectedReturn) {
          player[action].and.returnValue(expectedReturn);

          expect(playableMediaPlayer[action]()).toBe(expectedReturn);
        } else {
          playableMediaPlayer[action]();

          expect(player[action]).toHaveBeenCalledTimes(1);
        }
      }

      function isUndefined (action) {
        expect(playableMediaPlayer[action]).not.toBeDefined();
      }

      describe('Playable HMTL5 Live Player', function () {
        beforeEach(function () {
          player = jasmine.createSpyObj('player',
            ['beginPlayback', 'initialiseMedia', 'stop', 'reset', 'getState', 'getSource', 'getMimeType',
              'addEventCallback', 'removeEventCallback', 'removeAllEventCallbacks', 'getPlayerElement']);

          playableMediaPlayer = PlayableMediaPlayer(player, undefined, undefined, {windowStartTime: 0, windowEndTime: 100000});
        });

        it('calls beginPlayback on the media player', function () {
          wrapperTests('beginPlayback');
        });

        it('calls initialiseMedia on the media player', function () {
          wrapperTests('initialiseMedia');
        });

        it('calls stop on the media player', function () {
          wrapperTests('stop');
        });

        it('calls reset on the media player', function () {
          wrapperTests('reset');
        });

        it('calls getState on the media player', function () {
          wrapperTests('getState', 'thisState');
        });

        it('calls getSource on the media player', function () {
          wrapperTests('getSource', 'thisSource');
        });

        it('calls getMimeType on the media player', function () {
          wrapperTests('getMimeType', 'thisMimeType');
        });

        it('calls removeAllEventCallbacks on the media player', function () {
          wrapperTests('removeAllEventCallbacks');
        });

        it('calls getPlayerElement on the media player', function () {
          wrapperTests('getPlayerElement', 'thisPlayerElement');
        });

        describe('getCurrentTime', function () {
          var timeUpdates = [];
          var playableStrategy;
          var mockFakeTime;

          function timeUpdate (opts) {
            timeUpdates.forEach(function (fn) { fn(opts); });
          }

          beforeEach(function (done) {
            mockFakeTime = jasmine.createSpyObj('faketime', ['getCurrentTime', 'setCurrentTime', 'update']);

            player.addEventCallback.and.callFake(function (self, callback) {
              timeUpdates.push(callback);
            });

            injector.mock({'bigscreenplayer/playbackstrategy/faketime': function () {
              return mockFakeTime;
            }});

            injector.require(['bigscreenplayer/playbackstrategy/modifiers/live/playable'], function (Playable) {
              playableStrategy = Playable(player, undefined, undefined, {windowStartTime: 0, windowEndTime: 100000});
              done();
            });
          });

          it('should call faketimer.getCurrentTime', function () {
            playableStrategy.getCurrentTime();

            expect(mockFakeTime.getCurrentTime).toHaveBeenCalledWith();
          });

          it('should call faketimer.setCurrentTime when calling beginPlayback', function () {
            playableStrategy.beginPlayback();

            expect(mockFakeTime.setCurrentTime).toHaveBeenCalledWith(100);
          });

          it('should call faketimer.update when an event occurs', function () {
            var event = { state: MediaPlayerBase.STATE.PLAYING };

            timeUpdate(event);

            expect(mockFakeTime.update).toHaveBeenCalledWith(event);
          });

          describe('should alter callbacks', function () {
            it('calls addEventCallback on the media player', function () {
              var thisArg = 'arg';
              var callback = function () { return; };
              playableStrategy.addEventCallback(thisArg, callback);

              expect(player.addEventCallback).toHaveBeenCalledWith(thisArg, jasmine.any(Function));

              timeUpdate({ state: MediaPlayerBase.STATE.PLAYING });

              expect(mockFakeTime.getCurrentTime).toHaveBeenCalledWith();
            });

            it('calls removeEventCallback on the media player', function () {
              var thisArg = 'arg';
              var callback = function () { return; };
              playableStrategy.addEventCallback(thisArg, callback);
              playableStrategy.removeEventCallback(thisArg, callback);

              expect(player.removeEventCallback).toHaveBeenCalledWith(thisArg, jasmine.any(Function));
            });
          });
        });

        describe('should not have methods for', function () {
          it('beginPlaybackFrom', function () {
            isUndefined('beginPlaybackFrom');
          });

          it('playFrom', function () {
            isUndefined('playFrom');
          });

          it('pause', function () {
            isUndefined('pause');
          });

          it('resume', function () {
            isUndefined('resume');
          });

          it('getSeekableRange', function () {
            isUndefined('getSeekableRange');
          });
        });

        describe('calls the mediaplayer with the correct media Type', function () {
          it('when is an audio stream', function () {
            var mediaType = MediaPlayerBase.TYPE.AUDIO;
            playableMediaPlayer.initialiseMedia(mediaType, null, null, sourceContainer, null);

            expect(player.initialiseMedia).toHaveBeenCalledWith(MediaPlayerBase.TYPE.LIVE_AUDIO, null, null, sourceContainer, null);
          });

          it('when is an video stream', function () {
            var mediaType = MediaPlayerBase.TYPE.VIDEO;
            playableMediaPlayer.initialiseMedia(mediaType, null, null, sourceContainer, null);

            expect(player.initialiseMedia).toHaveBeenCalledWith(MediaPlayerBase.TYPE.LIVE_VIDEO, null, null, sourceContainer, null);
          });
        });
      });
    });
