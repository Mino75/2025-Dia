

// ----------------------------
// Service Worker Registration
// ----------------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(() => {
    console.log('Service Worker Registered');
  });
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.action === 'reload') {
      console.log('New version available. Reloading...');
      window.location.reload();
    }
  });
}

// ----- Configuration and Global Variables -----
// Adjust game container so that the header (10% height) is reserved at the top.
const headerHeight = window.innerHeight * 0.2;
const gameContainer = document.getElementById('game-container');
gameContainer.style.height = (window.innerHeight - headerHeight) + "px";
gameContainer.style.marginTop = headerHeight + "px";

// Dino parameters (canvas area now inside the adjusted gameContainer)
const dinoSize = 100; // Dino dimensions: 100x100px
let posX = (gameContainer.clientWidth - dinoSize) / 2;
let posY = (gameContainer.clientHeight - dinoSize) / 2;
const speed = 7; // Movement speed (pixels per frame)
let facing = "right"; // "right" or "left"

// Global score variable
let score = 0;

// Keyboard input state
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

// Joystick (virtual control) vector (normalized: values in range -1 to 1)
let joystickVec = { dx: 0, dy: 0 };

// Global variables for animal lists and current animal type.
// Expected JSON has two keys: "land_animals" and "sea_animals".
let landAnimalsList = [];
let seaAnimalsList = [];
let currentAnimalType = "land"; // "land" or "sea"

// Background color arrays:
const grassColors = ["#556B2F", "#2E8B57", "#006400", "#013220"];
const seaColors   = ["#5D7A81", "#65828A", "#6B8C96", "#7093A1"];

// ----- Decor Global Variables -----
// decorData holds the loaded decor JSON.
// nextDecor is preloaded along with its associated type.
let decorData = null;
let nextDecor = null; // Will store an object: { decor: [...], type: "land"|"sea" }

// ----- Fetch decor JSON -----
fetch('decor.json')
  .then(response => response.json())
  .then(data => { decorData = data; })
  .catch(error => console.error("Error loading decor.json:", error));

// ----- Load Animals from protagonist.json -----
// Load the animal arrays; do not update the dino so that the default remains.
fetch('protagonist.json')
  .then(response => response.json())
  .then(data => {
    landAnimalsList = data.land_animals;
    seaAnimalsList  = data.sea_animals;
    // Optionally, set an initial background.
    gameContainer.style.background = grassColors[Math.floor(Math.random() * grassColors.length)];
  })
  .catch(error => {
    console.error("Error loading protagonist.json:", error);
  });

// ----- Set Default Dino (T‑Rex) for the First Time -----
// The T‑Rex is used as the default display until a collectible collision triggers a change.
//🐉
//🦖
updateDino({ 
  emoji: "🦖", 
  translations: { 
    en: "T-Rex", 
    fr: "T-Rex", 
    zh: "霸王龙", 
    ja: "ティラノサウルス", 
    ru: "Тираннозавр", 
    es: "Tiranosaurio", 
    mg: "T-Rex" 
  }
});

// ----- Keyboard Event Listeners -----
window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// ----- Create Virtual Joystick -----
const controllerDiv = document.getElementById('controller');
controllerDiv.innerHTML = ""; // Clear any previous content

// Create joystick base element
const joystick = document.createElement('div');
joystick.id = 'joystick';
controllerDiv.appendChild(joystick);

// Create joystick handle (draggable)
const handle = document.createElement('div');
handle.id = 'joystick-handle';
joystick.appendChild(handle);

// Joystick parameters
let joystickActive = false;
const joystickCenter = { x: 100, y: 100 }; // Center in a 100x100 joystick
const joystickMaxDist = 80; // Maximum displacement (in pixels)

