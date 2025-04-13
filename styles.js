(function() {
  const css = `
    /* Global reset and dark mode styling */
    * {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none; /* Chrome, Safari, Opera */
      -moz-user-select: none;    /* Firefox */
      -ms-user-select: none;     /* IE/Edge */
      
    }
    body {
      margin: 0;
      background: #121212;
      color: #e0e0e0;
      font-family: sans-serif;
      overflow: hidden;
    }
    /* Header container styling for score and animal name */
    header {
      /* Reserve 20% of viewport height for header */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #e0e0e0;
      font-size: 3vh;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1100;
     
    }
    /* Header text elements */
    #score-header, #animal-name {
      width: 90%;
      text-align: center;
      word-wrap: break-word;
      margin: 0.5vh 0;
    }
    /* Game container positioned below header.
       The container gets the remaining 80% of viewport height minus a small margin. */
    #game-container {
      position: relative;
      margin-top: calc(20vh + 10px);
      width: calc(100vw - 20px);
      height: calc(80vh - 20px);
      border: 3px solid #333;
      /* Background color will be updated dynamically by main.js */
    }
    /* Dino container: fixed 100x100px; main.js controls its position */
    #dino-container {
      position: absolute;
      width: 120px;
      height: 120px;
    }
    /* Both emoji layers fill the dino container */
    .emoji-top, .emoji-bottom {
      position: absolute;
      top: 0;
      left: 0;
      width: 100px;
      height: 100px;
    }
    .emoji-top {
      clip: rect(0px, 100px, 90px, 0px);
    }
    .emoji-bottom {
      clip: rect(90px, 100px, 120px, 0px);
    }
    .emoji-bottom.moving {
      animation: legMove 0.01s infinite alternate;
    }
    @keyframes legMove {
      0% { transform: translateY(0); }
      100% { transform: translateY(-5px); }
    }
    /* Controller (joystick) container, fixed near bottom center */
    #controller {
      position: fixed;
      bottom: 200px;
      left: 75%;
      transform: translateX(-50%);
      z-index: 1000;
    }
    /* Joystick base */
    #joystick {
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.6);
      border: 2px solid #888;
      border-radius: 50%;
      position: relative;
      touch-action: none;
    }
    /* Joystick handle */
    #joystick-handle {
      width: 80px;
      height: 80px;
      background: rgba(200, 200, 200, 0.6);
      border: 2px solid #666;
      border-radius: 50%;
      position: absolute;
      left: 60px;
      top: 60px;
      touch-action: none;
    }
    /* Increase joystick size on mobile screens */
    @media (max-width: 480px) {
      #joystick {
        width: 800px;
        height: 800px;
      }
      #joystick-handle {
        width: 100px;
        height: 100px;
        left: 90px;
        top: 90px;
      }

    }
    /* Collectible styling: a 100x100 box with centered text */
    #collectible {
      position: absolute;
      width: 100px;
      height: 100px;
      font-size: 32px;
      text-align: center;
      line-height: 100px;
      cursor: pointer;
      user-select: none;
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();
