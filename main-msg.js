/**
 * msg module
 */
(function msgModule() {
  const win = window;
  const doc = document;
  const msgNode = doc.querySelector('#msgNode');
  if (msgNode === null) {
    return;
  }

  /**
   * Constants
   */
  const MSG_PARAM = 'msg';

  /**
   * View utils
   */
  const applyMsg = (msg = '') => {
    if (typeof msg === 'string' && msg.trim().length >= 0) {
      msgNode.textContent = msg;
    }
  };
  const clearMsg = () => {
    applyMsg();
  };
  const clearFromHead = () => {
    const msgText = msgNode.textContent || '';
    applyMsg(msgText.substring(1));
  };
  const clearFromTail = () => {
    const msgText = msgNode.textContent || '';
    applyMsg(msgText.slice(0, -1));
  };

  /**
   * View methods
   */
  const applyInputMsg = (e) => {
    const newChar = e.key || '';
    // only allow intended keys
    if (newChar.length === 1) {
      applyMsg(msgNode.textContent + newChar);
    }
  };
  const applyDefaultMsg = () => {
    let msgText;

    // try get message from query param
    const searchParams = new URLSearchParams(win.location.search);
    msgText = searchParams.get(MSG_PARAM) || '';

    applyMsg(msgText);
  };

  /**
   * Event handlers
   */
  const handleGlobalKeyUp = (e) => {
    switch (e.keyCode) {
      // escape
      case 27:
        clearMsg();
        break;
      // all others
      default:
    }
  };
  const handleGlobalKeyDown = (e) => {
    switch (e.keyCode) {
      // backspace
      case 8:
      // delete
      case 46:
        clearFromTail();
        break;
      // all others
      default:
        applyInputMsg(e);
    }
  };

  /**
   * Init
   */
  const init = () => {
    // apply default given message text if any
    applyDefaultMsg();

    // register message inputs
    doc.addEventListener('keyup', handleGlobalKeyUp);
    doc.addEventListener('keydown', handleGlobalKeyDown);
  };
  init();
})();
