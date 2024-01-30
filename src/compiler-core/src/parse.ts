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
  }
  nodes.push(node);

  return nodes;
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
