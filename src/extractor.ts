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
        // 使用字符串代替Symbol
        Fragment: 'react.fragment'
    };
};

// 模拟的require函数
const createFakeRequire = () => {
    return (packageName: string) => {
        if (packageName === 'react') {
            return createFakeReact();
        }
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
}

const createBrowserEnvironment = () => {
    // 创建基础模拟对象
    const fakeDocument = {
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: (tagName: string) => {
            // 创建更完整的DOM元素模拟
            const element: Record<string, any> = {
                tagName: tagName.toUpperCase(),
                style: {},
                classList: {
                    add: () => {},
                    remove: () => {},
                    contains: () => false,
                    toggle: () => {}
                },
                attributes: {} as Record<string, string>,
                scrollTop: 0,
                offsetTop: 0,
                // 添加DOM方法
                setAttribute: (name: string, value: string) => {
                    element.attributes[name] = value;
                },
                getAttribute: (name: string) => element.attributes[name] || null,
                appendChild: (child: any) => {
                    if (!element.children) element.children = [];
                    element.children.push(child);
                },
                removeChild: (child: any) => {
                    if (element.children) {
                        element.children = element.children.filter((c: any) => c !== child);
                    }
                },
                addEventListener: () => {},
                removeEventListener: () => {},
                // 添加一些特殊元素的模拟方法
                src: '',
                href: '',
                innerHTML: '',
                innerText: '',
                textContent: '',
                // 表单元素方法
                focus: () => {},
                blur: () => {},
                click: () => {},
                submit: () => {},
                reset: () => {},
                // 添加样式方法
                getBoundingClientRect: () => ({
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    width: 0,
                    height: 0
                })
            };
            
            // 根据标签类型添加特定属性
            if (tagName === 'input' || tagName === 'textarea') {
                element.value = '';
                element.checked = false;
                element.focus = () => {};
                element.blur = () => {};
            }
            
            if (tagName === 'a') {
                element.href = '';
            }
            
            if (tagName === 'img') {
                element.src = '';
                element.alt = '';
                element.onload = null;
                element.onerror = null;
            }
            
            if (tagName === 'script') {
                element.src = '';
                element.async = false;
                element.defer = false;
                element.onload = null;
                element.onerror = null;
            }
            
            return element;
        },
        body: {
            appendChild: () => {},
            removeChild: () => {},
            style: {}
        },
        head: {
            appendChild: () => {},
            removeChild: () => {}
        },
        // 添加更多DOM方法
        getElementById: () => null,
        getElementsByClassName: () => [],
        getElementsByTagName: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        createTextNode: (text: string) => ({ nodeValue: text }),
        createComment: () => ({ nodeValue: '' }),
        title: '',
        cookie: '',
        location: {
            href: '',
            protocol: '',
            host: '',
            hostname: '',
            port: '',
            pathname: '',
            search: '',
            hash: '',
            assign: () => {},
            replace: () => {},
            reload: () => {}
        }
    };

    const silentConsole = {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
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
        requestAnimationFrame: (cb: () => void) => setTimeout(cb, 16),
        // 添加更多浏览器API
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null
        },
        sessionStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null
        },
        navigator: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
            language: 'en-US',
            languages: ['en-US', 'en'],
            platform: 'Win32',
            cookieEnabled: true,
            onLine: true,
            hardwareConcurrency: 4,
            maxTouchPoints: 0
        },
        location: fakeDocument.location,
        history: {
            length: 1,
            state: null,
            back: () => {},
            forward: () => {},
            go: () => {},
            pushState: () => {},
            replaceState: () => {}
        },
        screen: {
            width: 1920,
            height: 1080,
            availWidth: 1920,
            availHeight: 1080,
            colorDepth: 24,
            pixelDepth: 24,
            orientation: {
                type: 'landscape-primary',
                angle: 0
            }
        },
        // 添加XMLHttpRequest和Fetch的简单模拟
        XMLHttpRequest: class {
            open() {}
            send() {}
            setRequestHeader() {}
            abort() {}
            onload = null;
            onerror = null;
            status = 200;
            statusText = 'OK';
            responseText = '';
            response = '';
        },
        fetch: () => Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
            blob: () => Promise.resolve(new Blob()),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
        }),
        // 添加Web API
        setTimeout: (handler: Function, timeout?: number, ...args: any[]) => {
            return setTimeout(handler, timeout, ...args);
        },
        clearTimeout: (id: number) => clearTimeout(id),
        setInterval: (handler: Function, timeout?: number, ...args: any[]) => {
            return setInterval(handler, timeout, ...args);
        },
        clearInterval: (id: number) => clearInterval(id),
        // 添加更多全局对象
        Image: class {
            src = '';
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            width = 0;
            height = 0;
        }
    };

    // 创建全局对象代理
    const fakeWindow = new Proxy(globalVars, {
        get(target, prop) {
            if (prop === 'window' || prop === 'globalThis') return fakeWindow;
            
            // 特殊处理document
            if (prop === 'document') return target.document;
            
            return target[prop as string] ?? undefined;
        },
        has() {
            return true;
        }
    });

    return fakeWindow;
};

