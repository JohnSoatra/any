import React, { useEffect, useRef, useState } from "react";
import type { AllTags, Breakpoints, To, Tos, On } from "../types";
import useReached from "../hooks/useReached";
import { TailwindMergeType, tailwindMerge } from "../utils/tailwind";
import {
    getDelay,
    getDuration,
    getEasing,
    getProperty,
    getTimeoutDelay,
} from "../utils/any";
import isArray from "../utils/array";
import { clearTimeouts } from "../utils/timeout";
import useVisible from "../hooks/useVisible";

type RemoveProps =
    | "from"
    | "to"
    | "children"
    | "dangerouslySetInnerHTML"
    | "as"
    | "start"
    | "instant"
    | "animatedProperties"
    | "mergeConfig"
    | "breakpoints"
    | "onStart"
    | "onEnd"
    | "onEnter"
    | "onLeave";

type SameProps1 = {
    from: string;
    start?: boolean;
    instant?: boolean;
    animatedProperties?: [string, ...string[]];
    mergeConfig?: TailwindMergeType;
    onStart?: () => void;
    onEnd?: () => void;
    onEnter?: () => void;
    onLeave?: () => void;
};

type SameProps2<B extends Breakpoints> =
    | (SameProps1 & {
          breakpoints?: undefined;
          to: Tos<undefined>;
      })
    | (SameProps1 & {
          breakpoints: B;
          to: Tos<B>;
      });

type SameProps3<B extends Breakpoints> =
    | (SameProps2<B> & {
          children: React.ReactNode;
          dangerouslySetInnerHTML?: undefined;
      })
    | (SameProps2<B> & {
          children?: undefined;
          dangerouslySetInnerHTML: { __html: string };
      })
    | (SameProps2<B> & {
          children?: undefined;
          dangerouslySetInnerHTML?: { __html: string };
      });

type AnyProps<T extends AllTags, B extends Breakpoints> =
    | (SameProps3<B> &
          Omit<JSX.IntrinsicElements["div"], RemoveProps> & {
              as?: undefined;
          })
    | (SameProps3<B> &
          Omit<JSX.IntrinsicElements[T], RemoveProps> & {
              as: T;
          });

function animatedProps<B extends Breakpoints>({
    to,
    index,
    ended,
    breakpoints,
    animatedProperties,
}: {
    to: Tos<B>;
    index: number;
    ended: boolean;
    animatedProperties?: [string, ...string[]];
    breakpoints?: B;
}): React.HTMLAttributes<HTMLDivElement>["style"] {
    let property = getProperty(animatedProperties);
    let duration = getDuration({
        index,
        ended,
        to,
        breakpoints,
    });
    let easing = getEasing({
        index,
        ended,
        to,
        breakpoints,
    });
    let delay = getDelay({
        index,
        ended,
        to,
        breakpoints,
    });

    if (ended === true) {
        return {};
    }

    return {
        transitionProperty: property,
        msTransitionProperty: property,
        MozTransitionProperty: property,
        WebkitTransitionProperty: property,

        transitionDuration: duration + "ms",
        msTransitionDuration: duration + "ms",
        MozTransitionDuration: duration + "ms",
        WebkitTransitionDuration: duration + "ms",

        transitionDelay: delay + "ms",
        msTransitionDelay: delay + "ms",
        MozTransitionDelay: delay + "ms",
        WebkitTransitionDelay: delay + "ms",

        transitionTimingFunction: easing,
        MozTransitionTimingFunction: easing,
        WebkitTransitionTimingFunction: easing,
    };
}

