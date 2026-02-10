import type { Operator } from '@/types/puzzle';

function precedence(op: Operator): number {
  return (op === '*' || op === '/') ? 2 : 1;
}

function applyOp(a: number, op: Operator, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) return null;
      return a / b;
  }
}

/**
 * Evaluate a 3-number, 2-operator expression with standard order of operations.
 * Returns null if the expression is invalid (division by zero) or the result is
 * not a positive integer. Intermediate values CAN be decimal.
 */
export function evaluateExpression(
  n1: number,
  op1: Operator,
  n2: number,
  op2: Operator,
  n3: number,
): number | null {
  let result: number | null;

  if (precedence(op1) >= precedence(op2)) {
    // Evaluate left first: (n1 op1 n2) op2 n3
    const left = applyOp(n1, op1, n2);
    if (left === null) return null;
    result = applyOp(left, op2, n3);
  } else {
    // Evaluate right first: n1 op1 (n2 op2 n3)
    const right = applyOp(n2, op2, n3);
    if (right === null) return null;
    result = applyOp(n1, op1, right);
  }

  if (result === null) return null;
  if (!Number.isInteger(result)) return null;
  if (result <= 0) return null;

  return result;
}

/**
 * Evaluate for display purposes - returns the raw numeric result
 * even if it's a decimal or negative. Returns null only for division by zero.
 */
export function evaluateForDisplay(
  n1: number,
  op1: Operator,
  n2: number,
  op2: Operator,
  n3: number,
): number | null {
  let result: number | null;

  if (precedence(op1) >= precedence(op2)) {
    const left = applyOp(n1, op1, n2);
    if (left === null) return null;
    result = applyOp(left, op2, n3);
  } else {
    const right = applyOp(n2, op2, n3);
    if (right === null) return null;
    result = applyOp(n1, op1, right);
  }

  return result;
}

/**
 * Format an expression as a string for display.
 */
export function formatExpression(
  n1: number,
  op1: string,
  n2: number,
  op2: string,
  n3: number,
): string {
  const opDisplay = (op: string) => op === '*' ? '\u00D7' : op === '/' ? '\u00F7' : op;
  return `${n1} ${opDisplay(op1)} ${n2} ${opDisplay(op2)} ${n3}`;
}

/**
 * Format a numeric result for display (rounds decimals nicely).
 */
export function formatResult(val: number | null): string {
  if (val === null) return '??';
  if (Number.isInteger(val)) return String(val);
  return val.toFixed(1) + '...';
}
