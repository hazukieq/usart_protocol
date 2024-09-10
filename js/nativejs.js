const DATA_LEN=256
const Unprotol_LEN=DATA_LEN+8
var static_vars={
    'step':0,
    'cnt':0,
    'Buf':[],
    'len':0,
    'lenarr':[2],
    'crc16':0,
    'stat':0,
}
const parseResult={
    'data':'',
    'cmd':0
}


const crc16_create=(data,len)=>{
    let CRC16 = 0xFFFF;
    for (let i = 0; i < len; i++) {
        CRC16 ^= (typeof data=='string')?data.charCodeAt(i):data[i]
        for (let j = 0; j < 8; j++) {
            let state = CRC16 & 0x01;
            CRC16 >>= 1;
            if (state) {
                CRC16 ^= 0xA001;
            }
        }
    }
    console.log("CRC16=>",CRC16)
    //console.log("crc16_create=>",{data,len,CRC16}) 
    return CRC16;
}



const receiveData=(byte_data)=>{
    byte_data = typeof byte_data == 'string' ? byte_data.charCodeAt() : byte_data;
    if (static_vars.step == 0) {
        if (byte_data == 0x5a) {
            static_vars.step++;
            static_vars.cnt = 0;

            parseResult.cmd = 0;
            parseResult.data = '';

            static_vars.Buf.push(byte_data);
            static_vars.stat = 0;
            static_vars.cnt++;
        }
    } else if (static_vars.step == 1) {
        if (byte_data == 0xa5) {
            static_vars.step++;
            static_vars.Buf.push(byte_data);
            static_vars.cnt++;
        } else if (byte_data == 0x5a) static_vars.step = 1;
        else static_vars.step = 0;
    } else if (static_vars.step == 2) {
        static_vars.step++;
        static_vars.Buf.push(byte_data);
        static_vars.cnt++;
        //----note that here is no any translation for that!--//
        static_vars.lenarr.push(byte_data);//parseInt(byte_data,16)
        //console.log(static_vars.len)
        //console.log({ buf: static_vars.Buf, byte_data, len: parseInt(byte_data, 16) });
    }else if(static_vars.step == 3){
        static_vars.step++
        static_vars.Buf.push(byte_data)
        static_vars.cnt++
        static_vars.lenarr.push(byte_data)
        console.log(static_vars.lenarr)
        for(let i=0;i<static_vars.lenarr.length;i++)
            static_vars.len|=static_vars.lenarr[i]

        console.log(static_vars.len)
    } else if (static_vars.step == 4) {
        static_vars.step++;
        static_vars.Buf.push(byte_data);
        static_vars.cnt++;
    } else if (static_vars.step == 5) {
        static_vars.Buf.push(byte_data);
        static_vars.cnt++;
        //为什么要DATALEN呢？因为data段长度已经固定，即便不够依然会用0x0填充
        if (DATA_LEN + 5 == static_vars.cnt) static_vars.step++;
        //console.log("keep going!now step is 4th")
    } else if (static_vars.step == 6) {
        static_vars.step++;
        static_vars.crc16 = byte_data;
        //console.log("5th...")
    } else if (static_vars.step == 7) {
        let low_8bits = byte_data;
        static_vars.crc16 = (static_vars.crc16 << 8) | low_8bits;
        let new_crc16 = crc16_create(static_vars.Buf.slice(5, static_vars.len + 5), static_vars.len);
        if (static_vars.crc16 == new_crc16) {
            static_vars.step++;
            //console.log(static_vars.crc16) 
            //console.log("crc16 corrected!")
        }
        else if (byte_data == 0x5a) {
            static_vars.step = 1;
            //console.log("met a 0x5a so go back to 1st")
        }
        else {
            static_vars.step = 0;
            console.log("what a damn, the crc16 seems fault...", static_vars.crc16, '!=', new_crc16);
        }
    } else if (static_vars.step == 8) {
        if (byte_data == 0xff) {
            let cmd = parseInt(static_vars.Buf[3], 16);
            let data = static_vars.Buf.slice(5,static_vars.len+5).flatMap((item) =>String.fromCharCode(item)).join('');

            static_vars.stat = 1;
            parseResult.cmd = cmd;
            parseResult.data = data;

            static_vars.step = 0;
            static_vars.Buf = [];
            static_vars.len = 0;
            static_vars.crc16 = 0;
        } else if (byte_data == 0xa5)
            static_vars.step = 1;
        else static_vars.step = 0;
    } else static_vars.step = 0;
}


const createData=(_cmd,str)=>{
    let head=[0x5a,0xa5]
    let end=0xff
    /**
     * 根据给定字符串生成特定格式的数据数组。
     * 该函数不接受参数，也不直接返回值，但会通过控制台输出部分结果。
     * 
     * 主要步骤包括：
     * 1. 确定数据长度：将字符串长度与预定义的最大数据长度DATA_LEN比较，取较小值。
     * 2. 初始化命令变量：将命令赋值给_cmd变量，此处未展示命令的来源或定义。
     * 3. 构建数据数组：创建一个长度为DATA_LEN的数组，其中每个元素根据字符串内容赋值。
     *    如果字符串长度超过DATA_LEN，数组中超出部分的元素赋值为0x00。
     */
    let datalen=str.length>DATA_LEN?DATA_LEN:str.length // 确定实际处理的数据长度
    let datalen_low=datalen&0xff
    let datalen_high=datalen>>8&0xff
    console.log(datalen_low|datalen_high)
    console.log(datalen) // 输出数据长度，此处len变量未定义，可能是个错误，应为datalen
    let cmd=_cmd // 初始化命令变量

    let data=[DATA_LEN] // 初始化数据数组，长度为DATA_LEN
    for(let i=0;i<DATA_LEN;i++){ // 遍历数据数组
        data[i]=i<datalen?str.charCodeAt(i):0x00 // 根据字符串内容或赋值为0x00
    }

    let crc16_arr=[2]
    let crc16=crc16_create(data,datalen)
    crc16_arr[0]=(crc16>>8)
    crc16_arr[1]=crc16&0xff

    dataframe=[].concat(head,datalen_low,datalen_high,cmd,data,crc16_arr,end)
    if(dataframe.length!=Unprotol_LEN) console.log("dataframe length is not correct!")
    return dataframe
}


const sendToNative=(cmd,datas)=>{
    let dataframe=createData(cmd,datas)
    let binaryString = dataframe.map(num => 'x'+num.toString(16)).join('');
    console.log(binaryString)
    //NJs.send(binaryString)
    return binaryString
}

const receiveFromNative=(raw_data)=>{
    if(raw_data!=undefined&&raw_data!=null&&typeof raw_data=='string'&&raw_data.length>0){
        let data=raw_data.split('x').slice(1)
        
        for(d of data) receiveData(parseInt('0x'+d,16))
        
        if(static_vars.stat==1)
            //execute something according to status!
            execCmdFromNative(parseResult.cmd,parseResult.data)   
        
    }
}


const execCmdFromNative=(cmd,dats)=>{
    console.log(`cmd=${cmd}, datas=${dats}`)
    console.log("execue something based on the state!")  
    let obj=JSON.parse(dats)
    console.log(obj)
    console.log(typeof dats)//JSON.parse(receive)) 
}



const Nativejs={
    receive:receiveFromNative,
    send:sendToNative
}


const test_Unprotocol=()=>{
    let obj_str=JSON.stringify({arg1:'hello',arg2:'world'})
    console.log(obj_str)
    let raw=sendToNative(0x01,obj_str)
    receiveFromNative(raw)
}
