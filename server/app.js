var koa = require('koa');
var Router = require('koa-router');
var logger = require('koa-logger');
var SerialPort = require("serialport");
var app = koa();
var server = require('http').createServer(app.callback());
var io = require('socket.io')(server);

var render = require('./lib/render.js');

var port = new SerialPort("/dev/cu.usbmodem1411", {
  parser: SerialPort.parsers.readline('\r\n')
});

var router = new Router();

app.use(logger());

var power = 0;
var money = 0;
var price = 1.63;
port.on('open', function () {
  router.get('/', function* index() {
    this.body = yield render('index');
    io.sockets.on('connection', function (client) {
      port.on('data', function (data) {
        SerialPort_data = JSON.parse(data);
        humi = SerialPort_data.Humidity;
        temp = SerialPort_data.Temperature;
        currents = SerialPort_data.currents;
        // console.log("Humidity: " + humi);
        // console.log("Temperature: " + temp);
        // console.log("Currents: " + currents);
        power = currents + currents * 110 / 3600 / 1000;
        money = power * price;
        client.emit('humi', {
          date: humi
        })
        client.emit('temp', {
          date: temp
        })
        client.emit('event', {
          date: currents
        }); //發送資料
        client.emit('power', {
          date: power
        }); //發送資料
        client.emit('price', {
          date: price
        }); //發送資料
        client.emit('money', {
          date: money
        }); //發送資料
        console.log(typeof (data));
        if (!(data == 'Timed out waiting for a card\r')) {
          var mes = data.split('\r');
          cardId = mes[0];
        }
      });
      client.on('client_data', function (data) { // 接收來自於瀏覽器的資料
        price = data.data;
      });
    });
  });
});
app.use(router.middleware());
server.listen(3000, function () {
  console.log('listening on port 3000');
});