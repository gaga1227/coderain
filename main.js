// based on concept from https://codepen.io/cahil/pen/OwEeoe/

/**
 * configs
 */
const getConfigs = () => {
  const winW = window.innerWidth;
  const letterSize = winW > 600 ? 18 : 13;
  const letterSpacing = letterSize * 1.5; // integer
  const streamDensityXRatio = 0.75; // 1 will fill whole screen
  const totalStreams = Math.floor((winW / letterSize) * streamDensityXRatio);
  const speedMin = 6;
  const speedMax = speedMin * 6;
  const streamLength = 24; // TODO: based on height?

  return {
    DEBUG: true, //false
    FRAMERATE: 60,
    TOTAL_STREAMS: totalStreams,
    LETTER_SIZE: letterSize,
    LETTER_SPACING: letterSpacing,
    SPEED_MIN: speedMin,
    SPEED_MAX: speedMax,
    STREAM_LENGTH: streamLength,
    COLOR_FIRST: [200, 255, 200],
    COLOR_REST: [3, 160, 98],
    DEPTH_ALPHA_OFFSET_RATIO: 0.4, // 0 (no effect) ~ 1 (full effect): controls how subtle the depth alpha offset is
  };
};
let CONFIGS = getConfigs();

/**
 * class - Letter
 */
class Letter {
  constructor({posX, posY, size, char, depth}) {
    this.x = posX;
    this.y = posY;
    this.size = size;
    this.char = char;
    this.depth = depth;
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
    const sequentialAlphaOffset = Math.round(baseAlpha / CONFIGS.STREAM_LENGTH * charIndex);
    const alpha = charIndex === 0
      ? baseAlpha
      : baseAlpha - sequentialAlphaOffset;

    return alpha > 0 ? alpha : 0;
  }

  // return random char from katakana sequence
  // TODO: specifically list all allowed chars: katakana, alpha and numerics
  static getChar() {
    return String.fromCharCode(floor(0x30a0 + random(0, 96)));
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

  // returns simulated z depth ratio for stream based on speed
  // - fast is closer
  // - slower is further
  static getDepth(speed) {
    return 1 - (speed - CONFIGS.SPEED_MIN) / (CONFIGS.SPEED_MAX - CONFIGS.SPEED_MIN);
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

    // always switch a non-first letter
    const letterToSwitch = floor(random(1, this.letters.length)); // starts from 1
    this.letters[letterToSwitch].switch();

    // randomly switch first letter
    if (random(1, 100) < 20) {
      this.letters[0].switch();
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
      speed: Math.round(random(CONFIGS.SPEED_MIN, CONFIGS.SPEED_MAX)),
      streamLength: CONFIGS.STREAM_LENGTH,
    };
    streamList.push(new Stream(newStreamConfig));
  }

  return streamList;
};

/**
 * Init
 */
const debugNode = document.querySelector('#debugNode');

let rainStreams = null;
let renderer = null;

/**
 * P5 - setup
 */
function setup() {
  renderer = createCanvas(window.innerWidth, window.innerHeight);
  frameRate(CONFIGS.FRAMERATE);
  noStroke();
  textStyle(BOLD);
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

  background(0); // pure black bg: 0 - 255
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
