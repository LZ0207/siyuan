// 引入相关工具函数和常量
import {hasClosestBlock, hasClosestByAttribute, isInEmbedBlock} from "../util/hasClosest";
import {Constants} from "../../constants";

+ /**
+  * 获取当前元素的前一个具有 data - node - id 属性的兄弟块元素
+  * @description 从给定元素开始，向上遍历父元素，查找具有 data - node - id 属性的前一个兄弟元素
+  * @param {Element} element - 起始元素
+  * @returns {Element | boolean} 返回找到的前一个块元素，如果未找到则返回 false
+  * @example
+  * const element = document.getElementById('someElement');
+  * const prevBlock = getPreviousBlock(element);
+  * if (prevBlock) {
+  *     console.log('Previous block found:', prevBlock);
+  * } else {
+  *     console.log('No previous block found');
+  * }
+  */
export const getPreviousBlock = (element: Element) => {
    let parentElement = element;
    while (parentElement) {
        if (parentElement.previousElementSibling && parentElement.previousElementSibling.getAttribute("data-node-id")) {
            return parentElement.previousElementSibling;
        }
        const pElement = hasClosestBlock(parentElement.parentElement);
        if (pElement) {
            parentElement = pElement;
        } else {
            return false;
        }
    }
};

+ /**
+  * 获取给定元素内的最后一个非嵌入块元素
+  * @description 从给定元素的所有具有 data - node - id 的子元素中，反向查找第一个非嵌入块元素
+  * @param {Element} element - 起始元素
+  * @returns {Element} 返回找到的最后一个非嵌入块元素，如果未找到则返回起始元素本身
+  * @example
+  * const element = document.getElementById('someElement');
+  * const lastBlock = getLastBlock(element);
+  * console.log('Last block:', lastBlock);
+  */
export const getLastBlock = (element: Element) => {
    let lastElement;
    Array.from(element.querySelectorAll("[data-node-id]")).reverse().find(item => {
        if (!isInEmbedBlock(item)) {
            lastElement = item;
            return true;
        }
    });
    return lastElement || element;
};

+ /**
+  * 获取给定元素内的第一个满足条件的非嵌入块元素
+  * @description 从给定元素的所有具有 data - node - id 的子元素中，查找第一个既非嵌入块，又不包含特定类名（li, sb）的元素
+  * @param {Element} element - 起始元素
+  * @returns {Element} 返回找到的第一个满足条件的非嵌入块元素，如果未找到则返回起始元素本身
+  * @example
+  * const element = document.getElementById('someElement');
+  * const firstBlock = getFirstBlock(element);
+  * console.log('First block:', firstBlock);
+  */
export const getFirstBlock = (element: Element) => {
    let firstElement;
    Array.from(element.querySelectorAll("[data-node-id]")).find(item => {
        if (!isInEmbedBlock(item) &&!item.classList.contains("li") &&!item.classList.contains("sb")) {
            firstElement = item;
            return true;
        }
    });
    return firstElement || element;
};

+ /**
+  * 获取当前元素的下一个兄弟块元素（排除特定类名）
+  * @description 从给定元素开始，向上遍历父元素，查找下一个非 protyle - attr 类名的兄弟元素
+  * @param {Element} element - 起始元素
+  * @returns {HTMLElement | boolean} 返回找到的下一个块元素，如果未找到则返回 false
+  * @example
+  * const element = document.getElementById('someElement');
+  * const nextBlock = getNextBlock(element);
+  * if (nextBlock) {
+  *     console.log('Next block found:', nextBlock);
+  * } else {
+  *     console.log('No next block found');
+  * }
+  */
export const getNextBlock = (element: Element) => {
    let parentElement = element;
    while (parentElement) {
        if (parentElement.nextElementSibling &&!parentElement.nextElementSibling.classList.contains("protyle-attr")) {
            return parentElement.nextElementSibling as HTMLElement;
        }
        const pElement = hasClosestBlock(parentElement.parentElement);
        if (pElement) {
            parentElement = pElement;
        } else {
            return false;
        }
    }
    return false;
};

