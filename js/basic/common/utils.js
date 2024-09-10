/*兼容旧版本WebView ES语法*/
String.prototype.replaceAll=function(s1,s2){
    return this.replace(new RegExp(s1,'gm'),s2)
}


/**
 * 为HTMLElement对象添加自动点击功能。
 * 该函数不会接受参数且没有返回值。
 */
HTMLElement.prototype.autoclick=function(){
    // 创建一个鼠标点击事件
    const el=new MouseEvent('click')
    // 在当前元素上触发鼠标点击事件
    this.dispatchEvent(el)
}

/*
 * @param {String} id 
 * @returns {Object} obj
 *
const $=(id)=>{
    var __id=typeof id=='string'
    if(__id){
        try{
            return document.getElementById(id)
        }catch(err){
            console.log('passed id=>',id)
            console.log('err=>',err)
        }
    }
    else console.log(`id is not string type,please make sure passed id<${id}> is correct!`)
}*/

/** 
 * 根据提供的id获取DOM元素。
 * 示例：获取存在的DOM元素:
 *          const myElement = $('elementId');
 * @param {String} id - 要查找的元素的ID。
 * @returns {Object|null} 找到的DOM元素或者在发生错误时返回null。
 */
const $ = (id) => {
    // 直接在条件判断中检查类型，同时包含了null和undefined的检查
    if (typeof id === 'string' && id !== null && id !== undefined) {
        try {
            return document.getElementById(id);
        } catch (err) {
            // 更详细的错误处理，此处仅打印错误，也可以考虑将错误信息通过其他方式反馈给调用者
            console.error('passed id=>', id);
            console.error('err=>', err);
            // 根据需求，此处可以选择抛出异常或者返回null
            return null;
        }
    } else {
        // 对于非字符串或者空值的处理，返回null并打印明确的错误信息
        console.error(`id is not string type or is null/undefined, please make sure passed id<${id}> is correct!`);
        return null;
    }
};



/*HTMLElement.prototype.$=function(id){
    var __id=typeof id=='string'
    if(__id){
        try{
            return document.getElementById(id)
        }catch(err){
            console.log('passed id=>',id)
            console.log('err=>',err)
        }
    }
    else console.log('id is not string type,please make sure passed id is correct!')
}*/

/**
 * 根据 id 查找某元素下的元素
 * 示例：
 *      const subEl=rootEl.$('subEl')
 * @param {String} id - 要查找的元素的ID。
 * @returns {Object|null} 找到的DOM元素或者在发生错误时返回null。
 */
HTMLElement.prototype.$ = function(id) {
    // 检查 id 是否为字符串类型，同时考虑 null 或 undefined 的情况
    const __id = typeof id === 'string' && id !== null && id !== undefined;
    if (__id) {
        try {
            // 尝试获取元素
            const element = document.getElementById(id);
            // 如果找到元素，返回元素本身
            if (element) return element;
            else {
                // 如果未找到元素，打印日志并返回 undefined
                console.log(`Passed id=> ${id}`);
                console.log('Err=> Element not found');
                return undefined;
            }
        } catch (err) {
            // 在捕获到异常时，打印更详细的错误信息，并返回 undefined
            console.log(`Passed id=> ${id}`);
            console.log(`Err=> ${err}`);
            return undefined;
        }
    } else {
        // 如果输入不是字符串类型，打印明确的错误提示并返回 undefined
        console.log('id is not string type, please make sure passed id is correct!');
        return undefined;
    }
}



/**
 * 为HTMLElement对象添加样式。
 * @param {String|Object} prop - 如果是字符串，则表示要设置的样式属性；如果是一个对象，则表示要设置的一系列样式属性。
 * @param {String|Null} [value] - 样式属性的值。如果prop是对象，则此参数不必要。
 * @returns {HTMLElement} - 返回修改样式的HTMLElement对象，支持链式调用。
 */
HTMLElement.prototype.css=function(prop,value){
    // 当未指定value时，处理传入的是样式对象的情况
    if(value===undefined){
        if(typeof(prop)=='object'){
            // 遍历对象，设置样式
            for(let key in prop) this.style[key]=prop[key]
        }
        return this
    }else{
        // 设置单个样式属性
        this.style[prop]=value
        return this
    }
}

