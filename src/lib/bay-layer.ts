/** Checks workspace vs Report pane. Never apply `flex` and `hidden` together. */

export function bayChecksPaneProps(showReport: boolean): {
  hidden: boolean;
  inert: true | undefined;
  "aria-hidden": boolean;
  "data-testid": "bay-checks-pane";
  className: string;
  style: { display: "none" } | undefined;
} {
  if (showReport) {
    return {
      hidden: true,
      inert: true,
      "aria-hidden": true,
      "data-testid": "bay-checks-pane",
      className: "pointer-events-none",
      style: { display: "none" },
    };
  }
  return {
    hidden: false,
    inert: undefined,
    "aria-hidden": false,
    "data-testid": "bay-checks-pane",
    className: "flex min-h-0 flex-1",
    style: undefined,
  };
}

export function bayChecksPaneIsParked(props: ReturnType<typeof bayChecksPaneProps>): boolean {
  return (
    props.hidden === true &&
    props.inert === true &&
    props.style?.display === "none" &&
    !props.className.includes("flex") &&
    props.className.includes("pointer-events-none")
  );
}
