import java.lang.Exception
import java.nio.ByteBuffer
import java.util.Objects

object DataParser{
    private val HEADER_LEN=DataFrame().HEADER_LEN
    private val DATALEN=DataFrame().DATALEN
    private val dtaFrame=DataFrame()
    private val Unprotocol_LEN=dtaFrame.Unprotocol_LEN
    private var buf=ByteArray(Unprotocol_LEN)
    private var step=0
    private var cnt=0
    private var len=0

    private val b0x5a=(0x5A).toByte()
    private val b0xa5=(0xA5).toByte()
    private val b0xff=(0xFF).toByte()

    private var check=false

    private fun clearBuf(buf:ByteArray){
        buf.fill(0x00,0 , Unprotocol_LEN)
    }

    fun parseBuffer(raws:ByteArray):Map<Int,ByteArray>{
        var parsedStr= mapOf<Int,ByteArray>()
        for(raw in raws){
            try{
                parse(raw)
            }catch (e:Exception){
                e.printStackTrace()
                break
            }
            // we need to know the status of parser,so set a check var here
            if(check) {
                parsedStr=dtaFrame.toData()
                check=false
                break
            }
        }
        return parsedStr
    }


    fun jsparse(raws:String):Map<Int,ByteArray>{
        val raw=raws.split('x').let {
            it.subList(1,it.size).map { it.toUInt(16).toByte()}
        }
        return parseBuffer(raw.toByteArray())
    }

    fun toStr(data:Map<Int,ByteArray>)= mapOf(data.firstNotNullOf { it.key to it.value.decodeToString() })
    fun toInt(data: Map<Int, ByteArray>)= mapOf(data.firstNotNullOf { it.key to dtaFrame.bytes2int(it.value) })

    private fun parse(raw:Byte){
        when(step){
            0->{
                if(raw==b0x5a){
                    step++
                    cnt=0
                    len=0
                    buf[cnt++]=raw
                }
            }

            1-> {
                when (raw) {
                    b0xa5 -> {
                        step++
                        buf[cnt++] = raw
                    }

                    b0x5a -> step = 1
                    else -> step = 0
                }
            }

            2->{
                step++
                buf[cnt++]=raw
                len=raw.toInt()
            }

            3->{
                step++
                buf[cnt++]=raw
                len=len.or(raw.toInt())
                println(len)
            }
            4->{
                step++
                buf[cnt++]=raw
            }
            5->{
                buf[cnt++]=raw
                //为什么要DATALEN呢？因为data段长度已经固定，即便不够依然会用0x0填充
                if(cnt==DATALEN+HEADER_LEN) step++
            }

            6->{
                buf[cnt++]=raw
                step++
                dtaFrame.crc16=raw.toUShort()
            }

            7->{
                val bits= byteArrayOf(dtaFrame.crc16.toByte(),raw)
                dtaFrame.crc16= ByteBuffer.wrap(bits).short.toUShort()

                val byte_arr=buf.sliceArray(HEADER_LEN..<len+HEADER_LEN)
                val ncrc=dtaFrame.crc16_create(byte_arr,len)

                if(dtaFrame.crc16==ncrc)
                    step++
                else if(raw==b0xa5) step=1
                else step=0
            }

            8->{
                when(raw){
                    b0xff->{
                        buf[cnt++]=raw
                        dtaFrame.data=buf.sliceArray(HEADER_LEN until len+HEADER_LEN)
                        dtaFrame.len=len.toShort()
                        dtaFrame.cmd=buf[4]

                        //Log.e("dta","len:$len,cmd:${buf.slice(3 until 4).get(0)},data:${buf.sliceArray(4 until len+4).decodeToString()}")
                        check =true

                        step=0
                        cnt=0
                        len=0
                        clearBuf(buf)
                    }
                    b0xa5->step=1
                    else->step=0
                }
            }
            else->step=0
        }
    }
}
