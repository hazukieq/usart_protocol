class DataFrame{
    val HEADER_LEN=5 //header[2],len[2],cmd[1]
    val DATALEN=256
    val Unprotocol_LEN=DATALEN+8
    private var head: Short=0x5AA5
    var len: Short= 0
    var cmd: Byte=0x00
    var data: ByteArray= ByteArray(DATALEN)
    var crc16: UShort=0xFFFFu
    private var end: Byte=(0xff).toByte()

    fun create(_cmd:Int,_data: ByteArray){
        cmd=_cmd.or(0x00).toByte()
        //当 data 是汉字时，data 的长度(utf-8编码的长度)和实际字节长度不一样!!!
        len= _data.size.toShort()
        if(_data.size>DATALEN) len=DATALEN.toShort()
        for(i in 0..<len.toInt()) data[i]=_data[i]
        for(i in len.toInt()..<DATALEN) data[i]=0x0
        crc16=crc16_create(_data,len.toInt())
    }

    fun crc16_create(_data:ByteArray,len:Int):UShort{
        return _crc16_create(_data,len)
    }

    private fun _crc16_create(_data:ByteArray,slen:Int):UShort{
        var _crc16: UShort = 0xFFFFu
        var state:UShort

        for(i in 0..<slen){
            _crc16 = _crc16 xor _data[i].toUByte().toUShort()
            for (j in 0..<8) {
                state = _crc16 and 0x01u
                _crc16 = (_crc16.toInt() shr 1).toUShort()
                if (state.toInt() != 0) {
                    _crc16 = _crc16 xor 0xA001u
                }
            }
        }
        return _crc16
    }

    fun bytes2int(params:ByteArray):Int{
        var value=0
        for(i in params.size-1 downTo 0){
            val shift=i*8
            value+=params[i].toInt() and 0x000000ff shl shift
        }
        return value
    }

    fun int2bytes(param:Int):ByteArray{
        val value=ByteArray(4)
        value[3]=(param.shr(24) and 0xff).toByte()
        value[2]=(param.shr(16) and 0xff).toByte()
        value[1]=(param.shr(8) and 0xff).toByte()
        value[0]=(param.shr(0) and 0xff).toByte()
        return value
    }

    fun toData(): Map<Int, ByteArray> {
        val cmdstr=cmd.toInt()
        return mapOf(cmdstr to data.sliceArray(0..<len.toInt()))
    }

    fun toRawdata():ByteArray{
        val obj=ByteArray(Unprotocol_LEN)
        var cnt=0
        obj[cnt++]=head.toInt().shr(8).toByte()
        obj[cnt++]=head.toInt().and(0xff).toByte()
        //默认小端存储
        obj[cnt++]=len.toInt().and(0xff).toByte()
        obj[cnt++]=len.toInt().shr(8).toByte()
        obj[cnt++]=cmd
        data.forEach {
            obj[cnt++]=it
        }
        obj[cnt++]=crc16.toInt().shr(8).toByte()
        obj[cnt++]=crc16.and(0xffu).toByte()
        obj[cnt++]=end
        return obj
    }

    fun getRawStr():String{
        return toRawdata().joinToString(""){ "x%01x".format(it) }
    }

}
