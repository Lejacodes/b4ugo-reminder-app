import React from 'react';
import { act, create } from 'react-test-renderer';
import { ButterButton } from '../ButterButton';

jest.mock('@/hooks/use-scrapbook-palette', () => ({
  useScrapbookPalette: () => ({ butterDeep: '#657454', inkOnMatcha: '#FFFFFF', ink: '#382D25' }),
}));
jest.mock('@/constants/scrapbook', () => ({
  readableFont: { fontFamily: 'System' }, readableType: { item: { fontSize: 17, lineHeight: 23 } },
}));

describe('scrapbook asynchronous actions', () => {
  beforeAll(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; });
  it('blocks a second press while a save is pending', async () => {
    let finish: () => void;
    const save = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(React.createElement(ButterButton, { label: 'save', onPress: save })); });
    const press = view!.root.findAllByProps({ accessibilityRole: 'button' })[0].props.onPress;
    let pending: Promise<void>;
    await act(async () => { pending = press(); await press(); });
    expect(save).toHaveBeenCalledTimes(1);
    expect(view!.root.findAllByProps({ accessibilityRole: 'button' })[0].props.disabled).toBe(true);
    await act(async () => { finish!(); await pending; });
    expect(view!.root.findAllByProps({ accessibilityRole: 'button' })[0].props.disabled).toBe(false);
    await act(async () => view!.unmount());
  });
  it('announces a retained failure and permits an explicit retry', async () => {
    const save = jest.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValueOnce(undefined);
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(React.createElement(ButterButton, { label: 'save', onPress: save })); });
    await act(async () => { await view!.root.findAllByProps({ accessibilityRole: 'button' })[0].props.onPress(); });
    expect(view!.root.findAllByProps({ accessibilityRole: 'alert' }).length).toBeGreaterThan(0);
    expect(view!.root.findAllByProps({ accessibilityRole: 'button' })[0].props.disabled).toBe(false);
    await act(async () => { await view!.root.findAllByProps({ accessibilityRole: 'button' })[0].props.onPress(); });
    expect(save).toHaveBeenCalledTimes(2);
    expect(view!.root.findAllByProps({ accessibilityRole: 'alert' })).toHaveLength(0);
    await act(async () => view!.unmount());
  });
});
