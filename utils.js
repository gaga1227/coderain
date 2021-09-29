/**
 * throttle
 * - https://stackoverflow.com/questions/27078285/simple-throttle-in-javascript
 */
const throttle = (callback, limit) => {
  var waiting = false;
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
