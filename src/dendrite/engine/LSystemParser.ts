// L-System Production Rule Parser

import type { ProductionRule, LSystemDefinition } from '../../shared/types';

interface ParsedSymbol {
  symbol: string;
  params?: number[];
}

export class LSystemParser {
  private axiom: string;
  private rules: ProductionRule[];
  private random: () => number;

  constructor(definition: Pick<LSystemDefinition, 'axiom' | 'rules'>, seed?: number) {
    this.axiom = definition.axiom;
    this.rules = definition.rules;
    // Simple seedable random
    this.random = seed !== undefined ? this.seededRandom(seed) : Math.random.bind(Math);
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  parse(iterations: number): string {
    let current = this.axiom;

    for (let i = 0; i < iterations; i++) {
      current = this.applyRules(current);
    }

    return current;
  }

  private applyRules(input: string): string {
    const symbols = this.tokenize(input);
    let result = '';

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const left = i > 0 ? symbols[i - 1] : null;
      const right = i < symbols.length - 1 ? symbols[i + 1] : null;

      const replacement = this.findReplacement(symbol, left, right);
      result += replacement;
    }

    return result;
  }

  private tokenize(input: string): ParsedSymbol[] {
    const symbols: ParsedSymbol[] = [];
    let i = 0;

    while (i < input.length) {
      const char = input[i];

      // Check for parametric symbol: A(1.0, 2.0)
      if (i + 1 < input.length && input[i + 1] === '(') {
        const closeIdx = input.indexOf(')', i);
        if (closeIdx > i) {
          const paramStr = input.substring(i + 2, closeIdx);
          const params = paramStr.split(',').map(p => parseFloat(p.trim()));
          symbols.push({ symbol: char, params });
          i = closeIdx + 1;
          continue;
        }
      }

      symbols.push({ symbol: char });
      i++;
    }

    return symbols;
  }

  private findReplacement(
    symbol: ParsedSymbol,
    left: ParsedSymbol | null,
    right: ParsedSymbol | null
  ): string {
    // Find matching rules
    const matchingRules = this.rules.filter(rule => {
      // Match predecessor symbol
      const predecessorSymbol = rule.predecessor.charAt(0);
      if (predecessorSymbol !== symbol.symbol) return false;

      // Check context sensitivity
      if (rule.leftContext && (!left || left.symbol !== rule.leftContext)) {
        return false;
      }
      if (rule.rightContext && (!right || right.symbol !== rule.rightContext)) {
        return false;
      }

      // Check condition (parametric rules)
      if (rule.condition && symbol.params) {
        if (!this.evaluateCondition(rule.condition, symbol.params)) {
          return false;
        }
      }

      return true;
    });

    if (matchingRules.length === 0) {
      // No rule matches, keep symbol as-is
      return symbol.params
        ? `${symbol.symbol}(${symbol.params.join(',')})`
        : symbol.symbol;
    }

    // Handle stochastic rules
    if (matchingRules.some(r => r.probability !== undefined)) {
      return this.selectStochasticRule(matchingRules, symbol.params);
    }

    // Apply first matching deterministic rule
    const rule = matchingRules[0];
    return this.applyParametricRule(rule, symbol.params);
  }

  private selectStochasticRule(
    rules: ProductionRule[],
    params?: number[]
  ): string {
    const total = rules.reduce((sum, r) => sum + (r.probability || 0), 0);
    let rand = this.random() * total;

    for (const rule of rules) {
      rand -= rule.probability || 0;
      if (rand <= 0) {
        return this.applyParametricRule(rule, params);
      }
    }

    return this.applyParametricRule(rules[rules.length - 1], params);
  }

