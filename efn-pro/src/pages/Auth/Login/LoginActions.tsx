import { Checkbox, FormControlLabel, Grid, Link, Typography } from "@mui/material"

export function LoginActions() {
	return (
		<Grid container alignItems={"center"} justifyContent={"space-between"}>

			<Grid item>

				<FormControlLabel control={<Checkbox />}
					label={
						<Typography color={"grey"} sx={{ fontSize: 12 }}>
							Remember me
						</Typography>
					}
				/>
			</Grid>

			<Grid item>
				<Link href="/login" color={"primary"} sx={{ fontSize: 12 }}>
					Forgot Password?
				</Link>

			</Grid>

		</Grid>
	)
}