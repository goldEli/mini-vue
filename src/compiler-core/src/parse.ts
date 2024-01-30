import { NodeTypes } from "./ast";

export function baseParse(source) {
  const root = createRoot(source);
  return root;
}

const interpolationStart = "{{";
const interpolationEnd = "}}";

function createRoot(source) {
  const child = parseChild(source);
  return {
    type: NodeTypes.ROOT,
    children: [child],
  };
}
function parseChild(source: string) {
  let child;
  if (source.startsWith(interpolationStart)) {
    child = parseInterpolation(advanceBy(source, interpolationStart.length));
  }
  return child;
}
function parseInterpolation(source: any) {
  const content = source.slice(0, -interpolationEnd.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(source, length) {
  return source.slice(length);
}
