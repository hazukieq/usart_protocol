import java.nio.ByteBuffer

class Usart(DATA_LEN_MAX: Short){
    private val packet=Packet(DATA_LEN_MAX)
    private val header_len=packet.PACKET_HEADER_LEN
    private val header_data_len=packet.PACKET_HEADER_LEN+DATA_LEN_MAX
    private var buf=ByteArray(packet.TOTAL_LEN)
    private var step=0
    private var cnt=0
    private var len=0

    private val b0x5a=(0x5A).toByte()
    private val b0xa5=(0xA5).toByte()
    private val b0xff=(0xFF).toByte()
    fun send_frame(CMD:Int, DATA:String,callback:(Packet)->Unit){
        val raws=packet.build(CMD, DATA)
        callback(raws)
    }

    fun rec_frame(raw:Byte, process_fn: (Packet)->Unit){
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
                if(cnt==header_data_len) step++
            }

            6->{
                buf[cnt++]=raw
                step++
                packet.crc16=raw.toUShort()
            }

            7->{
                val bits= byteArrayOf(packet.crc16.toByte(),raw)
                packet.crc16= ByteBuffer.wrap(bits).short.toUShort()

                val byte_arr=buf.sliceArray(header_len..<len+header_len)
                val ncrc=packet.crc16_create(byte_arr,len)

                if(packet.crc16==ncrc)
                    step++
                else if(raw==b0xa5) step=1
                else step=0
            }

            8->{
                when(raw){
                    b0xff->{
                        buf[cnt++]=raw
                        packet.data=buf.sliceArray(header_len..<len+header_len)
                        packet.len=len.toShort()
                        packet.cmd=buf[4]

                        process_fn(packet)
                        step=0
                        cnt=0
                        len=0
                    }
                    b0xa5->step=1
                    else->step=0
                }
            }
            else->step=0
        }
    }
}
