type DotNestedKeys<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]: T[K] extends object
        ? K | `${K}.${DotNestedKeys<T[K]>}`
        : K;
    }[Extract<keyof T, string>]
  : never;

interface CheckFieldsOptions<T> {
  isBody?: boolean;
  bodyLabel?: string;
  checkers?: Partial<
    Record<
      Partial<keyof T>,
      { action: (value: any) => boolean; message: string }
    >
  >;
  defaults?: T;
}
function checkFieldsRecursive<T extends Record<string, any>>(
  obj: T,
  paths: string[][],
  prefix = "",
  options: CheckFieldsOptions<T> = { isBody: true, bodyLabel: "Body" }
): string[] {
  const messages: string[] = [];
  // Group paths by their first segment
  const grouped: Record<string, string[][]> = {};
  for (const pathArr of paths) {
    if (pathArr.length === 0) continue;
    const [first, ...rest] = pathArr;
    if (!grouped[first]) grouped[first] = [];
    grouped[first].push(rest);
  }

  for (const key in grouped) {
    const fullPath = prefix
      ? `${prefix}${options?.isBody ? "." : "?"}${key}`
      : key;
    const value = obj?.[key];

    // If there are further segments, recurse
    const childPaths = grouped[key].filter((arr) => arr.length > 0);
    if (childPaths.length > 0) {
      if (value === undefined || value === null) {
        messages.push(options?.bodyLabel + ` is Missing ${fullPath}`);
      } else {
        messages.push(...checkFieldsRecursive(value, childPaths, fullPath));
      }
    } else {
      // Leaf node: check value
      if (
        value === undefined ||
        value === null ||
        (typeof value !== "object" && value === "")
      ) {
        messages.push(options?.bodyLabel + ` is Missing ${fullPath}`);
      } else if (value === options.defaults?.[key]) {
        messages.push(
          `${options?.bodyLabel} ${fullPath} should not be have a default value since it is required`
        );
      }
    }
  }

  if (options?.checkers) {

    Object.keys(options.checkers).forEach((key) => {
      const checker = options.checkers![key];
      const fullPath = prefix
        ? `${prefix}${options?.isBody ? "." : "?"}${key}`
        : key;
      const value = obj?.[key];

      if (checker && !checker.action(value)) {
        const constructedMessage = checker.message.replace(
          "{{value}}",
          JSON.stringify(value)
        );
        messages.push(
          `${options?.bodyLabel} ${fullPath} is invalid: ${constructedMessage}`
        );
      }
    });
  }
  return messages;
}

interface bodyErrorBoundaryOptions<T> {
  bodyLabel?: string;
  isBody?: boolean;
  prefix?: string;
  defaults?: Partial<T>;
  checkers?: Partial<
    Record<
      Partial<keyof T>,
      { action: (value: any) => boolean; message: string }
    >
  >;
}
export default function <T extends Record<string, any>>(
  body: T | undefined,
  requiredFields: Array<DotNestedKeys<T>> | Array<string>,
  options: bodyErrorBoundaryOptions<T> = { bodyLabel: "Body", isBody: true }
): { hasError: boolean; errorMessage: string; body: T | undefined } {
  const message: string[] = [];
  const uniqueFields = Array.from(new Set(requiredFields));
  const constructedBody: T = { ...options.defaults, ...body } as T;
    const paths = uniqueFields.map((f) => (f as string).split("."));

  if (!body) {
    message.push(options?.bodyLabel + " is required");
  }
  message.push(
      ...checkFieldsRecursive(constructedBody, paths, options.prefix, options)
    );

  return {
    hasError: message.length > 0,
    errorMessage: message.join(", "),
    body: constructedBody,
  };
}