+ /**
+  * 获取不包含特定类名容器的子元素
+  * @description 从给定元素开始，向下查找第一个不包含特定类名（list, li, bq, sb）的子元素
+  * @param {Element} element - 起始元素
+  * @returns {Element | boolean} 返回找到的元素，如果未找到则返回 false
+  * @example
+  * const element = document.getElementById('someElement');
+  * const noContainerElement = getNoContainerElement(element);
+  * if (noContainerElement) {
+  *     console.log('No container element found:', noContainerElement);
+  * } else {
+  *     console.log('No such element found');
+  * }
+  */
export const getNoContainerElement = (element: Element) => {
    let childElement = element;
    while (childElement) {
        if (childElement.classList.contains("list") || childElement.classList.contains("li") || childElement.classList.contains("bq") || childElement.classList.contains("sb")) {
            childElement = childElement.querySelector("[data-node-id]");
        } else {
            return childElement;
        }
    }
    return false;
};

+ /**
+  * 获取可编辑的元素
+  * @description 查找给定元素及其子元素中，满足特定条件的可编辑元素
+  * @param {Element} element - 起始元素
+  * @returns {Element | undefined} 返回找到的可编辑元素，如果未找到则返回 undefined
+  * @example
+  * const element = document.getElementById('someElement');
+  * const editableElement = getContenteditableElement(element);
+  * if (editableElement) {
+  *     console.log('Editable element found:', editableElement);
+  * } else {
+  *     console.log('No editable element found');
+  * }
+  */
export const getContenteditableElement = (element: Element) => {
    if (!element || (element.getAttribute("contenteditable") === "true") &&!element.classList.contains("protyle-wysiwyg")) {
        return element;
    }
    const editableElement = element.querySelector('[contenteditable="true"]');
    if (editableElement &&!hasClosestByAttribute(editableElement, "data-type", "NodeBlockQueryEmbed")) {
        return editableElement;
    }
    return undefined;
};

+ /**
+  * 判断元素是否为不可编辑的块类型
+  * @description 根据元素的 data - type 属性和类名判断是否为不可编辑的特定块类型
+  * @param {Element} element - 需要判断的元素
+  * @returns {boolean} 如果是不可编辑的块类型则返回 true，否则返回 false
+  * @example
+  * const element = document.getElementById('someElement');
+  * const isNotEdit = isNotEditBlock(element);
+  * console.log('Is not edit block:', isNotEdit);
+  */
export const isNotEditBlock = (element: Element) => {
    return ["NodeBlockQueryEmbed", "NodeThematicBreak", "NodeMathBlock", "NodeHTMLBlock", "NodeIFrame", "NodeWidget", "NodeVideo", "NodeAudio"].includes(element.getAttribute("data-type")) ||
        (element.getAttribute("data-type") === "NodeCodeBlock" && element.classList.contains("render-node"));
};

+ /**
+  * 获取顶部的空元素
+  * @description 从给定元素开始，向上遍历父元素，查找顶部的空元素（根据特定条件判断为空）
+  * @param {Element} element - 起始元素
+  * @returns {Element} 返回找到的顶部空元素
+  * @example
+  * const element = document.getElementById('someElement');
+  * const topEmptyElement = getTopEmptyElement(element);
+  * console.log('Top empty element:', topEmptyElement);
+  */
export const getTopEmptyElement = (element: Element) => {
    let topElement = element;
    while (topElement.parentElement &&!topElement.parentElement.classList.contains("protyle-wysiwyg")) {
        if (!topElement.parentElement.getAttribute("data-node-id")) {
            topElement = topElement.parentElement;
        } else {
            let hasText = false;
            Array.from(topElement.parentElement.querySelectorAll('[contenteditable="true"]')).find(item => {
                if (item.textContent.replace(Constants.ZWSP, "").replace("\n", "")!== "") {
                    hasText = true;
                    return true;
                }
            });
            if (hasText || topElement.previousElementSibling?.getAttribute("data-node-id") ||
                topElement.nextElementSibling?.getAttribute("data-node-id")) {
                break;
            } else {
                topElement = topElement.parentElement;
            }
        }
    }
    return topElement;
};