/**
 * 给HTMLElement对象添加或获取属性。
 * 如果value为undefined，则该方法用于设置多个样式属性（当attr为对象时）或获取指定属性的值。
 * 如果value不为undefined，则该方法用于设置指定的属性值。
 * 
 * @param {String|Object} attr - 要设置的属性名或包含多个属性名及其值的对象。
 * @param {Any} [value] - 属性的值。如果未提供，则该方法用于获取属性值。
 * @returns {HTMLElement} - 返回当前HTMLElement对象，支持链式调用。
 */
HTMLElement.prototype.attr=function(attr,value){
    if(value===undefined){
        // 当attr为对象时，设置多个样式属性
        if(typeof attr=='object'){
            for(let key in attr)
                this.setAttribute(key,attr[key])
        }
        return this
    }else{
        // 设置指定的属性值
        this.setAttribute(attr,value)
        return this
    }
}



/**
 * 获取或设置元素的样式属性。
 * 如果value为undefined，则该方法用于获取指定属性的值。
 * 如果value不为undefined，则该方法用于设置指定的属性值。
 * 
 * @param {HTMLElement|String} prop - 要设置的属性名或包含多个属性名及其值的对象。
 * @param {Object} args - 属性的值。如果未提供，则该方法用于获取属性值。
 * */
const $css=(prop,args)=>{
    if(prop===undefined||args.length==0) return
    else{
        var __ele=typeof prop==='object'?prop:$(prop)
        const __args=args||{}
        for(let key in __args)  __ele.style[key]=__args[key]
    }
}



/**
 * 为指定元素设置属性。
 * @param {String|Object} id - 元素的id选择器或元素对象。
 * @param {Object} args - 包含要设置的属性名和值的对象。
 * @returns 无返回值。
 */
const $attr=(id,args)=>{
    // 如果id未定义或args为空，则不执行任何操作
    if(id===undefined||args.length==0) return
    else{
        // 根据id确定元素对象：如果是对象则直接使用，如果是字符串则通过$(id)获取
        var __ele=typeof id==='object'?id:$(id)
        // 确保args为对象
        const __args=args||{}

        // 遍历args对象，为元素设置每个属性
        for(let key in __args){
            __ele.setAttribute(key,__args[key])
            console.log(`element.setAttribute("${key}","${__args[key]}")`) // 打印设置的属性信息
        }
    }
}


/**
 * 获取指定元素的属性值。
 * @param {String|Object} id - 元素的id选择器或元素对象。
 * @param {Array} args - 一个包含属性名称的数组。
 * @returns {Array|String|undefined} - 如果只有一个属性被获取，则返回其值；如果多个属性被获取，则返回一个值的数组；如果没有找到任何元素或没有指定属性，则返回undefined。
 */
const $eattr=(id,args)=>{
    const _array=[] // 用于存储获取到的属性值。
    if(id===undefined||args.length==0) return // 如果没有指定id或args为空，则直接返回。
    else{
        var __ele=typeof id==='object'?id:$(id) // 根据id选择器获取元素对象。
        const __args=args||{} // 确保args是一个对象。

        // 遍历args，获取每个属性的值并添加到_array中。
        for(let key in __args){
            var __attr=__ele.getAttribute(__args[key])
            _array.push(__attr)
        }
    }
    // 根据获取到的属性数量，返回单个值或数组。
    return _array.length==1?_array[0]:_array
}


/**
 * 为HTMLElement添加事件监听器。
 * @param {String} args 事件名称。
 * @param {Function} func 当事件被触发时执行的函数。
 * @returns {HTMLElement} 返回原始的HTMLElement对象，以支持链式调用。
 */
HTMLElement.prototype.on=function(args,func){
    // 如果传入的func是函数，且args是字符串，则添加事件监听器
    if(typeof func=='function'&&typeof args=='string'){
        this.addEventListener(args,(e)=>typeof func=='function'?func(e):console.log('func is not a function!'))
    }
    return this
}



/**
 * 一个简化的、用于给元素添加事件监听器的工具函数。
 * @param {String|HTMLElement} id 元素的id或HTMLElement对象。
 * @param {String} args 事件名称。
 * @param {Function} func 当事件被触发时执行的函数。
 */
const $on=(id,args,func)=>{
    // 根据id获取元素对象，如果已经是对象则直接使用
    const __obj=typeof id=='object'?id:$(id)
    __obj.addEventListener(args,(e)=>func(e))
}




HTMLElement.prototype.elect=function(args){
    if(args===undefined||args.length==0) return this
    else{
        return this.querySelector(args)
    }
}

