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
  const root = createRoot(parseChildren(context));
  return root;
}

const interpolationStart = "{{";
const interpolationEnd = "}}";

function parseChildren(context: Context) {
  const nodes: any[] = [];
  const s = context.source;
  let node;
  if (s.startsWith(interpolationStart)) {
    // 处理插值
    node = parseInterpolation(context);
  } else if (s.startsWith("<")) {
    if (/[a-z]/i.test(s[1])) {
      // 处理element
      node = parseElement(context);
    }
  }
  nodes.push(node);

  return nodes;
}

function parseElement(context: Context) {
  const element = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  return element;
}

function parseTag(context: Context, type: TagType) {
  const { tag, raw } = getTag(context);

  advanceBy(context, raw.length); // 跳过标签名和标签结束符

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
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

  const rawContent = context.source.slice(0, closeIndex);
  const rawContentLength = rawContent.length;
  const content = rawContent.trim();

  advanceBy(context, rawContentLength + interpolationEnd.length);

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
