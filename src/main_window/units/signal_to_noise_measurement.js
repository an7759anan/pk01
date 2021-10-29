// const {DIAG_STROKE_WIDTH, canvas, ctx, gridX0, gridY0, gridWidth, gridHeight, gridX1, gridY1, diagPattern} = require('../globals');
// //const w = require('../index');

// const drawPicture = (dataModel) => {
//     ctx.clearRect(0,0,1000,1000);
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = '#000000';
//     ctx.textAlign = 'left';
//     drawGrid(dataModel);
// };

// const drawGrid = (dataModel) => {
//     ctx.save();
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = '#000000';
//     let xPointsNum = (dataModel.axisX.max - dataModel.axisX.min)/dataModel.axisX.step;
//     let yPointsNum = (dataModel.axisY.max - dataModel.axisY.min)/dataModel.axisY.step;
//     let dX = gridWidth/xPointsNum;
//     let dY = gridHeight/yPointsNum;
//     drawBottomBoundaryLine(dataModel);
//     drawBottomBoundaryLine2(dataModel);
//     ctx.beginPath();
//     for(let y = gridY0; y <= gridY1; y += dY){
//         ctx.moveTo(xv(gridX0), yv(y));
//         ctx.lineTo(xv(gridX1), yv(y));
//     }
//     for(let x = gridX0; x <= gridX1; x += dX){
//         ctx.moveTo(xv(x), yv(gridY0));
//         ctx.lineTo(xv(x), yv(gridY1));
//     }
//     ctx.stroke();
//     signXaxis(dataModel,dX);
//     signYaxis(dataModel,dY);
// //    drawBottomBoundaryLine(dataModel);
//     drawAdditionalMarks(dataModel);
//     ctx.strokeRect(gridX0,gridY0,gridWidth,gridHeight);
//     ctx.strokeRect(0,0,canvas.width, canvas.height);
//     ctx.restore();
// };

// const signXaxis = (dataModel, dX) => {
//     ctx.save();
//     ctx.font = '15px sans-serif';
//     dataModel.axisX.marks.length = 0;
//     let x = gridX0;
//     for(let p = dataModel.axisX.min; p <= dataModel.axisX.max; p += dataModel.axisX.step){
//         ctx.fillText(''+p,xv(x - 4),yv(gridY0 - 17));
//         dataModel.axisX.marks.push(p);
//         x += dX;
//     }
//     ctx.fillText(dataModel.axisX.units,xv(x - dX + 15),yv(gridY0 - 17));
//     ctx.textAlign = 'center';
//     ctx.fillText(dataModel.axisX.name,xv(gridX0 + gridWidth/2),yv(gridY0 - 35));
//     ctx.restore();
// }

// const signYaxis = (dataModel, dY) => {
//     ctx.save();
//     ctx.font = '15px sans-serif';
//     ctx.textAlign = 'right';
//     dataModel.axisY.marks.length = 0;
//     let y = gridY0;
//     for(let p = dataModel.axisY.min; p <= dataModel.axisY.max; p += dataModel.axisY.step){
//         ctx.fillText(''+p,xv(gridX0 - 7),yv(y - 5));
//         dataModel.axisY.marks.push(p);
//         y += dY;
//     }
//     ctx.fillText(dataModel.axisY.units,xv(gridX0 - 7),yv(y - dY + 10));
//     ctx.textAlign = 'center';
//     ctx.rotate(-Math.PI/2);
//     ctx.fillText(dataModel.axisY.name,xv(gridX0 - gridWidth/2),yv(gridHeight + 50));
//     ctx.restore();
// }

// const createPath = (dataModel, points) => {
//     let path = new Path2D();
// //    let points = dataModel.bottomBoundary;
//     let length = points.length;
//     for (let i = 0; i < length - 1; i++){
//         let p1 = points[i];
//         let p2 = points[i + 1];
//         let pp1 = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p1);
//         let pp2 = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p2);
//         if (i == 0){
//             path.moveTo(xv(pp1.x), yv(pp1.y));
//         }
//         path.lineTo(xv(pp2.x), yv(pp2.y));
//     }
//     return path;
// }

// const drawBottomBoundaryLine = (dataModel) => {
//     ctx.save();
//     ctx.lineWidth = 2;
//     ctx.stroke(createPath(dataModel, dataModel.bottomBoundary));
//     ctx.restore();
// }

// const drawBottomBoundaryLine2 = (dataModel) => {
//     ctx.save();
//     ctx.lineWidth = DIAG_STROKE_WIDTH;
//     ctx.strokeStyle = diagPattern;
//     ctx.stroke(createPath(dataModel, dataModel.bottomBoundary2));
//     ctx.restore();
// }

// const drawAdditionalMarks = (dataModel) => {
//     ctx.save();
//     ctx.font = '15px sans-serif';
//     ctx.textAlign = 'right';
//     ctx.lineWidth = 1;
//     let points = dataModel.bottomBoundary;
//     let length = points.length;
//     for (let i = 0; i < length - 1; i++){
//         let p1 = points[i];
//         let p2 = points[i + 1];
//         let pp1 = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p1);
//         if(!dataModel.axisY.marks.includes(p1.y)){
//             ctx.beginPath();
//             ctx.fillText(''+p1.y,xv(gridX0 - 7),yv(pp1.y - 5));
//             ctx.beginPath();
//             ctx.moveTo(xv(gridX0), yv(pp1.y));
//             ctx.lineTo(xv(pp1.x), yv(pp1.y));
//             ctx.stroke();
//         }
//         if(!dataModel.axisX.marks.includes(p1.x)){
//             ctx.beginPath();
//             ctx.fillText(''+p1.x,xv(pp1.x + 18),yv(gridY0 - 17));
//             ctx.beginPath();
//             ctx.moveTo(xv(pp1.x), yv(gridY0));
//             ctx.lineTo(xv(pp1.x), yv(pp1.y));
//             ctx.stroke();
//         }
//     }
//     ctx.restore();
// }

// const drawData = (dataModel, data) => {
//     ctx.save();
//     let path = createPath(dataModel, dataModel.bottomBoundary);
// //    path.closePath();
//     data.forEach(p => {
//         let pp = calculateXY(dataModel.axisX.min,dataModel.axisX.max,dataModel.axisY.min,dataModel.axisY.max,p);
//         ctx.beginPath();
//         ctx.fillStyle = ctx.isPointInPath(path, pp.x, pp.y)? 'red':'green';
//         ctx.arc(pp.x,pp.y,10,0,2*Math.PI);
//         ctx.stroke();
//         ctx.closePath();
//         ctx.fill();
//     });
//     ctx.restore();
// }

// const calculateXY = (minX, maxX, minY, maxY, point) => {
//     return {
//         x: gridX0 + gridWidth * (point.x - minX)/(maxX - minX), 
//         y: gridY0 + gridHeight * (point.y - minY)/(maxY - minY)
//     }
// }

// const xv = (x) => { return Math.floor(x) + 0.5; }
// const yv = (y) => { return Math.floor(canvas.height - y) + 0.5; }


// module.exports = {
//     "indrawDatait": drawData,
//     "drawPicture": drawPicture
// } 