+ /**
+  * 获取顶部孤立元素（根据特定父元素类型和子元素数量条件）
+  * @description 根据给定元素的父元素类型和子元素数量，递归查找顶部的孤立元素
+  * @param {Element} topSourceElement - 起始元素
+  * @returns {Element} 返回找到的顶部孤立元素
+  * @example
+  * const element = document.getElementById('someElement');
+  * const topAloneElement = getTopAloneElement(element);
+  * console.log('Top alone element:', topAloneElement);
+  */
export const getTopAloneElement = (topSourceElement: Element) => {
    if ("NodeBlockquote" === topSourceElement.parentElement.getAttribute("data-type") && topSourceElement.parentElement.childElementCount === 2) {
        while (!topSourceElement.parentElement.classList.contains("protyle-wysiwyg")) {
            if (topSourceElement.parentElement.getAttribute("data-type") === "NodeBlockquote" && topSourceElement.parentElement.childElementCount === 2) {
                topSourceElement = topSourceElement.parentElement;
            } else {
                topSourceElement = getTopAloneElement(topSourceElement);
                break;
            }
        }
    } else if ("NodeSuperBlock" === topSourceElement.parentElement.getAttribute("data-type") && topSourceElement.parentElement.childElementCount === 2) {
        while (!topSourceElement.parentElement.classList.contains("protyle-wysiwyg")) {
            if (topSourceElement.parentElement.getAttribute("data-type") === "NodeSuperBlock" && topSourceElement.parentElement.childElementCount === 2) {
                topSourceElement = topSourceElement.parentElement;
            } else {
                topSourceElement = getTopAloneElement(topSourceElement);
                break;
            }
        }
    } else if ("NodeListItem" === topSourceElement.parentElement.getAttribute("data-type") && topSourceElement.parentElement.childElementCount === 3) {
        while (!topSourceElement.parentElement.classList.contains("protyle-wysiwyg")) {
            if (topSourceElement.parentElement.getAttribute("data-type") === "NodeListItem" && topSourceElement.parentElement.childElementCount === 3) {
                topSourceElement = topSourceElement.parentElement;
            } else if (topSourceElement.parentElement.getAttribute("data-type") === "NodeList" && topSourceElement.parentElement.childElementCount === 2) {
                topSourceElement = topSourceElement.parentElement;
            } else {
                topSourceElement = getTopAloneElement(topSourceElement);
                break;
            }
        }
    } else if ("NodeList" === topSourceElement.parentElement.getAttribute("data-type") && topSourceElement.parentElement.childElementCount === 2) {
        while (!topSourceElement.parentElement.classList.contains("protyle-wysiwyg")) {
            if ("NodeList" === topSourceElement.parentElement.getAttribute("data-type") && topSourceElement.parentElement.childElementCount === 2) {
                topSourceElement = topSourceElement.parentElement;
            } else if (topSourceElement.parentElement.getAttribute("data-type") === "NodeListItem" && topSourceElement.parentElement.childElementCount === 3) {
                topSourceElement = topSourceElement.parentElement;
            } else {
                topSourceElement = getTopAloneElement(topSourceElement);
                break;
            }
        }
    }
    return topSourceElement;
};

+ /**
+  * 判断节点是否有下一个非空兄弟节点
+  * @description 从给定节点开始，查找下一个非空兄弟节点
+  * @param {Node} element - 起始节点
+  * @returns {Node | boolean} 如果找到下一个非空兄弟节点则返回该节点，否则返回 false
+  * @example
+  * const element = document.getElementById('someElement').childNodes[0];
+  * const hasNext = hasNextSibling(element);
+  * if (hasNext) {
+  *     console.log('Next sibling found:', hasNext);
+  * } else {
+  *     console.log('No next sibling found');
+  * }
+  */
export const hasNextSibling = (element: Node) => {
    let nextSibling = element.nextSibling;
    while (nextSibling) {
        if (nextSibling.textContent === "" && nextSibling.nodeType === 3) {
            nextSibling = nextSibling.nextSibling;
        } else {
            return nextSibling;
        }
    }
    return false;
};

+ /**
+  * 判断给定范围是否处于块的末尾
+  * @description 根据给定范围的结束容器和相关兄弟节点判断是否处于块的末尾
+  * @param {Range} range - 需要判断的范围对象
+  * @returns {boolean} 如果处于块的末尾则返回 true，否则返回 false
+  * @example
+  * const range = document.createRange();
+  * range.selectNodeContents(document.getElementById('someElement'));
+  * const isEnd = isEndOfBlock(range);
+  * console.log('Is end of block:', isEnd);
+  */
export const isEndOfBlock = (range: Range) => {
    if (range.endContainer.nodeType === 3 &&
        range.endContainer.textContent.length!== range.endOffset &&
        range.endContainer.textContent!== Constants.ZWSP &&
        range.endContainer.textContent!== "\n") {
        return false;
    }

    let nextSibling = range.endContainer;
    if (range.endContainer.nodeType!== 3) {
        nextSibling = range.endContainer.childNodes[range.endOffset];
    }

    while (nextSibling) {
        if (hasNextSibling(nextSibling)) {
            return false;
        } else {
            if (nextSibling.parentElement.getAttribute("spellcheck")) {
                return true;
            }
            nextSibling = nextSibling.parentElement;
        }
    }

    return true;
};

