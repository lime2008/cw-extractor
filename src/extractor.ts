import * as Babel from '@babel/standalone';

// 定义控件基础信息接口
export interface IWidgetTypeBase {
    type: `${string}_WIDGET`;
    title: string;
    icon: string;
    version: string;
    isInvisibleWidget: boolean;
    isGlobalWidget: boolean;
}

// 模拟的React环境
const createFakeReact = () => {
    return {
        createElement: (tag: any, props: any, ...children: any) => {
            return {
                tag,
                props: props || {},
                children
            };
        },
        Fragment: Symbol.for('react.fragment')
    };
};

// 模拟的require函数
const createFakeRequire = () => {
    return (packageName: string) => {
        // 这里可以添加特定包的模拟实现
        if (packageName === 'react') {
            return createFakeReact();
        }
        // 默认返回空对象
        return {};
    };
};

// 模拟的VisibleWidget基类
class VisibleWidget {
    constructor(props: any) {}
    setProps(props: any) {}
    emit(event: string, ...args: any[]) {}
    widgetError(message: string, error: any) {}
    render() {}
}

class InvisibleWidget {
    constructor(props: any) {}
    setProps(props: any) {}
    emit(event: string, ...args: any[]) {}
    widgetError(message: string, error: any) {}
    //render() {}
}

const createBrowserEnvironment = () => {
    // 创建基础模拟对象
    const fakeDocument = {
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: () => ({
            style: {},
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false
            },
            scrollTop: 0,
            offsetTop: 0
        }),
        body: {
            appendChild: () => {}
        }
    };


    
    const silentConsole = {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
        // 保留所有 console 方法但置空
        ...Object.keys(console).reduce((acc, key) => {
            if (typeof console[key as keyof Console] === 'function') {
                acc[key] = () => {};
            }
            return acc;
        }, {} as Record<string, any>)
    };
    
    
    const globalVars: Record<string, any> = {
        document: fakeDocument,
        console: silentConsole,
        performance: {
            now: () => Date.now()
        },
        requestAnimationFrame: (cb: () => void) => setTimeout(cb, 16)
    };

    // 创建全局对象代理
    const fakeWindow = new Proxy(globalVars, {
        get(target, prop) {
            // 特殊处理 window 属性指向自身
            if (prop === 'window') return fakeWindow;
            
            // 如果属性不存在，返回 undefined 而不是报错
            return target[prop as string];
        },
        has(target, prop) {
            // 让所有变量检查都返回 true，模拟浏览器环境
            return true;
        }
    });

    // 添加 Function 构造函数
    fakeWindow.Function = function(...args: string[]) {
        const body = args.length > 0 ? args.pop() : '';
        const params = args.length > 0 ? args : [];
        
        // 创建的函数将在我们的沙箱环境中执行
        return function(this: any) {
            // 创建执行上下文，合并参数和全局变量
            const context = Object.create(fakeWindow);
            params.forEach((param, i) => {
                context[param] = arguments[i];
            });
            
            // 使用 new Function 但确保它在我们的上下文中执行
            try {
                const func = new Function(...params, `with(this) { ${body} }`);
                return func.apply(context);
            } catch (e) {
                console.warn('动态函数执行错误:', e);
                return undefined;
            }
        }.bind(fakeWindow);
    };

    // 添加 eval 模拟
    fakeWindow.eval = function(code: string) {
        try {
            const func = fakeWindow.Function(code);
            return func();
        } catch (e) {
            console.warn('eval 执行错误:', e);
            return undefined;
        }
    };

    return fakeWindow;
};

// 主函数：从控件代码提取信息
export function extractWidgetInfo(code: string): IWidgetTypeBase {
    // 1. 使用Babel转换JSX代码
    let transformedCode = code;
    try {
        const result = Babel.transform(code, {
            presets: ['react'],
            sourceType: 'script',
            parserOpts: { strictMode: true }
        });
        
        if (result.code) {
            transformedCode = result.code;
            //console.log(transformedCode)
        }
    } catch (error) {
        console.warn('Babel转换失败，尝试直接执行原始代码', error);
    }

    // 2. 创建模拟环境
    const fakeWindow = createBrowserEnvironment();
    const fakeRequire = createFakeRequire();
    const fakeReact = createFakeReact();
    
    const exports: any = {};
    const widgetClass = VisibleWidget;
    const IwidgetClass = InvisibleWidget;
    // 3. 准备全局变量
    const globalVars = {
        exports,
        require: fakeRequire,
        React: fakeReact,
        VisibleWidget: widgetClass,
        InvisibleWidget : IwidgetClass,
        document: fakeWindow.document,
        window: fakeWindow,
        console: fakeWindow.console
    };

    // 4. 执行代码
    try {
        const functionParams = Object.keys(globalVars);
        const functionValues = Object.values(globalVars);
        
        const exec = new Function(...functionParams, transformedCode);
        exec.call(fakeWindow, ...functionValues);
    } catch (error) {
        throw new Error(`执行控件代码时出错: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 5. 提取控件信息
    const widgetType = exports.type || exports.types;
    if (!widgetType) {
        throw new Error('未找到控件类型定义');
    }

    // 6. 验证并返回所需字段
    const requiredFields = [
        'type', 'title', 'icon', 'version', 
        'isInvisibleWidget', 'isGlobalWidget',
    ];
    
    /*const missingFields = requiredFields.filter(field => !(field in widgetType));
    if (missingFields.length > 0) {
        throw new Error(`缺少必需的控件字段: ${missingFields.join(', ')}`);
    }

    // 确保type字段格式正确
    if (!(widgetType.type as string).endsWith('_WIDGET')) {
        console.warn(`控件类型格式可能不正确: ${widgetType.type}. 期望格式: *_WIDGET`);
    }*/

    return {
        type: widgetType?.type,
        title: widgetType?.title,
        icon: widgetType?.icon,
        version: widgetType?.version,
        isInvisibleWidget: !!widgetType.isInvisibleWidget,
        isGlobalWidget: !!widgetType.isGlobalWidget
    };
}
