/**
 * Protyle 核心编辑器类
 * 
 * 这是思源笔记的核心编辑器实现，提供了完整的文档编辑功能，包括：
 * - 富文本编辑（WYSIWYG）
 * - Markdown 预览
 * - 撤销/重做管理
 * - 块操作（创建、合并、转换等）
 * - 文档事务管理
 * - 插件系统集成
 * - 响应式布局
 */

import {Constants} from "../constants";
import {Hint} from "./hint";
import {setLute} from "./render/setLute";
import {Preview} from "./preview";
import {addLoading, initUI, removeLoading} from "./ui/initUI";
import {Undo} from "./undo";
import {Upload} from "./upload";
import {Options} from "./util/Options";
import {destroy} from "./util/destroy";
import {Scroll} from "./scroll";
import {Model} from "../layout/Model";
import {genUUID} from "../util/genID";
import {WYSIWYG} from "./wysiwyg";
import {Toolbar} from "./toolbar";
import {Gutter} from "./gutter";
import {Breadcrumb} from "./breadcrumb";
import {
    onTransaction,
    transaction,
    turnsIntoOneTransaction,
    turnsIntoTransaction,
    updateBatchTransaction,
    updateTransaction
} from "./wysiwyg/transaction";
import {fetchPost} from "../util/fetch";
/// #if !MOBILE
import {updatePanelByEditor} from "../editor/util";
import {setPanelFocus} from "../layout/util";
/// #endif
import {Title} from "./header/Title";
import {Background} from "./header/Background";
import {disabledProtyle, enableProtyle, onGet, setReadonlyByConfig} from "./util/onGet";
import {reloadProtyle} from "./util/reload";
import {renderBacklink} from "./wysiwyg/renderBacklink";
import {setEmpty} from "../mobile/util/setEmpty";
import {resize} from "./util/resize";
import {getDocByScroll} from "./scroll/saveScroll";
import {App} from "../index";
import {insertHTML} from "./util/insertHTML";
import {avRender} from "./render/av/render";
import {focusBlock, getEditorRange} from "./util/selection";
import {hasClosestBlock} from "./util/hasClosest";
import {setStorageVal} from "./util/compatibility";
import {merge} from "./util/merge";
/// #if !MOBILE
import {getAllModels} from "../layout/getAll";
/// #endif
import {isSupportCSSHL} from "./render/searchMarkRender";
import {renderAVAttribute} from "./render/av/blockAttr";
import {genEmptyElement} from "../block/util";

export class Protyle {
    /** 当前编辑器版本号，与思源笔记版本一致 */
    public readonly version: string;
    
    /** 编辑器核心实例对象 */
    public protyle: IProtyle;

