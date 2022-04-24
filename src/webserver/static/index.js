"use strict";
(function(){
    document.addEventListener('DOMContentLoaded', e => {
        let button = document.querySelector('#load-dsp');
        let input = document.querySelector('#file-upload-input');
            button.addEventListener('click', e => {
            input.value = '';
            input.click();
        });
        input.addEventListener('change', e => {
            if (e.target.files.length){
                let reader = new FileReader();
                reader.onload = function(e){
                    if (e.target.result && e.target.result.length){
                        let fileContent64 = e.target.result.substring(e.target.result.indexOf(";base64,") + 8);
                        fetch('/rest/dsp/soft', {
                            method: 'PUT',
                            body: JSON.stringify({
                                content: fileContent64
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(data => {
                            alert('File transferred');
                        })
                        .catch(data => {
                            alert('Transfer fail');
                        });
                    }
                }
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    });
}())