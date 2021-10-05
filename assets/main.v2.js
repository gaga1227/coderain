/**
 * constants
 */
const ENV = {
  isFirefox: isFirefox(),
  isTouchDevice: isTouchDevice(),
};
const GLYPHS = 'qwertyuiopasdfghjklzxcvbnm.:"*<>|123457890-_=+QWERTYUIOP '.split('');

/**
 * settings
 */
const SETTINGS = [
  {speed: 1, prompt: 'default'}, // default
  {speed: 1.6, prompt: 'warming up'},
  {speed: 3, prompt: 'let it rain'},
  {speed: 6, prompt: 'john wick'},
  {speed: 12, prompt: 'warp'},
];
const prevSetting = () => {
  const currentSetting = CONFIGS.SETTING;
  CONFIGS.SETTING = currentSetting === 0 ? SETTINGS.length - 1 : currentSetting - 1;
  MSG.promptMsg(SETTINGS[CONFIGS.SETTING].prompt);
  return CONFIGS.SETTING;
};
const nextSetting = () => {
  const currentSetting = CONFIGS.SETTING;
  CONFIGS.SETTING = (currentSetting === SETTINGS.length - 1) ? 0 : currentSetting + 1;
  MSG.promptMsg(SETTINGS[CONFIGS.SETTING].prompt);
  return CONFIGS.SETTING;
};

/**
 * configs
 */
const getConfigs = () => {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const letterSize = winW >= 600 ? 15 : 13;
  const letterSpacing = letterSize * 1.3;
  const streamDensityX = 0.75; // 0 (no effect) ~ 1 (full effect): controls streams density horizontally
  const streamLengthMin = 8;
  const streamLengthMax = Math.floor((winH / letterSpacing) * streamDensityX);
  const totalStreams = Math.floor((winW / letterSize) * streamDensityX);
  const speedMin = 1;
  const speedMax = speedMin * 6;

  return {
    // main
    DEBUG: false,
    FRAMERATE: 60,
    SHAKEN_THRESH: 30,

    // setting
    SETTING: 0,

    // letter
    GLYPHS,
    FONT: codeFont.font.names.fontFamily.en,
    LETTER_SIZE: letterSize,
    LETTER_SPACING: letterSpacing,
    COLOR_FIRST: [200, 255, 200],
    COLOR_REST: [3, 160, 98],
    GLOW_COLOR: [0, 255, 100, 0.7],
    GLOW_LEVEL: letterSize,
    DEPTH_ALPHA_OFFSET_RATIO: 0.5, // 0 (no effect) ~ 1 (full effect): controls depth based alpha offset

    // stream
    STREAM_LENGTH_MIN: streamLengthMin,
    STREAM_LENGTH_MAX: streamLengthMax,
    TOTAL_STREAMS: totalStreams,
    SPEED_MIN: speedMin,
    SPEED_MAX: speedMax,
  };
};

/**
 * class - Letter
 */
class Letter {
  constructor({posX, posY, size, char, depth, streamLength}) {
    this.x = posX;
    this.y = posY;
    this.size = size;
    this.char = char;
    this.depth = depth;
    this.streamLength = streamLength;
  }

  static getChar() {
    const charIndex = Math.round(random(0, CONFIGS.GLYPHS.length - 1));
    return CONFIGS.GLYPHS[charIndex];
  }

  static getNonDuplicateChar(previousChar) {
    let char = Letter.getChar();
    while (char === previousChar) {
      char = Letter.getChar();
    }
    return char;
  }

  /**
   * getFillAlpha
   * @param charIndex - index of char from its stream sequence
   * @param charDepth - simulated z depth from its stream sequence
   * @param streamLength - letter sequence's length
   * @returns {number} - fill alpha value for letter instances
   */
  static getFillAlpha(charIndex, charDepth, streamLength) {
    const baseAlpha = Math.round(255 * charDepth / CONFIGS.DEPTH_ALPHA_OFFSET_RATIO);
    const sequentialAlphaOffset = Math.round(baseAlpha / streamLength * charIndex);
    const alpha = charIndex === 0
      ? baseAlpha
      : baseAlpha - sequentialAlphaOffset;

    return alpha > 0 ? alpha : 0;
  }

