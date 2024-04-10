Vue.createApp({
    data: function() {
        return {
            socket: null,
            draw: false,
            prevX: null,
            prevY: null,
            lineW: 5,
            bodyColor: '#FFFFFF',
            canvas: null,
            ctx: null,
            colors: ["#000", "red", "orange", "blue", "purple", "yellowgreen", "yellow", "#fff"],
            currentLineColor: "#000",
            partyMode: false
        }
    },
    methods: {
        mouseUpHandler: function() {
            this.draw = false
        },
        mouseDownHandler: function() {
            this.draw = true
        },
        mouseMoveHandler: function(event) {
            if(this.prevX == null || this.prevY == null || !this.draw){
                this.prevX = event.clientX;
                this.prevY = event.clientY;
                return;
            }
            let currentX = event.clientX;
            let currentY = event.clientY;

            this.ctx.beginPath();
            this.ctx.moveTo(this.prevX, this.prevY);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();

            this.socket.send(JSON.stringify({"action": "draw", "prevX": this.prevX, "prevY": this.prevY, "currentX": currentX, "currentY": currentY, "color": this.currentLineColor, "lineW": this.lineW}));

            this.prevX = currentX;
            this.prevY = currentY;

        },
        saveDrawing: function() {
            let tempCanvas = document.createElement("canvas");
            let tempCtx = tempCanvas.getContext("2d");
            tempCanvas.height = this.canvas.height;
            tempCanvas.width = this.canvas.width;
            tempCtx.fillStyle = this.bodyColor;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(this.canvas, 0, 0);
            let data = tempCanvas.toDataURL("image/png");
            let a = document.createElement("a");
            a.href = data;
            a.download = "sketch.png";
            a.click();
        },
        clearCanvas: function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.bodyColor = "#FFFFFF";
            this.socket.send(JSON.stringify({"action": "clear"}));
        },
        changeColor: function(color) {
            this.ctx.strokeStyle = color;
            this.currentLineColor = color;
        },
        widthChangeHandler: function() {
            this.ctx.lineWidth = this.lineW;
        },
        bodyColorChangeHandler: function() {
            this.socket.send(JSON.stringify({"action": "backgroundChange", "bodyColor": this.bodyColor}));
        },
        activatePartyMode: function() {
            this.partyMode = !this.partyMode;
            this.socket.send(JSON.stringify({"action": "partyMode", "partyMode": this.partyMode}));
        }
    },
    mounted() {
        this.socket = new WebSocket("wss://s24-websocket-vanceya.onrender.com");
        this.canvas = document.getElementById("canvas");
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.lineWidth = this.lineW;

        window.addEventListener("resize", () => {
            let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.height = window.innerHeight;
            this.canvas.width = window.innerWidth;
            this.ctx.putImageData(imageData, 0, 0);
            this.ctx.lineWidth = this.lineW;
        });

        this.socket.addEventListener("open", (event) => {
            // console.log("Websocket open!");
        });

        this.socket.addEventListener("message",  (event) => {
            let data = JSON.parse(event.data);

            switch(data.action) {
                case "draw":
                    this.ctx.strokeStyle = data.color;
                    this.ctx.lineWidth = data.lineW;
                    this.ctx.beginPath();
                    this.ctx.moveTo(data.prevX, data.prevY);
                    this.ctx.lineTo(data.currentX, data.currentY);
                    this.ctx.stroke();
                    this.ctx.strokeStyle = this.currentLineColor;
                    this.ctx.lineWidth = this.lineW;
                    break;
                case "clear":
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.bodyColor = "#FFFFFF";
                    break;
                case "backgroundChange":
                    this.bodyColor = data.bodyColor;
                    break;
                case "partyMode":
                    this.partyMode = data.partyMode;
                    break;
                default:
                    break;
            }
        });
    }
}).mount("#app");