import { assert } from 'chai';
import * as path from 'path';
import {
  ComponentDoc,
  defaultParserOpts,
  parse,
  ParserOptions
} from '../parser';

export interface ExpectedComponents {
  [key: string]: ExpectedComponent;
}

export interface ExpectedComponent {
  [key: string]: ExpectedProp;
}

export interface ExpectedProp {
  type: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
}

export function fixturePath(componentName: string) {
  return path.join(
    __dirname,
    '..',
    '..',
    'src',
    '__tests__',
    'data',
    `${componentName}.tsx`
  ); // it's running in ./temp
}

export function check(
  componentName: string,
  expected: ExpectedComponents,
  exactProperties: boolean = true,
  description?: string,
  parserOpts?: ParserOptions
) {
  const result = parse(fixturePath(componentName), parserOpts);
  checkComponent(result, expected, exactProperties, description);
}

export function checkComponent(
  actual: ComponentDoc[],
  expected: ExpectedComponents,
  exactProperties: boolean = true,
  description?: string
) {
  const expectedComponentNames = Object.getOwnPropertyNames(expected);
  assert.equal(
    actual.length,
    expectedComponentNames.length,
    // tslint:disable-next-line:max-line-length
    `The number of expected components is different - \r\n\expected: ${expectedComponentNames}, \r\n\actual: ${actual.map(
      i => i.displayName
    )}`
  );

  const errors: string[] = [];
  for (const expectedComponentName of expectedComponentNames) {
    const expectedComponent = expected[expectedComponentName];
    const componentDocs = actual.filter(
      i => i.displayName === expectedComponentName
    );
    if (componentDocs.length === 0) {
      errors.push(`Component is missing - ${expectedComponentName}`);
      continue;
    }
    const componentDoc = componentDocs[0];
    const expectedPropNames = Object.getOwnPropertyNames(expectedComponent);
    const propNames = Object.getOwnPropertyNames(componentDoc.props);
    const compName = componentDoc.displayName;

    const expectedComponentDescription =
      description || `${compName} description`;

    if (componentDoc.description !== expectedComponentDescription) {
      // tslint:disable-next-line:max-line-length
      errors.push(
        `${compName} description is different - expected: '${compName} description', actual: '${
          componentDoc.description
        }'`
      );
    }

    if (
      propNames.length !== expectedPropNames.length &&
      exactProperties === true
    ) {
      // tslint:disable-next-line:max-line-length
      errors.push(
        `Properties for ${compName} are different - expected: ${
          expectedPropNames.length
        }, actual: ${propNames.length} (${JSON.stringify(
          expectedPropNames
        )}, ${JSON.stringify(propNames)})`
      );
    }

    for (const expectedPropName of expectedPropNames) {
      const expectedProp = expectedComponent[expectedPropName];
      const prop = componentDoc.props[expectedPropName];
      if (prop === undefined) {
        errors.push(`Property '${compName}.${expectedPropName}' is missing`);
      } else {
        if (expectedProp.type !== prop.type.name) {
          // tslint:disable-next-line:max-line-length
          errors.push(
            `Property '${compName}.${expectedPropName}' type is different - expected: ${
              expectedProp.type
            }, actual: ${prop.type.name}`
          );
        }
        const expectedDescription =
          expectedProp.description === undefined
            ? `${expectedPropName} description`
            : expectedProp.description;
        if (expectedDescription !== prop.description) {
          errors.push(
            // tslint:disable-next-line:max-line-length
            `Property '${compName}.${expectedPropName}' description is different - expected: ${expectedDescription}, actual: ${
              prop.description
            }`
          );
        }
        const expectedRequired =
          expectedProp.required === undefined ? true : expectedProp.required;
        if (expectedRequired !== prop.required) {
          errors.push(
            // tslint:disable-next-line:max-line-length
            `Property '${compName}.${expectedPropName}' required is different - expected: ${expectedRequired}, actual: ${
              prop.required
            }`
          );
        }
        const expectedDefaultValue = expectedProp.defaultValue;
        if (
          expectedDefaultValue &&
          prop.defaultValue &&
          expectedDefaultValue !== prop.defaultValue.value
        ) {
          errors.push(
            // tslint:disable-next-line:max-line-length
            `Property '${compName}.${expectedPropName}' defaultValue is different - expected: ${expectedDefaultValue}, actual: ${
              prop.defaultValue.value
            }`
          );
        }
      }
    }
  }
  const ok = errors.length === 0;
  if (!ok) {
    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(actual, null, 4));
  }

  assert(ok, errors.join('\r\n'));
}
