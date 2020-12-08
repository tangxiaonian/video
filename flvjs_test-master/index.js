var express =  require("express");
var expressWebSocket = require("express-ws");
var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");
var webSocketStream = require("websocket-stream/stream");
var WebSocket = require("websocket-stream");
var http = require("http");
function localServer() {
    let app = express();
    app.use(express.static(__dirname));
    expressWebSocket(app, null, {
        perMessageDeflate: true
    });
    app.ws("/rtsp/id", rtspRequestHandle)
    app.listen(8888);
    console.log("express listened")
}
function rtspRequestHandle(ws, req) {
    const stream = webSocketStream(ws, {
        binary: true,
        browserBufferTimeout: 1000000
    }, {
        browserBufferTimeout: 1000000
    });
    console.log("rtsp request handle ...");
    let url = req.query.url;
    let params = req.query.params;
    console.log("rtsp url:", url);
    console.log("rtsp params:", params);

    params = JSON.parse(params);
    let arr = [];
    if(url != null && params != null ){
        for (const key in params) {
            arr.push(key + "=" + params[key])
        }
    }
    url = url + "?" + arr.join("&");
    try {
        ffmpeg(url)
            .addInputOption("-rtsp_transport", "tcp", "-buffer_size", "102400")  // 这里可以添加一些 RTSP 优化的参数
            .on("start", function () {
                console.log(url, "Stream started.");
            })
            .on("codecData", function () {
                console.log(url, "Stream codecData.")
                // 摄像机在线处理
            })
            .on("error", function (err) {
                console.log(url, "An error occured: ", err.message);
            })
            .on("end", function () {
                console.log(url, "Stream end!");
                // 摄像机断线的处理
            })
            .outputFormat("flv").videoCodec("copy").noAudio().pipe(stream);
    } catch (error) {
        console.log(error);
    }
}
localServer();
