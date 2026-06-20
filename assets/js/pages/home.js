(function () {
  var onReady = window.WATELI && window.WATELI.utils && window.WATELI.utils.onReady
    ? window.WATELI.utils.onReady
    : function (callback) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
          callback();
        }
      };

  function initMobileHeroCarousel() {
    var hero = document.querySelector('[data-mobile-hero-carousel]');
    if (!hero) return;

    var track = hero.querySelector('.home-mobile-hero__track');
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-mobile-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-mobile-hero-dot]'));

    if (!track || slides.length < 2 || dots.length !== slides.length) return;

    var rafId = null;
    var timer = null;
    var interval = 4000;

    function setActive(index) {
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        var active = dotIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }

    function getActiveIndex() {
      var width = track.clientWidth || 1;
      return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / width)));
    }

    function goTo(index, behavior) {
      track.scrollTo({
        left: index * track.clientWidth,
        behavior: behavior || 'smooth'
      });
      setActive(index);
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      timer = window.setInterval(function () {
        var next = (getActiveIndex() + 1) % slides.length;
        goTo(next, 'smooth');
      }, interval);
    }

    function restartAutoplay() {
      startAutoplay();
    }

    function syncActiveDot() {
      rafId = null;
      setActive(getActiveIndex());
    }

    track.addEventListener('scroll', function () {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(syncActiveDot);
      }
      restartAutoplay();
    }, { passive: true });

    window.addEventListener('resize', function () {
      goTo(getActiveIndex(), 'auto');
      restartAutoplay();
    }, { passive: true });

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        goTo(index, 'smooth');
        restartAutoplay();
      });
    });

    setActive(0);
    startAutoplay();
  }

  onReady(function () {
    initMobileHeroCarousel();
  });
})();
