const { ipcRenderer } = require('electron');

// setTimeout(()=>{

//     $('#cmd1').on('click', () => {
//         $('#mode-select').show();
//     });
//     $('#cmd2').on('click', () => {
//         $('#mode-select').hide();
//     });

// }, 2000);

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
                            drawPicture();
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

const drawPicture = () => {
    let canvaso = $('#measurement-screen canvas')[0];
    let ctx = canvaso.getContext('2d');
    ctx.clearRect(0,0,1000,1000);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.moveTo(50,50);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillText('text',50,50);
}
