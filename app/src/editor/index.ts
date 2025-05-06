/**
 * Editor 编辑器模块
 * 
 * 该模块提供了一个基于 Protyle 的富文本编辑器实现，用于在思源笔记中编辑文档内容。
 * 它继承自 Model 基类，提供了编辑器初始化、UI 控制以及与思源笔记系统的集成功能。
 */

import {Tab} from "../layout/Tab";
import {Protyle} from "../protyle";
import {Model} from "../layout/Model";
import {setPadding} from "../protyle/ui/initUI";
/// #if !BROWSER
import {setModelsHash} from "../window/setHeader";
/// #endif
import {countBlockWord} from "../layout/status";
import {App} from "../index";
import {fullscreen} from "../protyle/breadcrumb/action";

/**
 * Editor 类 - 思源笔记编辑器实现
 * 
 * 提供文档编辑功能，包括：
 * - 编辑器初始化
 * - 全屏模式支持
 * - 字数统计
 * - 与思源笔记系统的集成
 */
export class Editor extends Model {
    /** 编辑器所在的 HTML 元素 */
    public element: HTMLElement;
    
    /** Protyle 编辑器实例 */
    public editor: Protyle;
    
    /** 编辑器标签页的头部元素 */
    public headElement: HTMLElement;

    /**
     * 构造函数
     * @param options 编辑器配置选项
     * @param options.app 思源笔记应用实例
     * @param options.tab 关联的标签页实例
     * @param options.blockId 要编辑的块ID
     * @param options.rootId 文档根ID
     * @param options.mode 编辑器模式（可选）
     * @param options.action 编辑器操作列表（可选）
     * @param options.afterInitProtyle 编辑器初始化后的回调函数（可选）
     */
    constructor(options: {
        app: App,
        tab: Tab,
        blockId: string,
        rootId: string,
        mode?: TEditorMode,
        action?: TProtyleAction[],
        afterInitProtyle?: (editor: Protyle) => void,
    }) {
        // 调用父类构造函数
        super({
            app: options.app,
            id: options.tab.id,
        });
        
        // 根据配置更新标签页状态
        if (window.siyuan.config.fileTree.openFilesUseCurrentTab) {
            options.tab.headElement.classList.add("item--unupdate");
        }
        
        // 初始化成员变量
        this.headElement = options.tab.headElement;
        this.element = options.tab.panelElement;
        
        // 初始化 Protyle 编辑器
        this.initProtyle(options);
    }

    /**
     * 初始化 Protyle 编辑器
     * @private
     * @param options 编辑器配置选项
     * @param options.blockId 要编辑的块ID
     * @param options.action 编辑器操作列表（可选）
     * @param options.rootId 文档根ID
     * @param options.mode 编辑器模式（可选）
     * @param options.afterInitProtyle 编辑器初始化后的回调函数（可选）
     */
    private initProtyle(options: {
        blockId: string,
        action?: TProtyleAction[]
        rootId: string,
        mode?: TEditorMode,
        afterInitProtyle?: (editor: Protyle) => void,
    }) {
        // 创建 Protyle 编辑器实例
        this.editor = new Protyle(this.app, this.element, {
            action: options.action || [],  // 默认空操作列表
            blockId: options.blockId,
            rootId: options.rootId,
            mode: options.mode,
            render: {
                title: true,      // 渲染标题
                background: true, // 渲染背景
                scroll: true      // 启用滚动
            },
            typewriterMode: true,  // 启用打字机模式
            
            // 编辑器初始化后的回调
            after: (editor) => {
                // 处理全屏模式
                if (window.siyuan.editorIsFullscreen) {
                    fullscreen(editor.protyle.element);
                    setPadding(editor.protyle);
                }
                
                // 统计字数
                countBlockWord([], editor.protyle.block.rootID);
                
                // 非浏览器环境下更新模型哈希
                /// #if !BROWSER
                setModelsHash();
                /// #endif
                
                // 执行用户自定义回调
                if (options.afterInitProtyle) {
                    options.afterInitProtyle(editor);
                }
            },
        });
        
        // 设置编辑器模型引用（需在 after 回调之前设置）
        this.editor.protyle.model = this;
    }
}
