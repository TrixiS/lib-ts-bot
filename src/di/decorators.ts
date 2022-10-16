import { Container } from "./container";

export const Injectable = (): ClassDecorator => {
  return (targetConstructor) => {
    Container.instance.set(targetConstructor as any);
  };
};

export const Inject = (): PropertyDecorator => {
  return (target, propertyKey) => {
    const id = (Reflect as any).getMetadata("design:type", target, propertyKey);
    const injectable = Container.instance.get(id.prototype.constructor);
    (target as any)[propertyKey.toString()] = injectable;
  };
};
