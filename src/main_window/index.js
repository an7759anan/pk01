const { ipcRenderer } = require('electron');
const { drawInit, drawData, drawPicture } = require('./drawings');

setTimeout(()=>{
    let dc = {};
    dc.DIAG_STROKE_WIDTH = 16;
    dc.canvas = $('#measurement-screen canvas')[0];
    dc.ctx = dc.canvas.getContext('2d');
    dc.gridX0 = 0.1 * dc.canvas.width;
    dc.gridY0 = 0.1 * dc.canvas.height + 20;
    dc.gridWidth = 0.8 * dc.canvas.width;
    dc.gridHeight = 0.8 * dc.canvas.height;
    dc.gridX1 = dc.gridX0 + dc.gridWidth;
    dc.gridY1 = dc.gridY0 + dc.gridHeight;
    let img = new Image();
    img.onload = () => {
        dc.diagPattern = dc.ctx.createPattern(img,'repeat');
        drawInit(dc);
    };
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAELSURBVDhPhZJLroMwDEXLHyT2v0kkmPBHkJdjYggp1bsDiE+v7drhY2V8FUVhoihy0Sk8IUPwR7YAV3Dfd3n7rG1b4dM0mbqu7wLjOJokSS4j2rZN4jiOHTkFL8vy8sqTv4dxWRaBFJTqzgSHIViWZZfXxrcRaWefqd74h1kQido5XBgcpsnDMNyNhFixGL8DBtUbVya0aZqHScWczKvc34MyeYbJ67rKO03Taxxlodee75n/u4WQoa8lIgrmeS5nFCbrEpFlH9P3vQSIRDWSiNlPVs3zfHIX/7yFMPn1FlgQnVma6jiOr2R8cEbUT1x+VaNW77pOYt0DHIbCovb8BOiNIVhVVS5CxvwBLOLdbHKhoSgAAAAASUVORK5CYII=';
}, 2000);


ipcRenderer.on('CONTROLLER_TO_VIEW_MESSAGE', (evt, message) => {
    if (message.screen == 'MODE_DIALOG'){
        if (message.show == true) {
            $('#mode-select').show();
            $('.gray-area').show();
        }
        if (message.value) $('#mode-select select').val(message.value);
    } else {
        if (message.show != undefined) $('.screens').hide();
        switch(message.screen){
            case 'SPLASH_SCREEN':
                if (message.show == true) $('#splash-screen').show();
            break;
            case 'DSP_LOADING':
                if (message.show == true) $('#dsp-loading-screen').show();
                if (message.dsp_loading_result) $('#dsp-loading-section').text($('#dsp-loading-section').text() + message.dsp_loading_result);
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
            case 'MEASUREMENT_GRAPHIC':
                if (message.show == true) $('#measurement-screen').show();
                if (message.value){
                    switch(message.value){
                        case 'TONE_SIGNAL_MEASUREMENT':
    
                        break;
                        case 'FREE_CHANNEL_NOISE_MEASUREMENT':
                    
                        break;
                        case 'SIGNAL_TO_NOISE_MEASUREMENT':
                        case 'FREQUENCY_RESPONSE_MEASUREMENT':
                        case 'AMPLITUDE_RESPONSE_MEASUREMENT':
                            if(message.data){
                                switch (message.action) {
                                    case 'draw-data':
                                        drawData(message.data);
                                    break;
                                    case 'draw-grid':
                                        drawPicture(message.data);
                                    break;
                                }
                            }
                        break;
                    }
                }
            break;
            case 'MEASUREMENT_TABLE': 
                switch(message.value){
                    case 'SIGNAL_TO_NOISE_MEASUREMENT':
                    case 'FREQUENCY_RESPONSE_MEASUREMENT':
                    case 'AMPLITUDE_RESPONSE_MEASUREMENT':
                        let $table_frame = $('#measurement-table');
                        let $table_body = $table_frame.find('table>body');
                        if (message.show == true) $table_frame.show();
                        renderTable(message.data);
                    break;
                }
            break;
            case 'SETTINGS_GRID':
                if (message.show == true) {
                    renderSettings(message.data);
                    $('#settings-grid').show();
                }
                $('.settings-item').removeClass('focus-mode edit-mode');
                if (message.value){
                    $(`.${message.value}`).addClass('focus-mode');
                    if (message.edit == true){
                        $(`.${message.value}`).addClass('edit-mode');
                    }
                    if (message.data){
                        renderSetting(message.value, message.data[message.value]);
                    }
                }
            break;
            case 'MEASUREMENT_GRID':
                if (message.show == true){ $(`#${message.value}`).show(); }
                if (message.data && message.data.data) {
                    let data = message.data.data;
                    let dataLength = data.length;
                    if (dataLength){
                        let lastValue = data[dataLength - 1];
                        switch(message.value){
                            case 'TONE_SIGNAL_MEASUREMENT':
                                $('#TONE_SIGNAL_MEASUREMENT .tsm-freq-gen').text(lastValue.genx);
                                $('#TONE_SIGNAL_MEASUREMENT .tsm-freq-val').text(lastValue.x);
                                $('#TONE_SIGNAL_MEASUREMENT .tsm-level-gen').text(lastValue.geny);
                                $('#TONE_SIGNAL_MEASUREMENT .tsm-level-val').text(lastValue.y);
                            break;
                            case 'FREE_CHANNEL_NOISE_MEASUREMENT':
                                $('#FREE_CHANNEL_NOISE_MEASUREMENT .fcn-level-val span').text(lastValue.x.toLocaleString('ru',{maximumFractionDigits: 1}));
                            break;
                        }
                    }
                }
            break;
            case 'NORMATIVE_TABLE':
                if (message.show == true){
                    $(`#normatives-${message.value}`).show();
                }
            break;
        }
    }
});

const renderSetting = (prop, v) => {
    if (v.type == 'enum'){
        $(`.${prop} span`).text(v.values.find(vv => vv.val == v.val).name);
    } else {
        $(`.${prop} span`).text(v.val);
    }
}

const renderSettings = (settings) => {
    for (let prop in settings) {
        if (settings.hasOwnProperty(prop)){
            renderSetting(prop, settings[prop]);
        }
    }
}

const renderTable = (data_model) => {
    let $table = $('#measurement-table');
    let $theads = $table.find('thead th');
    let $tbody = $table.find('tbody');
    $theads[0].innerText = `${data_model.axisX.name}, ${data_model.axisX.units}`;
    $theads[1].innerText = `${data_model.axisY.name}, ${data_model.axisY.units}`;
    $tbody.find('tr').remove();
    $tbody.append(data_model.data.map(d => `
        <tr>
            <td>${d.x.toLocaleString('ru',{minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td ${d.isBad? 'class="bad-value"':''}>${d.y.toLocaleString('ru',{minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        </tr>
    `));
}
