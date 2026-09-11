import {StatusBar} from 'expo-status-bar';
import {useTheme} from '../theme-provider';
export function ThemedStatusBar(){const theme=useTheme();return <StatusBar style={theme.name==='dark'?'light':'dark'}/>;}