function updateJoystick(clientX, clientY) {
  const rect = joystick.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  const offsetY = clientY - rect.top;
  // Vector from the center of the joystick
  let dx = offsetX - joystickCenter.x;
  let dy = offsetY - joystickCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > joystickMaxDist) {
    const ratio = joystickMaxDist / dist;
    dx *= ratio;
    dy *= ratio;
  }
  // Update joystick handle position
  handle.style.left = (joystickCenter.x - handle.offsetWidth / 2 + dx) + 'px';
  handle.style.top = (joystickCenter.y - handle.offsetHeight / 2 + dy) + 'px';
  // Set joystick vector (normalized)
  joystickVec.dx = dx / joystickMaxDist;
  joystickVec.dy = dy / joystickMaxDist;
}

joystick.addEventListener('pointerdown', (e) => {
  joystickActive = true;
  updateJoystick(e.clientX, e.clientY);
});
joystick.addEventListener('pointermove', (e) => {
  if (joystickActive) updateJoystick(e.clientX, e.clientY);
});
window.addEventListener('pointerup', () => {
  if (joystickActive) {
    joystickActive = false;
    // Reset joystick handle to center
    handle.style.left = (joystickCenter.x - handle.offsetWidth / 2) + 'px';
    handle.style.top = (joystickCenter.y - handle.offsetHeight / 2) + 'px';
    joystickVec = { dx: 0, dy: 0 };
  }
});

// ----- Set Up Dino Container and Render the Dino Emoji -----
const dinoContainer = document.getElementById('dino-container');
dinoContainer.style.width = dinoSize + 'px';
dinoContainer.style.height = dinoSize + 'px';
// Ensure the dino is above decor.
dinoContainer.style.zIndex = "1000";

// ----- Decor Placement Helper Functions -----
// Checks whether two rectangles overlap.
function rectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}

// Attempts to find a non-overlapping position inside the game container.
function getNonOverlappingPosition(w, h, existingItems) {
  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.floor(Math.random() * (gameContainer.clientWidth - w));
    const y = Math.floor(Math.random() * (gameContainer.clientHeight - h));
    let overlap = false;
    for (let item of existingItems) {
      if (rectOverlap(x, y, w, h, item.x, item.y, item.width, item.height)) {
        overlap = true;
        break;
      }
    }
    if (!overlap) return { x, y };
  }
  return null;
}

// ----- Generate Decor Configuration -----
// Generates an array of decor items based on the animal type.
function generateDecor(animalType) {
  if (!decorData) return []; // If decor data not loaded, return empty.
  
  // Select the appropriate set of decor.
  const decorSet = (animalType === "land") ? decorData.land_decor : decorData.sea_decor;
  
  // For tall decor: randomly select one emoji and a random occurrence between 10 and 20.
  const tallEmoji = decorSet.tall[Math.floor(Math.random() * decorSet.tall.length)];
  const tallCount = Math.floor(Math.random() * 11) + 5; // 10-20
  
  // For small decor: select up to 3 distinct emojis.
  const availableSmall = decorSet.small.slice();
  availableSmall.sort(() => Math.random() - 0.5);
  const smallEmojis = availableSmall.slice(0, Math.min(3, availableSmall.length));
  
  // For each small decor type, choose a random occurrence between 10 and 20.
  let smallDecorConfigs = [];
  for (const emoji of smallEmojis) {
    const count = Math.floor(Math.random() * 11) + 1;
    smallDecorConfigs.push({ emoji, count });
  }
  
  // Base sizes (adjusted for mobile, these sizes are in pixels).
  const baseSmall = 50; // small decor size
  const tallSize = baseSmall * 3; // tall decor size
  
  let decorItems = [];
  // Generate tall decor items.
  for (let i = 0; i < tallCount; i++) {
    const pos = getNonOverlappingPosition(tallSize, tallSize, decorItems);
    if (pos)
      decorItems.push({ emoji: tallEmoji, x: pos.x, y: pos.y, width: tallSize, height: tallSize });
  }
  
  // Generate small decor items.
  for (const item of smallDecorConfigs) {
    for (let i = 0; i < item.count; i++) {
      const pos = getNonOverlappingPosition(baseSmall, baseSmall, decorItems);
      if (pos)
        decorItems.push({ emoji: item.emoji, x: pos.x, y: pos.y, width: baseSmall, height: baseSmall });
    }
  }
  
  return decorItems;
}

