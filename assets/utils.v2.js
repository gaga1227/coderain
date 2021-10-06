/**
 * throttle
 * - https://stackoverflow.com/questions/27078285/simple-throttle-in-javascript
 */
const throttle = (callback, limit) => {
  let waiting = false;
  return function () {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      setTimeout(function () {
        waiting = false;
      }, limit);
    }
  }
};

/**
 * debounce
 * - https://gist.github.com/nmsdvid/8807205
 */
const debounce = (func, wait, immediate) => {
  let timeout;
  return function () {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);
    if (immediate && !timeout) func.apply(context, args);
  };
};

/**
 * Env helpers
 */
const isTouchDevice = () => {
  return !!document && ('ontouchstart' in window || ('DocumentTouch' in window && document instanceof DocumentTouch));
};
const isFirefox = () => {
  const userAgent = (navigator && navigator.userAgent || '').toLowerCase();
  return userAgent.match(/(?:firefox|fxios)\/(\d+)/) !== null;
};

/**
 * roundDecimals
 */
const roundDecimals = (float = 0, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((float + Number.EPSILON) * factor) / factor;
};
