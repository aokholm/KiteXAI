var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect

var inputLayer = new Layer(3)
var hiddenLayer = new Layer(30, 'hid1')
// var hiddenLayer2 = new Layer(5, 'hid2')
var outputLayer = new Layer(1)

inputLayer.project(hiddenLayer)
hiddenLayer.project(outputLayer)
// hiddenLayer2.project(outputLayer)
// hiddenLayer3.project(outputLayer)

var network = new Network({
    input: inputLayer,
    hidden: [hiddenLayer], // , hiddenLayer2],//, hiddenLayer2, hiddenLayer3],
    output: outputLayer
})
var trainer = new Trainer(network)

var trainingPerformance = {
  iterations: [],
  error: [],
  errorTest: [],
  errorIncreaseCount: 0
}
var trainingOptions = {
    // log: 10000,
    cost: Trainer.cost.MSE,
    rate: 0.1,
    iterations: 50000,
    schedule: {
      every: 1000, // repeat this task every 500 iterations
      do: function(data) {
          // custom log
          trainingPerformance.error.push(data.error)
          trainingPerformance.iterations.push(data.iterations)

          var errorTest = trainer.test(testSet)['error']

          if (trainingPerformance.errorTest.slice(-1)[0] < errorTest) {
            trainingPerformance.errorIncreaseCount += 1
          } else {
            trainingPerformance.errorIncreaseCount = 0
          }

          trainingPerformance.errorTest.push(errorTest)

          console.log("error", data.error, "errorTest", errorTest, "iterations", data.iterations, "rate", data.rate)

          if (trainingPerformance.errorIncreaseCount == 3)
            return true; // abort/stop training
      }
  }
}

var testSet;

function learn(data, testData) {
  testSet = testData
  var results = trainer.train(data, trainingOptions)
  console.log('done!', results)

  // trainer.trainAsync(data, trainingOptions)
  // .then(function(results) {
  //   console.log('done!', results)
  // })
}

function playAI() {
  startGameWithNetwork(network)
}
