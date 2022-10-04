export type Constructible<T> = new () => T;

export class Container {
  private readonly _injectables = new Map<Constructible<unknown>, any>();
  public static readonly instance = new Container();

  public get<T = unknown>(injectableType: Constructible<T>): T | undefined {
    return this._injectables.get(injectableType);
  }

  public set<T = unknown>(injectableType: Constructible<T>) {
    const injectableInstance = Reflect.construct(injectableType, []);
    this._injectables.set(injectableType, injectableInstance);
    return this;
  }
}