    /**
     * 构造函数 - 创建 Protyle 编辑器实例
     * 
     * @param app 思源笔记应用实例
     * @param id 要挂载编辑器的 HTML 元素或元素ID
     * @param options 编辑器配置选项
     */
    constructor(app: App, id: HTMLElement, options?: IProtyleOptions) {
        this.version = Constants.SIYUAN_VERSION;
        
        // 合并插件配置
        let pluginsOptions: IProtyleOptions = options;
        app.plugins.forEach(item => {
            if (item.protyleOptions) {
                pluginsOptions = merge(pluginsOptions, item.protyleOptions);
            }
        });
        
        // 初始化配置
        const getOptions = new Options(pluginsOptions);
        const mergedOptions = getOptions.merge();
        
        // 初始化编辑器核心对象
        this.protyle = {
            getInstance: () => this,
            app,
            transactionTime: new Date().getTime(), // 事务时间戳
            id: genUUID(), // 编辑器唯一ID
            disabled: false, // 是否禁用状态
            updated: false, // 是否有更新
            element: id, // 挂载元素
            options: mergedOptions, // 合并后的配置
            block: {}, // 块数据
            highlight: { // 高亮相关配置
                mark: isSupportCSSHL() ? new Highlight() : undefined,
                markHL: isSupportCSSHL() ? new Highlight() : undefined,
                ranges: [], // 高亮范围
                rangeIndex: 0, // 当前高亮索引
                styleElement: document.createElement("style"), // 高亮样式元素
            }
        };

        // 初始化高亮样式
        if (isSupportCSSHL()) {
            const styleId = genUUID();
            this.protyle.highlight.styleElement.dataset.uuid = styleId;
            this.protyle.highlight.styleElement.textContent = `
                .protyle-wysiwyg::highlight(search-mark-${styleId}) {
                    background-color: var(--b3-highlight-background);
                    color: var(--b3-highlight-color);
                }
                .protyle-wysiwyg::highlight(search-mark-hl-${styleId}) {
                    color: var(--b3-highlight-color);
                    background-color: var(--b3-highlight-current-background)
                }`;
        }

        // 初始化各功能模块
        this.protyle.hint = new Hint(this.protyle); // 提示功能
        
        // 根据配置初始化可选模块
        if (mergedOptions.render.breadcrumb) {
            this.protyle.breadcrumb = new Breadcrumb(this.protyle); // 面包屑导航
        }
        if (mergedOptions.render.title) {
            this.protyle.title = new Title(this.protyle); // 标题栏
        }
        if (mergedOptions.render.background) {
            this.protyle.background = new Background(this.protyle); // 背景设置
        }

        // 清空并初始化编辑器容器
        this.protyle.element.innerHTML = "";
        this.protyle.element.classList.add("protyle");
        
        // 添加面包屑导航（如果启用）
        if (mergedOptions.render.breadcrumb) {
            this.protyle.element.appendChild(this.protyle.breadcrumb.element.parentElement);
        }
        
        // 初始化核心功能模块
        this.protyle.undo = new Undo(); // 撤销/重做管理
        this.protyle.wysiwyg = new WYSIWYG(this.protyle); // 富文本编辑器
        this.protyle.toolbar = new Toolbar(this.protyle); // 工具栏
        this.protyle.scroll = new Scroll(this.protyle); // 滚动管理
        
        // 初始化可选模块
        if (this.protyle.options.render.gutter) {
            this.protyle.gutter = new Gutter(this.protyle); // 行号显示
        }
        if (mergedOptions.upload.url || mergedOptions.upload.handler) {
            this.protyle.upload = new Upload(); // 文件上传功能
        }

        // 执行初始化
        this.init();
        
        // 处理特殊加载情况
        if (!mergedOptions.action.includes(Constants.CB_GET_HISTORY)) {
            // 处理反链数据加载
            if (options.backlinkData) {
                this.protyle.block.rootID = options.blockId;
                renderBacklink(this.protyle, options.backlinkData);
                this.protyle.wysiwyg.element.style.padding = "4px 16px 4px 24px";
                return;
            }
            
            // 处理空块ID情况（如搜索页签）
            if (!options.blockId) {
                removeLoading(this.protyle);
                return;
            }

            // 根据滚动位置加载文档
            if (this.protyle.options.mode !== "preview" &&
                options.rootId && window.siyuan.storage[Constants.LOCAL_FILEPOSITION][options.rootId] &&
                (
                    mergedOptions.action.includes(Constants.CB_GET_SCROLL) ||
                    (mergedOptions.action.includes(Constants.CB_GET_ROOTSCROLL) && options.rootId === options.blockId)
                )
            ) {
                getDocByScroll({
                    protyle: this.protyle,
                    scrollAttr: window.siyuan.storage[Constants.LOCAL_FILEPOSITION][options.rootId],
                    mergedOptions,
                    cb: () => {
                        this.afterOnGet(mergedOptions);
                    }
                });
            } else {
                this.getDoc(mergedOptions);
            }
        } else {
            this.protyle.contentElement.classList.add("protyle-content--transition");
        }
    }