  draw(index) {
    const fillAlpha = Letter.getFillAlpha(index, this.depth, this.streamLength);
    if (index === 0) {
      fill(...CONFIGS.COLOR_FIRST, fillAlpha);
    } else {
      // fade the stream sequence towards the end
      fill(...CONFIGS.COLOR_REST, fillAlpha);
    }

    // use native canvas drawing API for better performance
    rendererCtx.font = `${this.size}px '${CONFIGS.FONT}'`;
    rendererCtx.fillText(this.char, this.x, this.y);
  }

  moveTo(deltaY = 0) {
    this.y = deltaY;
  }

  switch() {
    this.char = Letter.getChar();
  }
}

/**
 * class - Stream
 */
class Stream {
  constructor({posX, posY, speed, streamLength}) {
    this.letters = [];
    this.letterSize = CONFIGS.LETTER_SIZE;
    this.letterSpacing = CONFIGS.LETTER_SPACING;

    this.x = posX;
    this.y = posY;
    this.speed = speed;
    this.depth = Stream.getDepth(speed);
    this.streamLength = streamLength;

    this.regenerateLetters();
  }

  /**
   * getDepth
   * - fast is closer
   * - slower is further
   * @param speed - stream moving speed
   * @returns {number} - (0 ~ 1) simulated z depth ratio based on speed
   */
  static getDepth(speed) {
    return (speed - CONFIGS.SPEED_MIN) / (CONFIGS.SPEED_MAX - CONFIGS.SPEED_MIN);
  }

  /**
   * getSpeed
   * @param speed - stream default speed value
   */
  static getSpeed(speed) {
    return speed * SETTINGS[CONFIGS.SETTING].speed;
  }

  regenerateLetters() {
    this.letters = [];

    for (let i = 0; i < this.streamLength; i++) {
      const previousChar = this.letters[i - 1] ? this.letters[i - 1].char : '';
      const newLetterConfig = {
        posX: this.x,
        posY: this.y - i * this.letterSpacing,
        depth: this.depth,
        size: this.letterSize,
        streamLength: this.streamLength,
        char: Letter.getNonDuplicateChar(previousChar),
      };
      const newLetter = new Letter(newLetterConfig);
      this.letters.push(newLetter);
    }
  }

  update() {
    // Add the speed to the stream head position
    this.y += Stream.getSpeed(this.speed);

    // If there is enough space for the stream to move another downward step
    // this moves the stream downward
    // update all letters with new posY
    this.letters.forEach((letter, idx) => {
      const deltaY = this.y - idx * this.letterSpacing;
      letter.moveTo(deltaY);
    });

    // If the last character has gone off the screen
    // this reset the stream back to top of screen
    if (this.letters[this.letters.length - 1].y > height + this.letterSize) {
      // Reset the head to the top of the screen
      this.y = 0;

      // Regenerate letters as all x values will change
      this.regenerateLetters();
    }
  }

  draw() {
    // Update and draw all letters
    this.update();
    this.letters.forEach((letter, idx) => letter.draw(idx));

    // randomly switch first letter
    const randomChance = random(0, 1);
    if (randomChance < 0.1) {
      this.letters[0].switch();
    }
    // randomly switch a non-first letter
    else if (randomChance < 0.5) {
      const letterToSwitch = floor(random(1, this.letters.length)); // starts from 1
      this.letters[letterToSwitch].switch();
    }
  }
}

/**
 * initStreams
 * @returns {[]} - stream list to draw
 */
const initStreams = () => {
  const streamList = [];
  const posXSlotSize = Math.floor(width / CONFIGS.TOTAL_STREAMS);
  const posXOffset = (posXSlotSize - CONFIGS.LETTER_SIZE) / 2;

  for (let i = 0; i < CONFIGS.TOTAL_STREAMS; i++) {
    const newStreamConfig = {
      posXSlot: i,
      posX: i * posXSlotSize + posXOffset,
      posY: CONFIGS.LETTER_SPACING * -2, // so streams will rain down from top edge
      streamLength: Math.floor(random(CONFIGS.STREAM_LENGTH_MIN, CONFIGS.STREAM_LENGTH_MAX)),
      speed: random(CONFIGS.SPEED_MIN, CONFIGS.SPEED_MAX),
    };
    streamList.push(new Stream(newStreamConfig));
  }

  return streamList;
};

