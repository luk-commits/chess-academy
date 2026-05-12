import { createTheme } from '@mui/material/styles';
export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1a237e',
            light: '#534bae',
            dark: '#000051',
        },
        secondary: {
            main: '#c2a878',
            dark: '#8d7a4a',
        },
        background: {
            default: '#f5f5f7',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h4: { fontWeight: 700, letterSpacing: '-0.5px' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { paddingBlock: 10 },
            },
        },
        MuiTextField: {
            defaultProps: { fullWidth: true, variant: 'outlined' },
        },
    },
});
