export interface ScoreDescriptor {
  maxScore: number;
  optional: boolean;
}

const ScoreMap = new Map<Function, Map<string, ScoreDescriptor>>();

export function ScoreRequired(score: number): ScoreDescriptor {
  return {
    maxScore: score,
    optional: false,
  };
}

export function ScoreOptional(score: number): ScoreDescriptor {
  return {
    maxScore: score,
    optional: true,
  };
}

export function MatchScore(scoreDescriptor: number | ScoreDescriptor) {
  const score =
    typeof scoreDescriptor === 'number'
      ? ScoreRequired(scoreDescriptor)
      : scoreDescriptor;
  return function (
    target: any,
    propertyKey: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    descriptor: PropertyDescriptor,
  ) {
    let map = ScoreMap.get(target.constructor);
    if (!map) {
      map = new Map();
      ScoreMap.set(target.constructor, map);
    }
    map.set(propertyKey, score);
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getMatchScoresForClass(
  klass: Function,
): Map<string, ScoreDescriptor> {
  let proto = klass.prototype;
  while (proto !== Object.prototype) {
    const m = ScoreMap.get(proto.constructor);
    if (m) {
      return m;
    }
    proto = Object.getPrototypeOf(proto);
  }
}