  private applyParametricRule(rule: ProductionRule, params?: number[]): string {
    if (!params || params.length === 0) {
      return rule.successor;
    }

    // Replace parameter references in successor
    // e.g., "F(s*0.7)" with params [10] becomes "F(7)"
    return rule.successor.replace(
      /([A-Z])\(([^)]+)\)/g,
      (_, sym, expr) => {
        const evaluated = this.evaluateExpression(expr, params);
        return `${sym}(${evaluated})`;
      }
    );
  }

  private evaluateExpression(expr: string, params: number[]): number {
    // Simple expression evaluator
    // Supports: s (first param), +, -, *, /, numbers
    let result = expr;

    // Replace 's' with first param (common convention)
    result = result.replace(/\bs\b/g, params[0].toString());

    // Replace indexed params: $0, $1, etc.
    result = result.replace(/\$(\d+)/g, (_, idx) => {
      const i = parseInt(idx);
      return (params[i] ?? 0).toString();
    });

    // Evaluate simple math expression
    try {
      // Safe evaluation for simple expressions
      return this.safeMathEval(result);
    } catch {
      return params[0] || 0;
    }
  }

  private safeMathEval(expr: string): number {
    // Only allow safe mathematical expressions
    const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '');
    // eslint-disable-next-line no-new-func
    return new Function(`return ${sanitized}`)();
  }

  private evaluateCondition(condition: string, params: number[]): boolean {
    let expr = condition;
    expr = expr.replace(/\bs\b/g, params[0].toString());
    expr = expr.replace(/\$(\d+)/g, (_, idx) => {
      const i = parseInt(idx);
      return (params[i] ?? 0).toString();
    });

    try {
      // eslint-disable-next-line no-new-func
      return new Function(`return ${expr}`)();
    } catch {
      return true;
    }
  }
}

// L-System presets
export const L_SYSTEM_PRESETS: Record<string, Omit<LSystemDefinition, 'interpretation'>> = {
  binaryTree: {
    axiom: 'F',
    rules: [{ predecessor: 'F', successor: 'F[+F][-F]' }],
    parameters: {
      angle: 30,
      stepLength: 10,
      lengthDecay: 0.8,
      widthInitial: 2,
      widthDecay: 0.7,
      angleVariance: 0,
      iterations: 5,
    },
  },
  fern: {
    axiom: 'X',
    rules: [
      { predecessor: 'X', successor: 'F+[[X]-X]-F[-FX]+X' },
      { predecessor: 'F', successor: 'FF' },
    ],
    parameters: {
      angle: 25,
      stepLength: 5,
      lengthDecay: 1,
      widthInitial: 1,
      widthDecay: 0.9,
      angleVariance: 2,
      iterations: 6,
    },
  },
  bush: {
    axiom: 'F',
    rules: [
      { predecessor: 'F', successor: 'F[+F]F[-F]F', probability: 0.33 },
      { predecessor: 'F', successor: 'F[+F]F', probability: 0.33 },
      { predecessor: 'F', successor: 'F[-F]F', probability: 0.34 },
    ],
    parameters: {
      angle: 22.5,
      stepLength: 8,
      lengthDecay: 0.9,
      widthInitial: 2,
      widthDecay: 0.8,
      angleVariance: 5,
      iterations: 4,
    },
  },
  seaweed: {
    axiom: 'F',
    rules: [{ predecessor: 'F', successor: 'FF-[-F+F+F]+[+F-F-F]' }],
    parameters: {
      angle: 22.5,
      stepLength: 6,
      lengthDecay: 0.85,
      widthInitial: 1.5,
      widthDecay: 0.75,
      angleVariance: 3,
      iterations: 4,
    },
  },
  tree: {
    axiom: 'X',
    rules: [
      { predecessor: 'X', successor: 'F[+X][-X]FX' },
      { predecessor: 'F', successor: 'FF' },
    ],
    parameters: {
      angle: 25.7,
      stepLength: 4,
      lengthDecay: 1,
      widthInitial: 2,
      widthDecay: 0.8,
      angleVariance: 3,
      iterations: 6,
    },
  },
  dragon: {
    axiom: 'FX',
    rules: [
      { predecessor: 'X', successor: 'X+YF+' },
      { predecessor: 'Y', successor: '-FX-Y' },
    ],
    parameters: {
      angle: 90,
      stepLength: 5,
      lengthDecay: 1,
      widthInitial: 1,
      widthDecay: 1,
      angleVariance: 0,
      iterations: 10,
    },
  },
  koch: {
    axiom: 'F',
    rules: [{ predecessor: 'F', successor: 'F+F-F-F+F' }],
    parameters: {
      angle: 90,
      stepLength: 4,
      lengthDecay: 1,
      widthInitial: 1,
      widthDecay: 1,
      angleVariance: 0,
      iterations: 4,
    },
  },
  sierpinski: {
    axiom: 'F-G-G',
    rules: [
      { predecessor: 'F', successor: 'F-G+F+G-F' },
      { predecessor: 'G', successor: 'GG' },
    ],
    parameters: {
      angle: 120,
      stepLength: 4,
      lengthDecay: 1,
      widthInitial: 1,
      widthDecay: 1,
      angleVariance: 0,
      iterations: 6,
    },
  },
};
