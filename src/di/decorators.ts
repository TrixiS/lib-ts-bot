import { Container } from "./container";

export const Injectable = (): ClassDecorator => {
  return (targetConstructor) => {
    Container.instance.set(targetConstructor as any);
  };
};

export const Inject = (): PropertyDecorator => {
  return (target: Object, propertyKey: string | Symbol) => {
    const id = (Reflect as any).getMetadata("design:type", target, propertyKey);
    const injectable = Container.instance.get(id.prototype.constructor);
    // TODO?: throw an error if injectable is not found
    (target as any)[propertyKey.toString()] = injectable;
  };
};
