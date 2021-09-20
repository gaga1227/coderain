// based on concept from https://codepen.io/cahil/pen/OwEeoe/

/**
 * configs
 */
const getConfigs = () => {
  const letterSize = 14;
  const letterSpacing = letterSize * 1.25; // integer
  const streamDensityXRatio = 0.62;
  const totalStreams = Math.floor((window.innerWidth / letterSize) * streamDensityXRatio);
  const speedMin = letterSpacing;
  const speedMax = speedMin * 4;
  const streamLength = 24;

  const configs = {
    FRAMERATE: 24,
    TOTAL_STREAMS: totalStreams,
    LETTER_SIZE: letterSize,
    LETTER_SPACING: letterSpacing,
    SPEED_MIN: speedMin, // should at least move down one letter step
    SPEED_MAX: speedMax,
    STREAM_LENGTH: streamLength, // TODO: should tie to letter colour fading amount
  };
  console.log('configs:', configs);
  return configs;
};
let CONFIGS = getConfigs();

/**
 * class - Letter
 */
class Letter {
  constructor({posX, posY, size}) {
    // TODO: to be passed in from Stream to avoid identical chars next to each other
    this.char = Letter.getChar();

    this.x = posX;
    this.y = posY;
    this.size = size;
  }

  draw(index) {
    textSize(this.size);
    strokeWeight(1);

    // TODO: tune to accurate colours
    // TODO: use stroke to simulate glow?
    if (index === 0) {
      // If it's the first one make it white
      fill(255, 200);
      stroke(255, 200);
    } else {
      // Otherwise make it green and fade it out more when it's towards then end
      fill(50, 255, 50, 200 - (index * 200) / 25);
      stroke(50, 255, 50, 200 - (index * 200) / 25);
    }

    text(
      this.char, // char
      this.x * (width / CONFIGS.TOTAL_STREAMS), // x pos // TODO: can be passed down from Stream's x pos
      this.y // y pos
    );
  }

  moveTo(deltaY = 0) {
    this.y = deltaY;
  }

  switch() {
    this.char = Letter.getChar();
  }

  // return random char from katakana sequence
  // TODO: should be controlled by Stream so the sequence can be more controlled
  static getChar() {
    return String.fromCharCode(floor(0x30a0 + random(0, 96)));
  }
}

/**
 * class - Stream
 */
class Stream {
  constructor({posX, posY, speed, streamLength}) {
    this.letters = [];
    this.streamLength = streamLength;

    this.x = posX;
    this.y = posY;
    this.speed = speed;

    this.letterSize = CONFIGS.LETTER_SIZE;
    this.letterSpacing = CONFIGS.LETTER_SPACING;

    console.log('speed:', this.speed);
    this.regenerateLetters();
  }

  regenerateLetters() {
    this.letters = [];
    for (let i = 0; i < this.streamLength; i++) {
      const newLetterConfig = {
        posX: this.x,
        posY: this.y - i * this.letterSpacing,
        size: this.letterSize,
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

    // 10% chance to randomly switch a letter
    // TODO: move threshold to global config
    if (random(1, 100) < 10) {
      this.letters[floor(random(this.letters.length))].switch();
    }
  }

  update() {
    // Add the speed to the stream head position
    this.y += this.speed;

    // If there is enough space for the stream to move another downward step
    // this moves the stream downward
    if (this.y >= this.letters[0].y + this.letterSpacing) {
      // update all letters with new posY
      this.letters.forEach((letter, idx) => {
        const deltaY = this.y - idx * this.letterSpacing;
        letter.moveTo(deltaY);
      });
    }

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
  for (let i = 0; i < CONFIGS.TOTAL_STREAMS; i++) {
    const newStreamConfig = {
      posX: i,
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
  background(0); // pure black bg: 0 - 255
  rainStreams.forEach(s => s.draw()); // draw all streams
}

/**
 * P5 - windowResized
 */
function windowResized() {
  CONFIGS = getConfigs();
  rainStreams = [...initStreams()];
  resizeCanvas(window.innerWidth, window.innerHeight);
}
