//定义状态
const PROMISE_CONST={
    PENDING:"pending",
    FULFILLED:"fulfilled",
    REJECTED:"rejected"
}

//定义Promise对象
function Promise(executor) {
    let _this=this;
    _this.status=PROMISE_CONST.PENDING;
    _this.value=undefined;
    _this.reason=undefined;
    _this.onFulfilledCallback=[];
    _this.onRecjectedCallback=[];
    //在异步promise中 resolve 和 reject是被异步调用的 所以使用发布订阅模式 将函数暂存 当调用then方法时再取出执行
    let resolve=function(val){
        if(_this.status==PROMISE_CONST.PENDING){
            _this.status=PROMISE_CONST.FULFILLED;//成功了
            _this.value=val;
        }
        _this.onFulfilledCallback.forEach((fn)=>{
            fn();
        })
    }
    let reject=function(reason){
        if(_this.status==PROMISE_CONST.PENDING){
            _this.status=PROMISE_CONST.REJECTED;//失败了
            _this.reason=reason;
        }
        _this.onRecjectedCallback.forEach((fn)=>{
            fn();
        })
    }
    try{
        executor(resolve,reject);
    }catch (e) {
        reject(e);
    }
}

function resolvePromise(promise2,x,resolve,reject){
    //防止循环引用
    if(promise2===x){
          return  reject(new TypeError("循环引用"));
    }
    if(x!=null&&typeof x =="object"||typeof x =="function"){
        let then=x.then;
        try{
            if(typeof then=="function"){
                //执行这个promise
                then.call(x,function (y) {
                    resolvePromise(promise2,y,resolve,reject);
                },function (r) {
                    reject(r);
                });
            }else{
                resolve(x);
            } 
        }catch (e) {
            reject(e);
        }
    }else{
        resolve(x); //普通类型的 直接调用resolve()
    }
}

Promise.prototype.then=function(onFilledFn,onRejectedFn){
    let _this=this;
    let promise2=new Promise(function (resolve,reject) {
        /***start 这段负责处理同步 promise start****/

        if(_this.status==PROMISE_CONST.FULFILLED){
            setTimeout(function () {
                try{
                    let x=onFilledFn(_this.value);
                    // console.log("x====="+promise2);
                    resolvePromise(promise2,x,resolve,reject);
                }catch (e) {
                    reject(e);
                }
            })
        }
        if(_this.status==PROMISE_CONST.REJECTED){
            setTimeout(function () {
                try{
                    let x=onRejectedFn(_this.reason);
                    resolvePromise(promise2,x,resolve,reject);
                }catch (e) {
                    reject(e);
                }
            })
        }

        /***end 这段负责处理同步-promise end****/

        /***start 这段时处理异步promise的 start**/
        if(_this.status==PROMISE_CONST.PENDING){
            _this.onFulfilledCallback.push(function(){
                setTimeout(function () {
                    try{
                        let x=onFilledFn(_this.value);
                        resolvePromise(promise2,x,resolve,reject);
                    }catch (e) {
                        reject(e);
                    }
                })
            });
            _this.onRecjectedCallback.push(function(){
                setTimeout(function () {
                    try {
                        let x = onRejectedFn(_this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                })
            });
        }
        /***end 这段时处理异步promise的 end**/
    });
    return promise2;
    // console.log("then....");
}

//成功执行
Promise.resolve=function(value){
    return new Promise(function (resolve,reject) {
        resolve(value);
    })
}

//失败执行
Promise.reject=function(reason){
    return new Promise(function (resolve,reject) {
        reject(reason);
    })
}

//执行所有promise
Promise.all=function(promises){
    return new Promise(function (resolve,reject) {
      let results=[]; //数据结果
      let counter=0;
      //分别去执行promise 将返回结果放入results中
      let processData=function(index,data){
          results[index]=data;
          counter++;
          if(counter==promises.length){//统计到结尾了
              resolve(results);
          }
      }
        promises.forEach(function (promise,index) {
            //循环执行promise
            promise.then(function (data) {
                processData(index,data);
            },reject)
        })
    })
}

//谁快返回谁但是多个promise仍然在执行
Promise.race=function(promises){
    return new Promise(function (resolve,reject) {
        promises.forEach(function (promise) {
            promise.then(resolve,reject);//谁先返回执行谁
        })
    })
}
//异常捕获
Promise.catch=function(onRejectFn){
    return this.then(null,onRejectFn);
}

module.exports=Promise;  
