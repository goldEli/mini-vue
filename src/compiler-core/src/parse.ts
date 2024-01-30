import { NodeTypes } from "./ast";

interface Context {
  source: string;
}

const enum TagType {
  Start,
  End,
}

export function baseParse(source: string) {
  const context = createParserContext(source);
  const root = createRoot(parseChildren(context, []));
  return root;
}

const interpolationStart = "{{";
const interpolationEnd = "}}";

function parseChildren(context: Context, ancestors) {
  const nodes: any[] = [];
  while (!isEnd(context, ancestors)) {
    const s = context.source;
    let node;
    if (s.startsWith(interpolationStart)) {
      // 处理插值
      node = parseInterpolation(context);
    } else if (s.startsWith("<")) {
      if (/[a-z]/i.test(s[1])) {
        // 处理element
        node = parseElement(context, ancestors);
      }
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}
function isEnd(context: Context, ancestors) {
  const s = context.source;
  if (s.startsWith("</")) {
    const tag = ancestors[ancestors.length - 1].tag;
    if (startWithEndTagOpen(context, tag)) {
      return true;
    } else {
      lackOfEndTagError(tag);
    }
    // for (let i = ancestors.length - 1; i >= 0; i--) {
    //   const tag = ancestors[i].tag;
    //   if (startWithEndTagOpen(context, tag)) {
    //     return true;
    //   }
    // }
  }
  return !s;
}
function parseText(context: Context) {
  let lastIndex = context.source.length;
  if (context.source.indexOf(interpolationStart) !== -1) {
    lastIndex = context.source.indexOf(interpolationStart);
  }

  if (context.source.indexOf("<") !== -1) {
    const idx = context.source.indexOf("<");
    lastIndex = lastIndex < idx ? lastIndex : idx;
  }
  const content = parseTextData(context, lastIndex);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: Context, length: number) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}

function parseElement(context: Context, ancestors) {
  const element: any = parseTag(context, TagType.Start);
  ancestors.push(element); // 用于后续的结束标签匹配
  element.children = parseChildren(context, ancestors);
  ancestors.pop(); // 移除当前元素，用于后续的兄弟元素匹配
  //   parseTag(context, TagType.End);
  if (startWithEndTagOpen(context, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    lackOfEndTagError(element.tag);
  }
  return element;
}

function lackOfEndTagError(tag) {
  throw new Error(`lack of end tag: ${tag}`);
}

function startWithEndTagOpen(context: Context, tag: string) {
  const s = context.source;
  const t = s.slice(2, tag.length + 2);
  return s.startsWith("</") && t.toLowerCase() === tag.toLowerCase();
}

function parseTag(context: Context, type: TagType) {
  const { tag, raw } = getTag(context);

  advanceBy(context, raw.length); // 跳过标签名和标签结束符

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
    children: [],
  };
}

function getTag(context: Context) {
  const reg = /<\/?([a-z]*)>/i;
  const match = context.source.match(reg);
  if (match) {
    return {
      tag: match[1],
      raw: match[0],
    };
  }
  return {
    tag: "",
    raw: "",
  };
}

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}

function parseInterpolation(context: Context) {
  advanceBy(context, interpolationStart.length);
  const closeIndex = context.source.indexOf(interpolationEnd);

  const rawContent = parseTextData(context, closeIndex);
  const content = rawContent.trim();

  advanceBy(context, interpolationEnd.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context: Context, length) {
  context.source = context.source.slice(length);
}
function createParserContext(source: string) {
  return {
    source,
  };
}
