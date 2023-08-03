const { ipcRenderer } = require('electron');
const { drawInit, drawData, drawPicture } = require('./drawings');

ipcRenderer.on('CONTROLLER_TO_VIEW_MESSAGE', (evt, message) => {
    if (message.screen == 'DSP_TEST_SCREEN') {
        if (message.show == true) $('#dsp-test-screen').show();
        if (message.value && message.value == 'DATA_TO_SERIALPORT'){
            let $text = $('#logarea');
            let dataFromDspText = `===> data: ${JSON.stringify(message.data)}`;
            $text.val(`${dataFromDspText}\n${$text.val()}`)
        }
        if (message.value && message.value == 'DATA_FROM_SERIALPORT'){
            let $text = $('#logarea');
            let dataFromDspText = `<=== row: ${message.data.dataFromSerialPort}; data: ${JSON.stringify(message.data.dataFromDsp)}`;
            if (message.data.dataFromDsp["p30"] === 2){
                let d = message.data.dataFromDsp;
                // dataFromDspText = `Вх.сиг: ${d["p8"]}; Шум: ${d["p9"]}; Ур.вх.сиг.: ${(20*Math.log10(d["p8"]/0.775)).toFixed(2)}; Отношение: ${(20*Math.log10(d["p8"]/d["p9"])).toFixed(2)}`
                dataFromDspText = `Вх.сиг: ${d["p8"]}; Шум: ${d["p9"]}; Ур.вх.сиг.: ${(20*Math.log10(d["p8"]/10158)).toFixed(2)}; Отношение: ${(20*Math.log10(d["p8"]/d["p9"])).toFixed(2)}`
            }
            $text.val(`${dataFromDspText}\n${$text.val()}`)
        }
    }
});

/**
 * DSP тестовое представление
 */
addEventListener('load', (event) => {
    ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'SERIAL_PORT_LIST'  })
    .then(result => {
        $('#serial-port-select').append(result.map(el => `<option value="${el.path}">${el.friendlyName || el.path}</option>`).join(''));
    });
    $("#open-port").on('click', (e) => {
        ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'SERIAL_PORT_OPEN', path: $('#serial-port-select').val()})
        .then(result => {
            $('#open-port').text(result? 'Открыт':'Не открыт');
        });
    });
    $('button[kf]').on('click', (e) => {
        let $button = $(e.target);
        let $tr = $button.closest('tr');
        let kf = +$button.attr('kf');
        let cmd = { "kf": kf };
        switch (kf){
            case 0x41: // Установить параметры
            let p30 = +$button.attr('p30');
            cmd["p30"] = p30;
            switch (p30){
                case 1:
                    cmd["p2"] = parseInt($tr.find('td[param="2"]').text());
                    cmd["p3.1"] = parseInt($tr.find('td[param="3.1"]').text());
                    cmd["p6"] = parseInt($tr.find('td[param="6"]').text());
                    cmd["p7"] = parseInt($tr.find('td[param="7"]').text());
                    break;
                case 2:
                    cmd["p3.1"] = parseInt($tr.find('td[param="3.1"]').text());
                    cmd["p11"] = parseInt($tr.find('td[param="11"]').text());
                    break;
                case 4:
                    cmd["p2"] = parseInt($tr.find('td[param="2"]').text());
                    cmd["p3.1"] = parseInt($tr.find('td[param="3.1"]').text());
                    cmd["p3.2"] = parseInt($tr.find('td[param="3.2"]').text());
                    cmd["p12"] = parseInt($tr.find('td[param="12"]').text());
                    break;
                case 5:
                    cmd["p2"] = parseInt($tr.find('td[param="2"]').text());
                    cmd["p11"] = parseInt($tr.find('td[param="11"]').text());
                    break;
                default:
                    break;
            }
            cmd["TEST"] = parseInt($tr.find('td[param="TEST"]').text());
            cmd["PSOF"] = parseInt($tr.find('td[param="PSOF"]').text());
            cmd["DB10"] = parseInt($tr.find('td[param="DB10"]').text());
            ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'SEND_COMMAND_TO_DSP', cmd: cmd})
            .then(result => {
                let $text = $('#logarea');
                $text.val(`===> ${result.success? result.content : 'error'}\n${$text.val()}`)
            });
            break;
            case 42: // имитация ответа DSP
            cmd["p30"] = parseInt($tr.find('td[param="30"]').text());
            cmd["p4"] = parseInt($tr.find('td[param="4"]').text());
            cmd["p3.1"] = parseInt($tr.find('td[param="3.1"]').text());
            ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'SEND_COMMAND_FROM_DSP', cmd: cmd})
            .then(result => {
                let $text = $('#logarea');
                $text.val(`===> ${result.success? result.content : 'error'}\n${$text.val()}`)
            });
            break;
        }
    });
    $('#clear-log').on('click', () => {
        $('#logarea').val('');
    });
    $('#load-sdp-soft').on('click', () => {
        let $text = $('#logarea');
        ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'LOAD_DSP_SOFT' })
        .then(result => {
            $text.val(`<=== ${result}\n${$text.val()}`)
            console.log(result);
        })
        .catch(err => {
            $text.val(`<=== ${err}\n${$text.val()}`)
            console.log(result);
        })
    })
    $('#touch-panel-screen button').on('click', e => {
        let $button = $(e.target).closest('button');
        ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'EVENT_LOOP', key: +$button.attr('code') })
    });
});