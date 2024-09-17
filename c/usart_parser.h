#ifndef __USART_PARSER_H_
#define __USART_PARSER_H_
//定义是否为测试环境
#ifndef DEBUG
#define DEBUG 0
#endif


/**
 * 头无效字段 2byte
 * 尾无效字段 1byte
 * crc16 校验码长度 2byte
 * 
 * 数据长度字段 2 byte 
 * 取值范围 0-65535
 * 
 * 命令数据字段 1 byte
 * 合计 8bytes
 **/
#define HEAD_L 2
#define END_L 1
//存储数据长度的字段长度
#define LEN_L 2
#define CMD_L 1
#define CRC16_L 2
// 数据长度
#define DATA_LEN 256
// Packet中数据段之前的总长度: head[2]+len[2]+cmd[1]=5
#define PACKET_HEADER_LEN HEAD_L+LEN_L+CMD_L
//#define PACKET_HEADER_DATA_LEN PACKET_HEADER_LEN+DATA_LEN
// 总长度
#define Unprotol_LEN DATA_LEN+HEAD_L+LEN_L+CMD_L+CRC16_L+END_L

/* 数据帧创建
 * 帧头2 帧长1 命令1(可选) 数据(可变) CRC16校验字节2 帧尾1
 * 总长度 Unprotol_LEN 字节
 */
typedef struct {
		unsigned char head[HEAD_L];
		unsigned char len[LEN_L];
		unsigned char cmd;
		unsigned char data[DATA_LEN];
		unsigned char crc16[CRC16_L];
		unsigned char end;
} Packet;

/**联合体
 * 共用一块内存，即联合体长度以最大成员为准,可将buf转换成packet(前提是知道packet中len、data_len)
 * 只能同一时间内使用一个成员，该成员可转化为另一成员使用
 */
typedef union{
	unsigned char buf[Unprotol_LEN];
	Packet packet;
	} Unprotocol;

/**
 * 大数字
 **/
typedef union{
	unsigned char slen[2];
	unsigned short len;
} Num;


/**
 * 接收一个字节并字节
 * process_fn 处理解析完成的数据帧
 */
void Rec_dataframe(unsigned char dat,void (*process_fn)(Packet* packet));
/**
 * 创建一个数据帧并发送
 */
void Send_dataframe(unsigned char cmd,unsigned char* data,void (*__data_send)(unsigned char chars[],unsigned short len));
#endif
