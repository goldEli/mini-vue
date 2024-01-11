import { ComponentInstance } from "./component";

export const initProps = (instance: ComponentInstance, rawProps) => {
    // 初始化props
    instance.props = rawProps || {}
}