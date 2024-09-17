#include "usart_parser.h"

#if DEBUG
#include <stdio.h>
#endif

#define MSG_HEAD_1 0x5A
#define MSG_HEAD_2 0xA5
#define MSG_END 0xFF

static unsigned char step=0;
static unsigned short count=0,slen=0;
#if DEBUG
static Unprotocol rec_pack={0};
static Unprotocol package={0};
#else
static Unprotocol rec_pack={0};
#define package rec_pack
#endif
static Num num={0};

static unsigned short crc16=0;//2bytes,which is 16its
static unsigned short n_crc=0;

static unsigned short _strlen(unsigned char* chars){
	unsigned short len=0;
	while(*chars!='\0'){
		len++;chars++;
	}
	return len;
}

static unsigned short _crc16_create(unsigned char* data,unsigned short len){
    unsigned short CRC16 = 0xFFFF;
    int state,i,j;
    for(i = 0; i < len; i++ ){
	    CRC16 ^= data[i];
	    for(j = 0; j < 8; j++){
		    state = CRC16 & 0x01;
		    CRC16 >>= 1;
		    if(state) CRC16 ^= 0xA001;
	    }
    }
#if DEBUG
    printf("\033[32m[%s]\033[0m ->%d with %d\n",data,CRC16,len);
#endif
    return CRC16;
}


void Send_dataframe(unsigned char cmd,
		unsigned char* data,void (*__data_send)(unsigned char chars[],
			unsigned short len))
{
	package.packet.head[0]=MSG_HEAD_1;
	package.packet.head[1]=MSG_HEAD_2;
	package.packet.cmd=cmd;
	if(data){
		slen=_strlen(data);
		//这里用 num来存储长度,因为256比特已经需要用2bits来表示了
		//num.len存储后,可以通过num.slen[index]来取出逐个比特.
		if(slen>DATA_LEN) slen=DATA_LEN;
		num.len=slen;
		package.packet.len[0]=num.slen[0];
		package.packet.len[1]=num.slen[1];
#if DEBUG
		printf("Num.slen[%02x%02x]=Num.len[%d]\n",num.slen[0],num.slen[1],num.len);
#endif

#if DEBUG
		int i,j=0;
		for(i=0;i<slen;i++)
			package.packet.data[i]=data[i];
		
		for(j=slen;j<DATA_LEN;j++) 
			package.packet.data[j]=0x0;
#else
		int i=0;
		for(i=0;i<DATA_LEN;i++)
			package.packet.data[i]=0x0;
		for(i=0;i<slen;i++)
			package.packet.data[i]=data[i];
#endif
	}
	
	crc16=_crc16_create(data,slen);
	package.packet.crc16[0]=crc16>>8;//高位
	package.packet.crc16[1]=crc16&0xff;//低位
	package.packet.end=MSG_END;
	crc16=0x0;
	__data_send(package.buf,Unprotol_LEN);
}

void Rec_dataframe(unsigned char dat,void (*__process_fn)(Packet* packet))
{
	switch(step){
		case 0:
			if(MSG_HEAD_1==dat){
				step++;
				count=0;
				rec_pack.buf[count++]=dat;
			}
			break;
		case 1:
			if(MSG_HEAD_2==dat){
				step++;
				rec_pack.buf[count++]=dat;
			}else if(MSG_HEAD_1==dat)
				step=1;
			else
				step=0;
			break;
		case 2:
			step++;
			rec_pack.buf[count++]=dat;
			num.slen[0]=dat;
			break;
		case 3:
			step++;
			rec_pack.buf[count++]=dat;
			num.slen[1]=dat;
			break;
		case 4:
			step++;
			rec_pack.buf[count++]=dat;
#if DEBUG
			printf("we gotta know the data len is %d\n",num.len);
#endif
			break;
		case 5:
			rec_pack.buf[count++]=dat;
			if(count==(PACKET_HEADER_LEN+DATA_LEN)) step++;
			break;
		case 6:
			rec_pack.buf[count++]=dat;
			step++;
			crc16=dat;
			break;
		case 7:
			crc16=(crc16<<8)|dat;
			n_crc=_crc16_create((unsigned char*)(rec_pack.buf+PACKET_HEADER_LEN),num.len);
			#if DEBUG
			printf("old_crc16=%d,n_crc16=%d with %d\n",crc16,n_crc,num.len);
			#endif
			if(crc16==n_crc)
				step++;
			else if(dat==MSG_HEAD_2)
				step=1;
			else
				step=0;
			break;
		case 8:
			if(MSG_END==dat){
				rec_pack.buf[count++]=dat;
				__process_fn(&rec_pack.packet);
				num.len=0;step=0;count=0;crc16=0;			
			}
			else if(MSG_HEAD_2==dat)
				step=1;
			else
				step=0;
			break;
		default: step=0;
	}
}

#if DEBUG
#define LSTART "\033["
#define LINFO "32m"
#define LERR "31m"
#define LEND "\033[0m"
#define INFO_STR(str) LSTART LINFO str LEND
#define ERR_STR(str) LSTART LERR str LEND
void process_packet(Packet *packet){
	printf("cmd="LSTART LINFO"<%d>" LEND ",data=" LSTART LERR "<%s>\n"LEND
			,packet->cmd,packet->data);
}
void data_send(unsigned char *buf, unsigned short len){
	for(int i=0; i<len; i++)
		Rec_dataframe(buf[i], &process_packet);

	for(int i=0;i<len;i++){
		printf("x%02x",buf[i]);
	}
	printf("\n");
}

int main(void){
        unsigned char buf[]="hello,world! this is a little wired thing for me.";
	Send_dataframe(0x01,buf,&data_send);
	return 0;
}
#else
#endif
