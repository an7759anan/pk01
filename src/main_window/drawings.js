let DIAG_STROKE_WIDTH, canvas, ctx, gridX0, gridY0, gridWidth, gridHeight, gridX1, gridY1, diagPattern;

exports.drawInit = (drawContext) => {
   ({DIAG_STROKE_WIDTH, canvas, ctx, gridX0, gridY0, gridWidth, gridHeight, gridX1, gridY1, diagPattern} = drawContext); 
}

exports.drawPicture = (dataModel) => {
    ctx.clearRect(0,0,1000,1000);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.textAlign = 'left';
    drawGrid(dataModel);
};

exports.drawData = (dataModel, data) => {
    ctx.save();
//    let path = createPath(dataModel, dataModel.bottomBoundary);
    let path = createPath(dataModel, dataModel.boundaries[0].line); // TODO now only for SNM !
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

const drawGrid = (dataModel) => {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    for(const bound of dataModel.boundaries) {
        drawBoundaryLine(dataModel, bound);
    }
//    drawBottomBoundaryLine2(dataModel);
    if(dataModel.axisX.step){
        ctx.beginPath();
        let xPointsNum = (dataModel.axisX.max - dataModel.axisX.min)/dataModel.axisX.step;
        let dX = gridWidth/xPointsNum;
        for(let x = gridX0; x <= gridX1; x += dX){
            ctx.moveTo(xv(x), yv(gridY0));
            ctx.lineTo(xv(x), yv(gridY1));
        }
        ctx.stroke();
        signXaxisMarks(dataModel, dX);
    }
    if (dataModel.axisY.step){
        ctx.beginPath();
        let yPointsNum = (dataModel.axisY.max - dataModel.axisY.min)/dataModel.axisY.step;
        let dY = gridHeight/yPointsNum;
        for(let y = gridY0; y <= gridY1; y += dY){
            ctx.moveTo(xv(gridX0), yv(y));
            ctx.lineTo(xv(gridX1), yv(y));
        }
        ctx.stroke();
        signYaxisMarks(dataModel, dY);
    }
    signXaxis(dataModel);
    signYaxis(dataModel);
//    drawBottomBoundaryLine(dataModel);
    drawAdditionalMarks(dataModel);
    ctx.strokeRect(gridX0,gridY0,gridWidth,gridHeight);
    ctx.strokeRect(0,0,canvas.width, canvas.height);
    ctx.restore();
};

const signXaxisMarks = (dataModel, dX) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    dataModel.axisX.marks.length = 0;
    let x = gridX0;
    if (dataModel.axisX.step){
        for(let p = dataModel.axisX.min; p <= dataModel.axisX.max; p += dataModel.axisX.step){
            ctx.fillText(''+p,xv(x - 4),yv(gridY0 - 17));
            dataModel.axisX.marks.push(p);
            x += dX;
        }
    }
    ctx.restore();
}

const signXaxis = (dataModel) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.fillText(dataModel.axisX.units,xv(gridX1 + 15),yv(gridY0 - 17));
    ctx.textAlign = 'center';
    ctx.fillText(dataModel.axisX.name,xv(gridX0 + gridWidth/2),yv(gridY0 - 35));
    ctx.restore();
}

const signYaxisMarks = (dataModel, dY) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'right';
    dataModel.axisY.marks.length = 0;
    let y = gridY0;
    if(dataModel.axisY.step){
        for(let p = dataModel.axisY.min; p <= dataModel.axisY.max; p += dataModel.axisY.step){
            ctx.fillText(''+p,xv(gridX0 - 7),yv(y - 5));
            dataModel.axisY.marks.push(p);
            y += dY;
        }
    }
    ctx.restore();
}

const signYaxis = (dataModel) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(dataModel.axisY.units,xv(gridX0 - 7),yv(gridY1 + 10));
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

const drawBoundaryLine = (dataModel, bound) => {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.stroke(createPath(dataModel, bound.line));
    ctx.lineWidth = DIAG_STROKE_WIDTH;
    ctx.strokeStyle = diagPattern;
    ctx.stroke(createPath(dataModel, bound.shadow));
    ctx.restore();
}

// const drawBottomBoundaryLine2 = (dataModel) => {
//     ctx.save();
//     ctx.lineWidth = DIAG_STROKE_WIDTH;
//     ctx.strokeStyle = diagPattern;
//     ctx.stroke(createPath(dataModel, dataModel.bottomBoundary2));
//     ctx.restore();
// }

const drawAdditionalMarks = (dataModel) => {
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;
    for(const bound of dataModel.boundaries){
        let points = bound.line;
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
    }
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
