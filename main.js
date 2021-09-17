// based on concept from https://codepen.io/cahil/pen/OwEeoe/

/**
 * configs
 */
const TOTAL_STREAMS = 48;

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
      this.x * (width / TOTAL_STREAMS), // x pos // TODO: can be passed down from Stream's x pos
      this.y // y pos
    );
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
  constructor({posX, posY, speed}) {
    this.letters = [];

    this.x = posX;
    this.y = posY;
    this.speed = speed * 2;

    this.letterSize = 12;
    this.letterSpacing = 12;

    this.regenerateLetters();
  }

  regenerateLetters() {
    this.letters = [];
    for (let i = 0; i < 25; i++) {
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

    // If there is enough space to add a letter at the start
    if (this.y >= this.letters[0].y + this.letterSpacing) {
      // Add a new letter at the start
      const newLetterConfig = {
        posX: this.x,
        posY: this.y,
        size: this.letterSize,
      };
      this.letters.unshift(new Letter(newLetterConfig));

      // Remove the last item
      this.letters.pop();
    }

    // If the last character has gone off the screen
    if (this.letters[this.letters.length - 1].y > height + this.letterSize) {
      // Reset the head to the top of the screen
      this.y = 0;

      // Regenerate letters as all x values will change
      this.regenerateLetters();
    }
  }
}

/**
 * Init
 */
const rainStreams = [];
let renderer = null;

/**
 * P5 - setup
 */
function setup() {
  renderer = createCanvas(window.innerWidth, window.innerHeight);
  frameRate(24);
  noStroke();
  textStyle(BOLD);

  // create all streams
  for (let i = 0; i < TOTAL_STREAMS; i++) {
    const newStreamConfig = {
      posX: i,
      posY: random(1, height),
      speed: random(2, 10),
    };
    rainStreams.push(new Stream(newStreamConfig));
  }
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
  resizeCanvas(window.innerWidth, window.innerHeight);
}
