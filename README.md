# 单片机USART协议实现项目

使用C语言实现了一个单片机USART协议实现，用于串口通信。解析器包括用于发送和接收遵循特定协议结构的数据帧的功能。目前编写有 c、kotlin、js版本，可用于多端部署。

## 通过测试平台

- [x] Linux(Ubuntu22.04lts)
- [x] Windows10
- [x] 嵌入式设备：STM32F103C8T6、STC8086

## 文件

1. **usart_parser.h**：头文件，包含数据帧结构、联合类型、常量定义以及数据帧创建和解析函数声明。

2. **usart_parser.c**：源文件，包含单片机USART协议实现的实现。其中包括用于发送数据帧（`Send_dataframe`）和接收数据帧（`Rec_dataframe`）的函数。

## 协议结构

数据帧结构包括以下字段：
- 帧头：2字节

- 数据长度：2字节

- 命令：1字节

- 数据：可变长度（最多256字节）

- CRC16校验码：2字节

- 帧尾：1字节

  数据帧的总长度为`Unprotol_LEN(数据长度可DATA_LEN定义)`字节。

## 数据结构

- **Packet**：表示数据帧的结构体，包含帧头、数据长度、命令、数据、CRC16校验码和末尾字节。
- **Unprotocol**：联合体类型，允许在共享内存块中使用数据帧缓冲区或Packet结构。
- **Num**：联合体类型，用于以2字节数组或单个16位整数形式存储数据长度。

## 使用方法

1. 在项目中包含`usart_parser.h`。
2. 使用提供的函数`Send_dataframe`创建并发送数据帧，使用`Rec_dataframe`接收和解析数据帧。
3. 根据应用程序需求实现`必要的数据发送`和`处理解析后数据`的函数，即需要重写 data_send()&process_packet().

## 如何使用

1. 克隆该仓库。
2. 在项目中包含`usart_parser.h`和`usart_parser.c`。
3. 若测试，则保持 DEBUG宏为真，否则在生产环境中保持为假
   ```c
    DEBUG 1 //测试环境
    DEBUG 0 //生产环境
   ```
3. 根据需要实现数据发送和处理函数。
4. 构建并运行项目。

## 示例

在以调试模式编译时，`usart_parser.c`文件的`main`函数中提供了单片机USART协议实现示例用法。该示例演示了如何创建并发送带有示例消息的数据帧。

```c
//it means this will deploy in industrial environment
#define DEBUG 0

/**
 * chars messages
 * len length of messages
 */
static void __data_send(unsigned char* chars,unsigned char len){
	//0xffff=>65535,timeout
	HAL_UART_Transmit(&huart1,chars,len,0xFFFF);
}

/**
 * 0x0 reply some messages
 * 0x01 forward
 * 0x02 backward
 * 0x03 change angle
 * 0x04 turn on/off LED
 * 0x05 emergency brake
 */
static void __process_fn(Packet* packet){
	cmd=packet->cmd;
	unvar.num_arr[0]=packet->data[0];
	unvar.num_arr[1]=packet->data[1];
	switch(cmd){
		case 0x0:
            /* when receive 0x00 in mcu,just echo to host.
            just call Send func to execute,
            which assembles all well into the usart_obj */
			Send(0x00,Num(101));
			break;
		case 0x01:
			// run_control(unvar.num);
			run_control();
			break;
		case 0x02:
            // set the power of motor in real time
            // by adjust the current intensity. 
			pwmVal=unvar.lNum;
			pwm_control();
			break;
		case 0x03:
			// avoid some useless repeating code
			if(angle!=unvar.num){
				angle=unvar.num;
				direct_control();
			}
			break;
		case 0x04:
			led_control();
			break;
		default:
			break;
	}
}

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
 
  /* Reset of all peripherals, 
  Initializes the Flash interface and the Systick. */
  HAL_Init();
    
  /* Configure the system clock */
  SystemClock_Config();
    
  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_USART1_UART_Init();
  MX_TIM1_Init();
  MX_TIM2_Init();
  /* initialize all timers */
  HAL_TIM_PWM_Start(&htim1,TIM_CHANNEL_2);
  HAL_TIM_PWM_Start(&htim1,TIM_CHANNEL_3);
  HAL_TIM_PWM_Start(&htim2,TIM_CHANNEL_1);
  
  /* delaying the initialization of HAL lib,
  until all devs are ready */
  HAL_Delay(1000);
  run_control(3);
  /* Infinite loop */
  // receive the msg from host and parse,then do action for response
  while (1)
	  HAL_UART_Receive_IT(&huart1,RxBuffer,RxBuffer_LEN);
}

void HAL_UART_RxCpltCallback(UART_HandleTypeDef* huart){
	if(huart==&huart1){
        /* use this function to parse raw data into structure.
        note: this function is implemented by finite status machine,
        so when it actually do a successive parsing,
        the process_fn will be called to do something what you want
        */
		Rec_dataframe(RxBuffer[0],__process_fn);
		HAL_UART_Receive_IT(&huart1,RxBuffer,RxBuffer_LEN);
	}
}
```



## 作者

该单片机USART协议实现项目由叶月绘梨依创建。

如果您有任何问题或需要进一步帮助，请随时联系。

感谢您使用`单片机USART协议`实现！
