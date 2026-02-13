interface IOptions {
  timer: number;
  mode: "loop" | "once";
  callback: () => any;
  debug?: boolean;
}

type ModeType = "loop" | "once";

class PausableTimer {
  // timeID
  private id!: number;
  // 周期间隔
  private timer = 0;
  // 起点
  private startTime = 0;
  // 距离下一次调用时间
  private diffTime: number = 0;
  // 调试模式
  private isDubgger!: boolean | undefined;
  // 回调函数
  private callback = () => {};
  private mode: ModeType;

  constructor(option: IOptions) {
    this.isDubgger = option.debug;
    // 在ts以外的环境判断下
    this.checkMode(option.mode);
    this.isDubgger && console.log(globalThis.window ? "运行在浏览器" : "运行在其它运行时");

    this.timer = option.timer;
    this.mode = option.mode;

    this.callback = option.callback;
    // 开始计时
    this.start();
  }

  // 启动
  start = () => {
    this.isDubgger && console.log("调用start成功", this.getState());
    this.stop();
    this.id = setTimeout(
      () => {
        this.isDubgger && console.log("回调触发", this.getState());
        // 重置中断点
        this.callback();
        this.mode === "loop" && this.start();
      },
      (() => {
        if (this.diffTime > 0) {
          return this.diffTime;
        }
        this.startTime = this.getNowTime();
        return this.timer;
      })()
    );
    this.diffTime = 0;
  };
  // 恢复
  resume = () => {
    if (this.diffTime === 0) {
      return;
    }
    this.isDubgger && console.log("恢复", this.getState());
    this.start();
  };
  // 暂停
  pause = () => {
    if (this.diffTime) {
      return;
    }
    this.diffTime = this.timer - (this.getNowTime() - this.startTime);
    this.isDubgger && console.log("暂停", this.getState());
    this.diffTime < 0 && this.callback();
    this.stop();
  };
  after(delay: number) {
    this.pause();
    setTimeout(this.resume, delay);
  }
  // 停止
  stop = () => {
    this.id && clearTimeout(this.id);
    this.id = 0;
  };
  getNowTime = () => {
    // performance.now()不会受线程阻塞之类的影响,相对更准确
    return globalThis.window?.performance?.now() || Date.now();
  };
  // 改变模式
  setMode = (mode: ModeType, isReset?: false) => {
    this.checkMode(mode);
    isReset && this.reset();
    this.mode = mode;
    this.isDubgger && console.log("模式改变", this.getState());
    this.start();
  };
  // 回到最初的美好
  reset = () => {
    this.diffTime = 0;
    this.stop();
  };
  getState = () => {
    const { diffTime, startTime, mode, timer } = this;
    return {
      diffTime,
      startTime,
      timer,
      mode,
    };
  };
  checkMode = (mode: ModeType) => {
    if (!["loop", "once"].includes(mode))
      throw new Error(`请指定正确的运行模式,"loop" | "once"`);
  };
}
export default PausableTimer;
