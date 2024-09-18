fun main() {
    val pac=Packet(256).build(0x01,"hello,world! this is a little wired thing for me.")
    val usart=Usart(256)
    pac.toBytes().forEach { itz ->
        usart.rec_frame(itz){
            processfn(it)
        }
    }
}

fun processfn(packet: Packet) {
    println("cmd=<${packet.cmd}>,data=<${packet.data.decodeToString()}>")
}
