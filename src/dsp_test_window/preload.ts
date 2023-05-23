const { ipcRenderer } = require('electron');

addEventListener('load', (event) => {
    ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'SERIAL_PORT_LIST'  })
    .then(result => {
        $('#serial-port-select').append(result.map(el => `<option value="${el.path}">${el.friendlyName}</option>`).join(''));
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
        let kf = +$button.attr('kf')!;
        let cmd = { "kf": kf };
        switch (kf){
            case 0x41: // Установить параметры
            let p30 = +$button.attr('p30')!;
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
                break;
        }
        ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'SEND_COMMAND_TO_DSP', cmd: cmd})
        .then(result => {
            let $text = $('#logarea');
            $text.val(`${$text.val()}\n===> ${result.success? result.content : 'error'}`)
        });
    });
    $('#clear-log').on('click', () => {
        $('#logarea').val('');
    });
    $('#load-sdp-soft').on('click', () => {
        let $text = $('#logarea');
        ipcRenderer.invoke('VIEW_TO_CONTROLLER_MESSAGE', { command: 'LOAD_DSP_SOFT' })
        .then(result => {
            $text.val(`${$text.val()}\n<=== ${result}`)
            console.log(result);
        })
        .catch(err => {
            $text.val(`${$text.val()}\n<=== ${err}`)
            console.log(err);
        })

    })
});

ipcRenderer.on('CONTROLLER_TO_VIEW_MESSAGE', (evt, message) => {
    switch(message.type){
        case 'DATA_FROM_SERIALPORT':
            let $text = $('#logarea');
            $text.val(`${$text.val()}\n<=== ${message.data}`)
            
        break;
    }
});

