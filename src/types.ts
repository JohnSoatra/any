type AllTags = keyof JSX.IntrinsicElements;

type Jump = `jump-${"start" | "end" | "none" | "both"}`;

type EasingNames =
    | "sine"
    | "quad"
    | "cubic"
    | "quart"
    | "quint"
    | "expo"
    | "circ"
    | "back";

type EasingNoFunction =
    | "linear"
    | "stepStart"
    | "stepEnd"
    | "ease"
    | "easeIn"
    | "easeOut"
    | "easeInOut"
    | `${EasingNames}In`
    | `${EasingNames}Out`
    | `${EasingNames}InOut`;

type EasingFunction =
    | `steps(${number}, ${Jump})`
    | `cubic-bezier(${number}, ${number}, ${number}, ${number})`;

type Easing = EasingNoFunction | EasingFunction;

type EasingStyle =
    | "linear"
    | "step-start"
    | "step-end"
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | EasingFunction;

type EasingType = {
    [key in Capitalize<EasingNoFunction>]: Easing;
} & {
    Cubic: (
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ) => `cubic-bezier(${number}, ${number}, ${number}, ${number})`;
    Steps: (n: number, jump: Jump) => `steps(${number}, ${Jump})`;
};

type ToSingle<B extends Breakpoints | undefined> = {
    state: string;
    duration: number | DurationValueBreakpoints<B>;
    easing: Easing | EasingValueBreakpoints<B>;
    delay?: number | DelayValueBreakpoints<B>;
    on?: On | On[];
};

type ToBegin<B extends Breakpoints | undefined> = ToSingle<B> & {
    onEnd?: () => void;
};

type To<B extends Breakpoints | undefined> = ToBegin<B> & {
    start?: boolean;
    after?: number;
};

type ToEnd<B extends Breakpoints | undefined> = Omit<To<B>, "onEnd">;

type Tos<B extends Breakpoints | undefined> =
    | [ToSingle<B>]
    | [ToBegin<B>, ToEnd<B>]
    | [ToBegin<B>, ...To<B>[], ToEnd<B>];

type DefaultBreakpoints = {
    sm?: number;
    md?: number;
    lg?: number;
};

type Breakpoints = {
    [key: string]: number;
} & DefaultBreakpoints;

type ValueBreakpoints<
    B extends Breakpoints | undefined,
    V
> = (B extends undefined
    ? {
          [key in keyof DefaultBreakpoints]?: V;
      }
    : {
          [key in keyof B]?: V;
      }) & {
    [key in keyof DefaultBreakpoints]?: V;
} & {
    xs?: V;
};

type ValueBreakpointsXs<
    B extends Breakpoints | undefined,
    V
> = (B extends undefined
    ? {
          [key in keyof DefaultBreakpoints]?: V;
      }
    : {
          [key in keyof B]?: V;
      }) & {
    [key in keyof DefaultBreakpoints]?: V;
} & {
    xs: V;
};

type DelayValueBreakpoints<B extends Breakpoints | undefined> =
    ValueBreakpoints<B, number>;

type DurationValueBreakpoints<B extends Breakpoints | undefined> =
    ValueBreakpointsXs<B, number>;

type EasingValueBreakpoints<B extends Breakpoints | undefined> =
    ValueBreakpointsXs<B, Easing>;

type AllValueBreakpoints<B extends Breakpoints> =
    | DelayValueBreakpoints<B>
    | DurationValueBreakpoints<B>
    | EasingValueBreakpoints<B>;

type On = {
    complete: number;
    task: () => void;
};

export type {
    AllTags,
    To,
    Tos,
    Jump,
    Easing,
    EasingType,
    EasingStyle,
    Breakpoints,
    DelayValueBreakpoints,
    DurationValueBreakpoints,
    EasingValueBreakpoints,
    AllValueBreakpoints,
    On,
};
