var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect

function AI() {
  this.container = document.getElementById('ai')

  this.canvas = document.createElement("canvas")
  this.canvas.width = 400
  this.canvas.height = 400
  this.controlValue = 500

  this.defaultNumberOfSets = 5

  this.context = this.canvas.getContext("2d")
  this.container.appendChild(this.canvas)
  this.container.appendChild(createButton("Learn ", "ai.prepareAndLearn()"))
  this.container.appendChild(createButton("Load pre-trained network", "ai.network = Network.fromJSON(storedNetwork)"))
  this.container.appendChild(createButton("Play network", "ai.play()"))
  this.container.appendChild(createButton("Play network", "ai.play()"))


  this.inputLayer = new Layer(3)
  this.hiddenLayer = new Layer(10, 'hidden1')
  this.outputLayer = new Layer(1)

  this.inputLayer.project(this.hiddenLayer)
  this.hiddenLayer.project(this.outputLayer)

  this.network = new Network({
      input: this.inputLayer,
      hidden: [this.hiddenLayer], // , hiddenLayer2],//, hiddenLayer2, hiddenLayer3],
      output: this.outputLayer
  })

  this.trainer = new Trainer(this.network)

  this.trainingPerformance = {
    iterations: [],
    error: [],
    errorTest: [],
    errorIncreaseCount: 0
  }

  this.trainingOptions = {
      // log: 10000,
      cost: Trainer.cost.MSE,
      rate: 0.1,
      iterations: 50000,
      schedule: {
        every: 1000, // repeat this task every 500 iterations
        do: function(data) {
            // custom log
            var self = ai // fixme: Should find another workaround

            self.trainingPerformance.error.push(data.error)
            self.trainingPerformance.iterations.push(data.iterations)

            var errorTest = self.trainer.test(testSet)['error']

            if (self.trainingPerformance.errorTest.slice(-1)[0] < errorTest) {
              self.trainingPerformance.errorIncreaseCount += 1
            } else {
              self.trainingPerformance.errorIncreaseCount = 0
            }

            self.trainingPerformance.errorTest.push(errorTest)

            console.log("error", data.error, "errorTest", errorTest, "iterations", data.iterations, "rate", data.rate)

            if (self.trainingPerformance.errorIncreaseCount == 3)
              return true; // abort/stop training
        }
    }
  }
}

AI.prototype = {

  prepareAndLearn: function () {
    // merge sets to one
    var datasetsMerged = simulation.datasets.reduce(function(aggregate, dataset) {
      return aggregate.concat(dataset)
    }, [])
    var stride = 4

    var trainingset = []
    var testset = []

    for (var i = 0; i < datasetsMerged.length; i++) {
      if (i % stride == 0) {
        testset.push(datasetsMerged[i])
      } else {
        trainingset.push(datasetsMerged[i])
      }
    }

    this.learn(trainingset, testset)
  },

  learn: function (trainingset, testset) {
    // split the dataset evenly
    testSet = testset
    var results = this.trainer.train(trainingset, this.trainingOptions)
    console.log('done!', results)
  },

  play: function() {
    simulation.setup(this.network)
    simulation.start()
  },

  plotTraces: function() {

  }
}

var testSet
var ai = new AI()



// NOT CURRENTLY IN USE
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

// NOT CURRENTLY IN USE
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
