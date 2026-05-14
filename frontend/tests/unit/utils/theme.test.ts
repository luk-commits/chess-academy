import { describe, it, expect } from 'vitest';
import { theme } from '../../../src/theme';

describe('theme', () => {
  it('should have correct primary color', () => {
    expect(theme.palette.primary.main).toBe('#1a237e');
    expect(theme.palette.primary.light).toBe('#534bae');
    expect(theme.palette.primary.dark).toBe('#000051');
  });

  it('should have correct secondary color', () => {
    expect(theme.palette.secondary.main).toBe('#c2a878');
    expect(theme.palette.secondary.dark).toBe('#8d7a4a');
  });

  it('should have correct background colors', () => {
    expect(theme.palette.background.default).toBe('#f5f5f7');
    expect(theme.palette.background.paper).toBe('#ffffff');
  });

  it('should have light mode', () => {
    expect(theme.palette.mode).toBe('light');
  });

  it('should have correct typography settings', () => {
    expect(theme.typography.fontFamily).toContain('Inter');
    expect(theme.typography.h1?.fontWeight).toBe(700);
    expect(theme.typography.h4?.fontWeight).toBe(700);
    expect(theme.typography.button?.textTransform).toBe('none');
  });

  it('should have correct shape border radius', () => {
    expect(theme.shape.borderRadius).toBe(12);
  });

  it('should have MuiButton defaults', () => {
    expect(theme.components?.MuiButton?.defaultProps?.disableElevation).toBe(true);
  });

  it('should have MuiTextField defaults', () => {
    expect(theme.components?.MuiTextField?.defaultProps?.fullWidth).toBe(true);
    expect(theme.components?.MuiTextField?.defaultProps?.variant).toBe('outlined');
  });
});
