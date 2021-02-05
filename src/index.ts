/**
 * concent 相关的一些公共封装函数
 */
import {
  useConcent, IRefCtxM, ModuleDesc,
  ReducerCallerParams, IReducerFn, IActionCtxBase,
  ICtxBase, IAnyObj, SettingsType, ComputedValType,
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

const noop = () => { };
export function makeUseModelWithSetup<RootInfo, ModelDesc extends ModuleDesc>(moduleName: string) {
  return function useModelWithSetup<
    Setup extends (ctx: ICtxBase) => IAnyObj, CuSpec extends IAnyObj, P extends IAnyObj, Extra extends IAnyObj,
    >(setup: Setup, opts?: { cuSpec?: CuSpec, props?: P, extra?: Extra }) {
    const { cuSpec, props, extra } = opts || {};
    const targetProps = (props || {}) as P;
    // @ts-ignore
    noop(cuSpec);// 仅用于推导出类型
    type Ctx = IRefCtxM<RootInfo, P, ModelDesc, SettingsType<Setup>, ComputedValType<CuSpec>, Extra>;
    return useConcent<P, Ctx>({ module: moduleName, setup, props: targetProps, extra });
  }
}