// ----- Render Decor -----
// This function renders decor items in the game container.
// It verifies that the preloaded decor matches the current animal type.
function updateDecor() {
  let decorContainer = document.getElementById('decor-container');
  if (!decorContainer) {
    decorContainer = document.createElement('div');
    decorContainer.id = "decor-container";
    decorContainer.style.position = "absolute";
    decorContainer.style.top = "0";
    decorContainer.style.left = "0";
    decorContainer.style.width = "100%";
    decorContainer.style.height = "100%";
    decorContainer.style.pointerEvents = "none"; // Do not block interactions.
    // Ensure decor is behind the dino.
    decorContainer.style.zIndex = "0";
    gameContainer.appendChild(decorContainer);
  }
  // Clear any existing decor.
  decorContainer.innerHTML = "";
  
  // Preload new decor if needed.
  if (!nextDecor || nextDecor.type !== currentAnimalType) {
    nextDecor = {
      decor: generateDecor(currentAnimalType),
      type: currentAnimalType
    };
  }
  
  let currentDecor = nextDecor.decor;
  
  currentDecor.forEach(item => {
    const elem = document.createElement('div');
    elem.className = "decor-item";
    elem.style.position = "absolute";
    elem.style.left = item.x + "px";
    elem.style.top = item.y + "px";
    elem.style.width = item.width + "px";
    elem.style.height = item.height + "px";
    elem.style.fontSize = item.height + "px"; // Adjust font size
    elem.textContent = item.emoji;
    decorContainer.appendChild(elem);
  });
  
  // Preload the next decor configuration.
  nextDecor = {
    decor: generateDecor(currentAnimalType),
    type: currentAnimalType
  };
}

// ----- Render the Dino and Update Decor -----
// Renders the dino using a canvas and updates both halves.
// Also updates the decor and header.
function updateDino(animal) {
  const emoji = animal.emoji;
  
  // Determine the current animal type based on loaded arrays.
  if (landAnimalsList.find(item => item.emoji === emoji)) {
    currentAnimalType = "land";
  } else if (seaAnimalsList.find(item => item.emoji === emoji)) {
    currentAnimalType = "sea";
  } else {
    currentAnimalType = "land";
  }
  
  // Update background color based on type.
  if (currentAnimalType === "land") {
    gameContainer.style.background = grassColors[Math.floor(Math.random() * grassColors.length)];
  } else {
    gameContainer.style.background = seaColors[Math.floor(Math.random() * seaColors.length)];
  }
  
  // Render dino via canvas.
  const canvas = document.createElement('canvas');
  canvas.width = dinoSize;
  canvas.height = dinoSize;
  const ctx = canvas.getContext('2d');
  ctx.font = dinoSize + "px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.clearRect(0, 0, dinoSize, dinoSize);
  // arrange emoji
  const metrics = ctx.measureText(emoji);
  const ascent = metrics.actualBoundingBoxAscent || 0;
  const descent = metrics.actualBoundingBoxDescent || 0;
  const offsetY = (ascent - descent) / 2;

  ctx.fillText(emoji, dinoSize / 2, dinoSize / 2 + offsetY);
  const dinoDataURL = canvas.toDataURL();
  document.getElementById('emojiTop').src = dinoDataURL;
  document.getElementById('emojiBottom').src = dinoDataURL;
  
  // Update decor for the current animal type.
  updateDecor();
  
  // Update the header animal name in the four specified languages: mg, zh, ru, ja.
  const headerAnimalName = document.getElementById('animal-name');
  const keysToShow = ["mg", "zh", "ru", "ja"];
  const names = [];
  keysToShow.forEach(k => {
    if (animal.translations && animal.translations[k]) {
      names.push(animal.translations[k]);
    }
  });
  headerAnimalName.textContent = names.join(" | ");
}

// ----- Create Collectible -----
const collectible = document.getElementById('collectible');
const collectibleSize = 70;
collectible.style.width = collectibleSize + "px";
collectible.style.height = collectibleSize + "px";
collectible.style.fontSize = "70px";
collectible.innerText = "⭐"; // Star emoji as the collectible
collectible.style.zIndex = "1000";