+ /**
+  * 判断节点是否有上一个非空兄弟节点
+  * @description 从给定节点开始，查找上一个非空兄弟节点
+  * @param {Node} element - 起始节点
+  * @returns {Node | boolean} 如果找到上一个非空兄弟节点则返回该节点，否则返回 false
+  * @example
+  * const element = document.getElementById('someElement').childNodes[0];
+  * const hasPrevious = hasPreviousSibling(element);
+  * if (hasPrevious) {
+  *     console.log('Previous sibling found:', hasPrevious);
+  * } else {
+  *     console.log('No previous sibling found');
+  * }
+  */
export const hasPreviousSibling = (element: Node) => {
    let previousSibling = element.previousSibling;
    while (previousSibling) {
        if (previousSibling.textContent === "" && previousSibling.nodeType === 3) {
            previousSibling = previousSibling.previousSibling;
        } else {
            return previousSibling;
        }
    }
    return false;
};

+ /**
+  * 获取当前列表项（LI）的下一个相关列表项
+  * @description 根据当前元素，查找下一个相关的列表项（LI 或 UL 下的第一个 LI）
+  * @param {Element} current - 当前元素
+  * @returns {Element | boolean} 返回找到的下一个列表项，如果未找到则返回 false
+  * @example
+  * const currentLi = document.getElementById('currentLi');
+  * const nextFileLi = getNextFileLi(currentLi);
+  * if (nextFileLi) {
+  *     console.log('Next file LI found:', nextFileLi);
+  * } else {
+  *     console.log('No next file LI found');
+  * }
+  */
export const getNextFileLi = (current: Element) => {
    let nextElement = current.nextElementSibling;
    if (nextElement) {
if (nextElement.tagName === "LI") {
    return nextElement;
} else if (nextElement.tagName === "UL") {
    return nextElement.firstElementChild;
}
return false;
}
nextElement = current.parentElement;
while (nextElement.tagName === "UL") {
    if (!nextElement.nextElementSibling) {
        nextElement = nextElement.parentElement;
    } else if (nextElement.nextElementSibling.tagName === "LI") {
        return nextElement.nextElementSibling;
    } else if (nextElement.nextElementSibling.tagName === "UL") {
        return nextElement.nextElementSibling.firstElementChild;
    }
}
return false;
};

+ /**
+  * 获取当前列表项（LI）的上一个相关列表项
+  * @description 根据当前元素，查找上一个相关的列表项（LI 或 UL 下的最后一个 LI）
+  * @param {Element} current - 当前元素
+  * @returns {Element | boolean} 返回找到的上一个列表项，如果未找到则返回 false
+  * @example
+  * const currentLi = document.getElementById('currentLi');
+  * const prevFileLi = getPreviousFileLi(currentLi);
+  * if (prevFileLi) {
+  *     console.log('Previous file LI found:', prevFileLi);
+  * } else {
+  *     console.log('No previous file LI found');
+  * }
+  */
export const getPreviousFileLi = (current: Element) => {
    let previousElement = current.previousElementSibling;
    if (previousElement) {
        if (previousElement.tagName === "LI") {
            return previousElement;
        } else if (previousElement.tagName === "UL") {
            return previousElement.lastElementChild;
        }
        return false;
    }
    previousElement = current.parentElement;
    while (previousElement.tagName === "UL") {
        if (!previousElement.previousElementSibling) {
            previousElement = previousElement.parentElement;
        } else if (previousElement.previousElementSibling.tagName === "LI") {
            return previousElement.previousElementSibling;
        } else if (previousElement.previousElementSibling.tagName === "UL") {
            const liElements = previousElement.previousElementSibling.querySelectorAll(".b3 - list - item");
            return liElements[liElements.length - 1];
        }
    }
    return false;
};
        }
    }
    return false;
};
