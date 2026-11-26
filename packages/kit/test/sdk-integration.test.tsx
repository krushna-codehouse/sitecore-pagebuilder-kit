import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Text } from '@sitecore-content-sdk/react';
import { FieldGuard } from '../src/index.js';

afterEach(cleanup);

// An empty Single-Line Text field as Page Builder delivers it.
const emptyEditingField = {
  value: '',
  metadata: { datasource: { id: '{00000000-0000-0000-0000-000000000001}' }, fieldId: '{F1}', fieldName: 'Heading', fieldType: 'Single-Line Text', rawValue: '' },
};

describe('with the real Content SDK Text component', () => {
  it('the common conditional pattern renders nothing in Page Builder', () => {
    const field = emptyEditingField;
    const { container } = render(<>{field.value && <Text field={field} tag="h1" />}</>);
    expect(container.innerHTML).toBe('');
  });

  it('FieldGuard keeps the wrapper and lets the SDK render its empty-field placeholder', () => {
    const field = emptyEditingField;
    const { container } = render(
      <FieldGuard field={field}>
        <div className="hero__heading">
          <Text field={field} tag="h1" />
        </div>
      </FieldGuard>,
    );
    const wrapper = container.querySelector('.hero__heading');
    expect(wrapper).not.toBeNull();
    // The SDK renders field chrome and its empty-field placeholder.
    expect(wrapper!.innerHTML).toContain('chrometype="field"');
    expect(wrapper!.textContent).toContain('[No text in field]');
  });

  it('FieldGuard removes the wrapper on the live site', () => {
    const { container } = render(
      <FieldGuard field={{ value: '' }}>
        <div className="hero__heading">
          <Text field={{ value: '' }} tag="h1" />
        </div>
      </FieldGuard>,
    );
    expect(container.querySelector('.hero__heading')).toBeNull();
  });
});
