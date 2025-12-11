import { colors } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import "@fontsource/roboto";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/800.css';

const AppTheme = (mode = 'light') => createTheme({
    breakpoints: {
        values: {
            // xl: 1536,
            // lg: 1200,
            // md: 900,
            // sm: 600,
            // xs: 0,
            xs: 0,
            sm: 480,
            md: 768,
            lg: 1024,
            xl: 1368,
            xxl: 1980
        }
    },
    size: 10,
    spacing: 8,
    palette: {
        mode,
        background: {
            default: mode === 'dark' ? '#080808ff' : '#f8fffcff',
            paper: mode === 'dark' ? '#121212ff' : '#f5f5f5ff',
        },
        ...(mode === 'dark' && {
            text: {
                primary: '#0b261aff',
                secondary: '#ffffffff'
            }
        }),
        primary: {
            main: colors.teal[50],
            dark: colors.teal[500],
            deem: colors.teal[200],
            light: colors.teal[50],
        },
        secondary: {
            main: colors.deepPurple[900],
            dark: colors.deepPurple[500],
            deem: colors.deepPurple[200],
            light: colors.deepPurple[50]
        },
        info: {
            main: colors.grey[900],
            dark: colors.grey[700],
            deem: colors.grey[500],
            light: colors.grey[50]
        },
        success: {
            main: colors.green[700],
            dark: colors.green[500],
            deem: colors.green[200],
            light: colors.green[50]
        },
        error: {
            main: colors.red[900],
            dark: colors.red[500],
            deem: colors.red[200],
            light: colors.red[50],
        },

        blue: '#131938',
        tintBlue: '#326EE6'
    },
    shape: {
        borderRadius: 5
    },
    typography: {
        fontFamily: "'Roboto',san-serif",
        fontSize: 25,
        htmlFontSize: 30,
        h1: {
            fontWeight: 300,
            fontSize: "6rem",
            lineHeight: 1.167,
            letterSpacing: "-0.01562em"
        },
        h2: {
            fontWeight: 300,
            fontSize: "3.75rem",
            lineHeight: 1.2,
            letterSpacing: "-0.00833em"
        },
        h3: {
            fontWeight: 400,
            fontSize: "3rem",
            lineHeight: 1.167,
            letterSpacing: "0em"
        },
        h4: {
            fontWeight: 400,
            fontSize: "1.650rem",
            lineHeight: 1.235,
            letterSpacing: "0.00735em"
        },
        h5: {
            fontWeight: 400,
            fontSize: "1.2rem",
            lineHeight: 1.334,
            letterSpacing: "0em"
        },
        h6: {
            fontWeight: 700,
            fontSize: "1.10rem",
            lineHeight: 1.6,
            letterSpacing: "0.0075em"
        },
        body1: {
            fontFamily: "Roboto",
            fontWeight: 500,
            fontSize: "0.685rem",
            lineHeight: 1.5,
            letterSpacing: "0.01038em"
        },
        body2: {
            fontFamily: "Roboto",
            fontWeight: 400,
            fontSize: "0.675rem",
            lineHeight: 1.43,
            letterSpacing: "0.01071em"
        },
        subtitle1: {
            fontWeight: 400,
            fontSize: "1rem",
            lineHeight: 1.75,
            letterSpacing: "0.00938em"
        },
        subtitle2: {
            fontWeight: 500,
            fontSize: "0.875rem",
            lineHeight: 1.57,
            letterSpacing: "0.00714em"
        },
        button: {
            fontWeight: 400,
            fontSize: "0.575rem",
            lineHeight: 2.15,
            letterSpacing: "0.02857em",
            textTransform: "uppercase",
        },
        caption: {
            fontWeight: 400,
            fontSize: "0.75rem",
            lineHeight: 1.66,
            letterSpacing: "0.03333em"

        },
        overline: {
            fontWeight: 400,
            fontSize: "0.75rem",
            lineHeight: 1.66,
            letterSpacing: "0.08333em",
            textTransform: "uppercase"
        }
    },
    mixins: {
        toolbar: {
            minHeight: 56
        }
    },
    components: {
        MuiIconButton: {
            styleOverrides: {
                root: {
                    outline: 'none',
                    boxShadow: 'none',
                    '&:focus': {
                        outline: 'none',
                        boxShadow: 'none',
                    },
                    '&:focus-visible': {
                        outline: 'none',
                        boxShadow: 'none',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    background: 'rgba(255, 255, 255, 0.2)',
                    // boxShadow:'0 4px 30px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.1))',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    border: '1px solid rgba(191, 162, 162, 0.3)',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '4px 12px',
                    height: 10,
                    fontSize: '10px',
                    lineHeight: '10px',
                    borderBottom: '1px solid #FEFEFE',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:nth-of-type(even)': {
                        fontSize: '10px',
                        backgroundColor: '#eee'
                    },
                    '&:last-child td, &:last-child th': {
                        fontSize: '10px',
                        border: 0,
                    },
                    borderBottom: '1px solid #FEFEFE',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    height: 30,
                },
            },
        },
        MuiTableFooter: {
            styleOverrides: {
                root: {
                    height: 10,
                    padding: 0
                },
            },
        },

        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: 25,
                    height: 35,
                    padding: 0,
                    fontSize: '15px',
                },
                indicator: {
                    height: 2,
                }
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    // width: '50px',
                    minHeight: 25,
                    height: 35,
                    padding: '0 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    border: 'none',
                    outline: 'none',
                    '&:focus': {
                        outline: 'none',
                    },
                    '&:focus-visible': {
                        outline: 'none',
                        boxShadow: 'none',
                    }
                }
            }
        },

        MuiTablePagination: {
            styleOverrides: {
                root: {
                    '& .MuiIconButton-root': {
                        size: 'small',
                        fontSize: '.51rem',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-notchedOutline': {
                        // border: 0,
                        background: 'none',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        // border: 0,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        // border: 0,
                    },
                },
                input: {
                    padding: '8px 12px',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-notchedOutline': {
                        border: 0,
                        background: 'none',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: 0,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: 0,
                    },
                },
                input: {
                    padding: '0px 12px',
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    padding: '3px',
                    '& svg': {
                        fontSize: '15px',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                root: {
                    background: 'none',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    my: 1,
                    height: 27,
                    background: 'none',
                    '& svg': {
                        fontSize: '13px',
                    },
                },
            },
        },
    },
});



export default AppTheme