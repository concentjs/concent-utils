/**
 * concent 相关的一些公共封装函数
 */
import {
  useConcent, IRefCtxM, ModuleDesc,
  ReducerCallerParams, IReducerFn, IActionCtxBase,
  ICtxBase, IAnyObj, SettingsType, ComputedValType, ComputedValTypeForFn,
  MultiComputedFn, MultiComputed, StateType,
} from 'concent';

/**
 * 调用目标函数，用于对接 reducer里的 ghost函数
 * @param callerParams 
 * @param ac 
 */
export async function callTarget(callerParams: ReducerCallerParams | [IReducerFn, any], ac: IActionCtxBase) {
  try {
    // 支持 reducer文件里内部调用 ac.dispatch(loading, [targetFn, payload])
    if (Array.isArray(callerParams)) {
      let [fn, payload] = callerParams;
      await ac.dispatch(fn, payload);
    } else {
      const { fnName, payload, renderKey, delay } = callerParams;
      await ac.dispatch(fnName, payload, renderKey, delay);
    }
  } catch (err) {
    alert(err.message);
  }
}

export function makeUseModel<RootInfo, ModelDesc extends ModuleDesc>(moduleName: string) {
  return function useModel<P extends IAnyObj>(props?: P) {
    const targetProps = (props || {}) as P;
    type Ctx = IRefCtxM<RootInfo, P, ModelDesc>;
    return useConcent<P, Ctx>({ module: moduleName, props: targetProps });
  }
}


export interface BaseOpts<P extends IAnyObj, Extra extends IAnyObj> {
  props?: P;
  extra?: Extra;
  /** 
   * 是否透传 cuSpec 给 useConcent函数，默认为true，
   * 表示需要透传，此时用户不需要再setup函数体内调用 ctx.computed(cuSpec)
   * 如果用户设置passCuSpec为false，表示传入 cuSpec 仅为了方便推导出refComputed类型，但不透传 cuSpec 给 useConcent函数
   * 注意此时用户需要在 setup函数体内调用 ctx.computed(cuSpec) 来完成示例计算函数的定义，
   * 否则 refComputed 里拿不到真正的计算结果
   */
  passCuDesc?: boolean;
  /**
   * 用于辅助定位 ccc.refs 或者 cc.getRefs 具体ref
   */
  tag?: string;
  ccClassKey?: string;
  moduleName?: string;
}

export interface Opts<CuDesc extends MultiComputed<any>, P extends IAnyObj, Extra extends IAnyObj>
  extends BaseOpts<P, Extra> {
  /**
   * 对象型计算函数描述体
   *  const cuDesc = {
   *    xxx:({num}:St)=><button>{num}</button>,
   *    yyy:({bigNum}:St)=><button>{bigNum}</button>,
   *  }
   */
  cuDesc?: CuDesc;
}
export interface CufOpts<CuDesc extends MultiComputedFn<any>, P extends IAnyObj, Extra extends IAnyObj>
  extends BaseOpts<P, Extra> {
  /**
   * 函数型计算函数描述体, 通常用于脱离了setup函数体内时，需要拿到渲染上下文句柄做一些其他事情
   * 如获得 ctx.mr 去绑定onClick事件等
   * 
   *  function cuDesc(ctx:CtxPre){
   *    const { mr } = ctx;
   *    return {
   *      xxx:({num}:St)=><button onClick={mr.add}>{num}</button>
   *    }
   *  }
   */
  cuDesc?: CuDesc;
}

export type ValidSetup = (ctx: ICtxBase) => IAnyObj | void;
export type SetupParam = ValidSetup | null;

const noop = () => ({});

/**
 * 普通对象型 cuSpec 用此函数来推导类型
 * @param moduleName 
 */
export function makeUseModelWithSetup<RootInfo, ModelDesc extends ModuleDesc>(moduleName: string) {

  /**
   *  const ceDesc = {a:()=>1, b:()=>2};
   *  function setup(ctx:CtrPre){ }
   * 
   *  useModelWithSetup(setup);
   *  useModelWithSetup(setup, { extra, props, ceDesc });
   */
  return function useModelWithSetup<
    Setup extends SetupParam, CuDesc extends MultiComputed<StateType<ModuleDesc['state']>>, P extends IAnyObj, Extra extends IAnyObj,
    >(setup: Setup, opts?: Opts<CuDesc, P, Extra>) {
    const { cuDesc, props, extra, passCuDesc = true, ccClassKey, tag } = opts || {};
    const targetProps = (props || {}) as P;
    const targetCuDesc = passCuDesc ? cuDesc : null;
    const targetSetup = (setup || noop) as ValidSetup;

    type Ctx = IRefCtxM<RootInfo, P, ModelDesc, SettingsType<Setup>, ComputedValType<CuDesc>, Extra>;
    return useConcent<P, Ctx>(
      { module: moduleName, tag, setup: targetSetup, props: targetProps, extra, cuDesc: targetCuDesc }
      , ccClassKey,
    );
  }
}

/**
 * 函数型 cuSpec 用此函数来推导类型
 * @param moduleName
 */
export function makeUseModelWithSetupCuf<RootInfo, ModelDesc extends ModuleDesc>(moduleName: string) {

  /**
   *  const ceDesc = (ctx:CtrPre)=>{
   *    return {a:()=>1, b:()=>2};
   *  }
   *  
   *  function setup(ctx:CtrPre){ }
   * 
   *  makeUseModelWithSetupCuf(setup);
   *  makeUseModelWithSetupCuf(setup, { extra, props, ceDesc });
   */
  return function useModelWithSetupCuf<
    Setup extends SetupParam, CuDesc extends MultiComputedFn<StateType<ModuleDesc['state']>>, P extends IAnyObj, Extra extends IAnyObj,
    >(setup: Setup, opts?: CufOpts<CuDesc, P, Extra>) {
    const { cuDesc, props, extra, passCuDesc = true, ccClassKey, tag } = opts || {};
    const targetProps = (props || {}) as P;
    const targetCuDesc = passCuDesc ? cuDesc : null;
    const targetSetup = (setup || noop) as ValidSetup;

    type Ctx = IRefCtxM<RootInfo, P, ModelDesc, SettingsType<Setup>, ComputedValTypeForFn<CuDesc>, Extra>;
    return useConcent<P, Ctx>(
      { module: moduleName, tag, setup: targetSetup, props: targetProps, extra, cuDesc: targetCuDesc },
      ccClassKey,
    );
  }
}
