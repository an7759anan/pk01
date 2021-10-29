const { ipcRenderer } = require('electron');
//const snm = require('./units/signal_to_noise_measurement');
//let {DIAG_STROKE_WIDTH, canvas, ctx, gridX0, gridY0, gridWidth, gridHeight, gridX1, gridY1, diagPattern} = require('./globals');

const DIAG_STROKE_WIDTH = 16;
let canvas, ctx; // drawing context
let gridX0, gridY0, gridWidth, gridHeight, gridX1, gridY1;
let diagPattern;

setTimeout(()=>{

    canvas = $('#measurement-screen canvas')[0];
    ctx = canvas.getContext('2d');
    gridX0 = 0.1 * canvas.width;
    gridY0 = 0.1 * canvas.height;
    gridWidth = 0.8 * canvas.width;
    gridHeight = 0.8 * canvas.height;
    gridX1 = gridX0 + gridWidth;
    gridY1 = gridY0 + gridHeight;
    let img = new Image();
    img.onload = () => {
        diagPattern = ctx.createPattern(img,'repeat');
    };
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAELSURBVDhPhZJLroMwDEXLHyT2v0kkmPBHkJdjYggp1bsDiE+v7drhY2V8FUVhoihy0Sk8IUPwR7YAV3Dfd3n7rG1b4dM0mbqu7wLjOJokSS4j2rZN4jiOHTkFL8vy8sqTv4dxWRaBFJTqzgSHIViWZZfXxrcRaWefqd74h1kQido5XBgcpsnDMNyNhFixGL8DBtUbVya0aZqHScWczKvc34MyeYbJ67rKO03Taxxlodee75n/u4WQoa8lIgrmeS5nFCbrEpFlH9P3vQSIRDWSiNlPVs3zfHIX/7yFMPn1FlgQnVma6jiOr2R8cEbUT1x+VaNW77pOYt0DHIbCovb8BOiNIVhVVS5CxvwBLOLdbHKhoSgAAAAASUVORK5CYII=';

}, 2000);

ipcRenderer.on('CONTROLLER_TO_VIEW_MESSAGE', (evt, message) => {
    if (message.screen == 'MODE_DIALOG'){
        if (message.show == true) $('#mode-select').show();
        if (message.value) $('#mode-select select').val(message.value);
    } else {
        if (message.show != undefined) $('.screens').hide();
        switch(message.screen){
            case 'SPLASH_SCREEN':
                if (message.show == true) $('#splash-screen').show();
            break;
            case 'TEST_INFO':
                if (message.show == true) $('#test-screen').show();
                if (message.opk_soft_version) $('#opk_soft_version').text($('#opk_soft_version').text() + message.opk_soft_version);
                if (message.switch_soft_version) $('#switch_soft_version').text($('#switch_soft_version').text() + message.switch_soft_version);
                if (message.dsp_soft_version) $('#dsp_soft_version').text($('#dsp_soft_version').text() + message.dsp_soft_version);
                if (message.channel) $('#channel').text($('#channel').text() + message.channel);
            break;
            case 'ERROR_DIALOG':
                if (message.show == true) $('#error-dialog').show();
            break;
            case 'MEASUREMENT':
                if (message.show == true) $('#measurement-screen').show();
                if (message.value){
                    switch(message.value){
                        case 'TONE_SIGNAL_MEASUREMENT':
    
                        break;
                        case 'SIGNAL_TO_NOISE_MEASUREMENT':
                            if(message.data){
                                drawData(dataModel, message.data);
                            } else {
                                drawPicture(dataModel);
                            }
                        break;
                        case 'FREE_CHANNEL_NOISE_MEASUREMENT':
                    
                        break;
                        case 'FREQUENCY_RESPONSE_MEASUREMENT':
                    
                        break;
                    }
                }
            break;
        }
    }
});

const dataModel = {
    axisX: {
        name: 'Input level',
        units: 'dBm0',
        min: -60,
        max: 10,
        step: 10,
        marks: []
    },
    axisY: {
        name: 'Signal-to-total distortion ratio',
        units: 'dB',
        min: 0,
        max: 40,
        step: 10,
        marks: []
    },
    bottomBoundary: [
        {x: -45, y:  0},
        {x: -45, y: 22},
        {x: -40, y: 27},
        {x: -30, y: 33},
        {x:   0, y: 33},
        {x:   0, y:  0},
    ],
    bottomBoundary2: [
        {x: -44, y:  0},
        {x: -44, y: 21.5},
        {x: -40, y: 26},
        {x: -30, y: 32},
        {x:   -1, y: 32},
        {x:   -1, y:  0},
    ]
}

const drawPicture = (dataModel) => {
    ctx.clearRect(0,0,1000,1000);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.textAlign = 'left';
    drawGrid(dataModel);
};

const drawGrid = (dataModel) => {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    let xPointsNum = (dataModel.axisX.max - dataModel.axisX.min)/dataModel.axisX.step;
    let yPointsNum = (dataModel.axisY.max - dataModel.axisY.min)/dataModel.axisY.step;
    let dX = gridWidth/xPointsNum;
    let dY = gridHeight/yPointsNum;
    drawBottomBoundaryLine(dataModel);
    drawBottomBoundaryLine2(dataModel);
    ctx.beginPath();
    for(let y = gridY0; y <= gridY1; y += dY){
        ctx.moveTo(xv(gridX0), yv(y));
        ctx.lineTo(xv(gridX1), yv(y));
    }
    for(let x = gridX0; x <= gridX1; x += dX){
        ctx.moveTo(xv(x), yv(gridY0));
        ctx.lineTo(xv(x), yv(gridY1));
    }
    ctx.stroke();
    signXaxis(dataModel,dX);
    signYaxis(dataModel,dY);
//    drawBottomBoundaryLine(dataModel);
    drawAdditionalMarks(dataModel);
    ctx.strokeRect(gridX0,gridY0,gridWidth,gridHeight);
    ctx.strokeRect(0,0,canvas.width, canvas.height);
    ctx.restore();
};

