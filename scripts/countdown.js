/* to use in an HTML file, copy this into <script> tags and place it right before the </body> tag. Or, save it in a js file, and load it in the <head>. Make sure to add the defer attribute if you load it from a file in <head> */

/* creating a date for 12/07/2022 at 1:45pm using ISO8601-compliant format. If you want to use a new target date, set it here. */
const targetDate = new Date("2022-12-07T13:45:00-07:00");

// this is a test date to show the fireworks on timeout
// const targetDate = new Date("2022-10-20T18:25:00-06:00");

/* Grabbing the <span> elements from the document. I prefer using spans so only the numbers are updated. This allows you to change the layout and style more easily than if the JS generated the full string as output */
const daySpan = document.querySelector(".days");
const hourSpan = document.querySelector(".hours");
const minuteSpan = document.querySelector(".minutes");
const secondSpan = document.querySelector(".seconds");

/* setInterval (what runs the timer) returns an interval ID, which I assign to a const so I can use the interval ID to stop the timer if needed. I declare it here so my stop function can access it. */
let timer;

// function to update counter. I just like arrow notation.
const updateCountdown = () => {
  /* Date objects contain a number that represents milliseconds since January 1, 1970 UTC so subtracting these two dates gives the number of milliseconds they are apart.
  A new empty Date returns the current date and time.
 I divide by 1000 so diff is now number of seconds the dates are apart. I update diff every time this function is called */
  const diff = (targetDate - new Date()) / 1000;

  /* since diff is seconds, we need to convert it to days, hours, minutes and seconds. Modulo or % returns the reminder of division. For example 100 % 60 = 40. It's a CS "trick" to pull out seconds, minutes, etc. */
  const days = Math.floor(diff / 60 / 60 / 24);
  const hours = Math.floor(diff / 60 / 60) % 24;
  const minutes = Math.floor(diff / 60) % 60;
  const seconds = Math.floor(diff % 60);

  /* set the <span>s to the corresponding values */
  /* using toLocalString() will add commas to a number */
  /* for security, I prefer to set textContent, not innerHTML */
  daySpan.textContent = days.toLocaleString("en-US");
  hourSpan.textContent = hours;
  minuteSpan.textContent = minutes;
  secondSpan.textContent = seconds;

  //If you prefer 2-digit numbers, comment out the 4 lines above, and uncomment the 4 lines below
  // daySpan.textContent = days.toLocaleString("en-US").toString().padStart(2, 0);
  // hourSpan.textContent = hours.toString().padStart(2, 0);
  // minuteSpan.textContent = minutes.toString().padStart(2, 0);
  // secondSpan.textContent = seconds.toString().padStart(2, 0);

  // this will stop the timer when it runs out. I take advantage of short-circuiting by listing the days first. The pluto birthday likely won't need this, but it's good to have a stop coded in
  if (!days && !hours && !minutes && !seconds) stopCounter();
};

// set target date and call updateCountdown when page first loads
const initCounter = () => {
  // call the initial countdown
  updateCountdown();
};

const stopCounter = () => {
  // you can add extra here to indicate to the user that the counter stopped.
  clearInterval(timer);

  // start fireworks :D
  startFireworks();
};

document.querySelector(".done").addEventListener("click", stopCounter);

/* this will call updateCountdown once every second.
Only run if target date is after now */
if (targetDate - new Date() > 0) {
  initCounter();
  timer = setInterval(updateCountdown, 1000);
}

/*****************************
 *** NON-TIMER EXTRA STUFF
 ***
 *** fireworks courtesy of
 *** https://codepen.io/programking/pen/AJgeEd?editors=0110
 *** with some modernizations
 *** and modifications:
 *** - convert prototypes to classes
 *** - convert while loops to forEach loops
 *** - use const and let instead of var
 *** - better variable names
 *** - convert mouse events to pointer events
 *** - remove magic numbers
 *** - use string templates
 ****************************/

const startFireworks = () => {
  document.querySelector("canvas").classList.remove("hidden");
  loop();
};

const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d"),
  canvasWidth = window.innerWidth,
  canvasHeight = window.innerHeight,
  fireworks = [],
  particles = [],
  // one launch per 5 loop ticks
  LIMITER_TOTAL = 5,
  // one auto-launch per 80 loop ticks
  TIMER_TOTAL = 80,
  COORDINATE_COUNT = 3,
  PARTICLE_COORDINATE_COUNT = 5,
  PARTICLE_BRIGHTNESS_DECREMENT = 10,
  MIN_BRIGHTNESS = 70,
  MAX_BRIGHTNESS = 100,
  MAX_PARTICLE_SPEED = 10,
  MAX_PARTICLE_COUNT = 30,
  MAX_DECAY = 0.03,
  MIN_DECAY = 0.015,
  FRICTION = 0.95,
  GRAVITY = 1,
  ACCELERATION = 1.05,
  SPEED = 2,
  HUE_START = 120,
  HUE_INCREMENT = 0.5,
  MAX_TARGET_RADIUS = 8,
  TARGET_RADIUS_GROWTH = 0.3;

let currentHue = HUE_START,
  limiterTick = 0,
  timerTick = 0,
  pointerDown = false,
  pointerX,
  pointerY;

// set canvas dimensions
canvas.width = canvasWidth;
canvas.height = canvasHeight;

