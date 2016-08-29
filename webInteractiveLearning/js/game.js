// requirements

// network settings is editable
// can simulate kite behavior based on networkExported
// can show and calculate score base on fixed initialization
// can generate a training set , x paths
// can plot the training set
// can preload trainingset
// can preload trainedNetwork


// structure

// AI
// datasets (global) -> trainingset, verificationset,
// networks (global), trainer,

// Simulation
// Simulation

// Simulaiton Engine
// KiteComponent, motorControl

var simulation;

function setup() {
  simulation = new Simulation();
  simulation.start();
  // network = Network.fromJSON(networkExported);
}

function Simulation() {
  this.updateInterval = 10 //ms
  this.canvas = document.createElement("canvas")
  this.canvas.width = 400
  this.canvas.height = 400
  this.controlValue = 500

  this.context = this.canvas.getContext("2d")

  this.controlSlider = createSlider({"oninput": "simulation.controlValue = parseFloat(this.value)"})
  this.motorSlider = createSlider()

  this.container = document.getElementById('simulation')

  this.container.appendChild(this.canvas)
  this.container.appendChild(document.createElement("br"))
  this.container.appendChild(createParagraph("control:"))
  this.container.appendChild(this.controlSlider)
  this.container.appendChild(document.createElement("br"))
  this.container.appendChild(createParagraph("motor position:"))
  this.container.appendChild(this.motorSlider)


  this.timerText = new TextComponent(this.canvas.width-200, 40)
  this.rotationWarningText = new TextComponent(this.canvas.width/2-100, this.canvas.height/2-30, {"text": "Lines crossed!"})
  this.gameOverText = new TextComponent(this.canvas.width/2-100, this.canvas.height/2-30, {"text": "Game Over", "active": false})

  this.drawables = [this.timerText, this.rotationWarningText, this.gameOverText]

  this.datasets = []
  this.activeSet = []
}

Simulation.prototype = {

  start : function(network) {
    this.frameNo = 0;
    this.interval = setInterval(this.loop.bind(this), this.updateInterval)

    this.kite = new KiteComponent(200, this.canvas.height-20, 0, network);
    this.drawables.push(this.kite)

    this.draw()
  },

  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  loop : function() {

    this.updateLogic()
    this.log()
    this.draw()
  },

  updateLogic : function() {
    this.frameNo += 1

    if (this.kite.network) {
      this.controlValue = this.kite.network.activate(this.kite.normInput(this.canvas))[0]*1000;
    }
    this.kite.newPos(this.controlValue)

    if (Math.abs(this.kite.directionUpsideDown) > Math.PI) {
      this.rotationWarningText.options.active = true
    } else {
      this.rotationWarningText.options.active = false
    }

    if (this.kite.outOfBounds(this.canvas) || (this.frameNo == 3000)) {
      this.gameOver()
    }

    this.timerText.options.text = "SCORE: " + this.frameNo;
  },

  draw : function() {
    this.clear()
    this.drawables.map (function(drawable) {
      drawable.draw(this.context)
    }, this)

    // store reference
    this.motorSlider.value = this.kite.motorControl.pos

    if (this.kite.network) {
      this.controlSlider.value = this.controlValue
    }
  },

  log : function() {
    if (this.frameNo % 10 == 0) {
      this.activeSet.push( {
        input: this.kite.normInput(this.canvas),
        output: [this.controlValue/1000]
      })
    }
  },

  gameOver : function() {
    this.gameOverText.options.active = true
    this.rotationWarningText.options.active = false

    clearInterval(this.interval)

    document.getElementById("output").innerHTML = JSON.stringify(this.activeSet, null, 2);
  }

}


//
// plotLine: function(line, color) {
//   ctx = this.context;
//
//   // draw the kite
//   ctx.strokeStyle = "#000000";
//   if (color) {
//     ctx.strokeStyle = "#" + color;
//   }
//
//   ctx.lineWidth=1;
//   ctx.beginPath();
//   ctx.moveTo(line[0][0], line[0][1]);
//
//   for (var i = 1; i < line.length; i++) {
//     ctx.lineTo(line[i][0], line[i][1]);
//   }
//   ctx.stroke();
// }




