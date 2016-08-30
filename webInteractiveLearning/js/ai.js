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
  this.directionSlider = createSlider({"oninput": "ai.newDirectionSliderValue(parseFloat(this.value))"})
  this.container.appendChild(this.directionSlider)
  this.container.appendChild(document.createElement("br"))
  this.container.appendChild(createButton("Learn ", "ai.prepareAndLearn()"))
  this.container.appendChild(createButton("Load pre-trained network", "ai.network = Network.fromJSON(storedNetwork)"))
  this.container.appendChild(createButton("Play network", "ai.play()"))
  this.container.appendChild(createButton("Plot traces", "ai.plotTraces()"))

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
    this.clear()

    var n = [6,6,5]
    var N = n.reduce(function(a, e) {return a*e}, 1)
    var startIndex = this.canvas.width*0.2
    var endIndex = this.canvas.width*0.8
    var width = endIndex - startIndex
    var increment0 = width / (n[0]-1)
    var increment1 = width / (n[1]-1)
    var colors = palette('tol-dv', N)
    var l = 0

    for (i = 0; i < n[0]; i++) {
      for (var j = 0; j < n[1]; j++) {
        for (var k = 0; k < n[2]; k++) {
          var x = startIndex + increment0*i
          var y = startIndex + increment1*j
          var dir = k*2*Math.PI/n[2]

          var kite = new KiteComponent(x, y, dir, this.network);
          var trace = kite.generateTrace(this.canvas, 2000)
          plotLine(this.context, trace, colors[l])
          l += 1
        }
      }

    }
  },

  newDirectionSliderValue : function(value) {
    this.plotContours((value/500 - 1) * 2*Math.PI )
  },

  plotContours : function(dir) {
    var width = this.canvas.width
    var height = this.canvas.height

    var imageData = this.context.createImageData(width, height)

    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        var pix = (i + j*width) * 4
        var networkLevel = this.network.activate([i/width, j/height, dir])[0]
        imageData.data[ pix ] = networkLevel * 255
        imageData.data[ pix + 2 ] = (1-networkLevel) * 255
        imageData.data[ pix + 3 ] = 255
      }
    }

    this.context.putImageData(imageData, 0, 0)
  },

  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
}

var testSet
var ai = new AI()
