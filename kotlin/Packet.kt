class Packet(val DATA_LEN_MAX:Short){
    private val HEAD_L=2
    private val END_L=1
    private val LEN_L=2
    private val CMD_L=1
    private val CRC16_L=2
    var PACKET_HEADER_LEN=0
    var TOTAL_LEN=0


    //copied from struct property.
    private val head: Short=0x5AA5
    var len:Short=0
    var cmd: Byte=0x0
    var data: ByteArray= ByteArray(len.toInt())
    var crc16: UShort=0xFFFFu
    private val end: Byte=(0xff).toByte()

    //construct the packet object
    fun crc16_create(DATA_ARR:ByteArray,data_arr_size:Int):UShort{
        var crc16: UShort = 0xFFFFu
        var state:UShort


        for(i in 0..<data_arr_size){
            crc16 = crc16 xor DATA_ARR[i].toUByte().toUShort()
            for (j in 0..<8) {
                state = crc16 and 0x01u
                crc16 = (crc16.toInt() shr 1).toUShort()
                if (state.toInt() != 0) {
                    crc16 = crc16 xor 0xA001u
                }
            }
        }
        return crc16
    }

    init {
        PACKET_HEADER_LEN=HEAD_L+LEN_L+CMD_L
        TOTAL_LEN=HEAD_L+LEN_L+CMD_L+DATA_LEN_MAX+CRC16_L+END_L
    }

    private fun toRawdata():ByteArray{
        val obj=ByteArray(TOTAL_LEN)
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

    fun build(CMD:Int,DATA:String): Packet {
        cmd=CMD.or(0x00).toByte()

        val DATA_ARR=DATA.encodeToByteArray()
        data= ByteArray(DATA_LEN_MAX.toInt())
        len=DATA_ARR.size.toShort()
        if(data.size>DATA_LEN_MAX) len= DATA_LEN_MAX
        for(i in 0..<len.toInt()) data[i]=DATA_ARR[i]
        for(i in len.toInt()..<DATA_LEN_MAX) data[i]=0x0

        crc16=crc16_create(DATA_ARR,DATA_ARR.size)

        return this
    }

    fun create(CMD:Int,DATA:String):ByteArray{
        return build(CMD, DATA).toRawdata()
    }

    fun getRawStr():String{
        return toRawdata().joinToString(""){ "x%01x".format(it) }
    }

    fun toBytes():ByteArray{
        return toRawdata()
    }
}
