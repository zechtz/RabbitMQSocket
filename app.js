var express    =  require('express');
var amqp       =  require('amqp');
var io         =  require('socket.io');
var app        =  express();
var path       =  require('path');
var bodyParser =  require('body-parser');
var port       =  3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname));

/**
 * create connection with RabbitMQ using the
 * amqp library
 *
 */
var connection = amqp.createConnection();
connection.on('ready', setup);


/**
 * define an exchange
 */

var exchange;
function setup() {
  exchange = connection.exchange('my_exchange1', {'type': 'fanout', durable: false}, exchangeSetup);
}

/**
 *
 * define the queue
 *
 */

var queue;
var deadQueue;

function exchangeSetup() {
  queue     =  connection.queue('my_queue1', {durable: false, exclusive: false}, queueSetup);
  deadQueue =  connection.queue('my_queue2', {durable: false, exclusive: false}, queueSetup);

  queue.on('queueBindOk', function() {
    onQueueReady(exchange);
  });
  console.log('Exchange ' + exchange.name + ' is open');
}

function queueSetup() {
  queue.subscribe(function(message) {
    console.log("message from queue is", message);
    emitEvent(message.data);
  });
  queue.bind(exchange.name, 'my_queue1');
  deadQueue.bind(exchange.name, 'my_queue2');
}

function onQueueReady(exchange) {
  console.log('queue binding done...');
}

app.post('/test', function(req, res) {
  var myName = req.body.myName;
  exchange.publish('my_queue1', {data: myName});
  console.log("publish on RabbitMQ done..", req.body.myName);
  res.redirect('/');
});

var server = app.listen(port, function() {
  console.log('listening on port', port);
});

io = io.listen(server);

function emitEvent(data){
  console.log('socket emit function is running');
  io.sockets.on('connection', function (socket) {
    console.log('socket connected', socket.id);
    console.log("emitting event now from server..", data);
    io.sockets.emit('event1', data);
  });
}
