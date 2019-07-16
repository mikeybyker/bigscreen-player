require(
  [
    'bigscreenplayer/playbackstrategy/modifiers/mediaplayerbase',
    'bigscreenplayer/playbackstrategy/faketime'
  ],
    function (MediaPlayerBase, FakeTime) {
      describe('Fake time', function () {
        var fakeTime;

        beforeEach(function () {
          jasmine.clock().install();
          jasmine.clock().mockDate();

          fakeTime = FakeTime();
        });

        afterEach(function () {
          jasmine.clock().uninstall();
        });

        describe('getCurrentTime', function () {
          it('should increase when playing', function () {
            fakeTime.setCurrentTime(10);
            fakeTime.update({ state: MediaPlayerBase.STATE.PLAYING });

            jasmine.clock().tick(1000);

            fakeTime.update({ state: MediaPlayerBase.STATE.PLAYING });

            expect(fakeTime.getCurrentTime()).toBe(11);
          });

          it('should not increase when paused', function () {
            fakeTime.setCurrentTime(10);
            fakeTime.update({ state: MediaPlayerBase.STATE.PAUSED });

            jasmine.clock().tick(1000);

            fakeTime.update({ state: MediaPlayerBase.STATE.PLAYING });

            expect(fakeTime.getCurrentTime()).toBe(10);
          });
        });
      });
    }
);
