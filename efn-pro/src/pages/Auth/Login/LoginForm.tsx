import { Grid, TextField } from "@mui/material"
import { GREY_LIGHT, textFieldStyle } from "../Common/styles"
import { LoginActions } from "./index"

interface LoginFormProps {
	setEmail: React.Dispatch<React.SetStateAction<String>>, 
	setPw: React.Dispatch<React.SetStateAction<String>>
}

export default function LoginForm (props: LoginFormProps) {

	return (
		<Grid container direction={"column"} alignContent="center" justifySelf={"center"}>
			<Grid item xs={4} padding={1} width={"inherit"}>
				<TextField sx={textFieldStyle} InputLabelProps={{ style: { color: GREY_LIGHT } }} label="Email address"
					type="email" fullWidth={true} variant="standard"
					onChange={(e) => props.setEmail(e.target.value)}
				/>
			</Grid>

			<Grid item xs={4} padding={1} width={"inherit"}>
				<TextField sx={textFieldStyle} InputLabelProps={{ style: { color: GREY_LIGHT } }} label="Password"
					type="password" fullWidth={true} variant="standard"
					onChange={(e) => props.setPw(e.target.value)}
				/>
			</Grid>

			<Grid item xs={4} padding={2}>
				<LoginActions />
			</Grid>

		</Grid>
	)
}