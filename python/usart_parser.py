import struct

# 状态变量初始化为0，在函数中必须为静态变量
DATA_LEN = 256
static_vars = {
    "step": 0,
    "cnt": 0,
    "Buf": [],
    "len": 0,
    "crc16": 0,
    "status": 0
}
RxBuff = {"cmd": 0x0, "data": ""}


def crc16_check(data, lens):
    # 创建CRC16校验对象
    CRC16 = 0xFFFF
    for i in range(5, lens):
        CRC16 ^= int.from_bytes(data[i], 'big')
        for _ in range(8):
            state = CRC16 & 0x01
            CRC16 >>= 1
            if state:
                CRC16 ^= 0xA001
    return CRC16


def crc16_create(data: bytes, lens):
    # 创建CRC16校验对象
    CRC16 = 0xFFFF
    for i in range(lens):
        CRC16 ^= data[i]
        for _ in range(8):
            state = CRC16 & 0x01
            CRC16 >>= 1
            if state:
                CRC16 ^= 0xA001
    # print('crc16_raw: ', [c.to_bytes(1, 'big', signed=False).hex() for c in CRC16.to_bytes(2, 'little', signed=False)])
    return CRC16


def send(cmd: int, data: str):
    # print("\033[31m%s\033[0m" % "please note that DATA_LEN!!! It must be the same with usart_parser.h!!")
    bylist = [b'\x5A', b'\xA5']  # 使用字节直接表示 0x5A 和 0xA5
    # 当 data 是汉字时，data 的长度(utf-8编码的长度)和实际字节长度不一样!!!
    data_len = len(data.encode('utf-8'))
    # 转化 data_len 为两位数且小端的字节 data_len_bytes
    # data_len 假定其类型为short
    data_len_bytes = data_len.to_bytes(2, 'little', signed=False)  # 使用 2 字节表示 data_len
    bylist.append(data_len_bytes[0].to_bytes(1, 'big'))
    bylist.append(data_len_bytes[1].to_bytes(1, 'big'))
    #bylist.append((data_len>>8).to_bytes(1, 'big'))
    #bylist.append((data_len & 0xff).to_bytes(1, 'big'))  # 使用字节直接表示 data_len
    # 命令 cmd
    bylist.append(cmd.to_bytes(1, 'big'))
    data_bytes = [d.encode() for d in data]  # 将一组字符串分割并分别转换成字节
    bylist.extend(data_bytes)  # 使用 extend() 方法添加字节数据
    bylist.extend([b'\x00'] * (DATA_LEN - data_len))  # 使用字节直接表示 0x00

    # print(data.encode(),len(data))
    # 当 data 是汉字时，data 的长度(utf-8编码的长度)和实际字节长度不一样!!!
    crc16 = crc16_create(data.encode(), data_len)
    crc16_bytes = crc16.to_bytes(2, 'big')  # 使用 2 字节表示 CRC16

    bylist.append((crc16 >> 8).to_bytes(1, 'big'))
    bylist.append((crc16 & 0xff).to_bytes(1, 'big'))
    bylist.append(b'\xFF')
    result = b''.join(bylist)
    return result


def get_bytes_hexstr(result):
    raw = (''.join([hex(res).replace('0x', 'x') for res in result]))
    print(raw)
    return raw


# 接收数据
def receive(bytedata):
    step = static_vars["step"]
    cnt = static_vars["cnt"]
    Buf = static_vars["Buf"]
    # 进行数据解析，状态机
    if step == 0:  # 接收帧头1状态
        if bytedata == b'\x5a':
            step += 1
            cnt = 0
            Buf.append(bytedata)
            static_vars["status"] = 0  # 重置 status
            cnt += 1
    elif step == 1:  # 接收帧头2状态
        if bytedata == b'\xa5':
            step += 1
            Buf.append(bytedata)
            cnt += 1
        elif bytedata == b'\x5a':
            step = 1
        else:
            step = 0
    elif step == 2:  # 接收数据长度字节状态,需要判断是否是数字类型！！
        step += 1
        Buf.append(bytedata)
        cnt += 1
        static_vars['len'] = int.from_bytes(bytedata, 'little')  # 字节转数字
        #print(static_vars["len"])
    elif step == 3:
        step += 1
        Buf.append(bytedata)
        cnt += 1
        len_high = int.from_bytes(bytedata, 'big')  # 字节转数字
        # print(len_high)
        static_vars["len"] = static_vars["len"] | (len_high >> 8)  # 低8位和高8位合并
        #print(len_high)
        #print('数据长度:', static_vars["len"])
    elif step == 4:
        step += 1
        Buf.append(bytedata)
        cnt += 1
    elif step == 5:  # 接收字节数据状态
        Buf.append(bytedata)
        cnt += 1
        # 因为buffer len 是固定的，即便实际字符串长度< buffer_len,依然将其填充到固定
        if DATA_LEN + 5 == cnt:  # 利用Buf现有长度和len核对,是否接收完len位数据
            step += 1
    elif step == 6:  # 接收crc16校验高8位字节
        step += 1
        static_vars["crc16"] = int.from_bytes(bytedata, 'big')
        # print("检验码高8位: %s" % hex(static_vars['crc16']))
        # static_vars["crc16_arr"][0] = bytedata
    elif step == 7:  # 接收crc16校验低8位字节
        low8_crc16 = int.from_bytes(bytedata, 'big')
        # print("检验码低8位: %s" % hex(low8_crc16))
        # static_vars["crc16_arr"][1] = bytedata
        static_vars["crc16"] = (static_vars["crc16"] << 8) | low8_crc16
        # print(static_vars['crc16_arr'][0] + static_vars['crc16_arr'][1])
        if static_vars["crc16"] == crc16_check(Buf, static_vars["len"] + 5):  # 校验正确进入下一状态
            #print("CRC16: %d==%d 校验码正确！" % (static_vars["crc16"], crc16_check(Buf, static_vars["len"] + 5)))
            step += 1
        elif bytedata == b'\x5a':
            step = 1
        else:
            step = 0
            print("CRC16: %d==%d 校验码失败！" % (static_vars["crc16"], crc16_check(Buf, static_vars["len"] + 5)))
    elif step == 8:  # 接收帧尾
        if bytedata == b'\xff':  # 帧尾接收正确
            cmd = struct.unpack('B', Buf[4])[0]
            data = b''.join(Buf[5:static_vars["len"] + 5]).decode('utf-8')
            # 数据解析
            #print("\033[0;034m原始数据长度: %d" % cnt)
            #print("\033[0;034m原始数据: %s\033[0m" % b''.join(Buf))
            print("\033[0;32m指令: %s,数据: %s\033[0m" %
                  (hex(cmd), data))
            step = 0
            # 重置接收缓冲
            static_vars["Buf"] = []
            static_vars["cnt"] = 0
            static_vars["len"] = 0
            static_vars["crc16"] = 0
            static_vars["status"] = 1
            RxBuff['cmd'] = cmd
            RxBuff['data'] = data
        elif bytedata == b'\xa5':
            step = 1
        else:
            step = 0
    else:
        step = 0  # 多余状态，正常情况下不可能出现
    static_vars["step"] = step
    static_vars["cnt"] = cnt
    #print(step, bytedata)
    return RxBuff


if __name__ == '__main__':
    raws = send(0x01, 'hello,world! this is a little wired thing for me.')
    ret = {}
    for raw in raws:
        ret = receive(raw.to_bytes(1, 'big'))
    print(ret)