// 创建增强版浏览器环境
const createEnhancedBrowserEnvironment = () => {
    const fakeWindow = createBrowserEnvironment();
    
    // 自定义Function实现
    fakeWindow.Function = function(...args: string[]) {
        const body = args.length > 0 ? args.pop() : '';
        const params = args.length > 0 ? args : [];
        
        return function(this: any) {
            // 创建执行上下文
            const context = Object.create(fakeWindow);
            params.forEach((param, i) => {
                context[param] = arguments[i];
            });
            
            try {
                // 使用原生Function但确保它在我们的上下文中执行
                const func = new Function(...params, `with(this) { ${body} }`);
                return func.apply(context);
            } catch (e) {
                console.warn('动态函数执行错误:', e);
                return undefined;
            }
        }.bind(fakeWindow);
    };

    // 自定义eval实现
    fakeWindow.eval = function(code: string) {
        try {
            const func = fakeWindow.Function(code);
            return func();
        } catch (e) {
            console.warn('eval执行错误:', e);
            return undefined;
        }
    };

    return fakeWindow;
};

// 创建全局作用域代理
const createGlobalProxy = (fakeWindow: any, customGlobals: Record<string, any>) => {
    // 合并基础环境变量和自定义全局变量
    const globalVars = { ...fakeWindow, ...customGlobals };
    
    return new Proxy(globalVars, {
        get(target, prop) {
            // 将prop转换为字符串处理
            const propKey = typeof prop === 'symbol' ? Symbol.keyFor(prop) || prop.toString() : prop;
            
            // 特殊处理window属性
            if (propKey === 'window' || propKey === 'globalThis') {
                return target;
            }
            
            // 优先返回自定义全局变量
            if (propKey in customGlobals) {
                return customGlobals[propKey as keyof typeof customGlobals];
            }
            
            // 返回模拟环境变量
            return target[propKey as keyof typeof target];
        },
        has(target, prop) {
            // 将prop转换为字符串处理
            const propKey = typeof prop === 'symbol' ? Symbol.keyFor(prop) || prop.toString() : prop;
            return propKey in target || propKey in customGlobals;
        }
    });
};

// 主函数：从控件代码提取信息
export function extractWidgetInfo(code: string): IWidgetTypeBase {
    // 1. 使用Babel转换JSX代码（禁用严格模式）
    let transformedCode = code;
    try {
        const result = Babel.transform(code, {
            presets: [['react', { strictMode: false }]],
            sourceType: 'unambiguous',
            parserOpts: { strictMode: false }
        });
        transformedCode = result.code || code;
        // 移除可能的严格模式声明
        transformedCode = transformedCode.replace(/^['"]use strict['"];?/g, '');
    } catch (error) {
        console.warn('Babel转换失败，尝试直接执行原始代码', error);
    }

    // 2. 创建增强版模拟环境
    const fakeWindow = createEnhancedBrowserEnvironment();
    const fakeReact = createFakeReact();
    
    // 3. 创建全局作用域代理
    const customGlobals = {
        React: fakeReact,
        require: createFakeRequire(),
        exports: {},
        module: { exports: {} },
        VisibleWidget: VisibleWidget,
        InvisibleWidget: InvisibleWidget
    };
    
    const globalProxy = createGlobalProxy(fakeWindow, customGlobals);

    // 4. 安全执行代码
    try {
        const wrappedCode = `
            (function(global) {
                with(global) {
                    ${transformedCode}
                }
            }).call(global, global);
        `;
        
        const exec = new Function('global', wrappedCode);
        exec(globalProxy);
    } catch (error) {
        throw new Error(`执行控件代码时出错: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 5. 提取控件信息
    const widgetType = globalProxy.module.exports?.type || 
                      globalProxy.module.exports?.types || 
                      globalProxy.exports?.type || 
                      globalProxy.exports?.types;
    
    if (!widgetType) {
        throw new Error('未找到控件类型定义');
    }

    return {
        type: widgetType.type,
        title: widgetType.title,
        icon: widgetType.icon,
        version: widgetType.version,
        isInvisibleWidget: !!widgetType.isInvisibleWidget,
        isGlobalWidget: !!widgetType.isGlobalWidget
    };
}