class Firework {
  constructor(startX, startY, targetX, targetY) {
    // actual coordinates
    this.x = startX;
    this.y = startY;
    // starting coordinates
    this.sx = startX;
    this.sy = startY;
    // target coordinates
    this.tx = targetX;
    this.ty = targetY;
    // distance from starting point to target
    this.distanceToTarget = calculateDistance(startX, startY, targetX, targetY);
    this.distanceTraveled = 0;
    // track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = [];
    this.coordinateCount = COORDINATE_COUNT;
    // populate initial coordinate collection with the current coordinates
    while (this.coordinateCount--) {
      this.coordinates.push([startX, startY]);
    }
    this.angle = Math.atan2(targetY - startY, targetX - startX);
    this.speed = SPEED;
    this.acceleration = ACCELERATION;
    this.brightness = random(MIN_BRIGHTNESS, MAX_BRIGHTNESS);
    this.targetRadius = 1;
  }

  update(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);

    // cycle the circle target indicator radius
    if (this.targetRadius < MAX_TARGET_RADIUS) {
      this.targetRadius += TARGET_RADIUS_GROWTH;
    } else {
      this.targetRadius = 1;
    }

    this.speed *= this.acceleration;

    // get the current velocities based on angle and speed
    let vx = Math.cos(this.angle) * this.speed,
      vy = Math.sin(this.angle) * this.speed;
    // how far will the firework have traveled with velocities applied?
    this.distanceTraveled = calculateDistance(
      this.sx,
      this.sy,
      this.x + vx,
      this.y + vy
    );

    // if the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
    if (this.distanceTraveled >= this.distanceToTarget) {
      createParticles(this.tx, this.ty);
      // remove the firework, use the index passed into the update function to determine which to remove
      fireworks.splice(index, 1);
    } else {
      // target not reached, keep traveling
      this.x += vx;
      this.y += vy;
    }
  }

  draw() {
    ctx.beginPath();
    // move to the last tracked coordinate in the set, then draw a line to the current x and y
    ctx.moveTo(
      this.coordinates[this.coordinates.length - 1][0],
      this.coordinates[this.coordinates.length - 1][1]
    );
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = `hsl(${currentHue}, 100%, ${this.brightness}%)`;
    ctx.stroke();

    ctx.beginPath();
    // draw the target for this firework with a pulsing circle
    ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = [];
    this.coordinateCount = PARTICLE_COORDINATE_COUNT;
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y]);
    }
    // set a random angle in all possible directions, in radians
    this.angle = random(0, Math.PI * 2);
    this.speed = random(1, MAX_PARTICLE_SPEED);
    // friction will slow the particle down
    this.friction = FRICTION;
    // gravity will be applied and pull the particle down
    this.gravity = 1;
    // set the hue to a random number +-20 of the overall hue variable
    this.hue = random(currentHue - 20, currentHue + 20);
    this.brightness = random(
      MIN_BRIGHTNESS - PARTICLE_BRIGHTNESS_DECREMENT,
      MAX_BRIGHTNESS - PARTICLE_BRIGHTNESS_DECREMENT
    );
    this.alpha = GRAVITY;
    // set how fast the particle fades out
    this.decay = random(MIN_DECAY, MAX_DECAY);
  }
  update(index) {
    // remove last item in coordinates array
    this.coordinates.pop();
    // add current coordinates to the start of the array
    this.coordinates.unshift([this.x, this.y]);
    // slow down the particle
    this.speed *= this.friction;
    // apply velocity
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + this.gravity;
    // fade out the particle
    this.alpha -= this.decay;

    // remove the particle once the alpha is low enough, based on the passed in index
    if (this.alpha <= this.decay) {
      particles.splice(index, 1);
    }
  }

  draw = function () {
    ctx.beginPath();
    // move to the last tracked coordinates in the set, then draw a line to the current x and y
    ctx.moveTo(
      this.coordinates[this.coordinates.length - 1][0],
      this.coordinates[this.coordinates.length - 1][1]
    );
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
    ctx.stroke();
  };
}

// create particle group/explosion
function createParticles(x, y) {
  // increase the particle count for a bigger explosion, beware of the canvas performance hit with the increased particles though
  let particleCount = MAX_PARTICLE_COUNT;
  while (particleCount--) {
    particles.push(new Particle(x, y));
  }
}

// main demo loop
function loop() {
  window.requestAnimationFrame(loop);

  currentHue += HUE_INCREMENT;

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.globalCompositeOperation = "lighter";

  fireworks.forEach((firework, i) => {
    firework.draw();
    firework.update(i);
  });

  particles.forEach((particle, i) => {
    particle.draw();
    particle.update(i);
  });

  // launch fireworks automatically to random coordinates, when the pointer isn't down
  if (timerTick >= TIMER_TOTAL) {
    if (!pointerDown) {
      // start the firework at the bottom middle of the screen, then set the random target coordinates, the random y coordinates will be set within the range of the top half of the screen
      fireworks.push(
        new Firework(
          canvasWidth / 2,
          canvasHeight,
          random(0, canvasWidth),
          random(0, canvasHeight / 2)
        )
      );
      timerTick = 0;
    }
  } else {
    timerTick++;
  }

  // limit the rate at which fireworks get launched when pointer is down
  if (limiterTick >= LIMITER_TOTAL) {
    if (pointerDown) {
      // start the firework at the bottom middle of the screen, then set the current mouse coordinates as the target
      fireworks.push(
        new Firework(canvasWidth / 2, canvasHeight, pointerX, pointerY)
      );
      limiterTick = 0;
    }
  } else {
    limiterTick++;
  }
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function calculateDistance(p1x, p1y, p2x, p2y) {
  let xDistance = p1x - p2x,
    yDistance = p1y - p2y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

canvas.addEventListener("pointermove", e => {
  pointerX = e.pageX - canvas.offsetLeft;
  pointerY = e.pageY - canvas.offsetTop;
});

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  pointerDown = true;
});

canvas.addEventListener("pointerup", e => {
  e.preventDefault();
  pointerDown = false;
});
