var crc16=Nativejs.send(0x01,'')
const detect=(e)=>{
    $('crc16').innerHTML=Nativejs.send(0x01,e.value)
}

setTimeout(() => {
    $('waitloading').innerHTML=`
    <div class="row">
        <div class="col ps-5 pe-5">
            <div class="mb-3 mt-2">
                <label for="crc16_create" class="form-label"><h5>传输数据</h5></label>
                <input class="form-control" id="crc16_create" placeholder="" oninput="detect(this)">
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col ps-5 pe-5">
            <h5>Crc16 二进制数据:</h5>
            <p class="text-break" id="crc16">${crc16}</p>
        </div>
    </div>`
}, 1000);