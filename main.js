/**
 * constants
 */
const GLYPHS = 'qwertyuiopasdfghjklzxcvbnm.:"*<>|123457890-_=+QWERTYUIOP '.split('');

/**
 * configs
 */
const getConfigs = () => {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const letterSize = winW > 600 ? 15 : 13;
  const letterSpacing = letterSize * 1.3;
  const streamDensityXRatio = 0.75; // 1 will fill whole screen
  const totalStreams = Math.floor((winW / letterSize) * streamDensityXRatio);
  const streamLengthMin = 8;
  const streamLengthMax = Math.floor((winH / letterSpacing) * streamDensityXRatio);
  const speedMin = 1;
  const speedMax = speedMin * 6;

  return {
    DEBUG: true, //false
    FRAMERATE: 60,
    TOTAL_STREAMS: totalStreams,
    LETTER_SIZE: letterSize,
    LETTER_SPACING: letterSpacing,
    SPEED_MIN: speedMin,
    SPEED_MAX: speedMax,
    STREAM_LENGTH_MIN: streamLengthMin,
    STREAM_LENGTH_MAX: streamLengthMax,
    COLOR_FIRST: [200, 255, 200],
    COLOR_REST: [3, 160, 98],
    DEPTH_ALPHA_OFFSET_RATIO: 0.5, // 0 (no effect) ~ 1 (full effect): controls how subtle the depth alpha offset is
    GLYPHS,
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

  draw(index) {
    textSize(this.size);
    const fillAlpha = this.getFillAlpha(index);

    if (index === 0) {
      fill(...CONFIGS.COLOR_FIRST, fillAlpha);
    } else {
      // fade it out more when it's towards then end
      fill(...CONFIGS.COLOR_REST, fillAlpha);
    }

    text(
      this.char,
      this.x,
      this.y
    );
  }

  moveTo(deltaY = 0) {
    this.y = deltaY;
  }

  switch() {
    this.char = Letter.getChar();
  }

  getFillAlpha(charIndex) {
    const baseAlpha = Math.round(255 * this.depth / CONFIGS.DEPTH_ALPHA_OFFSET_RATIO);
    const sequentialAlphaOffset = Math.round(baseAlpha / this.streamLength * charIndex);
    const alpha = charIndex === 0
      ? baseAlpha
      : baseAlpha - sequentialAlphaOffset;

    return alpha > 0 ? alpha : 0;
  }

  // return random char from katakana sequence
  // TODO: draw from rendered graphic buffer
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
    this.streamLength = streamLength;
    this.depth = Stream.getDepth(speed);

    this.regenerateLetters();
  }

  // returns simulated z depth ratio for stream based on speed (0 ~ 1)
  // - fast is closer
  // - slower is further
  static getDepth(speed) {
    return (speed - CONFIGS.SPEED_MIN) / (CONFIGS.SPEED_MAX - CONFIGS.SPEED_MIN);
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

  draw() {
    // Update the position
    this.update();

    // Draw each letter
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

  update() {
    // Add the speed to the stream head position
    this.y += this.speed;

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
      posY: Math.floor(random(1, height)),
      streamLength: Math.floor(random(CONFIGS.STREAM_LENGTH_MIN, CONFIGS.STREAM_LENGTH_MAX)),
      speed: random(CONFIGS.SPEED_MIN, CONFIGS.SPEED_MAX),
    };
    streamList.push(new Stream(newStreamConfig));
  }

  return streamList;
};

/**
 * Init
 */
const debugNode = document.querySelector('#debugNode');

let CONFIGS = null;
let rainStreams = null;
let renderer = null;
let codeFont = null;

/**
 * P5 - preload
 */
function preload() {
  codeFont = loadFont('assets/matrix-code.ttf');
}

/**
 * P5 - setup
 */
function setup() {
  CONFIGS = getConfigs();

  renderer = createCanvas(window.innerWidth, window.innerHeight);
  renderer.id('renderer');
  frameRate(CONFIGS.FRAMERATE);
  textFont(codeFont);
  textStyle(BOLD);
  noStroke();
  rainStreams = [...initStreams()];
}

/**
 * P5 - draw
 * - runs continuously after setup()
 * - frequency controlled by frameRate()
 */
function draw() {
  if (CONFIGS.DEBUG) {
    debugNode.textContent = '' + Math.round(frameRate());
  }

  clear();
  rainStreams.forEach(s => s.draw()); // draw all streams
}

/**
 * P5 - windowResized
 */
function windowResized() {
  CONFIGS = getConfigs();

  renderer = resizeCanvas(window.innerWidth, window.innerHeight);
  rainStreams = [...initStreams()];
}