HTMLElement.prototype.electAll=function(args){
    if(args===undefined||args.length==0) return this
    else{
        return this.querySelectorAll(args)
    }
}

const $elect=(clss)=>{
    if(typeof clss=='string'&&clss.length>0)document.querySelector(clss)
    else console.log('make sure the argument is belong to string!')
}
const $electAll=(clss)=>{
    if(typeof clss=='string'&&clss.length>0)clss.length>0&&document.querySelectorAll(clss)
    else console.log('make sure the argument is belong to string!')
}




/**
 * 为HTMLElement对象添加点击事件功能。
 * @param {any} args - 传递给点击事件函数的参数，可选。
 * @param {Function} func - 点击事件的回调函数，必选。
 * @returns {HTMLElement} - 返回经过点击事件处理的HTMLElement对象。
 */
HTMLElement.prototype.click=function(args,func){
    // 当未定义参数func时，检查args是否为函数并设置点击事件
    if(func===undefined){
        console.log('args is define:',args)
        if(typeof args =='function') this.setAttribute('onclick',args(this))
        else console.log('args is not a function !')
    }else{
        console.log('args is defined',args)
        // 当定义了参数args时，检查func是否为函数并设置点击事件，传入args
        if(typeof func =='function') this.setAttribute('onclick',func(args))
        else console.log('func is not a function !')
    }

    return this
}

/**
 * 为指定元素绑定点击事件。
 * 
 * @param {String|Object} id 或者是 DOM 元素对象，用于指定需要绑定点击事件的元素。
 * @param {Function} func 一个函数，当点击事件被触发时执行该函数。函数接收一个参数，即被点击的元素。
 */
const $click=(id,func)=>{

    // 根据 id 参数的类型选择性地获取元素。如果是对象，则直接使用，如果是字符串，则通过 $(id) 来获取。
    var __element=typeof id==='object'?id:$(id)

    // 检查传入的 func 是否为函数，如果是，则设置元素的 onclick 属性为执行该函数。
    if(func!==null&&typeof func=='function') 
            __element
                .setAttribute('onclick',`(${func})(this)`)    
}




HTMLElement.prototype.neo=function(ele_name,args,attrs){
    var ele_tag_name=(ele_name!=null&&ele_name!=undefined&&ele_name.length>0&&typeof ele_name=='string')?ele_name:'div'
    var __neoele=document.createElement(ele_tag_name)

    $css(__neoele,args)

    var __attrs=attrs||{}
    $attr(__neoele,__attrs)

    return this
}

const $neo=(root_ele,ele_name,args,attrs)=>{
    if(root_ele!=undefined&&ele_tag_name==undefined&&args==undefined&&attrs==undefined){
        ele_name=root_ele
        root_ele=undefined
    }

    var ele_tag_name=(ele_name!=undefined&&ele_name.length>0&&typeof ele_name=='string')?ele_name:'div'
    var __neoele=document.createElement(ele_tag_name)

    var __args=args||{}
    $css(__neoele,__args)

    if(root_ele!=undefined){
        var __rootele= typeof root_ele=='object'?root_ele:$(root_ele)
        __rootele.appendChild(__neoele)
    }

    var __attrs=attrs||{}
    $attr(__neoele,__attrs)
    return __neoele
}



/**
 * 删除指定根元素下的指定子元素。
 * 
 * @param {string|object} root_ele - 根元素的选择器或根元素对象。
 * @param {string|object} id - 子元素的选择器或子元素对象。
 * @returns 无返回值。
 */
const $del=(root_ele,id)=>{

    // 将根元素选择器转换为对象，如果已经是对象则不变
    var __rootele= typeof root_ele=='object'?root_ele:$(root_ele)
    
    // 将子元素选择器转换为对象，如果已经是对象则不变
    var __neoele=typeof id=='object'?id:$(id)

    // 如果找到子元素，则从根元素中移除
    if(__neoele!==null)
    __rootele.removeChild(__neoele)
}

/*const $del=(root_ele,id)=>{
    var __rootele= typeof root_ele=='object'?root_ele:$(root_ele)
    var __neoele=typeof id=='object'?id:$(id)
    if(__neoele!==null)
    __rootele.removeChild(__neoele)
}*/