// ----- Spawn Collectible -----
function spawnCollectible() {
  const maxX = gameContainer.clientWidth - collectibleSize;
  const maxY = gameContainer.clientHeight - collectibleSize;
  const randX = Math.floor(Math.random() * maxX);
  const randY = Math.floor(Math.random() * maxY);
  collectible.style.left = randX + "px";
  collectible.style.top = randY + "px";
  collectible.style.display = "block";
}
spawnCollectible();

// ----- Collision Detection -----
function isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 < x2 || x1 > x2 + w2 ||
           y1 + h1 < y2 || y1 > y2 + h2);
}

// ----- Game Loop -----
function gameLoop() {
  // Compute keyboard input vector.
  let kbDx = 0, kbDy = 0;
  if (keys.ArrowUp) kbDy -= 1;
  if (keys.ArrowDown) kbDy += 1;
  if (keys.ArrowLeft) kbDx -= 1;
  if (keys.ArrowRight) kbDx += 1;
    
  // Combine keyboard and joystick inputs.
  let totalDx = kbDx + joystickVec.dx;
  let totalDy = kbDy + joystickVec.dy;
    
  // Update position if movement is detected.
  if (totalDx !== 0 || totalDy !== 0) {
    const mag = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
    totalDx /= mag;
    totalDy /= mag;
    posX += totalDx * speed;
    posY += totalDy * speed;
      
    // Apply leg animation only for land animals.
    if (currentAnimalType === "land") {
      document.getElementById('emojiBottom').classList.add('moving');
    }
      
    // Update facing based on horizontal movement.
    if (totalDx < 0) {
      facing = "right";
    } else if (totalDx > 0) {
      facing = "left";
    }
  } else {
    document.getElementById('emojiBottom').classList.remove('moving');
  }
    
  // Clamp dino position within game container.
  const maxX = gameContainer.clientWidth - dinoSize;
  const maxY = gameContainer.clientHeight - dinoSize;
  if (posX < 0) posX = 0;
  if (posY < 0) posY = 0;
  if (posX > maxX) posX = maxX;
  if (posY > maxY) posY = maxY;
    
  // Update transformation.
  const flip = (facing === "left") ? -1 : 1;
  dinoContainer.style.transform = `translate(${posX}px, ${posY}px) scaleX(${flip})`;
    
  // Check for collision with collectible.
  if (collectible.style.display === "block") {
    const collLeft = parseInt(collectible.style.left, 10);
    const collTop = parseInt(collectible.style.top, 10);
    if (isColliding(posX, posY, dinoSize, dinoSize,
                    collLeft, collTop, collectibleSize, collectibleSize)) {
      // Collision: hide collectible and update score.
      collectible.style.display = "none";
      score += 1;
      document.getElementById('score-header').textContent = 'Isa: ' + score;
      
      // Randomly select a new animal.
      let useLand = Math.random() < 0.5;
      if (useLand && landAnimalsList.length > 0) {
        const randomIndex = Math.floor(Math.random() * landAnimalsList.length);
        updateDino(landAnimalsList[randomIndex]);
      } else if (!useLand && seaAnimalsList.length > 0) {
        const randomIndex = Math.floor(Math.random() * seaAnimalsList.length);
        updateDino(seaAnimalsList[randomIndex]);
      }
      
      // Re-spawn collectible after a delay.
      const delay = 1000 + Math.random() * 1000;
      setTimeout(spawnCollectible, delay);
    }
  }
    
  requestAnimationFrame(gameLoop);
}
gameLoop();

// ----- Adjust Starting Position on Resize -----
window.addEventListener('resize', () => {
  const headerHeight = window.innerHeight * 0.2;
  gameContainer.style.height = (window.innerHeight - headerHeight) + "px";
  gameContainer.style.marginTop = headerHeight + "px";
  posX = (gameContainer.clientWidth - dinoSize) / 2;
  posY = (gameContainer.clientHeight - dinoSize) / 2;
});