const Any = function <T extends AllTags, B extends Breakpoints>({
    as,
    from,
    to,
    start,
    instant,
    breakpoints,
    animatedProperties,
    mergeConfig,
    style,
    onStart,
    onEnd,
    onEnter,
    onLeave,
    ...props
}: AnyProps<T, B>) {
    const [Tag]: ["div" | (() => JSX.Element), React.Dispatch<any>] = useState(
        as === undefined ? "div" : (as as any)
    );
    const [index, setIndex] = useState(-1);
    const [calledOnStart, setCalledOnStart] = useState(false);
    const [ended, setEnded] = useState(false);
    const [className, setClassName] = useState(from);
    const [animating, setAnimating] = useState(false);
    const ref = useRef(null);
    const isReached = useReached(ref);
    const isVisible = useVisible(ref);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const timeoutsRef = useRef<NodeJS.Timeout[]>();

    useEffect(() => {
        if (start === false) {
            setIndex(-1);
            setEnded(false);
            setClassName(from);

            if (
                (isReached || instant === true) &&
                ended === false &&
                index === -1 &&
                className === from
            ) {
                if (calledOnStart === false) {
                    setCalledOnStart(true);
                    onStart && onStart();
                }
            }
        } else {
            if (
                (isReached || instant === true) &&
                ended === false &&
                index === -1 &&
                className === from
            ) {
                if (calledOnStart === false) {
                    setCalledOnStart(true);
                    onStart && onStart();
                }
                if (window && ref.current) {
                    // use get computed style to await until component turn back to from
                    const tranProp = window.getComputedStyle(ref.current);

                    if (tranProp.transitionProperty) {
                        setIndex(0);
                        setAnimating(true);
                        setCalledOnStart(false);
                    }
                }
            }
        }
    }, [
        start,
        isReached,
        instant,
        ended,
        index,
        className,
        from,
        calledOnStart,
        onStart,
    ]);

    useEffect(() => {
        if (index > -1) {
            setClassName((className) =>
                tailwindMerge({
                    classLists: [props.className, className, to[index].state],
                    ...(mergeConfig || {}),
                })
            );
        }
    }, [index, to, props.className, mergeConfig]);

    useEffect(() => {
        let current: HTMLElement | null = null;

        const onTransitionStart = (evt: TransitionEvent) => {
            if (ref.current && evt.target === ref.current) {
                evt.stopImmediatePropagation();

                if (timeoutRef.current === undefined) {
                    clearTimeouts([
                        timeoutRef.current,
                        ...(timeoutsRef.current || []),
                    ]);
                    setAnimating(true);

                    const timeoutDelay = getTimeoutDelay({
                        index,
                        to,
                        breakpoints,
                    });
                    const currentTo = to[index];

                    timeoutRef.current = setTimeout(() => {
                        timeoutRef.current = undefined;

                        if (
                            index < to.length - 1 &&
                            (currentTo as To<B>).onEnd !== undefined
                        ) {
                            (currentTo as To<B>).onEnd!();
                        }

                        if (
                            index < to.length - 1 &&
                            (to[index + 1] as To<B>).start !== false
                        ) {
                            setIndex(index + 1);
                            setAnimating(true);
                        }
                    }, timeoutDelay);

                    if (currentTo.on !== undefined) {
                        const newTimeouts = [];
                        const duration = getDuration({
                            index,
                            to,
                            breakpoints,
                            ended,
                        });

                        if (isArray(currentTo.on)) {
                            for (let on of currentTo.on as On[]) {
                                const complete =
                                    on.complete < 0
                                        ? 0
                                        : on.complete > 1
                                        ? 1
                                        : on.complete;

                                newTimeouts.push(
                                    setTimeout(() => {
                                        on.task();
                                    }, complete * duration)
                                );
                            }
                        } else {
                            const on = currentTo.on as On;
                            const complete =
                                on.complete < 0
                                    ? 0
                                    : on.complete > 1
                                    ? 1
                                    : on.complete;

                            newTimeouts.push(
                                setTimeout(() => {
                                    on.task();
                                }, complete * duration)
                            );
                        }

                        timeoutsRef.current = [...newTimeouts];
                    }
                }
            }
        };

        const onTransitionEnd = (evt: TransitionEvent) => {
            if (evt.target === ref.current) {
                evt.stopImmediatePropagation();

                setAnimating(false);

                if (index === to.length - 1) {
                    setEnded(true);

                    if (onEnd !== undefined) {
                        onEnd();
                    }
                }
            }
        };

        if (ref.current) {
            current = ref.current as HTMLElement;
            current.addEventListener("transitionstart", onTransitionStart);
            current.addEventListener("transitionend", onTransitionEnd);
        }

        return () => {
            if (current) {
                current.removeEventListener(
                    "transitionstart",
                    onTransitionStart
                );
                current.removeEventListener("transitionend", onTransitionEnd);
            }
        };
    }, [index, to, breakpoints, ended, onEnd]);

    useEffect(() => {
        if (
            animating === false &&
            index > -1 &&
            index < to.length - 1 &&
            (to[index + 1] as To<B>).start === true
        ) {
            setIndex(index + 1);
            setAnimating(true);
        }
    }, [animating, index, to]);

    useEffect(() => {
        if (isReached) {
            if (isVisible === true) {
                if (onEnter) {
                    onEnter();
                }
            } else if (isVisible === false) {
                if (onLeave) {
                    onLeave();
                }
            }
        }
    }, [isReached, isVisible, onEnter, onLeave]);

    return (
        <Tag
            {...(props as React.HTMLAttributes<HTMLDivElement>)}
            ref={ref}
            className={tailwindMerge({
                classLists: [
                    props.className,
                    className,
                    index > -1 && to[index].state,
                ],
                ...(mergeConfig || {}),
            })}
            style={{
                ...(style || {}),
                ...animatedProps({
                    to,
                    index,
                    ended,
                    animatedProperties,
                    breakpoints,
                }),
            }}
        />
    );
};

export default Any;
export type { AnyProps };