/*const addEven=(modal_id,openfn,closefn)=>{
    var exampleModal = $(FullScreenEditor_id)
    exampleModal.addEventListener('show.bs.modal', function (event) {
        // Button that triggered the modal
        var button = event.relatedTarget

        // Extract info from data-bs-* attributes
        var recipient = button.getAttribute('data-bs-whatever')

        var modalEdit = exampleModal.elect('.form-control')
        modalEdit.value = recipient
})
}*/

HTMLElement.prototype.drop=function(callback){
    if(typeof callback=='function'){
        this.ondragover=(e)=>e.preventDefault()
        this.ondrop=(e)=>{
            e.preventDefault()
            callback(e)
        }
    }
    return this
}
const $drop=(ele,callback)=>{
    var __ele=typeof ele==='object'?ele:$(ele)
    __ele.ondragover=(e)=>e.preventDefault()
    __ele.ondrop=(e)=>{
        e.preventDefault()
        callback(e)
    }
}






HTMLElement.prototype.switch=function(args,onFunc,offFunc){
    var __check=this.getAttribute('isCheck')
    console.log(__check)
    if(__check==null||__check===undefined) {
        this.setAttribute('isCheck','true')
        onFunc(this,__args)
    }
    const __args=args||{}
    __check==='true'?offFunc(this,__args):onFunc(this,__args)
    this.setAttribute('isCheck',__check==='true'?'false':'true') 

    
    return this
}

/**
 * 
 * @param {Object} ele pass an Object or id of Object
 * @param {Object} args {common_data:''}
 * @param {Function} onFunc onFunc(ele,args)
 * @param {Function} offFunc offFunc(ele,args)
 */
const $switch=(ele,args,onFunc,offFunc)=>{
    var __ele=typeof ele==='object'?ele:$(ele)
    var __check=__ele.getAttribute('isCheck')
    console.log(__check)
    if(__check==null||__check===undefined) {
        __ele.setAttribute('isCheck','true')
        onFunc(__ele,__args)
    }
    const __args=args||{}
    __check==='true'?offFunc(__ele,__args):onFunc(__ele,__args)
    __ele.setAttribute('isCheck',__check==='true'?'false':'true') 
}


/**
 * generate optimazation codes by TONGYI AI
 */
const $get = (url, type, timeout = 5000) => { // 给timeout一个默认值
    return new Promise((res, rej) => {
        // 验证URL的实现（示例性代码，实际实现可能需要更复杂的逻辑）
        if (!isValidUrl(url)) {
            return rej('Invalid URL');
        }

        var xhr = new XMLHttpRequest();
        var timeoutTimer = setTimeout(() => {
            console.log('请求终止！请求地址为:' + url);
            xhr.abort();
            return rej('timeout!your applied url is: '+url);
        }, timeout);
    
        try {
            xhr.open('GET', encodeURI(url)); // 使用encodeURI来防范URL相关的安全问题
            xhr.responseType = validateType(type) ? type : 'text';
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return //rej('long time wait for ready state!');
                if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = null;
                }
                
                if (xhr.readyState === 4 && xhr.status === 200) {
                    return res(xhr);
                } else 
                    return rej('failed to get resp');
            };

            xhr.onerror = () => {
                if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = null;
                }
                rej('Network error');
            };
            xhr.send();
        } catch (error) {
            console.error('Error initializing XMLHttpRequest:', error);
            rej('Error initializing XMLHttpRequest');
        }
    });
}

// 用于验证URL的简单示例实现，实际应用中可能需要更复杂的逻辑
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 验证请求类型的函数示例
function validateType(type) {
    if (!type) return true; // 若未提供类型，默认视为有效
    const validTypes = ['text', 'json', 'arraybuffer', 'blob']; // 定义有效类型
    return validTypes.includes(type);
}



//封装AJax异步请求函数
var __timer;
const $ajax=(url,type,timeout)=>{
    return new Promise((res,rej)=>{
        var xhr=new XMLHttpRequest()

        var timedout=false;
        __timer=setTimeout(()=>{
            xhr.abort();
            timedout=true;
            return rej('请求超时,请求地址为:'+url)
        },timeout);
    
        xhr.onreadystatechange=()=>{
            if(xhr.readyState!=4) 
                return rej('long time wait for ready state!')
            if(timedout) 
                return rej('timeout!')
            clearTimeout(__timer)
            
            if(xhr.readyState==4
                &&xhr.status==200)
                return res(xhr)
            else return rej('failed to get resp')   
        }
        
        xhr.open('GET',url)
        xhr.responseType=type?type:'text'
        xhr.send()
    })
}
