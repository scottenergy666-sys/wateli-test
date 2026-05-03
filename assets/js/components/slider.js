(function () {
  const { onReady } = window.WATELI.utils;

  function initSlider(slider) {
    const track = slider.querySelector('[data-slider-track]');
    const prev = slider.querySelector('[data-slider-prev]');
    const next = slider.querySelector('[data-slider-next]');
    if (!track || !prev || !next) return;

    const step = () => Math.max(track.clientWidth * 0.86, 280);
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  }

  onReady(() => {
    document.querySelectorAll('[data-slider]').forEach(initSlider);
  });
})();