    /**
     * 获取文档内容
     * @private
     * @param mergedOptions 合并后的配置选项
     */
    private getDoc(mergedOptions: IProtyleOptions) {
        fetchPost("/api/filetree/getDoc", {
            id: mergedOptions.blockId,
            isBacklink: mergedOptions.action.includes(Constants.CB_GET_BACKLINK),
            originalRefBlockIDs: mergedOptions.originalRefBlockIDs,
            mode: (mergedOptions.action && mergedOptions.action.includes(Constants.CB_GET_CONTEXT)) ? 3 : 0,
            size: mergedOptions.action?.includes(Constants.CB_GET_ALL) ? Constants.SIZE_GET_MAX : window.siyuan.config.editor.dynamicLoadBlocks,
        }, getResponse => {
            onGet({
                data: getResponse,
                protyle: this.protyle,
                action: mergedOptions.action,
                afterCB: () => {
                    this.afterOnGet(mergedOptions);
                }
            });
        });
    }

    /**
     * 文档加载完成后的处理
     * @private
     * @param mergedOptions 合并后的配置选项
     */
    private afterOnGet(mergedOptions: IProtyleOptions) {
        // 更新面板状态（非移动端）
        if (this.protyle.model) {
            /// #if !MOBILE
            if (mergedOptions.action?.includes(Constants.CB_GET_FOCUS) || mergedOptions.action?.includes(Constants.CB_GET_OPENNEW)) {
                setPanelFocus(this.protyle.model.element.parentElement.parentElement);
            }
            updatePanelByEditor({
                protyle: this.protyle,
                focus: false,
                pushBackStack: false,
                reload: false,
                resize: false
            });
            /// #endif
        }
        
        // 调整布局
        resize(this.protyle);
        
        // 设置编辑器焦点事件监听
        this.protyle.wysiwyg.element.addEventListener("focusin", () => {
            /// #if !MOBILE
            if (this.protyle && this.protyle.model) {
                let needUpdate = true;
                if (this.protyle.model.element.parentElement.parentElement.classList.contains("layout__wnd--active") && 
                    this.protyle.model.headElement.classList.contains("item--focus")) {
                    needUpdate = false;
                }
                if (!needUpdate) {
                    return;
                }
                setPanelFocus(this.protyle.model.element.parentElement.parentElement);
                updatePanelByEditor({
                    protyle: this.protyle,
                    focus: false,
                    pushBackStack: false,
                    reload: false,
                    resize: false,
                });
            } else {
                // 处理悬浮层情况
                document.querySelectorAll(".layout__tab--active").forEach(item => {
                    item.classList.remove("layout__tab--active");
                });
                document.querySelectorAll(".layout__wnd--active").forEach(item => {
                    item.classList.remove("layout__wnd--active");
                });
            }
            /// #endif
        });
        
        // 执行初始化后回调
        if (mergedOptions.after) {
            mergedOptions.after(this);
        }
        this.protyle.contentElement.classList.add("protyle-content--transition");
    }

    /**
     * 初始化编辑器核心功能
     * @private
     */
    private init() {
        // 初始化 Lute Markdown 解析器
        this.protyle.lute = setLute({
            emojiSite: this.protyle.options.hint.emojiPath,
            emojis: this.protyle.options.hint.emoji,
            headingAnchor: false,
            listStyle: this.protyle.options.preview.markdown.listStyle,
            paragraphBeginningSpace: this.protyle.options.preview.markdown.paragraphBeginningSpace,
            sanitize: this.protyle.options.preview.markdown.sanitize,
        });

        // 初始化预览功能
        this.protyle.preview = new Preview(this.protyle);

        // 初始化UI
        initUI(this.protyle);
    }

    /* 公共API方法 */

    /**
     * 聚焦到编辑器
     */
    public focus() {
        this.protyle.wysiwyg.element.focus();
    }

    /**
     * 检查是否正在上传文件
     * @returns 是否正在上传
     */
    public isUploading() {
        return this.protyle.upload.isUploading;
    }

