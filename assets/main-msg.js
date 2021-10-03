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
  const MSG_LS_KEY = 'coderain-msg';
  const PROMPT_TIMEOUT = 2500;

  /**
   * vars
   */
  let promptMsgTimeout = null;

  /**
   * View helpers
   */
  const applyMsg = (msg = '') => {
    if (typeof msg !== 'string') {
      return;
    }

    const msgText = msg.trim();
    msgNode.textContent = msgText;

    if (msgText.length === 0) {
      localStorage.removeItem(MSG_LS_KEY);
    } else {
      localStorage.setItem(MSG_LS_KEY, msgText);
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
    // try get message from search query param
    const searchParams = new URLSearchParams(win.location.search);
    const searchMsgText = searchParams.get(MSG_PARAM); // null|string
    // try get message from LS
    const lsMsgText = localStorage.getItem(MSG_LS_KEY); // null|string

    let msgText;
    if (searchMsgText === null) {
      msgText = lsMsgText || '';
    } else {
      msgText = searchMsgText;
    }
    applyMsg(msgText);
  };
  const promptMsgCB = () => {
    clearMsg();
    promptMsgTimeout = null;
  };
  const promptMsg = (msg = '') => {
    if (typeof msg !== 'string' || !msg.trim().length) {
      return;
    }
    clearTimeout(promptMsgTimeout);
    applyMsg(msg);
    promptMsgTimeout = setTimeout(promptMsgCB, PROMPT_TIMEOUT);
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

    // return module interface
    win.MSG = win.MSG || {};
    win.MSG.applyMsg = applyMsg;
    win.MSG.clearMsg = clearMsg;
    win.MSG.promptMsg = promptMsg;
  };
  init();
})();
