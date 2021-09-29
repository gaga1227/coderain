/**
 * msg module
 */
(function msgModule() {
  const doc = document;
  const msgNode = doc.querySelector('#msgNode');

  if (msgNode === null) {
    return;
  }

  const clearMsg = () => {
    msgNode.textContent = '';
  };
  const clearFromHead = () => {
    const msgText = msgNode.textContent || '';
    msgNode.textContent = msgText.substring(1);
  };
  const clearFromTail = () => {
    const msgText = msgNode.textContent || '';
    msgNode.textContent = msgText.slice(0, -1);
  };
  const appendMsg = (e) => {
    const newChar = e.key || '';
    // only allow intended keys
    if (newChar.length === 1) {
      msgNode.textContent += newChar;
    }
  };

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
        appendMsg(e);
    }
  };
  doc.addEventListener('keyup', handleGlobalKeyUp);
  doc.addEventListener('keydown', handleGlobalKeyDown);
})();