    /**
     * 清空撤销/重做栈
     */
    public clearStack() {
        this.protyle.undo.clear();
    }

    /**
     * 销毁编辑器实例
     */
    public destroy() {
        destroy(this.protyle);
    }

    /**
     * 调整编辑器尺寸
     */
    public resize() {
        resize(this.protyle);
    }

    /**
     * 重新加载编辑器内容
     * @param focus 是否在加载后聚焦到编辑器
     */
    public reload(focus: boolean) {
        reloadProtyle(this.protyle, focus);
    }

    /**
     * 插入HTML内容
     * @param html 要插入的HTML内容
     * @param isBlock 是否作为块插入
     * @param useProtyleRange 是否使用编辑器范围
     */
    public insert(html: string, isBlock = false, useProtyleRange = false) {
        insertHTML(html, this.protyle, isBlock, useProtyleRange);
    }

    /**
     * 执行事务操作
     * @param doOperations 要执行的操作列表
     * @param undoOperations 对应的撤销操作列表（可选）
     */
    public transaction(doOperations: IOperation[], undoOperations?: IOperation[]) {
        transaction(this.protyle, doOperations, undoOperations);
    }

    /**
     * 将多个块合并为一个块
     * @param selectsElement 选中的块元素列表
     * @param type 合并类型
     * @param subType 子类型（当type为"BlocksMergeSuperBlock"时必传）
     */
    public turnIntoOneTransaction(selectsElement: Element[], type: TTurnIntoOne, subType?: TTurnIntoOneSub) {
        turnsIntoOneTransaction({
            protyle: this.protyle,
            selectsElement,
            type,
            level: subType
        });
    }

    /**
     * 转换块类型
     * @param nodeElement 要转换的块元素
     * @param type 转换类型
     * @param subType 子类型（当type为"Blocks2Hs"时必传）
     */
    public turnIntoTransaction(nodeElement: Element, type: TTurnInto, subType?: number) {
        turnsIntoTransaction({
            protyle: this.protyle,
            nodeElement,
            type,
            level: subType,
        });
    }

    /**
     * 更新单个块的事务
     * @param id 块ID
     * @param newHTML 新的HTML内容
     * @param html 原始HTML内容（用于撤销）
     */
    public updateTransaction(id: string, newHTML: string, html: string) {
        updateTransaction(this.protyle, id, newHTML, html);
    }

    /**
     * 批量更新块的事务
     * @param nodeElements 要更新的块元素列表
     * @param cb 更新回调函数
     */
    public updateBatchTransaction(nodeElements: Element[], cb: (e: HTMLElement) => void) {
        updateBatchTransaction(nodeElements, this.protyle, cb);
    }

    /**
     * 获取编辑器选区范围
     * @param element 要获取范围的元素
     * @returns 选区范围对象
     */
    public getRange(element: Element) {
        return getEditorRange(element);
    }

    /**
     * 检查元素是否在块内
     * @param element 要检查的元素
     * @returns 最近的块元素或null
     */
    public hasClosestBlock(element: Node) {
        return hasClosestBlock(element);
    }

    /**
     * 聚焦到指定块
     * @param element 要聚焦的块元素
     * @param toStart 是否聚焦到块开头
     * @returns 是否聚焦成功
     */
    public focusBlock(element: Element, toStart = true) {
        return focusBlock(element, undefined, toStart);
    }

    /**
     * 禁用编辑器
     */
    public disable() {
        disabledProtyle(this.protyle);
    }

    /**
     * 启用编辑器
     */
    public enable() {
        enableProtyle(this.protyle);
    }

    /**
     * 渲染属性视图属性
     * @param element 要渲染的元素
     * @param id 属性视图ID
     * @param cb 渲染完成后的回调函数
     */
    public renderAVAttribute(element: HTMLElement, id: string, cb?: (element: HTMLElement) => void) {
        renderAVAttribute(element, id, this.protyle, cb);
    }
}
