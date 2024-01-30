import { NodeTypes } from "./ast";

interface Context {
  source: string;
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
  let node;
  if (context.source.startsWith(interpolationStart)) {
    // 处理插值
    node = parseInterpolation(context);
  } else if (context.source.startsWith("<")) {
    // 处理element
    node = parseElement(context);
  }
  nodes.push(node);

  return nodes;
}

function parseElement(context: Context) {
  const tag = getTag(context);

  const lastIndex = context.source.indexOf(`</${tag}>`);
  advanceBy(context, lastIndex + tag.length + 3)
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function getTag(context: Context) {
  const reg = /<([a-z]*)>/i;
  const match = context.source.match(reg);
  if (match) {
    return match[1];
  }
  return "";
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