/**
 * Event handlers
 */
const handleDocMouseUp = (e) => {
  // FireFox crashes with 'shadowBlur', disabled
  !ENV.isFirefox && (rendererCtx.shadowBlur = 0);
};
const handleDocMouseDown = (e) => {
  // FireFox crashes with 'shadowBlur', disabled
  !ENV.isFirefox && (rendererCtx.shadowBlur = CONFIGS.GLOW_LEVEL);
};
const handleDocClick = (e) => {
  // TODO: use 'prevSetting' depends on screen location
  nextSetting();
};

/**
 * Debug
 */
const handleDebugNodeClick = (e) => {
  e.stopPropagation();
  CONFIGS.DEBUG = !CONFIGS.DEBUG;
  debugNode.setAttribute('data-enabled', CONFIGS.DEBUG ? 'true' : 'false');
};
const debugNode = document.querySelector('#debugNode');
debugNode.addEventListener('click', handleDebugNodeClick);

/**
 * Init
 */
// TODO: move global vars inside an object
let CONFIGS = null;
let codeFont = null;
let rainStreams = null;
let renderer = null; // P5.js renderer
let rendererCtx = null; // native canvas 2D context

/**
 * P5 - preload
 */
function preload() {
  codeFont = loadFont('../assets/matrix-code.ttf');
}

/**
 * P5 - setup
 */
function setup() {
  CONFIGS = getConfigs();

  // canvas
  renderer = createCanvas(window.innerWidth, window.innerHeight);
  renderer.id('mainRenderer');
  rendererCtx = renderer.canvas.getContext('2d');

  // global P5 setups
  setShakeThreshold(CONFIGS.SHAKEN_THRESH);
  frameRate(CONFIGS.FRAMERATE);
  noStroke();

  // global simulated glyph glow
  // Notes:
  // - affects render performance, but better than CSS filters
  // - off when 'shadowBlur' is 0
  // - FireFox crashes with 'shadowBlur', disabled
  !ENV.isFirefox && (rendererCtx.shadowColor = `rgba(${CONFIGS.GLOW_COLOR.join(', ')})`);

  // set up streams
  rainStreams = [...initStreams()];

  // event listeners
  if (ENV.isTouchDevice) {
    document.addEventListener('touchstart', handleDocMouseDown);
    document.addEventListener('touchend', handleDocMouseUp);
    document.addEventListener('touchcancel', handleDocMouseUp);
  } else {
    document.addEventListener('mousedown', handleDocMouseDown);
    document.addEventListener('mouseup', handleDocMouseUp);
    document.addEventListener('mouseout', handleDocMouseUp);
  }
  document.addEventListener('click', handleDocClick);
}

/**
 * P5 - draw
 * - runs continuously after setup()
 * - frequency controlled by frameRate()
 */
const drawFrameRate = throttle(() => {
  debugNode.textContent = '' + Math.round(frameRate());
}, 500);

function draw() {
  if (CONFIGS.DEBUG) {
    drawFrameRate();
  }

  clear();
  rainStreams.forEach(s => s.draw()); // redraw all streams
}

/**
 * P5 - windowResized
 */
const onWindowResize = debounce(() => {
  CONFIGS = getConfigs();

  renderer = resizeCanvas(window.innerWidth, window.innerHeight);
  rainStreams = [...initStreams()];

  // resume continuous drawing
  if (!isLooping()) {
    loop();
  }
}, 500);

function windowResized() {
  // pause continuous drawing
  if (isLooping()) {
    noLoop();
  }

  onWindowResize();
}

/**
 * P5 - deviceShaken
 */
function deviceShaken() {
  // reset setting
  CONFIGS.SETTING = 0;

  // reset view
  MSG.clearMsg();
  rainStreams = [...initStreams()];
}
