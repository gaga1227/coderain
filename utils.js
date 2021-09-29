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
