import { Grid } from "@mui/material";

import { background } from "../../../components/Styles";
import { rightMenu, leftMenu, lightTheme } from "../Common/styles";
import { ThemeProvider } from '@mui/material/styles';

import { RegisterRightMenu } from "./index";

import Logo from "../../../images/Logo.png"
import { SessionTracker } from "../Common/session";

export default function Login(props: SessionTracker) {

  return (
    <Grid container justifyContent={"center"} alignContent={"center"} style={background}>

    	<Grid item sx={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px'}} style={leftMenu} padding={4}>
    		<img src={Logo} alt="efnpro logo, a shield"></img>
    	</Grid>

    	<ThemeProvider theme={lightTheme}>
    		<Grid item sx={{ borderTopRightRadius: '16px', borderBottomRightRadius: '16px'}} style={rightMenu}>
    			<RegisterRightMenu setSession={props.setSession}/>
    		</Grid>
    	</ThemeProvider>

    </Grid>
  );
}