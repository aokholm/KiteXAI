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
// kiteComponent, motorControl



function Simulation() {
}

Simulation.prototype = {



}


var kite;
var mScore;
var controlValue = 500;

var dataset = []
var datasets = []

function setup() {
  mGameArea.setup();
  // network = Network.fromJSON(networkExported);
}

function startGameWithNetwork(network) {
  kite = new kiteComponent(20, 20, "red", mGameArea.width/2, mGameArea.height-20, network);
  mScore = new textComponent("30px", "Consolas", "black", mGameArea.width-200, 40);
  mGameArea.start();
}

function createDataset() {

  startGameWithNetwork()




}

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
  kite = new kiteComponent(20, 20, "red", startX, mGameArea.height-20, network);
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

var mGameArea = {
  canvas : document.createElement("canvas"),
  width: 400,
  height: 400,
  setup : function() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
  },
  start : function() {
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 10);
    },
  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  plotLine: function(line, color) {
    ctx = this.context;

    // draw the kite
    ctx.strokeStyle = "#000000";
    if (color) {
      ctx.strokeStyle = "#" + color;
    }

    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(line[0][0], line[0][1]);

    for (var i = 1; i < line.length; i++) {
      ctx.lineTo(line[i][0], line[i][1]);
    }
    ctx.stroke();
  }
}

function motorControl() {
  this.pos = 500; // value from 1000 to 0
  this.speed = 10;
  this.dirDelta = 0
  this.update = function( targetPos ) {
    if (targetPos != this.pos) {
      this.pos += Math.sign( targetPos - this.pos) * Math.min(this.speed, Math.abs(targetPos - this.pos));
      document.getElementById('sliderMotor').value = this.pos;
      this.dirDelta = (this.pos - 500) / 500 * Math.PI/180*3; // change up for 5 degrees per increment
    }
  }
}

function kiteComponent(width, height, color, x, y, network) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x;
  this.y = y;
  this.network = network


  this.velocity = 1.5;
  this.directionUpsideDown = 0; // upside down coordinate system
  this.direction = Math.PI - this.directionUpsideDown;

  this.motorControl = new motorControl();

  this.draw = function() {
    ctx = mGameArea.context;
    ctx.fillStyle = color;

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

  this.newPos = function() {
    if (network) {
      controlValue = network.activate(this.normInput())[0]*1000;
      document.getElementById('sliderControl').value = controlValue;
      this.motorControl.update(controlValue);
    } else {
      this.motorControl.update(controlValue);
    }


    this.directionUpsideDown += this.motorControl.dirDelta;
    this.direction = Math.PI - this.directionUpsideDown;

    this.x += Math.sin(this.direction) * this.velocity;
    this.y += Math.cos(this.direction) * this.velocity;
  }
  this.outOfBounds = function() {
    var mleft = this.x - this.width/2;
    var mright = this.x + this.width/2;
    var mtop = this.y - this.height/2;
    var mbottom = this.y + this.height/2;

    return (mleft < 0) || (mright > mGameArea.width) || (mtop < 0) || (mbottom > mGameArea.height)
  }

  this.normInput = function() {
    var x, y, dir, conVal;
    x = kite.x / mGameArea.width;
    y = kite.y / mGameArea.height;
    dir = kite.directionUpsideDown / 2*Math.PI;
    return [x, y, dir]
  }
}

function textComponent(fontSize, fontStyle, color, x, y) {
  this.score = 0;
  this.fontSize = fontSize;
  this.fontStyle = fontStyle;
  this.x = x;
  this.y = y;
  this.draw = function() {
    ctx = mGameArea.context;
    ctx.font = this.fontSize + " " + this.fontStyle;
    ctx.fillStyle = color;
    ctx.fillText(this.text, this.x, this.y);
  }
}

function updateGameArea() {
  var x, height, gap, minHeight, maxHeight, minGap, maxGap;

  mGameArea.clear();
  mGameArea.frameNo += 1;
  mScore.text="SCORE: " + mGameArea.frameNo;
  mScore.draw();
  kite.newPos();
  kite.draw();

  if (kite.outOfBounds() || (mGameArea.frameNo == 3000)) {
    gameOver();
  }

  if (Math.abs(kite.directionUpsideDown) > Math.PI) {
    rotationWarning = new textComponent("30px", "Consolas", "black", mGameArea.width/2-100, mGameArea.height/2-30, "text");
    rotationWarning.text = "Line Crossed!";
    rotationWarning.draw();
  }

  // logging
  if (mGameArea.frameNo % 10 == 0) {
    dataset.push( {
      input: kite.normInput(),
      output: [controlValue/1000]
    });
  }
}

function gameOver() {
  gameOverTextComp = new textComponent("30px", "Consolas", "black", mGameArea.width/2-100, mGameArea.height/2-30, "text");
  gameOverTextComp.text = "Game Over"
  gameOverTextComp.draw();
  clearInterval(mGameArea.interval);

  document.getElementById("output").innerHTML = JSON.stringify(dataset, null, 2);
}

function newControlSliderValue(val) {
  controlValue = val;
}