function plotMultipleStart() {
  mGameArea.clear();
  var startIndex, endIndex, N;
  startIndex = mGameArea.width*0.1;
  endIndex = mGameArea.width*0.9;
  N = 100;
  var width = endIndex - startIndex;
  var increment = width / (N-1);
  var colors = palette('tol-dv', N);
  for (i = 0; i < N; i++) {
    var startX = startIndex + increment*i;
    playGameFastForward(network, startX, colors[i]);
  }
}

function plotDataset(dataset) {
  var line = dataset.map( function ( data ) {
    return [data.input[0]*mGameArea.width, data.input[1]*mGameArea.height]
  });

  console.log(line);
  mGameArea.plotLine(line, "000000");
}


function playGameFastForward(network, startX, color) {
  kite = new KiteComponent(20, 20, "red", startX, mGameArea.height-20, network);
  var position = [];
  for (var i=0; i< 1000; i++) {
    position.push([kite.x, kite.y]);

    kite.newPos();

    if (kite.outOfBounds()) {
      break;
    }
  }
  mGameArea.plotLine(position, color)
}

function MotorControl() {
  this.pos = 500; // value from 1000 to 0
  this.speed = 10;
  this.dirDelta = 0
  this.update = function( targetPos ) {
    if (targetPos != this.pos) {
      this.pos += Math.sign( targetPos - this.pos) * Math.min(this.speed, Math.abs(targetPos - this.pos));
      this.dirDelta = (this.pos - 500) / 500 * Math.PI/180*3; // change up for 5 degrees per increment
    }
  }
}

function KiteComponent(x, y, dir, network) {
  this.x = x
  this.y = y
  this.directionUpsideDown = dir // upside down coordinate system
  this.direction = Math.PI - this.directionUpsideDown;

  // optional
  this.network = network

  this.width = 20
  this.height = 20
  this.color = "red"
  this.velocity = 1.5

  this.motorControl = new MotorControl()

  this.draw = function(ctx) {
    ctx.fillStyle = this.color;
    ctx.save(); // save the unrotated context of the canvas so we can restore it later
    ctx.translate(this.x,this.y); // move to the point of the kite
    ctx.rotate(this.directionUpsideDown); // rotate the canvas to the specified degrees

    // draw the kite
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(0,-10);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore(); // we’re done with the rotating so restore the unrotated ctx
  }

  this.newPos = function(controlValue) {
    this.motorControl.update(controlValue);

    this.directionUpsideDown += this.motorControl.dirDelta;
    this.direction = Math.PI - this.directionUpsideDown;

    this.x += Math.sin(this.direction) * this.velocity;
    this.y += Math.cos(this.direction) * this.velocity;
  }
  this.outOfBounds = function(canvas) {
    var mleft = this.x - this.width/2;
    var mright = this.x + this.width/2;
    var mtop = this.y - this.height/2;
    var mbottom = this.y + this.height/2;

    return (mleft < 0) || (mright > canvas.width) || (mtop < 0) || (mbottom > canvas.height)
  }

  this.normInput = function(canvas) {
    var x, y, dir
    x = this.x / canvas.width
    y = this.y / canvas.height
    dir = this.directionUpsideDown / 2*Math.PI
    return [x, y, dir]
  }
}

function TextComponent(x, y, options) {
  this.x = x || 0
  this.y = y || 0

  var defaults = {
      text: "empty",
      fontSize: "30px",
      fontStyle: "Consolas",
      color: "black",
      active: true
  }
  this.options = merge(defaults, options || {})

  this.draw = function(ctx) {
    if (this.options.active) {
      ctx.font = this.options.fontSize + " " + this.options.fontStyle;
      ctx.fillStyle = this.options.color;
      ctx.fillText(this.options.text, this.x, this.y);
    }
  }
}

function merge() {
    var obj, name, copy,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length;

    for (; i < length; i++) {
        if ((obj = arguments[i]) != null) {
            for (name in obj) {
                copy = obj[name];

                if (target === copy) {
                    continue;
                }
                else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    return target;
}

function createSlider(options) {
  var slider = document.createElement("input")
  var defaults = {
    "type": "range",
    "min": 0,
    "max": 1000,
    "step": 1,
    "style": "width:400px"
  }
  options = merge(defaults, options || {})

  Object.keys(options).forEach( function(key) {
    slider.setAttribute(key, options[key])
  })

  return slider
}

function createParagraph(text) {
  var p = document.createElement("p")
  p.innerHTML = text
  return p
}