const signXaxis = (dataModel, dX) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    dataModel.axisX.marks.length = 0;
    let x = gridX0;
    for(let p = dataModel.axisX.min; p <= dataModel.axisX.max; p += dataModel.axisX.step){
        ctx.fillText(''+p,xv(x - 4),yv(gridY0 - 17));
        dataModel.axisX.marks.push(p);
        x += dX;
    }
    ctx.fillText(dataModel.axisX.units,xv(x - dX + 15),yv(gridY0 - 17));
    ctx.textAlign = 'center';
    ctx.fillText(dataModel.axisX.name,xv(gridX0 + gridWidth/2),yv(gridY0 - 35));
    ctx.restore();
}

const signYaxis = (dataModel, dY) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'right';
    dataModel.axisY.marks.length = 0;
    let y = gridY0;
    for(let p = dataModel.axisY.min; p <= dataModel.axisY.max; p += dataModel.axisY.step){
        ctx.fillText(''+p,xv(gridX0 - 7),yv(y - 5));
        dataModel.axisY.marks.push(p);
        y += dY;
    }
    ctx.fillText(dataModel.axisY.units,xv(gridX0 - 7),yv(y - dY + 10));
    ctx.textAlign = 'center';
    ctx.rotate(-Math.PI/2);
    ctx.fillText(dataModel.axisY.name,xv(gridX0 - gridWidth/2),yv(gridHeight + 50));
    ctx.restore();
}

const createPath = (dataModel, points) => {
    let path = new Path2D();
//    let points = dataModel.bottomBoundary;
    let length = points.length;
    for (let i = 0; i < length - 1; i++){
        let p1 = points[i];
        let p2 = points[i + 1];
        let pp1 = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p1);
        let pp2 = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p2);
        if (i == 0){
            path.moveTo(xv(pp1.x), yv(pp1.y));
        }
        path.lineTo(xv(pp2.x), yv(pp2.y));
    }
    return path;
}

const drawBottomBoundaryLine = (dataModel) => {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.stroke(createPath(dataModel, dataModel.bottomBoundary));
    ctx.restore();
}

const drawBottomBoundaryLine2 = (dataModel) => {
    ctx.save();
    ctx.lineWidth = DIAG_STROKE_WIDTH;
    ctx.strokeStyle = diagPattern;
    ctx.stroke(createPath(dataModel, dataModel.bottomBoundary2));
    ctx.restore();
}

const drawAdditionalMarks = (dataModel) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;
    let points = dataModel.bottomBoundary;
    let length = points.length;
    for (let i = 0; i < length - 1; i++){
        let p1 = points[i];
        let p2 = points[i + 1];
        let pp1 = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p1);
        if(!dataModel.axisY.marks.includes(p1.y)){
            ctx.beginPath();
            ctx.fillText(''+p1.y,xv(gridX0 - 7),yv(pp1.y - 5));
            ctx.beginPath();
            ctx.moveTo(xv(gridX0), yv(pp1.y));
            ctx.lineTo(xv(pp1.x), yv(pp1.y));
            ctx.stroke();
        }
        if(!dataModel.axisX.marks.includes(p1.x)){
            ctx.beginPath();
            ctx.fillText(''+p1.x,xv(pp1.x + 18),yv(gridY0 - 17));
            ctx.beginPath();
            ctx.moveTo(xv(pp1.x), yv(gridY0));
            ctx.lineTo(xv(pp1.x), yv(pp1.y));
            ctx.stroke();
        }
    }
    ctx.restore();
}

const drawData = (dataModel, data) => {
    ctx.save();
    let path = createPath(dataModel, dataModel.bottomBoundary);
//    path.closePath();
    data.forEach(p => {
        let pp = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p);
        ctx.beginPath();
        ctx.fillStyle = ctx.isPointInPath(path, pp.x, pp.y)? 'red':'green';
        ctx.arc(pp.x,pp.y,10,0,2*Math.PI);
        ctx.stroke();
        ctx.closePath();
        ctx.fill();
    });
    ctx.restore();
}

const calculateXY = (minX, maxX, minY, maxY, point) => {
    return {
        x: gridX0 + gridWidth * (point.x - minX)/(maxX - minX), 
        y: gridY0 + gridHeight * (point.y - minY)/(maxY - minY)
    }
}

const xv = (x) => { return Math.floor(x) + 0.5; }
const yv = (y) => { return Math.floor(canvas.height - y) + 0.5; }

// module.exports = {
//     "DIAG_STROKE_WIDTH": DIAG_STROKE_WIDTH,
//     "canvas": canvas, 
//     "ctx": ctx,
//     "gridX0": gridX0, 
//     "gridY0": gridY0, 
//     "gridWidth": gridWidth, 
//     "gridHeight": gridHeight, 
//     "gridX1": gridX1, 
//     "gridY1": gridY1,
//     "diagPattern": diagPattern
// } 
