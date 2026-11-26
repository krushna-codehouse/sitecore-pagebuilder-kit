import { describe, expect, it } from 'vitest';
import {
  EMPTY_DATE_FIELD_VALUE,
  hasEditingMetadata,
  isEmptyDate,
  isEmptyField,
  isEmptyImage,
  isEmptyLink,
  isEmptyList,
  isEmptyRichText,
  isEmptyText,
} from '../src/index.js';

describe('isEmptyText', () => {
  it('treats missing, empty and whitespace values as empty', () => {
    expect(isEmptyText(undefined)).toBe(true);
    expect(isEmptyText({ value: '' })).toBe(true);
    expect(isEmptyText({ value: '   ' })).toBe(true);
  });
  it('keeps 0 and false as content', () => {
    expect(isEmptyText({ value: 0 })).toBe(false);
    expect(isEmptyText({ value: false })).toBe(false);
    expect(isEmptyText({ value: 'Hello' })).toBe(false);
  });
});

describe('isEmptyRichText', () => {
  it('treats markup with no visible text as empty', () => {
    expect(isEmptyRichText({ value: '<p></p>' })).toBe(true);
    expect(isEmptyRichText({ value: '<p>&nbsp;</p>' })).toBe(true);
    expect(isEmptyRichText({ value: '<p><br></p>\n<!-- note -->' })).toBe(true);
  });
  it('keeps text and media as content', () => {
    expect(isEmptyRichText({ value: '<p>Hi</p>' })).toBe(false);
    expect(isEmptyRichText({ value: '<p><img src="/a.jpg" /></p>' })).toBe(false);
    expect(isEmptyRichText({ value: '<iframe src="https://example.com"></iframe>' })).toBe(false);
  });
});

describe('isEmptyImage / isEmptyLink', () => {
  it('needs a src or href', () => {
    expect(isEmptyImage({ value: {} })).toBe(true);
    expect(isEmptyImage({ value: { src: '' } })).toBe(true);
    expect(isEmptyImage({ value: { src: '/a.jpg' } })).toBe(false);
    expect(isEmptyLink({ value: { href: '', text: 'Read more' } })).toBe(true);
    expect(isEmptyLink({ value: { href: '/about' } })).toBe(false);
  });
});

describe('isEmptyDate', () => {
  it('treats the Sitecore minimum date as empty', () => {
    expect(isEmptyDate({ value: EMPTY_DATE_FIELD_VALUE })).toBe(true);
    expect(isEmptyDate({ value: '' })).toBe(true);
    expect(isEmptyDate({ value: '2026-11-26T00:00:00Z' })).toBe(false);
    expect(isEmptyDate({ value: new Date('nope') })).toBe(true);
  });
});

describe('isEmptyList', () => {
  it('handles item arrays and value arrays', () => {
    expect(isEmptyList([])).toBe(true);
    expect(isEmptyList([{ id: '1' }])).toBe(false);
    expect(isEmptyList({ value: [] })).toBe(true);
    expect(isEmptyList(undefined)).toBe(true);
  });
});

describe('isEmptyField (auto-detect)', () => {
  it('picks the right check from the value', () => {
    expect(isEmptyField({ value: '<p>&nbsp;</p>' })).toBe(true);
    expect(isEmptyField({ value: { href: '' } })).toBe(true);
    expect(isEmptyField({ value: { src: '/a.jpg' } })).toBe(false);
    expect(isEmptyField({ value: EMPTY_DATE_FIELD_VALUE })).toBe(true);
    expect(isEmptyField({ value: 'Title' })).toBe(false);
    expect(isEmptyField([])).toBe(true);
    expect(isEmptyField(null)).toBe(true);
  });
});

describe('hasEditingMetadata', () => {
  it('detects Page Builder metadata on a field', () => {
    expect(hasEditingMetadata({ value: '', metadata: { fieldType: 'Single-Line Text' } })).toBe(true);
    expect(hasEditingMetadata({ value: 'x' })).toBe(false);
    expect(hasEditingMetadata(undefined)).toBe(false);
  });
});
